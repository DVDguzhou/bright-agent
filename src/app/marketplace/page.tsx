"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/agents");
  }, [router]);
  return (
    <div className="py-20 text-center text-slate-500">
      跳转至 Agents...
    </div>
  );
}
