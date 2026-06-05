"use client";

import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  variant?: "light" | "dark";
};

export default function LogoutButton({ variant = "light" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`ps-button-secondary ps-button-compact ${
        variant === "dark" ? "ps-button-dark" : ""
      }`}
    >
      Logout
    </button>
  );
}
