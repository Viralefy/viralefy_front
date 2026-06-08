"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// /auth/handoff?token=...&user_id=...&user_email=...&user_name=...&next=/account
//
// Página intermediária pra cross-origin login flow: backoffice
// (admin.viralefy.com) gera token via POST /v1/admin/me/become-customer,
// abre nova aba apontando aqui. localStorage é per-origin, então só esta
// página (www.viralefy.com) consegue setar a sessão e mandar pro destino.
//
// Não-bloqueante: nenhum estado server-side persistido aqui — token já é
// válido. Se algum field faltar, redireciona pra /login.
export default function HandoffPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("user_id");
    const email = params.get("user_email");
    const name = params.get("user_name");
    const next = params.get("next") || "/account";
    if (!token || !userId || !email) {
      router.replace("/login");
      return;
    }
    try {
      localStorage.setItem("viralefy_user_token", token);
      localStorage.setItem(
        "viralefy_user",
        JSON.stringify({ id: userId, email, name: name || email, instagram: "" }),
      );
    } catch {
      // privacy mode etc — fallback é /login que vai pedir senha
      router.replace("/login");
      return;
    }
    router.replace(next);
  }, [params, router]);

  return (
    <main className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
      <p style={{ color: "var(--muted)" }}>Opening customer account…</p>
    </main>
  );
}
