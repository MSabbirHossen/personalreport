const API_BASE = '/api/v1';

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token') || 'mock-token';

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
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

  // Advice
  getAdvice: () => fetchWithAuth<{ advice: any[] }>('/advice'),
  acknowledgeAdvice: (id: string) =>
    fetchWithAuth<{ success: boolean; message: string }>(`/advice/${id}/acknowledge`, {
      method: 'POST',
    }),
};
