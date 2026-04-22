import { UserRole } from "@/types";

export const ROUTES = {
  home: "/",
  about: "/about",
  contact: "/contact",
  login: "/login",
  adminLogin: "/admin/login",
  register: "/register",
  unauthorized: "/unauthorized",
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
} as const;

export const ROLE_HOME: Record<UserRole, string> = {
  admin: ROUTES.admin,
  doctor: ROUTES.doctor,
  patient: ROUTES.patient,
};
