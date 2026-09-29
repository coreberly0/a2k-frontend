import { ROLE_META, ROLES, type Role } from "./roles";

// DEMO ONLY. Replace with a real database lookup and hashed passwords.
export const DEMO_USERS: { email: string; password: string; role: Role; name: string }[] =
  ROLES.map((role) => ({
    ...ROLE_META[role].demo,
    role,
    name: ROLE_META[role].label,
  }));