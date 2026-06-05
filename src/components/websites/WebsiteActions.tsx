"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WebsiteActionsProps = {
  websiteId: string;
  isActive: boolean;
  websiteName: string;
};

export default function WebsiteActions({
  websiteId,
  isActive,
  websiteName,
}: WebsiteActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePause() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/websites/${websiteId}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        alert("Gagal menjeda monitoring website.");
        return;
      }

      router.refresh();
    } catch {
      alert("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResume() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/websites/${websiteId}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        alert("Gagal mengaktifkan monitoring website.");
        return;
      }

      router.refresh();
    } catch {
      alert("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Yakin ingin menghapus website "${websiteName}"? Data check dan incident terkait juga akan ikut terhapus.`
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Gagal menghapus website.");
        return;
      }

      router.refresh();
    } catch {
      alert("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <button
          type="button"
          onClick={handlePause}
          disabled={isLoading}
          className="ps-button-secondary ps-button-compact disabled:cursor-not-allowed disabled:opacity-60"
        >
          Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={handleResume}
          disabled={isLoading}
          className="ps-button-primary ps-button-compact disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resume
        </button>
      )}

      <button
      type="button"
      onClick={handleDelete}
      disabled={isLoading}
      className="ps-button-danger disabled:cursor-not-allowed disabled:opacity-60"
    >
      Delete
    </button>
    </div>
  );
}
