import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homePath } from "@/lib/roles";

export default async function DashboardIndex() {
  const session = await getSession();
  redirect(session ? homePath(session.role) : "/login");
}
