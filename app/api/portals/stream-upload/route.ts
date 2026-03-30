import { NextRequest, NextResponse } from "next/server";

import { applyUploadRateLimit } from "@/lib/rate-limit";
import { validateUploadToken } from "@/lib/upload-tokens";
import { prisma } from "@/lib/prisma";
import { checkAccess } from "@/lib/trial";

// Increase function timeout for large uploads
export const maxDuration = 60;

// Cache validated tokens to avoid re-validation on every chunk
const tokenCache = new Map<string, { validated: boolean; timestamp: number }>();
const TOKEN_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// POST /api/portals/stream-upload - Stream upload chunk to cloud storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob;
    const provider = formData.get("provider") as string;
    const uploadToken = formData.get("uploadToken") as string;
    const chunkStart = formData.get("chunkStart") as string;

    if (!chunk || !provider || !uploadToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Only apply rate limiting on first chunk (chunkStart === "0")
    if (chunkStart === "0") {
      const rateLimitResult = await applyUploadRateLimit(request);

      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    // Check token cache first
    const cachedToken = tokenCache.get(uploadToken);
    const now = Date.now();

    if (!cachedToken || now - cachedToken.timestamp > TOKEN_CACHE_TTL) {
      // Validate token (only if not cached or expired)
      const tokenData = validateUploadToken(uploadToken);

      if (!tokenData) {
        return NextResponse.json(
          { error: "Invalid or expired upload token" },
          { status: 401 },
        );
      }

      // On first chunk, verify portal owner still has access
      if (chunkStart === "0") {
        const portal = await prisma.portal.findUnique({
          where: { id: tokenData.portalId },
          select: { userId: true },
        });

        if (portal) {
          const access = await checkAccess(portal.userId);

          if (!access.allowed) {
            return NextResponse.json(
              {
                error: "Trial expired. Subscribe to continue.",
                trialExpired: true,
                code: "TRIAL_EXPIRED",
              },
              { status: 402 },
            );
          }
        }
      }

      // Cache the validated token
      tokenCache.set(uploadToken, { validated: true, timestamp: now });

      // Clean up old cache entries (prevent memory leak)
      if (tokenCache.size > 1000) {
        const oldestAllowed = now - TOKEN_CACHE_TTL;
        const entriesToDelete: string[] = [];

        tokenCache.forEach((value, key) => {
          if (value.timestamp < oldestAllowed) {
            entriesToDelete.push(key);
          }
        });
        entriesToDelete.forEach((key) => tokenCache.delete(key));
      }
    }

    if (provider === "google") {
      // Google Drive resumable upload
      const uploadUrl = formData.get("uploadUrl") as string;
      const chunkStart = parseInt(formData.get("chunkStart") as string);
      const chunkEnd = parseInt(formData.get("chunkEnd") as string);
      const totalSize = parseInt(formData.get("totalSize") as string);

      if (
        !uploadUrl ||
        isNaN(chunkStart) ||
        isNaN(chunkEnd) ||
        isNaN(totalSize)
      ) {
        return NextResponse.json(
          { error: "Missing Google Drive upload parameters" },
          { status: 400 },
        );
      }

      console.log(
        `[Stream Upload] Google Drive chunk ${chunkStart}-${chunkEnd}/${totalSize}`,
      );

      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": chunkBuffer.length.toString(),
          "Content-Range": `bytes ${chunkStart}-${chunkEnd - 1}/${totalSize}`,
        },
        body: chunkBuffer,
      });

      if (!uploadResponse.ok && uploadResponse.status !== 308) {
        const errorText = await uploadResponse.text();

        console.error(
          `[Stream Upload] Google Drive failed:`,
          uploadResponse.status,
          errorText,
        );

        return NextResponse.json(
          { error: `Upload failed: ${uploadResponse.status}` },
          { status: uploadResponse.status },
        );
      }

      const isComplete =
        uploadResponse.status === 200 || uploadResponse.status === 201;

      let fileData = null;

      if (isComplete) {
        fileData = await uploadResponse.json();
        console.log(
          `[Stream Upload] Google Drive complete, file ID: ${fileData.id}`,
        );
      }

      return NextResponse.json({
        success: true,
        complete: isComplete,
        fileData,
        status: uploadResponse.status,
      });
    } else if (provider === "dropbox") {
      // Dropbox upload session (chunked)
      const accessToken = formData.get("accessToken") as string;
      const uploadPath = formData.get("uploadPath") as string;
      const isLastChunk = formData.get("isLastChunk") === "true";
      const chunkIndex = parseInt(formData.get("chunkIndex") as string);
      const sessionId = formData.get("sessionId") as string;

      if (!accessToken || !uploadPath) {
        return NextResponse.json(
          { error: "Missing Dropbox upload parameters" },
          { status: 400 },
        );
      }

      console.log(
        `[Stream Upload] Dropbox chunk ${chunkIndex}, last: ${isLastChunk}, session: ${sessionId || "new"}`,
      );

      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());

      if (chunkIndex === 0 && !sessionId && isLastChunk) {
        // Single chunk upload - use direct upload
        const uploadResponse = await fetch(
          "https://content.dropboxapi.com/2/files/upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
              "Dropbox-API-Arg": JSON.stringify({
                path: uploadPath,
                mode: "add",
                autorename: true,
                mute: false,
              }),
            },
            body: chunkBuffer,
          },
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();

          console.error(
            `[Stream Upload] Dropbox single chunk upload failed:`,
            uploadResponse.status,
            errorText,
          );

          return NextResponse.json(
            { error: `Dropbox upload failed: ${uploadResponse.status}` },
            { status: uploadResponse.status },
          );
        }

        const fileData = await uploadResponse.json();

        console.log(
          `[Stream Upload] Dropbox single chunk complete, file ID: ${fileData.id}`,
        );

        return NextResponse.json({
          success: true,
          complete: true,
          fileData,
        });
      } else if (chunkIndex === 0 && !sessionId) {
        // Start upload session for multi-chunk
        const startResponse = await fetch(
          "https://content.dropboxapi.com/2/files/upload_session/start",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
            },
            body: chunkBuffer,
          },
        );

        if (!startResponse.ok) {
          const errorText = await startResponse.text();

          console.error(
            `[Stream Upload] Dropbox session start failed:`,
            startResponse.status,
            errorText,
          );

          return NextResponse.json(
            { error: `Dropbox session start failed: ${startResponse.status}` },
            { status: startResponse.status },
          );
        }

        const sessionData = await startResponse.json();

        console.log(
          `[Stream Upload] Dropbox session started: ${sessionData.session_id}`,
        );

        return NextResponse.json({
          success: true,
          complete: false,
          sessionId: sessionData.session_id,
        });
      } else if (!isLastChunk && sessionId) {
        // Append to session
        const offset = formData.get("offset") as string;

        if (!offset) {
          return NextResponse.json(
            { error: "Missing offset for chunk append" },
            { status: 400 },
          );
        }

        const appendResponse = await fetch(
          "https://content.dropboxapi.com/2/files/upload_session/append_v2",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
              "Dropbox-API-Arg": JSON.stringify({
                cursor: {
                  session_id: sessionId,
                  offset: parseInt(offset),
                },
              }),
            },
            body: chunkBuffer,
          },
        );

        if (!appendResponse.ok) {
          const errorText = await appendResponse.text();

          console.error(
            `[Stream Upload] Dropbox append failed:`,
            appendResponse.status,
            errorText,
          );

          return NextResponse.json(
            { error: `Dropbox append failed: ${appendResponse.status}` },
            { status: appendResponse.status },
          );
        }

        console.log(
          `[Stream Upload] Dropbox chunk ${chunkIndex} appended at offset ${offset}`,
        );

        return NextResponse.json({
          success: true,
          complete: false,
          sessionId: sessionId,
        });
      } else if (isLastChunk && sessionId) {
        // Finish session
        const offset = formData.get("offset") as string;

        if (!offset) {
          return NextResponse.json(
            { error: "Missing offset for finish" },
            { status: 400 },
          );
        }

        const finishResponse = await fetch(
          "https://content.dropboxapi.com/2/files/upload_session/finish",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
              "Dropbox-API-Arg": JSON.stringify({
                cursor: {
                  session_id: sessionId,
                  offset: parseInt(offset),
                },
                commit: {
                  path: uploadPath,
                  mode: "add",
                  autorename: true,
                  mute: false,
                },
              }),
            },
            body: chunkBuffer,
          },
        );

        if (!finishResponse.ok) {
          const errorText = await finishResponse.text();

          console.error(
            `[Stream Upload] Dropbox finish failed:`,
            finishResponse.status,
            errorText,
          );

          return NextResponse.json(
            { error: `Dropbox finish failed: ${finishResponse.status}` },
            { status: finishResponse.status },
          );
        }

        const fileData = await finishResponse.json();

        console.log(
          `[Stream Upload] Dropbox complete, file ID: ${fileData.id}`,
        );

        return NextResponse.json({
          success: true,
          complete: true,
          fileData,
        });
      } else {
        return NextResponse.json(
          { error: "Invalid Dropbox upload state" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("[Stream Upload] Error:", error);

    return NextResponse.json(
      { error: "Failed to stream upload" },
      { status: 500 },
    );
  }
}
