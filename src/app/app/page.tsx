import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAgentRole } from "@/lib/account-type";

/**
 * PWA / installed-app entry (manifest start_url).
 * Never shows marketing site — only auth or home inside the product.
 */
export default async function AppEntryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/app");
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { role: true, isBanned: true },
  });

  if (!user || user.isBanned) {
    redirect("/login?error=banned");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (isAgentRole(user.role)) {
    redirect("/agent");
  }

  redirect("/dashboard");
}
