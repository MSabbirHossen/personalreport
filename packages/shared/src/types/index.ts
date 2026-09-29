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
  };
  status: MonthlyOutcomeStatus;
  isStale?: boolean; // True if daily entries were modified after submission snapshot
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
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

export interface UserAuthContext {
  userId: string;
  firebaseUid: string;
  email: string;
  name: string;
  orgId?: string;
  roles: SystemRole[];
  membership?: Membership;
}
