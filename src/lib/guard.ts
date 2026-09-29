import { redirect } from "next/navigation";
import { getSession } from "./session";
import { homePath, type Role } from "./roles";

// Put this on top of every page and action.
export async function requireRole(roles: Role[]) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!roles.includes(s.role)) redirect(homePath(s.role));
  return s;
}
