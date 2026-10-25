import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasActivePlan } from "@/lib/plans";
import { generateRegistrationId } from "@/lib/ids";
import { isAgentRole } from "@/lib/account-type";

/**
 * Post-auth router for MAIN APP only (seeker / provider).
 * Agents are redirected away — separate product.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const email = session.user.email.trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          name: session.user.name || null,
          image: session.user.image || null,
          role: "USER",
          paymentStatus: "NONE",
          publicId: generateRegistrationId(),
        },
      });
    } catch {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
    }
  }

  if (!user) {
    redirect("/login?error=session");
  }

  // Agent accounts cannot use main member app
  if (isAgentRole(user.role)) {
    redirect("/agent");
  }

  if (!user.publicId) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { publicId: generateRegistrationId() },
      });
    } catch {
      /* ignore */
    }
  }

  if (user.isBanned) {
    redirect("/login?error=banned");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (hasActivePlan(user)) {
    redirect("/dashboard");
  }

  if (user.paymentStatus === "PENDING") {
    redirect("/pay");
  }

  redirect("/pricing");
}
