import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardIndex() {
  const session = await getSession();
  redirect(session ? `/dashboard/${session.role}` : "/login");
}