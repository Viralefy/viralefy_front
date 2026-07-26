"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /account/orders → redireciona pra /account onde a lista de orders já vive.
// A página dinâmica /account/orders/[id] (tracking detail) segue funcionando.
export default function AccountOrdersIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account");
  }, [router]);
  return null;
}
