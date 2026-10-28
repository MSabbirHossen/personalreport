export type Locale = 'bn' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface CommonTranslations {
  save: string;
  saving: string;
  saved: string;
  cancel: string;
  delete: string;
  edit: string;
  loading: string;
  search: string;
  filter: string;
  all: string;
  back: string;
  next: string;
  close: string;
  confirm: string;
  print: string;
  export: string;
  noData: string;
  error: string;
  success: string;
  retry: string;
  yes: string;
  no: string;
  unrecorded: string;
  appTitle: string;
  tagline: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  language: string;
  theme: string;
  date: string;
  time: string;
  status: string;
  actions: string;
  notes: string;
  total: string;
  minutes: string;
  hours: string;
  pages: string;
  items: string;
  persons: string;
  times: string;
  classes: string;
  activities: string;
}

export interface NavTranslations {
  dashboard: string;
  dailyReport: string;
  monthlyPlan: string;
  monthlyOutcome: string;
  advice: string;
  notifications: string;
  profile: string;
  supervisorDashboard: string;
  supervisorQueue: string;
  auditLog: string;
  logout: string;
  mainMenu: string;
  supervisorMenu: string;
  orgAdminMenu: string;
  developerInfo: string;
}

export interface AuthTranslations {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  forgotPasswordTitle: string;
  forgotPasswordSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  forgotPasswordLink: string;
  loginButton: string;
  loggingIn: string;
  registerButton: string;
  registering: string;
  resetButton: string;
  resetting: string;
  googleLogin: string;
  orWithEmail: string;
  noAccount: string;
  haveAccount: string;
  loginLink: string;
  registerLink: string;
  backToLogin: string;
  resetEmailSent: string;
  resetEmailCheckSpam: string;
  demoStudent: string;
  demoSupervisor: string;
  demoOrgAdmin: string;
  inviteTitle: string;
  inviteInactive: string;
  inviteAccepted: string;
  inviteAcceptedDesc: string;
  inviteRole: string;
  inviteExpires: string;
  inviteLoggedInAs: string;
  inviteAcceptButton: string;
  inviteAccepting: string;
  inviteLoginPrompt: string;
}

export interface DashboardTranslations {
  title: string;
  subtitle: string;
  greeting: string;
  todaySummaryTitle: string;
  todaySummaryDesc: string;
  enterDailyReportBtn: string;
  quickStatsTitle: string;
  totalStudyTime: string;
  salahJamaatCount: string;
  quranAyatCount: string;
  bookPagesCount: string;
  monthlyTargetStatus: string;
  monthlyPlanSubtitle: string;
  monthlyOutcomeSubtitle: string;
  viewMonthlyPlanBtn: string;
  viewMonthlyOutcomeBtn: string;
  adviceCardTitle: string;
  adviceCardSubtitle: string;
  viewAdviceBtn: string;
  recentActivityTitle: string;
  noRecentActivity: string;
  reportReminderTitle: string;
  reportReminderDesc: string;
}

export interface DailyReportTranslations {
  title: string;
  subtitle: string;
  dateSelectLabel: string;
  previousDay: string;
  nextDay: string;
  todayBadge: string;
  singleDayView: string;
  monthlyGridView: string;
  expandAll: string;
  collapseAll: string;
  saveReportBtn: string;
  savingReport: string;
  reportSavedSuccess: string;
  reportSaveError: string;
  dateRestrictedTooltip: string;
  dateRestrictedBadge: string;
  classAttendedExceedsTotal: string;
  summaryTitle: string;
  summarySubtitle: string;
  studyTimeCategory: string;
  quranRecitationCategory: string;
  quranStudyCategory: string;
  bookReadingCategory: string;
  orgWorkCategory: string;
  restSleepCategory: string;
  comparisonIncreased: string;
  comparisonDecreased: string;
  comparisonNoChange: string;
  comparisonNoYesterday: string;
  printGridBtn: string;
  monthSelector: string;
  lastUpdatedLabel: string;
  createdTimeLabel: string;
  revisionLabel: string;
  hadithExplanationPlaceholder: string;
  confirmedCheckboxLabel: string;
  familyMeetingLabel: string;
}

