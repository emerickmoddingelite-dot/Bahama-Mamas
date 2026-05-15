import { Role } from "@prisma/client";

export const ROLE_LEVEL: Record<Role, number> = {
  VISITOR: 0,
  EMPLOYEE: 10,
  RH: 50,
  COPATRON: 80,
  PATRON: 90,
  ADMIN: 100,
};

export function hasRole(role: Role | undefined | null, min: Role): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[min];
}

export const ROLE_LABELS: Record<Role, string> = {
  VISITOR: "Visiteur",
  EMPLOYEE: "Employé",
  RH: "Responsable RH",
  COPATRON: "Co-Patron",
  PATRON: "Patron",
  ADMIN: "Administrateur",
};
