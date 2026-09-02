function unquote(value: string) {
  let next = value.trim().replace(/\r$/g, "");
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

/** Passwords Coolify/.env may have stored vs what the user types. */
export function passwordCandidates(password: string): string[] {
  const candidates: string[] = [];
  const add = (value: string) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };

  const inner = unquote(password);
  add(inner);
  add(`"${inner}"`);
  add(`'${inner}'`);
  const hashCut = inner.split("#")[0]?.trim() ?? "";
  add(hashCut);

  return candidates;
}

export function envSecret(raw: string | undefined) {
  if (raw == null) return undefined;
  const value = unquote(raw);
  return value || undefined;
}
