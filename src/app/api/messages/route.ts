import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBlockedText } from "@/lib/content-filter";
import { ensureSessionUser } from "@/lib/session-user";

const MAX_BODY = 2000;
const MAX_PAGE = 100;

async function assertBookingAccess(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, name: true } },
      saathi: { select: { id: true, name: true } },
    },
  });
  if (!booking) return { error: "Booking not found", status: 404 as const };
  if (booking.clientId !== userId && booking.saathiId !== userId) {
    return { error: "Not your booking", status: 403 as const };
  }
  if (booking.status === "CANCELLED") {
    return { error: "Chat closed for cancelled bookings", status: 400 as const, booking };
  }
  return { booking };
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureSessionUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const access = await assertBookingAccess(bookingId, user.id);
    if (access.error && !access.booking) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    // Allow reading cancelled chat history, but not sending (POST blocks)
    const booking = access.booking!;
    if (booking.clientId !== user.id && booking.saathiId !== user.id) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }

    const after = searchParams.get("after"); // ISO or message id cursor by time
    const messages = await prisma.message.findMany({
      where: {
        bookingId,
        ...(after
          ? { createdAt: { gt: new Date(after) } }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      take: MAX_PAGE,
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Mark others' messages as read
    await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const peer =
      booking.clientId === user.id
        ? { id: booking.saathiId, name: booking.saathi.name || booking.saathiName }
        : { id: booking.clientId, name: booking.client.name || "Client" };

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName: m.sender.name || "Member",
        mine: m.senderId === user.id,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() || null,
      })),
      booking: {
        id: booking.id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        saathiName: booking.saathiName,
      },
      peer,
      me: { id: user.id, name: user.name || "You" },
      canSend: booking.status !== "CANCELLED",
    });
  } catch (err) {
    console.error("messages GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureSessionUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const body = await req.json();
    const bookingId = String(body.bookingId || "");
    const text = String(body.body || "").trim();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (text.length > MAX_BODY) {
      return NextResponse.json(
        { error: `Message max ${MAX_BODY} characters` },
        { status: 400 }
      );
    }
    if (isBlockedText(text)) {
      return NextResponse.json(
        { error: "Message contains content that is not allowed" },
        { status: 400 }
      );
    }

    const access = await assertBookingAccess(bookingId, user.id);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Simple rate limit: max 30 messages / minute from this user on this booking
    const since = new Date(Date.now() - 60_000);
    const recent = await prisma.message.count({
      where: {
        bookingId,
        senderId: user.id,
        createdAt: { gte: since },
      },
    });
    if (recent >= 30) {
      return NextResponse.json(
        { error: "Slow down — too many messages" },
        { status: 429 }
      );
    }

    const msg = await prisma.message.create({
      data: {
        bookingId,
        senderId: user.id,
        body: text,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: msg.id,
        body: msg.body,
        senderId: msg.senderId,
        senderName: msg.sender.name || "Member",
        mine: true,
        createdAt: msg.createdAt.toISOString(),
        readAt: null,
      },
    });
  } catch (err) {
    console.error("messages POST:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
