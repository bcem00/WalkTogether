const API_BASE_URL = 'https://localhost:5067'; // Adjust if needed (backend URL)

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}


export const authApi = {
  register: async (userData: { firstName: string; lastName: string; username: string; email: string; password: string }) => {
    return apiRequest<{ message: string; userId: string }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { identifier: string; password: string }) => {
    return apiRequest<{ token: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  changePassword: async (token: string, passwordData: { oldPassword: string; newPassword: string }) => {
    return apiRequest<{ message: string }>('/api/users/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(passwordData),
    });
  },

  changeUsername: async (token: string, usernameData: { newUsername: string }) => {
    return apiRequest<{ message: string }>('/api/users/change-username', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(usernameData),
    });
  },
};


export const eventsApi = {
  createRoute: async (eventId: string, waypoints: Array<{ lat: number; lng: number }>, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return apiRequest<{ message: string; polyline: string; distance: number }>(`/api/events/${eventId}/create-route`, {
      method: 'POST',
      headers,
      body: JSON.stringify(waypoints),
    });
  },

  getUpcomingEvents: async () => {
    return apiRequest<Array<{ event_id: string; title: string; description: string; start_date: string; invitation_code: string; creator_full_name: string; creator_username: string; route_distance_meters: number; participant_count: number }>>('/api/events/upcoming');
  },

  joinEvent: async (userId: string, inviteCode: string) => {
    return apiRequest<{ message: string }>('/api/events/join', {
      method: 'POST',
      body: JSON.stringify({ userId, inviteCode }),
    });
  },

  leaveEvent: async (userId: string, eventId: string) => {
    return apiRequest<{ message: string }>('/api/events/leave', {
      method: 'POST',
      body: JSON.stringify({ userId, eventId }),
    });
  },

  getEventsByUsername: async (username: string) => {
    return apiRequest<Array<{ title: string; description: string; start_date: string; invitation_code: string; creator_id: string }>>(`/api/events/user/${username}`);
  },

  filterEventsByDistance: async (minDist: number, maxDist: number) => {
    return apiRequest<Array<{ event_title: string; event_start_date: string; route_distance: number; participant_count: number }>>(`/api/events/filter?minDist=${minDist}&maxDist=${maxDist}`);
  },

  getDestinationsForEvent: async (eventId: string) => {
    return apiRequest<Array<{ destination_id: string; latitude: number; longitude: number; order_in_route: number }>>(`/api/events/${eventId}/destinations`);
  },
};


export default { auth: authApi, events: eventsApi };