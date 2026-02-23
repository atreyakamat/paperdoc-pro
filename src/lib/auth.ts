import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const authSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-auth-secret-change-me",
);

const sessionCookieName = "paperdoc_session";

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
};

type SessionPayload = SessionUser & {
  iat?: number;
  exp?: number;
};

export const hashPassword = async (value: string) => hash(value, 10);

export const verifyPassword = async (value: string, passwordHash: string) =>
  compare(value, passwordHash);

export const createSessionToken = async (user: SessionUser) => {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret);
};

export const setSessionCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionPayload>(token, authSecret);
    const payload = verified.payload;

    if (!payload.userId || !payload.email || !payload.name) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
};

const shareSecret = new TextEncoder().encode(
  process.env.SHARE_LINK_SECRET ?? "dev-share-secret-change-me",
);

export const createShareToken = async (payload: {
  shareId: string;
  documentId: string;
  tokenId: string;
  ownerId: string;
  expiresAtIso: string;
}) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAtIso))
    .sign(shareSecret);
};

export const verifyShareToken = async (token: string) => {
  const verified = await jwtVerify<{
    shareId: string;
    documentId: string;
    tokenId: string;
    ownerId: string;
  }>(token, shareSecret);

  return verified.payload;
};
