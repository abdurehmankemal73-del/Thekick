import { and, eq, ilike, or } from "drizzle-orm";
import { ACCOUNT_STATUSES, BELT_LEVELS } from "@/lib/constants";
import { users, type AccountStatus, type BeltLevel } from "@/db/schema";
import { HttpError } from "@/lib/http";

export type StudentFilters = {
  q?: string;
  belt?: string;
  status?: string;
};

function parseBelt(value: string): BeltLevel {
  if ((BELT_LEVELS as readonly string[]).includes(value)) return value as BeltLevel;
  throw new HttpError(400, "Unknown belt level");
}

function parseStatus(value: string): AccountStatus {
  if ((ACCOUNT_STATUSES as readonly string[]).includes(value)) return value as AccountStatus;
  throw new HttpError(400, "Unknown account status");
}

/** Shared WHERE clause for every admin student list (roster page, PDF export). */
export function studentWhere(filters: StudentFilters) {
  const clauses = [eq(users.role, "STUDENT")];

  const q = filters.q?.trim();
  if (q) {
    clauses.push(
      or(
        ilike(users.fullName, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.telegramUsername, `%${q}%`),
      )!,
    );
  }

  if (filters.belt) clauses.push(eq(users.beltLevel, parseBelt(filters.belt)));
  if (filters.status) clauses.push(eq(users.accountStatus, parseStatus(filters.status)));

  return and(...clauses);
}
