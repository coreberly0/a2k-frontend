import { NextResponse } from "next/server";
import { usersStore } from "@/lib/users";
import { homePath } from "@/lib/roles";
import { encode, SESSION_COOKIE } from "@/lib/session";
import { logAudit } from "@/lib/data/audit";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  const user = usersStore.list().find(
    (u) =>
      u.active &&
      u.email === String(email ?? "").toLowerCase().trim() &&
      u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  logAudit(user.email, "Signed in");
  const res = NextResponse.json({ redirect: homePath(user.role) });
  res.cookies.set(
    SESSION_COOKIE,
    encode({ id: user.id, email: user.email, name: user.name, role: user.role }),
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
