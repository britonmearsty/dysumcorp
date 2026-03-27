import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { checkAccess } from "@/lib/trial";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await checkAccess(session.user.id);

    // If user is on trial, also check trial file limit
    if (access.allowed && access.reason === "trialing") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          trialFileLimit: true,
          trialFileCount: true,
        },
      });

      if (user && user.trialFileCount >= user.trialFileLimit) {
        return NextResponse.json({
          allowed: false,
          reason: "trial_limit_exceeded",
          fileCount: user.trialFileCount,
          fileLimit: user.trialFileLimit,
        });
      }
    }

    return NextResponse.json(access);
  } catch (error) {
    console.error("[/api/access] Error:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 },
    );
  }
}
