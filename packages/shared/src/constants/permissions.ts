import { SystemRole } from './roles.js';

/**
 * Stable, machine-readable permission identifiers for BPS_Report.
 * Structured by domain and capability.
 */
export const PERMISSIONS = {
  // Daily Reports
  DAILY_REPORT_READ_OWN: 'daily_report:read_own',
  DAILY_REPORT_WRITE_OWN: 'daily_report:write_own',

  // Monthly Plans
  MONTHLY_PLAN_READ_OWN: 'monthly_plan:read_own',
  MONTHLY_PLAN_WRITE_OWN: 'monthly_plan:write_own',
  MONTHLY_PLAN_SHARE_OWN: 'monthly_plan:share_own',

  // Monthly Outcomes
  MONTHLY_OUTCOME_READ_OWN: 'monthly_outcome:read_own',
  MONTHLY_OUTCOME_WRITE_OWN: 'monthly_outcome:write_own',
  MONTHLY_OUTCOME_SUBMIT_OWN: 'monthly_outcome:submit_own',

  // Supervisor & Mentorship Review
  SUPERVISOR_DASHBOARD_READ: 'supervisor:dashboard_read',
  SUPERVISOR_QUEUE_READ: 'supervisor:queue_read',
  SUPERVISOR_STUDENTS_READ: 'supervisor:students_read',
  SUPERVISOR_REPORT_READ: 'supervisor:report_read',
  SUPERVISOR_REVIEW_SUBMIT: 'supervisor:review_submit',
  SUPERVISOR_ADVICE_CREATE: 'supervisor:advice_create',

  // Advice & Communication
  ADVICE_READ_OWN: 'advice:read_own',
  ADVICE_ACKNOWLEDGE_OWN: 'advice:acknowledge_own',
  ADVICE_REPLY: 'advice:reply',

  // In-App Notifications
  NOTIFICATIONS_READ_OWN: 'notifications:read_own',
  NOTIFICATIONS_WRITE_OWN: 'notifications:write_own',

  // Profile Management
  PROFILE_READ_OWN: 'profile:read_own',
  PROFILE_WRITE_OWN: 'profile:write_own',

  // Organization Administration
  ORG_USERS_READ: 'org:users_read',
  ORG_ASSIGNMENTS_MANAGE: 'org:assignments_manage',
  ORG_INVITATIONS_MANAGE: 'org:invitations_manage',
  ORG_AUDIT_READ: 'org:audit_read',
  ORG_TEMPLATES_READ: 'org:templates_read',

  // Platform Administration
  PLATFORM_MANAGE: 'platform:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Canonical Role-to-Permission mapping.
 * Each role possesses explicit, defined capabilities.
 */
export const ROLE_PERMISSIONS: Record<SystemRole, readonly Permission[]> = {
  student: [
    PERMISSIONS.DAILY_REPORT_READ_OWN,
    PERMISSIONS.DAILY_REPORT_WRITE_OWN,
    PERMISSIONS.MONTHLY_PLAN_READ_OWN,
    PERMISSIONS.MONTHLY_PLAN_WRITE_OWN,
    PERMISSIONS.MONTHLY_PLAN_SHARE_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_READ_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_WRITE_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_SUBMIT_OWN,
    PERMISSIONS.ADVICE_READ_OWN,
    PERMISSIONS.ADVICE_ACKNOWLEDGE_OWN,
    PERMISSIONS.ADVICE_REPLY,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_WRITE_OWN,
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
    PERMISSIONS.ORG_TEMPLATES_READ,
  ],

  supervisor: [
    PERMISSIONS.SUPERVISOR_DASHBOARD_READ,
    PERMISSIONS.SUPERVISOR_QUEUE_READ,
    PERMISSIONS.SUPERVISOR_STUDENTS_READ,
    PERMISSIONS.SUPERVISOR_REPORT_READ,
    PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT,
    PERMISSIONS.SUPERVISOR_ADVICE_CREATE,
    PERMISSIONS.ADVICE_REPLY,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_WRITE_OWN,
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
    PERMISSIONS.ORG_TEMPLATES_READ,
  ],

  org_admin: [
    PERMISSIONS.SUPERVISOR_DASHBOARD_READ,
    PERMISSIONS.SUPERVISOR_QUEUE_READ,
    PERMISSIONS.SUPERVISOR_STUDENTS_READ,
    PERMISSIONS.SUPERVISOR_REPORT_READ,
    PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT,
    PERMISSIONS.SUPERVISOR_ADVICE_CREATE,
    PERMISSIONS.ADVICE_REPLY,
    PERMISSIONS.ORG_USERS_READ,
    PERMISSIONS.ORG_ASSIGNMENTS_MANAGE,
    PERMISSIONS.ORG_INVITATIONS_MANAGE,
    PERMISSIONS.ORG_AUDIT_READ,
    PERMISSIONS.ORG_TEMPLATES_READ,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_WRITE_OWN,
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
  ],

  platform_admin: [
    PERMISSIONS.DAILY_REPORT_READ_OWN,
    PERMISSIONS.DAILY_REPORT_WRITE_OWN,
    PERMISSIONS.MONTHLY_PLAN_READ_OWN,
    PERMISSIONS.MONTHLY_PLAN_WRITE_OWN,
    PERMISSIONS.MONTHLY_PLAN_SHARE_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_READ_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_WRITE_OWN,
    PERMISSIONS.MONTHLY_OUTCOME_SUBMIT_OWN,
    PERMISSIONS.SUPERVISOR_DASHBOARD_READ,
    PERMISSIONS.SUPERVISOR_QUEUE_READ,
    PERMISSIONS.SUPERVISOR_STUDENTS_READ,
    PERMISSIONS.SUPERVISOR_REPORT_READ,
    PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT,
    PERMISSIONS.SUPERVISOR_ADVICE_CREATE,
    PERMISSIONS.ADVICE_READ_OWN,
    PERMISSIONS.ADVICE_ACKNOWLEDGE_OWN,
    PERMISSIONS.ADVICE_REPLY,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_WRITE_OWN,
    PERMISSIONS.PROFILE_READ_OWN,
    PERMISSIONS.PROFILE_WRITE_OWN,
    PERMISSIONS.ORG_USERS_READ,
    PERMISSIONS.ORG_ASSIGNMENTS_MANAGE,
    PERMISSIONS.ORG_INVITATIONS_MANAGE,
    PERMISSIONS.ORG_AUDIT_READ,
    PERMISSIONS.ORG_TEMPLATES_READ,
    PERMISSIONS.PLATFORM_MANAGE,
  ],
};

/**
 * Calculates the union of effective permissions granted across all roles the user holds.
 */
export function getEffectivePermissions(roles: SystemRole[]): Permission[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [];
  }
  const permissionSet = new Set<Permission>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) {
      for (const p of perms) {
        permissionSet.add(p);
      }
    }
  }
  return Array.from(permissionSet);
}

/**
 * Checks whether a given role set grants a specific permission.
 */
export function hasPermission(roles: SystemRole[], permission: Permission): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => {
    const perms = ROLE_PERMISSIONS[role];
    return perms ? perms.includes(permission) : false;
  });
}

/**
 * Checks whether a given role set grants at least one of the specified permissions.
 */
export function hasAnyPermission(roles: SystemRole[], permissions: Permission[]): boolean {
  if (!roles || roles.length === 0 || !permissions || permissions.length === 0) return false;
  return permissions.some((permission) => hasPermission(roles, permission));
}

/**
 * Checks whether a given role set grants all of the specified permissions.
 */
export function hasAllPermissions(roles: SystemRole[], permissions: Permission[]): boolean {
  if (!roles || roles.length === 0 || !permissions || permissions.length === 0) return false;
  return permissions.every((permission) => hasPermission(roles, permission));
}

