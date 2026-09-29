export type SystemRole = 'student' | 'supervisor' | 'org_admin' | 'platform_admin';

export interface MembershipLevel {
  id: string;
  labelBn: string;
  labelEn: string;
  order: number;
}

export const DEFAULT_MEMBERSHIP_LEVELS: MembershipLevel[] = [
  { id: 'general_student', labelBn: 'সাধারণ ছাত্র', labelEn: 'General Student', order: 1 },
  { id: 'supporter', labelBn: 'সমর্থক', labelEn: 'Supporter', order: 2 },
  { id: 'worker', labelBn: 'কর্মী', labelEn: 'Worker', order: 3 },
  { id: 'sathi_candidate', labelBn: 'সাথীপার্থী', labelEn: 'Sathi Candidate', order: 4 },
  { id: 'sathi', labelBn: 'সাথী', labelEn: 'Sathi', order: 5 },
  { id: 'member_candidate', labelBn: 'সদস্যপার্থী', labelEn: 'Member Candidate', order: 6 },
  { id: 'member', labelBn: 'সদস্য', labelEn: 'Member', order: 7 },
];

export const ROLE_LABELS: Record<SystemRole, { bn: string; en: string }> = {
  student: { bn: 'ছাত্র / ব্যবহারকারী', en: 'Student' },
  supervisor: { bn: 'পর্যবেক্ষক / দায়িত্বশীল', en: 'Supervisor' },
  org_admin: { bn: 'শাখা অ্যাডমিন', en: 'Organization Admin' },
  platform_admin: { bn: 'প্ল্যাটফর্ম অ্যাডমিন', en: 'Platform Admin' },
};
