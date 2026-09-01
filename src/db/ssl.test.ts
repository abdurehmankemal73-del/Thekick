import { afterEach, describe, expect, it, vi } from "vitest";
import { postgresSsl } from "./ssl";

describe("postgresSsl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.DATABASE_SSL;
  });

  it("skips SSL for localhost", () => {
    expect(postgresSsl("postgresql://thekick:thekick@localhost:5432/thekick")).toBeUndefined();
  });

  it("skips SSL for Docker Compose service names", () => {
    expect(postgresSsl("postgresql://thekick:secret@db:5432/thekick")).toBeUndefined();
    expect(postgresSsl("postgresql://thekick:secret@postgres:5432/thekick")).toBeUndefined();
    expect(postgresSsl("postgresql://thekick:secret@postgresql:5432/thekick")).toBeUndefined();
  });

  it("requires SSL for hosted Postgres hostnames", () => {
    expect(postgresSsl("postgresql://user:pass@ep-abc.aws.neon.tech/neondb")).toBe("require");
  });

  it("honors sslmode in the URL", () => {
    expect(
      postgresSsl("postgresql://user:pass@db.example.com/thekick?sslmode=disable"),
    ).toBeUndefined();
    expect(
      postgresSsl("postgresql://thekick:secret@db:5432/thekick?sslmode=require"),
    ).toBe("require");
  });

  it("honors DATABASE_SSL override", () => {
    vi.stubEnv("DATABASE_SSL", "disable");
    expect(postgresSsl("postgresql://user:pass@ep-abc.aws.neon.tech/neondb")).toBeUndefined();
    vi.stubEnv("DATABASE_SSL", "require");
    expect(postgresSsl("postgresql://thekick:secret@db:5432/thekick")).toBe("require");
  });
});
