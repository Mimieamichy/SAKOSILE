
export enum Role {
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  SUPERVISOR = "supervisor",
  STUDENT = "student",
  DEAN = "dean",
  HOD = "hod",
  PG_COORDINATOR = "pgcord",
  PROVOST = "provost",
  EXTERNAL_EXAMINER = "external_examiner",
  FACULTY_PG_REP = "faculty_pg_rep",
  LECTURER = "lecturer",
  PANEL_MEMBER = "panel_member",
  COLLEGE_REP = "college_rep",
  INTERNAL_EXAMINER = "internal_examiner",
  MAJOR_SUPERVISOR = "major_supervisor",
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: ["*"], // All permissions
  [Role.SUPER_ADMIN]: ["*"],
  [Role.SUPERVISOR]: ["view_dashboard", "manage_students", "view_projects"],
  [Role.STUDENT]: ["view_dashboard", "upload_project", "view_comments"],
  [Role.DEAN]: ["view_dashboard", "manage_faculty", "view_reports"],
  [Role.HOD]: ["view_dashboard", "manage_department", "assign_supervisors"],
  [Role.PG_COORDINATOR]: ["view_dashboard", "manage_pg_students"],
  [Role.PROVOST]: ["view_dashboard", "manage_college", "view_all_reports"],
  [Role.EXTERNAL_EXAMINER]: ["view_dashboard", "grade_projects"],
  [Role.FACULTY_PG_REP]: ["view_dashboard", "view_faculty_reports"],
  [Role.LECTURER]: ["view_dashboard"],
  [Role.PANEL_MEMBER]: ["view_dashboard", "grade_projects"],
  [Role.COLLEGE_REP]: ["view_dashboard"],
  [Role.INTERNAL_EXAMINER]: ["view_dashboard", "grade_projects"],
  [Role.MAJOR_SUPERVISOR]: ["view_dashboard", "manage_students"],
};

export const ROLE_HOME_PATHS: Record<Role, string> = {
  [Role.ADMIN]: "/admin",
  [Role.SUPER_ADMIN]: "/superadmin",
  [Role.SUPERVISOR]: "/supervisor",
  [Role.STUDENT]: "/student",
  [Role.DEAN]: "/dean",
  [Role.HOD]: "/portal",
  [Role.PG_COORDINATOR]: "/portal",
  [Role.PROVOST]: "/portal",
  [Role.EXTERNAL_EXAMINER]: "/portal",
  [Role.FACULTY_PG_REP]: "/defense-day",
  [Role.LECTURER]: "/portal",
  [Role.PANEL_MEMBER]: "/defense-day",
  [Role.COLLEGE_REP]: "/supervisor",
  [Role.INTERNAL_EXAMINER]: "/defense-day",
  [Role.MAJOR_SUPERVISOR]: "/supervisor",
};
