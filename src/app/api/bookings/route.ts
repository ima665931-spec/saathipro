import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePaidAccess } from "@/lib/payment-gate";
import { notifyBookingCreated } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await requirePaidAccess(session.user.email);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code, redirect: "/pricing" },
        { status: gate.status }
      );
    }

    const body = await req.json();
    const {
      saathiId,
      saathiName,
      service,
      city,
      date,
      time,
      durationHours,
      amount,
      notes,
      slotId,
    } = body;

    if (!saathiId || !saathiName || !service || !date || !time || amount == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = gate.user;

    const saathiUser = await prisma.user.findUnique({
      where: { id: String(saathiId) },
      include: { saathiProfile: true },
    });

    if (!saathiUser || saathiUser.isBanned) {
      return NextResponse.json({ error: "Saathi not found" }, { status: 404 });
    }

    if (!saathiUser.saathiProfile || !saathiUser.saathiProfile.isActive) {
      return NextResponse.json(
        { error: "This Saathi is not available for booking" },
        { status: 400 }
      );
    }

    if (saathiUser.id === client.id) {
      return NextResponse.json(
        { error: "You cannot book yourself" },
        { status: 400 }
      );
    }

    const scheduleCount = await prisma.availabilitySlot.count({
      where: { userId: saathiUser.id },
    });

    let lockedSlotId: string | null = null;

    if (scheduleCount > 0) {
      const slot = slotId
        ? await prisma.availabilitySlot.findFirst({
            where: {
              id: String(slotId),
              userId: saathiUser.id,
              isBooked: false,
            },
          })
        : await prisma.availabilitySlot.findFirst({
            where: {
              userId: saathiUser.id,
              date: String(date),
              time: String(time),
              isBooked: false,
            },
          });

      if (!slot) {
        return NextResponse.json(
          {
            error:
              "That time is not available. Pick an open slot from the list.",
          },
          { status: 400 }
        );
      }
      lockedSlotId = slot.id;
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        saathiId: saathiUser.id,
        saathiName: saathiUser.name || String(saathiName),
        service: String(service),
        city: city || saathiUser.saathiProfile.city || null,
        date: String(date),
        time: String(time),
        durationHours: Number(durationHours) || 1,
        amount: Number(amount),
        status: "CONFIRMED",
        notes: notes ? String(notes) : null,
      },
    });

    if (lockedSlotId) {
      await prisma.availabilitySlot.update({
        where: { id: lockedSlotId },
        data: { isBooked: true, bookingId: booking.id },
      });
    }

    // Client + Saathi email, optional Telegram ops — never block response
    notifyBookingCreated({
      bookingId: booking.id,
      clientEmail: client.email,
      clientName: client.name || session.user.name || null,
      clientPhone: client.phone,
      saathiEmail: saathiUser.email,
      saathiName: saathiUser.name || String(saathiName),
      saathiPhone: saathiUser.phone,
      service: String(service),
      date: String(date),
      time: String(time),
      durationHours: Number(durationHours) || 1,
      amount: Number(amount),
      city: city || saathiUser.saathiProfile.city || null,
    }).catch((err) => console.error("[notify] async error:", err));

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    console.error("booking error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ clientId: user.id }, { saathiId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        review: true,
      },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        ...b,
        hasReview: !!b.review,
        isClient: b.clientId === user.id,
      })),
      paymentStatus: user.paymentStatus,
    });
  } catch (err) {
    console.error("bookings list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, action } = body;

    if (!bookingId || action !== "cancel") {
      return NextResponse.json(
        { error: "bookingId and action=cancel required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== user.id) {
      return NextResponse.json(
        { error: "Only the client can cancel this booking" },
        { status: 403 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    await prisma.availabilitySlot.updateMany({
      where: { bookingId: booking.id },
      data: { isBooked: false, bookingId: null },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("booking cancel error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
