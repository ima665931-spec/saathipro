import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const client = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
      clientName: client.name,
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
    });
  } catch (err) {
    console.error("bookings list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
