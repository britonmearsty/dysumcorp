import { headers } from "next/headers";

import { auth, prisma } from "@/lib/auth";

export async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

export async function getSessionFromRequest(request: Request) {
  return await auth.api.getSession({ headers: request.headers });
}

export { auth, prisma };
