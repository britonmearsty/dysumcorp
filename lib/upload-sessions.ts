import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface UploadSession {
  uploadUrl: string;
  uploadedBytes: number;
  totalBytes: number;
  provider: "google" | "dropbox";
  portalId: string;
  fileName: string;
  createdAt: number;
}

const SESSION_PREFIX = "upload-session:";
const SESSION_TTL = 3600; // 1 hour TTL for upload sessions

export async function getUploadSession(
  sessionId: string,
): Promise<UploadSession | null> {
  try {
    const data = await redis.get(`${SESSION_PREFIX}${sessionId}`);

    return data as UploadSession | null;
  } catch (error) {
    console.error("Failed to get upload session from Redis:", error);

    return null;
  }
}

export async function setUploadSession(
  sessionId: string,
  session: UploadSession,
): Promise<boolean> {
  try {
    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );

    return true;
  } catch (error) {
    console.error("Failed to set upload session in Redis:", error);

    return false;
  }
}

export async function updateUploadSession(
  sessionId: string,
  updates: Partial<UploadSession>,
): Promise<boolean> {
  try {
    const existing = await getUploadSession(sessionId);

    if (!existing) return false;

    const updated = { ...existing, ...updates };

    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(updated),
    );

    return true;
  } catch (error) {
    console.error("Failed to update upload session in Redis:", error);

    return false;
  }
}

export async function deleteUploadSession(sessionId: string): Promise<boolean> {
  try {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);

    return true;
  } catch (error) {
    console.error("Failed to delete upload session from Redis:", error);

    return false;
  }
}

export async function incrementUploadedBytes(
  sessionId: string,
  bytesToAdd: number,
): Promise<UploadSession | null> {
  try {
    const session = await getUploadSession(sessionId);

    if (!session) return null;

    session.uploadedBytes += bytesToAdd;
    await redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );

    return session;
  } catch (error) {
    console.error("Failed to increment uploaded bytes:", error);

    return null;
  }
}

class InMemoryUploadSessions {
  private sessions: Map<string, UploadSession> = new Map();

  get(sessionId: string): UploadSession | null {
    return this.sessions.get(sessionId) || null;
  }

  set(sessionId: string, session: UploadSession): void {
    this.sessions.set(sessionId, session);
  }

  update(
    sessionId: string,
    updates: Partial<UploadSession>,
  ): UploadSession | null {
    const existing = this.sessions.get(sessionId);

    if (!existing) return null;

    const updated = { ...existing, ...updates };

    this.sessions.set(sessionId, updated);

    return updated;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  incrementBytes(sessionId: string, bytesToAdd: number): UploadSession | null {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    session.uploadedBytes += bytesToAdd;
    this.sessions.set(sessionId, session);

    return session;
  }
}

const fallbackSessions = new InMemoryUploadSessions();

export function getFallbackUploadSessions(): InMemoryUploadSessions {
  return fallbackSessions;
}

export function hasRedis(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
