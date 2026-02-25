import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-server";
import { checkFeatureAccess, getUserPlanType } from "@/lib/plan-limits";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expiresAt } = await request.json();

    if (!expiresAt) {
      return NextResponse.json(
        { error: "Expiration date is required" },
        { status: 400 },
      );
    }

    // Validate expiration date is in the future
    const expirationDate = new Date(expiresAt);

    if (expirationDate <= new Date()) {
      return NextResponse.json(
        {
          error: "Expiration date must be in the future",
        },
        { status: 400 },
      );
    }

    // Check if user has access to expiring links feature
    const planType = await getUserPlanType(session.user.id);
    const featureCheck = checkFeatureAccess(planType, "expiringLinks");

    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.reason || "Expiring links require a Pro plan",
          upgrade: true,
          currentPlan: planType,
        },
        { status: 403 },
      );
    }

    // Check if user owns the file
    const file = await prisma.file.findFirst({
      where: {
        id,
        portal: {
          userId: session.user.id,
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Set the expiration date
    await prisma.file.update({
      where: { id },
      data: { expiresAt: expirationDate },
    });

    return NextResponse.json({
      success: true,
      message: "Expiration date set successfully",
      expiresAt: expirationDate,
    });
  } catch (error) {
    console.error("Error setting file expiration:", error);

    return NextResponse.json(
      { error: "Failed to set expiration date" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(request);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns the file
    const file = await prisma.file.findFirst({
      where: {
        id,
        portal: {
          userId: session.user.id,
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Remove expiration date
    await prisma.file.update({
      where: { id },
      data: { expiresAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Expiration date removed successfully",
    });
  } catch (error) {
    console.error("Error removing file expiration:", error);

    return NextResponse.json(
      { error: "Failed to remove expiration date" },
      { status: 500 },
    );
  }
}
