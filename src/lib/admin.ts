import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function parseAdminEmails(): string[] {
  const raw = [
    process.env.ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .join(",");

  return raw
    .split(/[,;\n]+/)
    .map((e) => e.trim().toLowerCase().replace(/^["']|["']$/g, ""))
    .filter((e) => e.includes("@"));
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 as const, user: null };
  }

  const email = session.user.email.trim().toLowerCase();
  const adminEmails = parseAdminEmails();

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // try case-insensitive lookup if exact miss
  if (!user) {
    const all = await prisma.user.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      take: 1,
    });
    user = all[0] || null;
  }

  if (!user) {
    return { error: "User not found", status: 404 as const, user: null };
  }

  const inList = adminEmails.includes(user.email.trim().toLowerCase());
  const isAdmin = user.role === "ADMIN" || inList;

  if (!isAdmin) {
    return {
      error: `Forbidden. Logged in as ${user.email}. Set this exact email in ADMIN_EMAILS (current list size: ${adminEmails.length}).`,
      status: 403 as const,
      user: null,
    };
  }

  if (user.role !== "ADMIN" && inList) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  return { error: null, status: 200 as const, user };
}
