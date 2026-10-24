import { prisma } from "@/lib/prisma";
import { generateRegistrationId } from "@/lib/ids";

async function ensurePublicId(userId: string, current?: string | null) {
  if (current) return current;
  for (let i = 0; i < 8; i++) {
    const id = generateRegistrationId();
    try {
      await prisma.user.update({ where: { id: userId }, data: { publicId: id } });
      return id;
    } catch {
      /* unique clash */
    }
  }
  return null;
}

type SessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
} | null;

/**
 * Resolve DB user from NextAuth session.
 * Looks up by id, then email; creates user if session is valid but row missing
 * (common after JWT sessions / partial OAuth).
 */
export async function ensureSessionUser(session: SessionLike) {
  const emailRaw = session?.user?.email?.trim();
  if (!emailRaw) return null;

  const email = emailRaw.toLowerCase();
  const sessionId = session?.user?.id || null;

  let user =
    (sessionId
      ? await prisma.user.findUnique({ where: { id: sessionId } })
      : null) ||
    (await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    }));

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          name: session?.user?.name || null,
          image: session?.user?.image || null,
          role: "USER",
          paymentStatus: "NONE",
          publicId: generateRegistrationId(),
        },
      });
    } catch {
      // Race: another request created the same email
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
    }
  }

  if (!user) return null;

  if (!user.publicId) {
    await ensurePublicId(user.id, user.publicId);
    user = (await prisma.user.findUnique({ where: { id: user.id } })) || user;
  }

  return user;
}

export async function ensureSessionUserWithPayments(session: SessionLike) {
  const base = await ensureSessionUser(session);
  if (!base) return null;

  return prisma.user.findUnique({
    where: { id: base.id },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}
