import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 as const, user: null };
  }

  const email = session.user.email.toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { error: "User not found", status: 404 as const, user: null };
  }

  const isAdmin =
    user.role === "ADMIN" || adminEmails.includes(email);

  if (!isAdmin) {
    return { error: "Forbidden", status: 403 as const, user: null };
  }

  // Auto-promote listed emails to ADMIN role once
  if (user.role !== "ADMIN" && adminEmails.includes(email)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
    user.role = "ADMIN";
  }

  return { error: null, status: 200 as const, user };
}
