import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { sendSupportRequestEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, subject, message } = await req.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const result = await sendSupportRequestEmail({
            name,
            email,
            subject,
            message,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to send email" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in support API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
