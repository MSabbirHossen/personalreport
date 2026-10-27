import { z } from 'zod';

// ==================== User & Profile ====================
export const UserProfileSchema = z.object({
  education: z.string().max(100).optional(),
  institution: z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  academicYear: z.string().max(50).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),
  contactNumber: z.string().max(20).optional(),
  emergencyContact: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  bio: z.string().max(500).optional(),
});

export const UpdateProfileInputSchema = z.object({
  name: z.string().min(2).max(100),
  photoUrl: z.string().url().optional().or(z.literal('')),
  profile: UserProfileSchema.optional(),
});

// ==================== Daily Reporting ====================
export const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');
export const MonthKeySchema = z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)');

export const SaveDailyReportInputSchema = z
  .object({
    dateKey: DateKeySchema,
    templateVersionId: z.string().optional(),
    values: z.record(z.union([z.number(), z.boolean(), z.string(), z.null()])),
    revision: z.number().int().nonnegative().optional(),
    reason: z.string().max(300).optional(), // Reason for correction if editing prior saved date
  })
  .superRefine((data, ctx) => {
    for (const [key, val] of Object.entries(data.values)) {
      if (typeof val === 'number') {
        if (isNaN(val) || !isFinite(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field '${key}' must be a valid number.`,
            path: ['values', key],
          });
        } else if (val < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Negative values are not permitted for '${key}'. Received: ${val}`,
            path: ['values', key],
          });
        }
      } else if (typeof val === 'string') {
        const parsed = Number(val);
        if (!isNaN(parsed) && parsed < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Negative values are not permitted for '${key}'. Received: ${val}`,
            path: ['values', key],
          });
        }
      }
    }

    // Card 5: Attended classes cannot exceed total classes held
    const totalClasses = data.values['class_total_count'];
    const attendedClasses = data.values['class_attended_count'];
    if (
      typeof totalClasses === 'number' &&
      typeof attendedClasses === 'number' &&
      !isNaN(totalClasses) &&
      !isNaN(attendedClasses) &&
      attendedClasses > totalClasses
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'উপস্থিত ক্লাসের সংখ্যা মোট ক্লাসের সংখ্যার চেয়ে বেশি হতে পারে না',
        path: ['values', 'class_attended_count'],
      });
    }
  });

// ==================== Monthly Plan ====================
export const SaveMonthlyPlanInputSchema = z.object({
  monthKey: MonthKeySchema,
  targets: z.record(z.union([z.number(), z.string()])),
  notes: z.string().max(1000).optional(),
  revision: z.number().int().nonnegative().optional(),
});

// ==================== Monthly Outcome ====================
export const SaveMonthlyOutcomeInputSchema = z.object({
  monthKey: MonthKeySchema,
  manualValues: z.record(z.union([z.number(), z.string(), z.null()])).optional().default({}),
  reflections: z.object({
    achievements: z.string().max(2000).optional(),
    challenges: z.string().max(2000).optional(),
    nextMonthPriorities: z.string().max(2000).optional(),
  }).optional(),
  revision: z.number().int().nonnegative().optional(),
});

export const SubmitMonthlyOutcomeInputSchema = z.object({
  monthKey: MonthKeySchema,
  revision: z.number().int().nonnegative(),
});

// ==================== Supervisor Review & Advice ====================
export const ReviewOutcomeInputSchema = z.object({
  outcomeId: z.string(),
  action: z.enum(['acknowledge', 'return']),
  feedback: z.string().max(2000).optional(),
  revision: z.number().int().nonnegative().optional(),
});

export const CreateAdviceInputSchema = z.object({
  studentId: z.string(),
  targetType: z.enum(['plan', 'outcome', 'general']),
  targetId: z.string().optional(),
  monthKey: MonthKeySchema.optional(),
  body: z.string().min(5).max(3000),
});

export const ReplyAdviceInputSchema = z.object({
  body: z.string().min(2).max(2000),
});

export const SupervisorQueueQuerySchema = z.object({
  monthKey: MonthKeySchema.optional(),
  status: z.enum(['all', 'submitted', 'in_review', 'acknowledged', 'returned']).optional().default('submitted'),
  studentId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ==================== Organization Admin ====================
export const CreateInvitationInputSchema = z.object({
  email: z.string().email(),
  role: z.enum(['student', 'supervisor', 'org_admin']),
  branchId: z.string().optional(),
  membershipLevelId: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const AssignSupervisorInputSchema = z.object({
  studentId: z.string(),
  supervisorId: z.string(),
  startAt: z.string().optional(),
});

export const AuditEventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
