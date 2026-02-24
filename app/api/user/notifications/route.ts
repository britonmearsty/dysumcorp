import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { getSession } from "@/lib/auth-server";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyOnUpload: true,
        notifyOnDownload: true,
        notifyOnSignIn: true,
        notifyOnPortalCreate: true,
        notifyOnStorageWarning: true,
        weeklyReports: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching notifications:", error);

    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      notifyOnUpload,
      notifyOnDownload,
      notifyOnSignIn,
      notifyOnPortalCreate,
      notifyOnStorageWarning,
      weeklyReports,
    } = await req.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notifyOnUpload: notifyOnUpload ?? true,
        notifyOnDownload: notifyOnDownload ?? true,
        notifyOnSignIn: notifyOnSignIn ?? true,
        notifyOnPortalCreate: notifyOnPortalCreate ?? true,
        notifyOnStorageWarning: notifyOnStorageWarning ?? true,
        weeklyReports: weeklyReports ?? false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);

    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
