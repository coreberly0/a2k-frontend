"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, ROLE_META } from "@/lib/roles";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not sign in. Try again.");
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="font-display text-4xl font-bold">Sign in</h2>
      <p className="mt-1 text-gravel">Use the email and password you were given.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full border border-ink/20 bg-white px-3 py-2.5 outline-none focus:border-steel focus:ring-2 focus:ring-steel/30"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full border border-ink/20 bg-white px-3 py-2.5 pr-16 outline-none focus:border-steel focus:ring-2 focus:ring-steel/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-steel"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-signal px-4 py-3 font-semibold text-ink transition-colors hover:bg-signal/85 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>

      {/* DEMO ONLY: delete this whole block when you connect a real database */}
      <div className="mt-8 border-t border-ink/10 pt-5">
        <p className="text-sm font-medium">Demo logins (click to fill)</p>
        <ul className="mt-2 space-y-1">
          {ROLES.map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() => {
                  setEmail(ROLE_META[r].demo.email);
                  setPassword(ROLE_META[r].demo.password);
                  setError("");
                }}
                className="text-sm text-steel underline underline-offset-4"
              >
                {ROLE_META[r].label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}