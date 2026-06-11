import type { AdminPrincipal, Session, User } from "./api";

// Persistência de sessão em localStorage. Login UNIFICADO (2026-06-11):
// o mesmo /login do front aceita user da loja OU admin (mesmo email pode
// estar nas 2 tabelas). Guardamos o token de acesso, o principal (user
// OU admin), e o subject_kind pra UI decidir o que mostrar.

const TOKEN_KEY = "viralefy_user_token";
const USER_KEY = "viralefy_user";
const ADMIN_KEY = "viralefy_admin";
const KIND_KEY = "viralefy_subject_kind";

export type SubjectKind = "user" | "admin";

export function saveSession(s: Session) {
  const token = s.access_token;
  if (!token) return; // 2FA gate (twofa_required=true) → não persiste
  localStorage.setItem(TOKEN_KEY, token);
  if (s.subject_kind) {
    localStorage.setItem(KIND_KEY, s.subject_kind);
  }
  if (s.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(s.user));
    localStorage.removeItem(ADMIN_KEY);
  } else if (s.admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(s.admin));
    localStorage.removeItem(USER_KEY);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSubjectKind(): SubjectKind | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KIND_KEY);
  return v === "user" || v === "admin" ? v : null;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getAdmin(): AdminPrincipal | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminPrincipal;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getSubjectKind() === "admin";
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(KIND_KEY);
}
