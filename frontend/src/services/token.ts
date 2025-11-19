// frontend/src/services/token.ts
const TOKEN_KEY = "owk_token";

export function getTokenFromStorage(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setTokenToStorage(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
export function removeTokenFromStorage() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}
