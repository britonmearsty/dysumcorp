import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileUri = `data:${file.type};base64,${buffer.toString("base64")}`;

        const result: any = await uploadToCloudinary(fileUri, folder);

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload to Cloudinary" },
            { status: 500 }
        );
    }
}