export interface MonthlyPlanTranslations {
  title: string;
  subtitle: string;
  monthSelectLabel: string;
  planStatusDraft: string;
  planStatusShared: string;
  planStatusReviewed: string;
  setTargetHeader: string;
  unitLabel: string;
  targetInputLabel: string;
  saveDraftBtn: string;
  savingDraft: string;
  shareSupervisorBtn: string;
  sharingPlan: string;
  planSavedSuccess: string;
  planSharedSuccess: string;
  shareConfirmTitle: string;
  shareConfirmText: string;
  printHeader: string;
  printSubheader: string;
  studentNameLabel: string;
  organizationLabel: string;
  totalTargetsSet: string;
}

export interface MonthlyOutcomeTranslations {
  title: string;
  subtitle: string;
  monthSelectLabel: string;
  statusDraft: string;
  statusSubmitted: string;
  statusApproved: string;
  statusReturned: string;
  frozenSnapshotNotice: string;
  staleDataWarning: string;
  submitOutcomeBtn: string;
  resubmitOutcomeBtn: string;
  submittingOutcome: string;
  submitConfirmTitle: string;
  submitConfirmText: string;
  resubmitConfirmTitle: string;
  resubmitConfirmText: string;
  outcomeSubmittedSuccess: string;
  outcomeResubmittedSuccess: string;
  approvedBanner: string;
  returnedBanner: string;
  adviceThreadHeader: string;
  noAdviceYet: string;
  supervisorFeedbackPlaceholder: string;
  sendFeedbackBtn: string;
  sendingFeedback: string;
  lockedNotice: string;
}

export interface AdviceTranslations {
  title: string;
  subtitle: string;
  noThreadsTitle: string;
  noThreadsDesc: string;
  threadWith: string;
  threadMonth: string;
  replyPlaceholder: string;
  sendReplyBtn: string;
  sendingReply: string;
  statusUnread: string;
  statusRead: string;
  adviceFromSupervisor: string;
  studentResponse: string;
}

export interface NotificationsTranslations {
  title: string;
  subtitle: string;
  markAllReadBtn: string;
  markingRead: string;
  emptyTitle: string;
  emptyDesc: string;
  filterAll: string;
  filterUnread: string;
  notificationTypeOutcomeSubmitted: string;
  notificationTypeOutcomeReviewed: string;
  notificationTypeAdviceReceived: string;
  timeAgoJustNow: string;
}

export interface ProfileTranslations {
  title: string;
  subtitle: string;
  personalInfoCard: string;
  nameLabel: string;
  emailLabel: string;
  roleLabel: string;
  orgLabel: string;
  timezoneLabel: string;
  preferredLanguageLabel: string;
  preferredThemeLabel: string;
  securityCard: string;
  changePasswordBtn: string;
  logoutBtn: string;
  studentRole: string;
  supervisorRole: string;
  orgAdminRole: string;
  platformAdminRole: string;
}

export interface SupervisorTranslations {
  dashboardTitle: string;
  dashboardSubtitle: string;
  assignedStudentsTitle: string;
  reviewQueueTitle: string;
  pendingReviewsCount: string;
  approvedCount: string;
  returnedCount: string;
  studentNameHeader: string;
  monthHeader: string;
  submittedAtHeader: string;
  statusHeader: string;
  actionHeader: string;
  reviewReportBtn: string;
  approveReportBtn: string;
  returnReportBtn: string;
  approving: string;
  returning: string;
  approveConfirmTitle: string;
  approveConfirmText: string;
  returnModalTitle: string;
  returnModalSubtitle: string;
  feedbackPlaceholder: string;
  feedbackRequiredError: string;
  filterAllStatus: string;
  noAssignedStudents: string;
  noPendingReviews: string;
  reportReviewTitle: string;
  studentReportFor: string;
  reviewPageTitle: string;
  backToQueue: string;
  reportNotFound: string;
  reportMonthLabel: string;
  revisionCount: string;
  submittedDateLabel: string;
  reviewCompletedLabel: string;
  staleWarningTitle: string;
  staleWarningDesc: string;
  planVsActualTitle: string;
  frozenSnapshotSubtitle: string;
  activityHeader: string;
  targetHeader: string;
  actualHeader: string;
  unitHeader: string;
  reflectionsTitle: string;
  achievementsTitle: string;
  challengesTitle: string;
  nextMonthTitle: string;
  noComments: string;
  supervisorDecisionTitle: string;
  conflictErrorTitle: string;
  conflictErrorReload: string;
  acknowledgeOption: string;
  acknowledgeDesc: string;
  returnOption: string;
  returnDesc: string;
  feedbackLabel: string;
  confirmApprovalBtn: string;
  confirmReturnBtn: string;
  adviceHistoryTitle: string;
  noAdviceHistory: string;
  replyBtn: string;
  replySuccess: string;
  reviewSubmittedSuccess: string;
}

