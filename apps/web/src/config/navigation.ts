import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  FileSpreadsheet,
  MessageSquareQuote,
  User,
  ShieldAlert,
  Bell,
  ClipboardCheck,
  Users,
  Send,
} from 'lucide-react';
import {
  SystemRole,
  Permission,
  PERMISSIONS,
  hasAnyPermission,
  hasAllPermissions,
} from '@reportbd/shared';

export interface NavigationItem {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  href: string;
  icon: React.ElementType;
  requiredPermissions?: Permission[];
  requiredRoles?: SystemRole[];
  group: 'student' | 'supervisor' | 'admin' | 'common';
  order: number;
}

export interface QuickLinkItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: React.ElementType;
  requiredPermissions?: Permission[];
  requiredRoles?: SystemRole[];
  badgeKey?: string;
  themeVariant: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
  order: number;
}

export interface NavigationGroup {
  id: 'student' | 'supervisor' | 'admin' | 'common';
  groupTitleKey: string;
  items: NavigationItem[];
}

/**
 * Registry of all navigation items across the application.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Student / Personal Reporting Items
  {
    id: 'nav-dashboard',
    labelKey: 'nav.dashboard',
    href: '/app/home',
    icon: LayoutDashboard,
    group: 'common',
    order: 1,
  },
  {
    id: 'nav-daily-report',
    labelKey: 'nav.dailyReport',
    href: '/app/reports/daily',
    icon: CalendarCheck,
    requiredPermissions: [PERMISSIONS.DAILY_REPORT_READ_OWN],
    group: 'student',
    order: 2,
  },
  {
    id: 'nav-monthly-plan',
    labelKey: 'nav.monthlyPlan',
    href: '/app/reports/monthly-plan',
    icon: Target,
    requiredPermissions: [PERMISSIONS.MONTHLY_PLAN_READ_OWN],
    group: 'student',
    order: 3,
  },
  {
    id: 'nav-monthly-outcome',
    labelKey: 'nav.monthlyOutcome',
    href: '/app/reports/monthly-outcome',
    icon: FileSpreadsheet,
    requiredPermissions: [PERMISSIONS.MONTHLY_OUTCOME_READ_OWN],
    group: 'student',
    order: 4,
  },
  {
    id: 'nav-advice',
    labelKey: 'nav.advice',
    href: '/app/advice',
    icon: MessageSquareQuote,
    requiredPermissions: [PERMISSIONS.ADVICE_READ_OWN],
    group: 'student',
    order: 5,
  },

  // Supervisor Items
  {
    id: 'nav-supervisor-dashboard',
    labelKey: 'nav.supervisorDashboard',
    href: '/supervisor/dashboard',
    icon: ClipboardCheck,
    requiredPermissions: [PERMISSIONS.SUPERVISOR_DASHBOARD_READ],
    group: 'supervisor',
    order: 10,
  },

  // Organization Administration Items
  {
    id: 'nav-audit-log',
    labelKey: 'nav.auditLog',
    href: '/organization/audit-log',
    icon: ShieldAlert,
    requiredPermissions: [PERMISSIONS.ORG_AUDIT_READ],
    group: 'admin',
    order: 20,
  },

  // User Profile (accessible to all authenticated active users)
  {
    id: 'nav-notifications',
    labelKey: 'nav.notifications',
    href: '/app/notifications',
    icon: Bell,
    requiredPermissions: [PERMISSIONS.NOTIFICATIONS_READ_OWN],
    group: 'common',
    order: 30,
  },
  {
    id: 'nav-profile',
    labelKey: 'nav.profile',
    href: '/app/profile',
    icon: User,
    requiredPermissions: [PERMISSIONS.PROFILE_READ_OWN],
    group: 'common',
    order: 31,
  },
];

/**
 * Registry of all Role-Based Quick Links for the dashboard.
 */
