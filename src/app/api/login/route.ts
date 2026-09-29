import { NextResponse } from "next/server";
import { DEMO_USERS } from "@/lib/users";
import { encode, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  // Find the user by email and password only. The role comes from the user record.
  const user = DEMO_USERS.find(
    (u) =>
      u.email === String(email ?? "").toLowerCase().trim() &&
      u.password === password
  );

  if (!user) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ redirect: `/dashboard/${user.role}` });
  res.cookies.set(
    SESSION_COOKIE,
    encode({ email: user.email, name: user.name, role: user.role }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    }
  );
  return res;
}