"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BrandIcon from "@/components/BrandIcon";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@monitoring.local");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login gagal.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[var(--ps-canvas-dark)] text-[var(--ps-on-dark)] lg:grid-cols-[1fr_480px]">
      <section className="flex items-center px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <BrandIcon className="mb-8" size={48} />
          <h1 className="ps-display-xl">Monitoring Station</h1>
          <p className="ps-body-md mt-5 max-w-xl text-[var(--ps-body-dark)]">
            Masuk untuk melihat status website, incident aktif, dan pengiriman
            notifikasi realtime.
          </p>
        </div>
      </section>

      <section className="flex items-center bg-[var(--ps-canvas-light)] px-6 py-12 text-[var(--ps-ink)]">
      <div className="ps-card w-full max-w-sm p-6">
        <h2 className="ps-heading-xl">Login</h2>
        <p className="ps-body-sm mt-2 text-[var(--ps-body-light)]">
          Masuk ke dashboard monitoring.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="ps-caption font-semibold">Email</label>
            <input
              type="email"
              className="ps-input mt-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@ptrekaindo.co.id"
            />
          </div>

          <div>
            <label className="ps-caption font-semibold">Password</label>
            <input
              type="password"
              className="ps-input mt-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </div>

          {error ? (
            <div className="rounded-[var(--ps-radius-sm)] border border-[rgba(200,27,58,0.22)] bg-[rgba(200,27,58,0.08)] px-4 py-3 text-sm text-[var(--ps-warning)]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="ps-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
      </section>
    </main>
  );
}
