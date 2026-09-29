import crypto from "crypto";
import { cookies } from "next/headers";
import type { Role } from "./roles";

export const SESSION_COOKIE = "session";
export type Session = { id: string; email: string; name: string; role: Role };

const secret = () => process.env.SESSION_SECRET ?? "dev-secret-change-me";
const sign = (v: string) =>
  crypto.createHmac("sha256", secret()).update(v).digest("base64url");

export function encode(s: Session) {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decode(token?: string): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return decode(store.get(SESSION_COOKIE)?.value);
}