export interface AuditTranslations {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  filterAction: string;
  filterTarget: string;
  timestampHeader: string;
  actorHeader: string;
  actionHeader: string;
  targetHeader: string;
  statusHeader: string;
  metadataHeader: string;
  noEventsFound: string;
  refreshBtn: string;
  filterTitle: string;
  fromDateLabel: string;
  toDateLabel: string;
  allActions: string;
  allEntities: string;
  actorIdLabel: string;
  actorIdPlaceholder: string;
  loadingRecords: string;
  noRecordsDesc: string;
  detailsBtn: string;
  paginationTotal: string;
  prevBtn: string;
  nextBtn: string;
  modalTitle: string;
  closeBtn: string;
  metadataTitle: string;
}

export interface ValidationTranslations {
  required: string;
  invalidEmail: string;
  passwordTooShort: string;
  passwordsDoNotMatch: string;
  invalidNumber: string;
  negativeNumberNotAllowed: string;
  classAttendedExceedsTotal: string;
  dateRestrictedError: string;
}

export interface RbacTranslations {
  accessDeniedTitle: string;
  accessDeniedDesc: string;
  accessDeniedRequiredPermission: string;
  accessDeniedBackHome: string;
  accessDeniedContactAdmin: string;
  quickLinksTitle: string;
  quickLinksSubtitle: string;
  enterDailyReport: string;
  enterDailyReportDesc: string;
  monthlyPlan: string;
  monthlyPlanDesc: string;
  monthlyOutcome: string;
  monthlyOutcomeDesc: string;
  viewAdvice: string;
  viewAdviceDesc: string;
  supervisorDashboard: string;
  supervisorDashboardDesc: string;
  reviewQueue: string;
  reviewQueueDesc: string;
  auditLog: string;
  auditLogDesc: string;
  userManagement: string;
  userManagementDesc: string;
  invitations: string;
  invitationsDesc: string;
  profileSettings: string;
  profileSettingsDesc: string;
}

export interface DeveloperTranslations {
  pageCategory: string;
  pageTitle: string;
  pageDescription: string;
  copyEmail: string;
  emailCopied: string;
  portfolioBtn: string;
  linkedInBtn: string;
  availableForHire: string;
  creatorRole: string;
  creatorTagline: string;
  creatorBio: string;
  coreToolkit: string;
  channelsTitle: string;
  channelsSubtitle: string;
  tabAll: string;
  tabDirectChat: string;
  tabPlatforms: string;
  tabVentures: string;
  aboutVisionTitle: string;
  aboutVisionSubtitle: string;
  aboutVisionP1: string;
  aboutVisionP2: string;
  feedbackTitle: string;
  feedbackSubtitle: string;
  feedbackPlaceholder: string;
  sendFeedbackBtn: string;
  openingWhatsApp: string;
  readyToSend: string;
  clickIfNotOpened: string;
  directWhatsAppNotice: string;
  footerCraftedWith: string;
  footerRights: string;
  footerTagline: string;
}

export interface TranslationSchema {
  common: CommonTranslations;
  nav: NavTranslations;
  auth: AuthTranslations;
  dashboard: DashboardTranslations;
  dailyReport: DailyReportTranslations;
  monthlyPlan: MonthlyPlanTranslations;
  monthlyOutcome: MonthlyOutcomeTranslations;
  advice: AdviceTranslations;
  notifications: NotificationsTranslations;
  profile: ProfileTranslations;
  supervisor: SupervisorTranslations;
  audit: AuditTranslations;
  validation: ValidationTranslations;
  rbac: RbacTranslations;
  developer: DeveloperTranslations;
}
