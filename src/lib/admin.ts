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

  let user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    return { error: "User not found", status: 404 as const, user: null };
  }

  if (user.isBanned) {
    return { error: "Banned", status: 403 as const, user: null };
  }

  const inList = adminEmails.includes(user.email.trim().toLowerCase());
  const isAdmin = user.role === "ADMIN" || inList;

  if (!isAdmin) {
    return {
      error: `Forbidden. Use /admin/login with ADMIN_USERNAME + ADMIN_PASSWORD, or set this email in ADMIN_EMAILS.`,
      status: 403 as const,
      user: null,
    };
  }

  if (user.role !== "ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  return { error: null, status: 200 as const, user };
}
