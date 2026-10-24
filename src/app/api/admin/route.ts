import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { computeExpiry, isValidPlanId, type PlanId } from "@/lib/plans";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "stats";
  const q = searchParams.get("q")?.trim() || "";

  try {
    if (section === "stats") {
      const [
        users, saathis, bookings, reviews, revenue, banned, verified,
        activeBookings, pendingPay, upiCount, upiTotal,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.saathiProfile.count(),
        prisma.booking.count(),
        prisma.review.count(),
        prisma.booking.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { amount: true } }),
        prisma.user.count({ where: { isBanned: true } }),
        prisma.saathiProfile.count({ where: { isVerified: true } }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma.payment.count({ where: { status: "PENDING" } }),
        prisma.upiPool.count({ where: { isActive: true } }),
        prisma.upiPool.count(),
      ]);

      return NextResponse.json({
        stats: {
          users, saathis, bookings, reviews,
          revenue: revenue._sum.amount || 0,
          banned, verified, activeBookings, pendingPay, upiCount, upiTotal,
        },
      });
    }

    if (section === "users") {
      const users = await prisma.user.findMany({
        where: q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          isBanned: true, paymentStatus: true, plan: true, planExpiresAt: true, createdAt: true,
          saathiProfile: { select: { id: true, city: true, isVerified: true, isActive: true } },
          _count: { select: { bookingsAsClient: true, bookingsAsSaathi: true, reviewsGiven: true } },
        },
      });
      return NextResponse.json({ users });
    }

    if (section === "saathis") {
      const profiles = await prisma.saathiProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, name: true, email: true, isBanned: true, image: true } },
        },
      });
      return NextResponse.json({ saathis: profiles });
    }

    if (section === "bookings") {
      const status = searchParams.get("status");
      const bookings = await prisma.booking.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          client: { select: { name: true, email: true } },
          review: true,
        },
      });
      return NextResponse.json({ bookings });
    }

    if (section === "reviews") {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          client: { select: { name: true, email: true } },
          saathi: { select: { name: true, email: true } },
        },
      });
      return NextResponse.json({ reviews });
    }

    if (section === "payments") {
      const payments = await prisma.payment.findMany({
        where: { status: { not: "ASSIGNED" } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: {
            select: {
              id: true, name: true, email: true, paymentStatus: true, plan: true, planExpiresAt: true,
            },
          },
          upiPool: { select: { upiId: true, displayName: true } },
        },
      });
      return NextResponse.json({ payments });
    }

    if (section === "upi") {
      const list = await prisma.upiPool.findMany({
        orderBy: [{ isActive: "desc" }, { usedToday: "desc" }, { createdAt: "desc" }],
        take: 500,
      });
      return NextResponse.json({ upiList: list, total: list.length });
    }

    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (err) {
    console.error("admin GET:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await req.json();
    const {
      action, userId, saathiUserId, bookingId, reviewId, paymentId, role, rate,
      upiId, upiBulk, displayName, dailyLimit, priority, poolId, isActive,
    } = body;

    switch (action) {
      case "ban_user": {
        await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
        return NextResponse.json({ success: true });
      }
      case "unban_user": {
        await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
        return NextResponse.json({ success: true });
      }
      case "set_role": {
        if (!["USER", "SAATHI", "ADMIN"].includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await prisma.user.update({ where: { id: userId }, data: { role } });
        return NextResponse.json({ success: true });
      }
      case "delete_user": {
        if (userId === gate.user!.id) {
          return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }
        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
      }

      case "verify_saathi": {
        await prisma.saathiProfile.update({ where: { userId: saathiUserId }, data: { isVerified: true } });
        return NextResponse.json({ success: true });
      }
      case "unverify_saathi": {
        await prisma.saathiProfile.update({ where: { userId: saathiUserId }, data: { isVerified: false } });
        return NextResponse.json({ success: true });
      }
      case "activate_saathi": {
        await prisma.saathiProfile.update({ where: { userId: saathiUserId }, data: { isActive: true } });
        return NextResponse.json({ success: true });
      }
      case "deactivate_saathi": {
        await prisma.saathiProfile.update({ where: { userId: saathiUserId }, data: { isActive: false } });
        return NextResponse.json({ success: true });
      }
      case "set_saathi_rate": {
        await prisma.saathiProfile.update({ where: { userId: saathiUserId }, data: { hourlyRate: Number(rate) } });
        return NextResponse.json({ success: true });
      }
      case "promote_to_saathi": {
        await prisma.user.update({ where: { id: userId }, data: { role: "SAATHI" } });
        await prisma.saathiProfile.upsert({
          where: { userId },
          create: {
            userId,
            bio: "Admin-created profile",
            city: "India",
            hourlyRate: 1500,
            services: JSON.stringify(["Hanging Out"]),
            isActive: true,
            isVerified: false,
          },
          update: {},
        });
        return NextResponse.json({ success: true });
      }

      case "cancel_booking": {
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
        return NextResponse.json({ success: true });
      }
      case "confirm_booking": {
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
        return NextResponse.json({ success: true });
      }
      case "complete_booking": {
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
        return NextResponse.json({ success: true });
      }
      case "delete_booking": {
        await prisma.booking.delete({ where: { id: bookingId } });
        return NextResponse.json({ success: true });
      }
      case "delete_review": {
        await prisma.review.delete({ where: { id: reviewId } });
        return NextResponse.json({ success: true });
      }

      case "approve_payment": {
        const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!pay) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const planId: PlanId = isValidPlanId(pay.plan) ? pay.plan : "MONTHLY";
        const user = await prisma.user.findUnique({ where: { id: pay.userId } });
        const expires = computeExpiry(planId, user?.planExpiresAt);

        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "APPROVED" },
        });
        await prisma.user.update({
          where: { id: pay.userId },
          data: {
            paymentStatus: "VERIFIED",
            plan: planId,
            planExpiresAt: expires,
          },
        });
        // Activate saathi listing if they applied
        await prisma.saathiProfile.updateMany({
          where: { userId: pay.userId },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, plan: planId, planExpiresAt: expires });
      }

      case "reject_payment": {
        const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!pay) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "REJECTED" },
        });
        await prisma.user.update({
          where: { id: pay.userId },
          data: { paymentStatus: "REJECTED" },
        });
        return NextResponse.json({ success: true });
      }

      case "add_upi": {
        if (!upiId || typeof upiId !== "string" || !upiId.includes("@")) {
          return NextResponse.json({ error: "Valid UPI ID required" }, { status: 400 });
        }
        const lim = Number(dailyLimit) >= 0 && !Number.isNaN(Number(dailyLimit)) ? Number(dailyLimit) : 50;
        const created = await prisma.upiPool.create({
          data: {
            upiId: upiId.trim().toLowerCase(),
            displayName: displayName?.trim() || "SaathiPro",
            dailyLimit: lim,
            priority: Number(priority) || 0,
            isActive: true,
          },
        });
        return NextResponse.json({ success: true, upi: created });
      }

      case "bulk_add_upi": {
        const raw = String(upiBulk || upiId || "");
        const lines = raw.split(/[\n,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"));
        if (lines.length === 0) {
          return NextResponse.json({ error: "Paste UPI IDs" }, { status: 400 });
        }
        const lim = Number(dailyLimit) >= 0 && !Number.isNaN(Number(dailyLimit)) ? Number(dailyLimit) : 50;
        const name = displayName?.trim() || "SaathiPro";
        let added = 0, skipped = 0;
        for (const id of lines) {
          try {
            await prisma.upiPool.create({ data: { upiId: id, displayName: name, dailyLimit: lim, isActive: true } });
            added++;
          } catch { skipped++; }
        }
        return NextResponse.json({ success: true, added, skipped, message: `Added ${added}, skipped ${skipped}` });
      }

      case "update_upi": {
        if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });
        await prisma.upiPool.update({
          where: { id: poolId },
          data: {
            ...(displayName !== undefined && { displayName }),
            ...(dailyLimit !== undefined && { dailyLimit: Number(dailyLimit) }),
            ...(priority !== undefined && { priority: Number(priority) }),
            ...(typeof isActive === "boolean" && { isActive }),
          },
        });
        return NextResponse.json({ success: true });
      }

      case "toggle_upi": {
        if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });
        const cur = await prisma.upiPool.findUnique({ where: { id: poolId } });
        if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
        await prisma.upiPool.update({ where: { id: poolId }, data: { isActive: !cur.isActive } });
        return NextResponse.json({ success: true });
      }

      case "reset_upi_count": {
        if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });
        await prisma.upiPool.update({ where: { id: poolId }, data: { usedToday: 0, lastResetAt: new Date() } });
        return NextResponse.json({ success: true });
      }

      case "delete_upi": {
        if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });
        await prisma.upiPool.delete({ where: { id: poolId } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error("admin PATCH:", err);
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "This UPI already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
