import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureSessionUser } from "@/lib/session-user";

const TIME_RE = /^(1[0-2]|[1-9]):[0-5]\d\s?(AM|PM)$/i;

function isValidDate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/** GET ?saathiId=&date= → free slots for booking UI
 *  GET ?mine=1 → provider's own slots
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const saathiId = searchParams.get("saathiId");
    const date = searchParams.get("date");
    const mine = searchParams.get("mine") === "1";

    if (mine) {
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = await ensureSessionUser(session);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const fromStr = from.toISOString().slice(0, 10);
      const slots = await prisma.availabilitySlot.findMany({
        where: { userId: user.id, date: { gte: fromStr } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: 200,
      });
      return NextResponse.json({ slots });
    }

    if (!saathiId) {
      return NextResponse.json({ error: "saathiId required" }, { status: 400 });
    }

    const where: {
      userId: string;
      isBooked: boolean;
      date?: string | { gte: string };
    } = {
      userId: saathiId,
      isBooked: false,
    };

    if (date && isValidDate(date)) {
      where.date = date;
    } else {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      where.date = { gte: from.toISOString().slice(0, 10) };
    }

    const slots = await prisma.availabilitySlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 100,
      select: { id: true, date: true, time: true },
    });

    const totalConfigured = await prisma.availabilitySlot.count({
      where: { userId: saathiId },
    });

    return NextResponse.json({
      slots,
      /** If provider never set slots, book page may allow open times */
      hasSchedule: totalConfigured > 0,
    });
  } catch (err) {
    console.error("slots GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Provider: add slots { date, times: string[] } or { slots: {date,time}[] } */
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
    const pairs: { date: string; time: string }[] = [];

    if (Array.isArray(body.slots)) {
      for (const s of body.slots) {
        if (s?.date && s?.time) pairs.push({ date: String(s.date), time: String(s.time).trim() });
      }
    } else if (body.date && Array.isArray(body.times)) {
      const d = String(body.date);
      for (const t of body.times) {
        pairs.push({ date: d, time: String(t).trim() });
      }
    } else {
      return NextResponse.json(
        { error: "Send { date, times[] } or { slots: [{date,time}] }" },
        { status: 400 }
      );
    }

    if (pairs.length === 0) {
      return NextResponse.json({ error: "No slots" }, { status: 400 });
    }
    if (pairs.length > 48) {
      return NextResponse.json({ error: "Max 48 slots per request" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    for (const p of pairs) {
      if (!isValidDate(p.date) || p.date < todayStr) {
        return NextResponse.json({ error: `Invalid or past date: ${p.date}` }, { status: 400 });
      }
      if (!TIME_RE.test(p.time)) {
        return NextResponse.json({ error: `Invalid time: ${p.time}` }, { status: 400 });
      }
    }

    let created = 0;
    for (const p of pairs) {
      try {
        await prisma.availabilitySlot.create({
          data: { userId: user.id, date: p.date, time: p.time },
        });
        created++;
      } catch {
        /* unique clash — already exists */
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (err) {
    console.error("slots POST:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Provider: delete free slot by id */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await ensureSessionUser(session);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
    if (!slot || slot.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (slot.isBooked) {
      return NextResponse.json({ error: "Cannot delete a booked slot" }, { status: 400 });
    }

    await prisma.availabilitySlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("slots DELETE:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
