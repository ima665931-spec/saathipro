import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { requirePaidAccess } from "@/lib/payment-gate";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await requirePaidAccess(session.user.email);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.code, redirect: "/pay" },
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
    } = body;

    if (!saathiId || !saathiName || !service || !date || !time || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = gate.user;

    let saathiUserId = saathiId;
    const realSaathi = await prisma.user.findUnique({
      where: { id: saathiId },
    });

    if (!realSaathi) {
      saathiUserId = client.id;
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        saathiId: saathiUserId,
        saathiName,
        service,
        city: city || null,
        date,
        time,
        durationHours: Number(durationHours) || 1,
        amount: Number(amount),
        status: "CONFIRMED",
        notes: notes || null,
      },
    });

    sendBookingConfirmationEmail({
      to: client.email,
      clientName: session.user.name || null,
      saathiName,
      service,
      date,
      time,
      durationHours: Number(durationHours) || 1,
      amount: Number(amount),
      city: city || null,
    }).catch((err) => console.error("[email] async error:", err));

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

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("booking cancel error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
