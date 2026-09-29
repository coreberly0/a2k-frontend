import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homePath } from "@/lib/roles";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homePath(session.role));

  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between bg-steel px-8 py-10 text-white sm:px-14 sm:py-14">
        <p className="font-display text-2xl font-bold tracking-wide">Load Ledger</p>
        <div className="my-16 max-w-md">
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
            Every load, every rupee, in one place.
          </h1>
          <p className="mt-5 text-lg leading-7 text-white/75">
            Track diesel, tolls and driver bata against sales, and keep your
            vendors and customers on the same page.
          </p>
        </div>
        <div className="hazard h-3 w-full" aria-hidden />
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <LoginForm />
      </section>
    </main>
  );
}