export const QUICK_LINKS: QuickLinkItem[] = [
  // Student Quick Actions
  {
    id: 'ql-daily-report',
    titleKey: 'rbac.enterDailyReport',
    descriptionKey: 'rbac.enterDailyReportDesc',
    href: '/app/reports/daily',
    icon: CalendarCheck,
    requiredPermissions: [PERMISSIONS.DAILY_REPORT_WRITE_OWN],
    themeVariant: 'emerald',
    order: 1,
  },
  {
    id: 'ql-monthly-plan',
    titleKey: 'rbac.monthlyPlan',
    descriptionKey: 'rbac.monthlyPlanDesc',
    href: '/app/reports/monthly-plan',
    icon: Target,
    requiredPermissions: [PERMISSIONS.MONTHLY_PLAN_READ_OWN],
    themeVariant: 'blue',
    order: 2,
  },
  {
    id: 'ql-monthly-outcome',
    titleKey: 'rbac.monthlyOutcome',
    descriptionKey: 'rbac.monthlyOutcomeDesc',
    href: '/app/reports/monthly-outcome',
    icon: FileSpreadsheet,
    requiredPermissions: [PERMISSIONS.MONTHLY_OUTCOME_READ_OWN],
    themeVariant: 'amber',
    order: 3,
  },
  {
    id: 'ql-advice',
    titleKey: 'rbac.viewAdvice',
    descriptionKey: 'rbac.viewAdviceDesc',
    href: '/app/advice',
    icon: MessageSquareQuote,
    requiredPermissions: [PERMISSIONS.ADVICE_READ_OWN],
    themeVariant: 'purple',
    order: 4,
  },

  // Supervisor Quick Actions
  {
    id: 'ql-supervisor-dashboard',
    titleKey: 'rbac.supervisorDashboard',
    descriptionKey: 'rbac.supervisorDashboardDesc',
    href: '/supervisor/dashboard',
    icon: ClipboardCheck,
    requiredPermissions: [PERMISSIONS.SUPERVISOR_DASHBOARD_READ],
    themeVariant: 'emerald',
    order: 10,
  },
  {
    id: 'ql-supervisor-queue',
    titleKey: 'rbac.reviewQueue',
    descriptionKey: 'rbac.reviewQueueDesc',
    href: '/supervisor/dashboard',
    icon: Target,
    requiredPermissions: [PERMISSIONS.SUPERVISOR_QUEUE_READ],
    themeVariant: 'blue',
    order: 11,
  },

  // Organization Admin Quick Actions
  {
    id: 'ql-audit-log',
    titleKey: 'rbac.auditLog',
    descriptionKey: 'rbac.auditLogDesc',
    href: '/organization/audit-log',
    icon: ShieldAlert,
    requiredPermissions: [PERMISSIONS.ORG_AUDIT_READ],
    themeVariant: 'rose',
    order: 20,
  },

  // Common User Quick Action
  {
    id: 'ql-profile',
    titleKey: 'rbac.profileSettings',
    descriptionKey: 'rbac.profileSettingsDesc',
    href: '/app/profile',
    icon: User,
    requiredPermissions: [PERMISSIONS.PROFILE_READ_OWN],
    themeVariant: 'purple',
    order: 30,
  },
];

/**
 * Checks whether a given role set is permitted to access a navigation item.
 */
export function canAccessNavigationItem(
  userRoles: SystemRole[],
  item: NavigationItem | QuickLinkItem
): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Permission checks are primary
  if (item.requiredPermissions && item.requiredPermissions.length > 0) {
    if (!hasAllPermissions(userRoles, item.requiredPermissions)) {
      return false;
    }
  }

  // Genuine role constraints if specified
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    if (!userRoles.some((r) => item.requiredRoles!.includes(r))) {
      return false;
    }
  }

  return true;
}

/**
 * Returns grouped navigation items authorized for the user's roles.
 */
export function getVisibleNavigationGroups(userRoles: SystemRole[]): NavigationGroup[] {
  const groups: Record<'student' | 'supervisor' | 'admin' | 'common', NavigationItem[]> = {
    common: [],
    student: [],
    supervisor: [],
    admin: [],
  };

  for (const item of NAVIGATION_ITEMS) {
    if (canAccessNavigationItem(userRoles, item)) {
      groups[item.group].push(item);
    }
  }

  // Sort each group by configured order
  for (const k of Object.keys(groups) as Array<'student' | 'supervisor' | 'admin' | 'common'>) {
    groups[k].sort((a, b) => a.order - b.order);
  }

  const result: NavigationGroup[] = [];

  // 1. Common / Main Menu (if contains items)
  if (groups.common.length > 0) {
    result.push({
      id: 'common',
      groupTitleKey: 'nav.mainMenu',
      items: groups.common,
    });
  }

  // 2. Student reporting menu
  if (groups.student.length > 0) {
    result.push({
      id: 'student',
      groupTitleKey: 'nav.dailyReport',
      items: groups.student,
    });
  }

  // 3. Supervisor oversight menu
  if (groups.supervisor.length > 0) {
    result.push({
      id: 'supervisor',
      groupTitleKey: 'nav.supervisorMenu',
      items: groups.supervisor,
    });
  }

  // 4. Admin menu
  if (groups.admin.length > 0) {
    result.push({
      id: 'admin',
      groupTitleKey: 'nav.orgAdminMenu',
      items: groups.admin,
    });
  }

  return result;
}

/**
 * Returns authorized Quick Links for the current user.
 */
export function getVisibleQuickLinks(userRoles: SystemRole[]): QuickLinkItem[] {
  return QUICK_LINKS
    .filter((ql) => canAccessNavigationItem(userRoles, ql))
    .sort((a, b) => a.order - b.order);
}

/**
 * Returns authorized bottom mobile navigation items (up to 5 items).
 */
export function getVisibleMobileNavItems(userRoles: SystemRole[]): NavigationItem[] {
  const visible = NAVIGATION_ITEMS.filter((item) => canAccessNavigationItem(userRoles, item));

  // Determine top 5 primary links based on user roles
  if (userRoles.includes('student')) {
    const studentIds = ['nav-dashboard', 'nav-daily-report', 'nav-monthly-plan', 'nav-monthly-outcome', 'nav-profile'];
    return visible.filter((i) => studentIds.includes(i.id)).sort((a, b) => a.order - b.order);
  }

  if (userRoles.includes('supervisor')) {
    const supervisorIds = ['nav-dashboard', 'nav-supervisor-dashboard', 'nav-notifications', 'nav-profile'];
    return visible.filter((i) => supervisorIds.includes(i.id)).sort((a, b) => a.order - b.order);
  }

  if (userRoles.includes('org_admin') || userRoles.includes('platform_admin')) {
    const adminIds = ['nav-dashboard', 'nav-supervisor-dashboard', 'nav-audit-log', 'nav-profile'];
    return visible.filter((i) => adminIds.includes(i.id)).sort((a, b) => a.order - b.order);
  }

  return visible.slice(0, 5);
}

