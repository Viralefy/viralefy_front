"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { userRegister } from "@/lib/api";
import { useApp } from "@/components/Providers";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const session = await userRegister({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      });
      login(session);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem" }}>Create account</h1>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (min. 8 characters)</label>
            <input className="input" id="password" name="password" type="password" minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p style={{ color: "var(--muted)", marginTop: "1.25rem", fontSize: "0.9rem" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
