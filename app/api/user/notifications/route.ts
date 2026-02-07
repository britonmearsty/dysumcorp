import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailNotifications, pushNotifications, weeklyReports } =
      await req.json();

    // In a real app, you would store these preferences in the database
    // For now, we'll just return success
    // You can extend the User model to include notification preferences

    console.log("Notification preferences updated:", {
      userId: session.user.id,
      emailNotifications,
      pushNotifications,
      weeklyReports,
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
