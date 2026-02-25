import { auth } from "@/lib/auth-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_DOMAIN = (
  process.env.ADMIN_DOMAIN || "dysumcorp.com"
).toLowerCase();

export async function isAdmin(
  headers: Headers,
): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  try {
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return { isAdmin: false };
    }

    const userEmail = session.user.email?.toLowerCase();

    if (!userEmail) {
      return { isAdmin: false, userId: session.user.id };
    }

    const isAdminUser =
      ADMIN_EMAILS.includes(userEmail) ||
      userEmail.endsWith(`@${ADMIN_DOMAIN}`);

    return {
      isAdmin: isAdminUser,
      userId: session.user.id,
      email: session.user.email,
    };
  } catch {
    return { isAdmin: false };
  }
}

export function requireAdminEmail(email: string): boolean {
  const userEmail = email.toLowerCase();

  return (
    ADMIN_EMAILS.includes(userEmail) || userEmail.endsWith(`@${ADMIN_DOMAIN}`)
  );
}
