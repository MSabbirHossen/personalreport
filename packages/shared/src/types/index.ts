import { MetricGroup, MetricDefinition } from '../constants/metrics.js';
import { SystemRole } from '../constants/roles.js';

export interface UserProfile {
  education?: string;
  institution?: string;
  department?: string;
  academicYear?: string;
  bloodGroup?: string;
  contactNumber?: string;
  emergencyContact?: string;
  address?: string;
  bio?: string;
}

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  photoUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  timezone: string; // e.g. 'Asia/Dhaka'
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  orgId: string;
  nameBn: string;
  nameEn: string;
  code?: string;
}

export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  roles: SystemRole[];
  branchId?: string;
  membershipLevelId?: string;
  responsibilityId?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface DailyReportValue {
  value: number | boolean | string | null;
  note?: string;
}

export interface DailyReport {
  id?: string;
  orgId: string;
  studentId: string;
  dateKey: string; // YYYY-MM-DD
  templateVersionId: string;
  values: Record<string, number | boolean | string | null>;
  revision: number;
  status: 'empty' | 'saved' | 'corrected';
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportRevisionLog {
  id: string;
  orgId: string;
  studentId: string;
  dateKey: string;
  revision: number;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface MonthlyPlan {
  id?: string;
  orgId: string;
  studentId: string;
  monthKey: string; // YYYY-MM
  targets: Record<string, number | string>;
  notes?: string;
  status: 'draft' | 'shared' | 'acknowledged';
  revision: number;
  sharedAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MonthlyOutcomeStatus = 'draft' | 'submitted' | 'in_review' | 'acknowledged' | 'returned';

export interface MonthlyOutcome {
  id?: string;
  orgId: string;
  studentId: string;
  monthKey: string; // YYYY-MM
  derivedValues: Record<string, number | null>;
  manualValues: Record<string, number | string | null>;
  reflections?: {
    achievements?: string;
    challenges?: string;
    nextMonthPriorities?: string;
  };
  snapshot?: {
    dailyValuesSummary?: Record<string, any>;
    calculatedAt: string;
    templateVersionId: string;
    derivedValues?: Record<string, number | null>;
    dailyReportsCount?: number;
  };
  status: MonthlyOutcomeStatus;
  isStale?: boolean; // True if daily entries were modified after submission snapshot
  staleReason?: string;
  staleAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdviceReply {
  id?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface Advice {
  id: string;
  orgId: string;
  studentId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetType: 'plan' | 'outcome' | 'general';
  targetId?: string;
  monthKey?: string;
  body: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  replies?: AdviceReply[];
  createdAt: string;
  updatedAt?: string;
}

export interface SupervisorAssignment {
  id: string;
  orgId: string;
  studentId: string;
  supervisorId: string;
  startAt: string;
  endAt?: string;
  status: 'active' | 'ended';
}

export interface TemplateVersion {
  id: string;
  orgId: string;
  templateId: string;
  version: number;
  name: string;
  groups: MetricGroup[];
  isDefault: boolean;
  publishedAt: string;
}

export interface AuditEvent {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: SystemRole;
  branchId?: string;
  membershipLevelId?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdBy: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAuthContext {
  userId: string;
  firebaseUid: string;
  email: string;
  name: string;
  orgId?: string;
  roles: SystemRole[];
  membership?: Membership;
}

// ==================== Notifications ====================
export type NotificationType =
  | 'report_submitted'
  | 'report_returned'
  | 'report_acknowledged'
  | 'advice_received'
  | 'plan_shared';

export interface InAppNotification {
  id: string;
  orgId: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  targetType: 'outcome' | 'plan' | 'advice';
  targetId: string;
  isRead: boolean;
  readAt?: string;
  idempotencyKey?: string;
  createdAt: string;
}

// ==================== Supervisor Dashboard & Queue ====================
export interface SupervisorQueueItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  monthKey: string;
  status: MonthlyOutcomeStatus;
  submittedAt?: string;
  reviewedAt?: string;
  isStale: boolean;
  staleReason?: string | null;
  revision: number;
}

export interface SupervisorDashboardSummary {
  assignedStudentsCount: number;
  pendingReviewsCount: number;
  acknowledgedThisMonthCount: number;
  returnedThisMonthCount: number;
  recentQueue: SupervisorQueueItem[];
}
