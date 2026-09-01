import type { DefaultSession } from "next-auth";
import type { AccountStatus, BeltLevel, Role } from "@/db/schema";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    accountStatus: AccountStatus;
    fullName: string;
    beltLevel: BeltLevel | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      accountStatus: AccountStatus;
      fullName: string;
      beltLevel: BeltLevel | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    accountStatus: AccountStatus;
    fullName: string;
    beltLevel: BeltLevel | null;
  }
}
