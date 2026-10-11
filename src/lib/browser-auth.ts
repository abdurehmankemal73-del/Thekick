function errorFromUrl(raw: string | null | undefined) {
  if (!raw) return { error: undefined as string | undefined, code: undefined as string | undefined };
  try {
    const next = new URL(raw, window.location.origin);
    return {
      error: next.searchParams.get("error") ?? undefined,
      code: next.searchParams.get("code") ?? undefined,
    };
  } catch {
    return { error: undefined, code: undefined };
  }
}

export async function signInWithCredentials(email: string, password: string) {
  const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
  if (!csrfRes.ok) throw new Error("service_unavailable");
  const csrf = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrf.csrfToken) throw new Error("service_unavailable");

  const res = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      email,
      password,
      csrfToken: csrf.csrfToken,
      callbackUrl: "/pay",
      json: "true",
    }),
    credentials: "include",
    redirect: "manual",
  });

  const data = (await res.json().catch(() => null)) as { url?: string } | null;
  const location = data?.url ?? res.headers.get("location") ?? "";
  const { error, code } = errorFromUrl(location);
  const landedOnPay = /\/pay(?:\?|$|#)/.test(location);
  if ((error || code) && !landedOnPay) return { ok: false as const, error, code };
  if (!res.ok && res.status !== 302 && res.status !== 307) {
    return { ok: false as const, error: "service_unavailable", code: undefined };
  }
  return { ok: true as const, error: undefined, code: undefined };
}
