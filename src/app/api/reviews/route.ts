import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Valid booking and rating (1–5) required" },
        { status: 400 }
      );
    }

    const client = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: "insensitive" } },
    });
    if (!client) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.clientId !== client.id) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot review a cancelled booking" },
        { status: 400 }
      );
    }
    if (booking.review) {
      return NextResponse.json(
        { error: "Already reviewed" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        clientId: client.id,
        saathiId: booking.saathiId,
        rating: Number(rating),
        comment: comment?.trim()?.slice(0, 500) || null,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("review create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const saathiId = searchParams.get("saathiId");

    if (!saathiId) {
      return NextResponse.json({ error: "saathiId required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { saathiId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        client: { select: { name: true } },
      },
    });

    const avg =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        clientName: r.client.name || "Member",
        createdAt: r.createdAt,
      })),
      average: Math.round(avg * 10) / 10,
      count: reviews.length,
    });
  } catch (err) {
    console.error("reviews list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
