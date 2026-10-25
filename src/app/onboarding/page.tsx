import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateRegistrationId } from "@/lib/ids";
import { isAgentRole } from "@/lib/account-type";

/**
 * After login/register → always Dashboard.
 * Browse is free. Plan is required only when booking / messaging / going live.
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

  if (!user) redirect("/login?error=session");

  if (isAgentRole(user.role)) redirect("/agent");
  if (user.isBanned) redirect("/login?error=banned");
  if (user.role === "ADMIN") redirect("/admin");

  if (!user.publicId) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { publicId: generateRegistrationId() },
      });
    } catch {
      /* */
    }
  }

  redirect("/dashboard");
}
