import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_PERMISSIONS,
  PERMISSIONS,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  SystemRole,
} from '@reportbd/shared';
import {
  canAccessNavigationItem,
  getVisibleNavigationGroups,
  getVisibleQuickLinks,
  getVisibleMobileNavItems,
  NAVIGATION_ITEMS,
  QUICK_LINKS,
} from '../config/navigation.js';

describe('Project-Wide RBAC Navigation & Access Control Quality Gates', () => {
  // ==================== 1. Core Permission Derivation ====================
  test('Permission Matrix: Each role has well-defined capabilities', () => {
    const studentPerms = ROLE_PERMISSIONS.student;
    const supervisorPerms = ROLE_PERMISSIONS.supervisor;
    const orgAdminPerms = ROLE_PERMISSIONS.org_admin;
    const platformAdminPerms = ROLE_PERMISSIONS.platform_admin;

    // Student has daily reporting & monthly outcomes, but no supervisor reviews or admin audit
    assert.ok(studentPerms.includes(PERMISSIONS.DAILY_REPORT_READ_OWN));
    assert.ok(studentPerms.includes(PERMISSIONS.DAILY_REPORT_WRITE_OWN));
    assert.ok(studentPerms.includes(PERMISSIONS.MONTHLY_PLAN_READ_OWN));
    assert.ok(studentPerms.includes(PERMISSIONS.MONTHLY_OUTCOME_READ_OWN));
    assert.ok(!studentPerms.includes(PERMISSIONS.SUPERVISOR_DASHBOARD_READ));
    assert.ok(!studentPerms.includes(PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT));
    assert.ok(!studentPerms.includes(PERMISSIONS.ORG_AUDIT_READ));

    // Supervisor has queue & review capabilities, but not student write or org audit
    assert.ok(supervisorPerms.includes(PERMISSIONS.SUPERVISOR_DASHBOARD_READ));
    assert.ok(supervisorPerms.includes(PERMISSIONS.SUPERVISOR_QUEUE_READ));
    assert.ok(supervisorPerms.includes(PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT));
    assert.ok(!supervisorPerms.includes(PERMISSIONS.DAILY_REPORT_WRITE_OWN));
    assert.ok(!supervisorPerms.includes(PERMISSIONS.ORG_AUDIT_READ));

    // Org admin has administrative and audit log privileges
    assert.ok(orgAdminPerms.includes(PERMISSIONS.ORG_AUDIT_READ));
    assert.ok(orgAdminPerms.includes(PERMISSIONS.ORG_USERS_READ));
    assert.ok(orgAdminPerms.includes(PERMISSIONS.ORG_INVITATIONS_MANAGE));

    // Platform admin holds superuser privileges
    assert.ok(platformAdminPerms.includes(PERMISSIONS.ORG_AUDIT_READ));
    assert.ok(platformAdminPerms.includes(PERMISSIONS.PLATFORM_MANAGE));
  });

  test('Multi-role aggregation: Union of capabilities for dual student-supervisor', () => {
    const multiRoles: SystemRole[] = ['student', 'supervisor'];
    const perms = getEffectivePermissions(multiRoles);

    // Can write daily reports (from student)
    assert.ok(hasPermission(multiRoles, PERMISSIONS.DAILY_REPORT_WRITE_OWN));
    // Can review reports (from supervisor)
    assert.ok(hasPermission(multiRoles, PERMISSIONS.SUPERVISOR_REVIEW_SUBMIT));
    // Cannot view audit logs
    assert.ok(!hasPermission(multiRoles, PERMISSIONS.ORG_AUDIT_READ));
  });

  // ==================== 2. Navigation Item Access Evaluation ====================
  test('canAccessNavigationItem denies access when no roles are provided', () => {
    const item = NAVIGATION_ITEMS.find((i) => i.id === 'nav-daily-report')!;
    assert.equal(canAccessNavigationItem([] as any, item), false);
  });

  test('canAccessNavigationItem permits student to see daily reports but not supervisor dashboard', () => {
    const dailyReportItem = NAVIGATION_ITEMS.find((i) => i.id === 'nav-daily-report')!;
    const supervisorDashboardItem = NAVIGATION_ITEMS.find((i) => i.id === 'nav-supervisor-dashboard')!;

    assert.equal(canAccessNavigationItem(['student'], dailyReportItem), true);
    assert.equal(canAccessNavigationItem(['student'], supervisorDashboardItem), false);
  });

  test('canAccessNavigationItem permits supervisor to see supervisor dashboard but not daily report writing', () => {
    const dailyReportItem = NAVIGATION_ITEMS.find((i) => i.id === 'nav-daily-report')!;
    const supervisorDashboardItem = NAVIGATION_ITEMS.find((i) => i.id === 'nav-supervisor-dashboard')!;

    // nav-daily-report requires DAILY_REPORT_READ_OWN
    assert.equal(canAccessNavigationItem(['supervisor'], dailyReportItem), false);
    assert.equal(canAccessNavigationItem(['supervisor'], supervisorDashboardItem), true);
  });

  // ==================== 3. Sidebar Navigation Groups ====================
  test('getVisibleNavigationGroups for pure student: only common and student groups', () => {
    const groups = getVisibleNavigationGroups(['student']);
    const groupIds = groups.map((g) => g.id);

    assert.ok(groupIds.includes('common'), 'Student should have common group (Dashboard)');
    assert.ok(groupIds.includes('student'), 'Student should have student group');
    assert.ok(!groupIds.includes('supervisor'), 'Student must NOT have supervisor group');
    assert.ok(!groupIds.includes('admin'), 'Student must NOT have admin group');

    const studentGroup = groups.find((g) => g.id === 'student')!;
    const itemIds = studentGroup.items.map((i) => i.id);
    assert.ok(itemIds.includes('nav-daily-report'));
    assert.ok(itemIds.includes('nav-monthly-plan'));
    assert.ok(itemIds.includes('nav-monthly-outcome'));
  });

  test('getVisibleNavigationGroups for pure supervisor: only common and supervisor groups', () => {
    const groups = getVisibleNavigationGroups(['supervisor']);
    const groupIds = groups.map((g) => g.id);

    assert.ok(groupIds.includes('common'));
    assert.ok(groupIds.includes('supervisor'));
    assert.ok(!groupIds.includes('student'), 'Pure supervisor must NOT see student reporting group');
    assert.ok(!groupIds.includes('admin'), 'Pure supervisor must NOT see admin group');

    const supGroup = groups.find((g) => g.id === 'supervisor')!;
    const itemIds = supGroup.items.map((i) => i.id);
    assert.ok(itemIds.includes('nav-supervisor-dashboard'));
  });

  test('getVisibleNavigationGroups for org_admin: includes admin group and audit log', () => {
    const groups = getVisibleNavigationGroups(['org_admin']);
    const groupIds = groups.map((g) => g.id);

    assert.ok(groupIds.includes('admin'), 'Org admin must see admin navigation group');
    const adminGroup = groups.find((g) => g.id === 'admin')!;
    const itemIds = adminGroup.items.map((i) => i.id);
    assert.ok(itemIds.includes('nav-audit-log'), 'Org admin must see audit log item');
  });

  test('getVisibleNavigationGroups for dual role student+supervisor: sees BOTH groups seamlessly', () => {
    const groups = getVisibleNavigationGroups(['student', 'supervisor']);
    const groupIds = groups.map((g) => g.id);

    assert.ok(groupIds.includes('student'), 'Dual role must see student reporting group');
    assert.ok(groupIds.includes('supervisor'), 'Dual role must see supervisor oversight group');
    assert.ok(!groupIds.includes('admin'), 'Dual role without admin role must NOT see admin group');
  });

  // ==================== 4. Role-Based Quick Links ====================
  test('getVisibleQuickLinks for student: returns student shortcuts only', () => {
    const quickLinks = getVisibleQuickLinks(['student']);
    const qlIds = quickLinks.map((ql) => ql.id);

    assert.ok(qlIds.includes('ql-daily-report'), 'Student should have daily report quick link');
    assert.ok(qlIds.includes('ql-monthly-plan'), 'Student should have monthly plan quick link');
    assert.ok(qlIds.includes('ql-monthly-outcome'), 'Student should have monthly outcome quick link');
    assert.ok(!qlIds.includes('ql-supervisor-queue'), 'Student must NOT have supervisor queue quick link');
    assert.ok(!qlIds.includes('ql-audit-log'), 'Student must NOT have audit log quick link');
  });

  test('getVisibleQuickLinks for supervisor: returns supervisor queue and dashboard', () => {
    const quickLinks = getVisibleQuickLinks(['supervisor']);
    const qlIds = quickLinks.map((ql) => ql.id);

    assert.ok(qlIds.includes('ql-supervisor-queue'), 'Supervisor must have queue quick link');
    assert.ok(qlIds.includes('ql-supervisor-dashboard'), 'Supervisor must have dashboard quick link');
    assert.ok(!qlIds.includes('ql-daily-report'), 'Pure supervisor must NOT have daily report quick link');
    assert.ok(!qlIds.includes('ql-audit-log'), 'Supervisor must NOT have audit log quick link');
  });

  test('getVisibleQuickLinks for org_admin: includes audit log quick link', () => {
    const quickLinks = getVisibleQuickLinks(['org_admin']);
    const qlIds = quickLinks.map((ql) => ql.id);

    assert.ok(qlIds.includes('ql-audit-log'), 'Org admin must have audit log quick link');
  });

  // ==================== 5. Mobile Bottom Navigation ====================
  test('getVisibleMobileNavItems respects role priorities and caps at 5 items', () => {
    const studentMobile = getVisibleMobileNavItems(['student']);
    assert.ok(studentMobile.length <= 5);
    const studentMobileIds = studentMobile.map((m) => m.id);
    assert.ok(studentMobileIds.includes('nav-daily-report'));

    const supervisorMobile = getVisibleMobileNavItems(['supervisor']);
    assert.ok(supervisorMobile.length <= 5);
    const supervisorMobileIds = supervisorMobile.map((m) => m.id);
    assert.ok(supervisorMobileIds.includes('nav-supervisor-dashboard'));
    assert.ok(!supervisorMobileIds.includes('nav-daily-report'));
  });
});
