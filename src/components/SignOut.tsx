"use client";

import { useRouter } from "next/navigation";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="btn-secondary"
      style={{ width: "100%", fontSize: 13 }}
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
