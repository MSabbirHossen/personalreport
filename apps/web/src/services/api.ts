import { auth } from '../config/firebase.js';

const API_PREFIX = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_BASE = `${API_PREFIX}/api/v1`;

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('auth_token');

  // Attempt to obtain fresh token from Firebase client if user is signed in
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      if (token) {
        localStorage.setItem('auth_token', token);
      }
    } catch {
      // Fallback to token stored in localStorage
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized (401) and Firebase user is present, force refresh token once and retry
  if (response.status === 401 && auth?.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      if (freshToken) {
        localStorage.setItem('auth_token', freshToken);
        headers.set('Authorization', `Bearer ${freshToken}`);
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      }
    } catch {
      // Force refresh failed
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || 'API request failed');
    error.code = data.code;
    error.status = response.status;
    error.serverRevision = data.serverRevision;
    error.serverValues = data.serverValues;
    throw error;
  }

  return data;
}

export const api = {
  // Profile
  getMe: () => fetchWithAuth<{ user: any }>('/me'),
  updateProfile: (data: any) =>
    fetchWithAuth<{ success: boolean; message: string }>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Templates
  getCurrentTemplate: () =>
    fetchWithAuth<{ template: any }>('/templates/current'),

  // Daily Reports
  getDailyReportsForMonth: (monthKey: string) =>
    fetchWithAuth<{ month: string; reports: Record<string, any> }>(`/daily-reports?month=${monthKey}`),
  getDailyReportForDate: (dateKey: string) =>
    fetchWithAuth<any>(`/daily-reports/${dateKey}`),
  saveDailyReport: (dateKey: string, payload: any) =>
    fetchWithAuth<{ success: boolean; report: any }>(`/daily-reports/${dateKey}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Monthly Plan
  getMonthlyPlan: (monthKey: string) =>
    fetchWithAuth<any>(`/monthly-plans/${monthKey}`),
  saveMonthlyPlan: (monthKey: string, payload: any) =>
    fetchWithAuth<{ success: boolean; plan: any }>(`/monthly-plans/${monthKey}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  shareMonthlyPlan: (monthKey: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/monthly-plans/${monthKey}/share`, {
      method: 'POST',
    }),

  // Monthly Outcome
  getMonthlyOutcome: (monthKey: string) =>
    fetchWithAuth<any>(`/monthly-outcomes/${monthKey}`),
  saveMonthlyOutcome: (monthKey: string, payload: any) =>
    fetchWithAuth<{ success: boolean; outcome: any }>(`/monthly-outcomes/${monthKey}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  submitMonthlyOutcome: (monthKey: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/monthly-outcomes/${monthKey}/submit`, {
      method: 'POST',
    }),

  // Advice & Mentorship
  getAdvice: (params?: { studentId?: string; monthKey?: string }) => {
    const search = new URLSearchParams();
    if (params?.studentId) search.set('studentId', params.studentId);
    if (params?.monthKey) search.set('monthKey', params.monthKey);
    const qs = search.toString();
    return fetchWithAuth<{ advice: any[] }>(`/advice${qs ? `?${qs}` : ''}`);
  },
  acknowledgeAdvice: (id: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/advice/${id}/acknowledge`, {
      method: 'POST',
    }),
  replyAdvice: (id: string, body: string) =>
    fetchWithAuth<{ success: boolean; message: string; reply: any }>(`/advice/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  // Notifications
  getNotifications: () =>
    fetchWithAuth<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    fetchWithAuth<{ success: boolean; message: string; updatedCount: number }>(
      '/notifications/read-all',
      { method: 'POST' }
    ),

  // Supervisor Dashboard & Review
  getSupervisorDashboard: () =>
    fetchWithAuth<{ summary: any }>('/supervisor/dashboard'),
  getSupervisorQueue: (params?: {
    monthKey?: string;
    status?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.monthKey) search.set('monthKey', params.monthKey);
    if (params?.status) search.set('status', params.status);
    if (params?.studentId) search.set('studentId', params.studentId);
    if (params?.page) search.set('page', params.page.toString());
    if (params?.limit) search.set('limit', params.limit.toString());
    const qs = search.toString();
    return fetchWithAuth<{ queue: any[]; total: number; page: number; limit: number }>(
      `/supervisor/queue${qs ? `?${qs}` : ''}`
    );
  },
  getSupervisorStudents: () =>
    fetchWithAuth<{ students: any[] }>('/supervisor/students'),
  getSupervisorStudentReports: (studentId: string) =>
    fetchWithAuth<{ studentId: string; reports: any[] }>(`/supervisor/students/${studentId}/reports`),
  getSupervisorReportDetail: (outcomeId: string) =>
    fetchWithAuth<{ outcome: any; student: any; plan: any; adviceHistory: any[] }>(
      `/supervisor/reports/${outcomeId}`
    ),
  submitSupervisorReview: (
    outcomeId: string,
    payload: { action: 'acknowledge' | 'return'; feedback?: string; revision?: number }
  ) =>
    fetchWithAuth<{ success: boolean; message: string; status: string; reviewedAt: string; revision: number }>(
      `/supervisor/reviews/${outcomeId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  postSupervisorAdvice: (payload: {
    studentId: string;
    targetType: 'plan' | 'outcome' | 'general';
    targetId?: string;
    monthKey?: string;
    body: string;
  }) =>
    fetchWithAuth<{ success: boolean; advice: any }>('/supervisor/advice', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Memberships & Invitations
  getMemberships: () => fetchWithAuth<{ memberships: any[] }>('/me/memberships'),
  getInvitation: (token: string) =>
    fetchWithAuth<{ valid: boolean; invitation: any; organization: any }>(`/invitations/${token}`),
  acceptInvitation: (token: string) =>
    fetchWithAuth<{ success: boolean; message: string; membership: any }>(`/invitations/${token}/accept`, {
      method: 'POST',
    }),
  getOrganizationInvitations: () =>
    fetchWithAuth<{ invitations: any[] }>('/organization/invitations'),
  createInvitation: (payload: any) =>
    fetchWithAuth<{ success: boolean; invitation: any }>('/organization/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  revokeInvitation: (id: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/organization/invitations/${id}`, {
      method: 'DELETE',
    }),

  // Audit Log Explorer (ADMIN-07)
  getAuditEvents: (params?: {
    from?: string;
    to?: string;
    actorId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    if (params?.actorId) search.set('actorId', params.actorId);
    if (params?.action) search.set('action', params.action);
    if (params?.entityType) search.set('entityType', params.entityType);
    if (params?.limit) search.set('limit', params.limit.toString());
    if (params?.offset !== undefined) search.set('offset', params.offset.toString());
    const qs = search.toString();
    return fetchWithAuth<{ events: any[]; total: number; limit: number; offset: number }>(
      `/organization/audit-events${qs ? `?${qs}` : ''}`
    );
  },
};
