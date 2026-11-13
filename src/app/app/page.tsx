import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAgentRole } from "@/lib/account-type";

/**
 * PWA / installed-app entry (manifest start_url).
 * Member product only — never dumps users into admin panel.
 * Admin is a separate browser tool at /admin.
 */
export default async function AppEntryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { role: true, isBanned: true },
  });

  if (!user || user.isBanned) {
    redirect("/login?error=banned");
  }

  // Agents use agent hub — not member dashboard
  if (isAgentRole(user.role)) {
    redirect("/agent");
  }

  // ADMIN + USER + SAATHI all land on member dashboard from the app icon.
  // Ops admin panel: open /admin intentionally in a browser, not from APK.
  redirect("/dashboard");
}
