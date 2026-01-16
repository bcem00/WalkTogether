import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://172.30.16.127:5070'; // Adjust if needed (backend URL)

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface EventResponse {
  eventId: string; 
  title: string;
  description: string;
  startDate: string;
  invitationCode: string;
  isCreator: boolean;
  
  routePolyline?: string;
  waypointsJson?: string;
  totalDistanceMeters?: number;
}

// JWT decode helper (handles base64url)
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const decoded = JSON.parse(atob(paddedBase64));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Helper to get user info from token
export const getUserInfoFromToken = (token: string) => {
  const decoded = decodeJWT(token);
  return {
    userId: decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded?.sub || decoded?.userId || null,
    username: decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded?.username || null,
    role: decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded?.role || null,
  };
};

// --- CORE API REQUEST HANDLER ---
// Now automatically attaches the Authorization header if a token exists
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // 1. Get Token Automatically
    const token = await AsyncStorage.getItem('userToken');
    
    // 2. Prepare Headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>), // Preserve custom headers
    };

    // 3. Attach Bearer Token if not already set
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Server Error [${response.status}]:`, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return { error: errorData.message || `HTTP ${response.status}` };
      } catch {
        return { error: `Server Error: ${response.status}` };
      }
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

  loginWithStorage: async (credentials: { identifier: string; password: string }) => {
    const loginResult = await authApi.login(credentials);
    if (loginResult.data) {
      const token = loginResult.data.token;
      const userInfo = getUserInfoFromToken(token);
      
      await AsyncStorage.setItem('userToken', token);
      if (userInfo.userId) await AsyncStorage.setItem('userId', userInfo.userId);
      if (userInfo.username) await AsyncStorage.setItem('username', userInfo.username);
      if (userInfo.role) await AsyncStorage.setItem('userRole', userInfo.role);
    }
    return loginResult;
  },

  // Removed userId param; Backend must extract it from Token
  changePassword: async (passwordData: { oldPassword: string; newPassword: string }) => {
    return apiRequest<{ message: string }>('/api/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Removed userId param; Backend must extract it from Token
  changeUsername: async (usernameData: { newUsername: string }) => {
    return apiRequest<{ message: string }>('/api/users/change-username', {
      method: 'PUT',
      body: JSON.stringify(usernameData),
    });
  },

  // New: Get current user profile
  getUserProfile: async () => {
    return apiRequest<{
      userId: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      motivationPoint: number;
      hasBadge: boolean;
    }>('/api/users/profile', {
      method: 'GET',
    });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userId', 'username', 'userRole']);
  },

  // Removed userId param; Backend must extract it from Token
  savePushToken: async (token: string) => {
    return apiRequest('/api/users/save-push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};


export const eventsApi = {
  // Token handling is now automatic inside apiRequest, but we allow override if passed explicitly
  createRoute: async (eventId: string, waypoints: { latitude: number; longitude: number }[], token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return apiRequest<{ message: string; polyline: string; distance: number }>(`/api/events/${eventId}/create-route`, {
      method: 'POST',
      headers, 
      body: JSON.stringify(waypoints), 
    });
  },

  getUpcomingEvents: async () => {
    return apiRequest<{ event_id: string; title: string; description: string; start_date: string; invitation_code: string; creator_full_name: string; creator_username: string; route_distance_meters: number; participant_count: number }[]>('/api/events/upcoming');
  },

  // Updated: Only sends inviteCode
  joinEvent: async (inviteCode: string) => {
    return apiRequest<{ message: string }>('/api/events/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  // Updated: Removed userId param
  leaveEvent: async (eventId: string) => {
    return apiRequest<{ message: string }>('/api/events/leave', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  },

  getEventsByUsername: async (username: string) => {
    return apiRequest<EventResponse[]>(`/api/events/user/${username}`);
  },

  getEventsById: async (userId: string) => {
    return apiRequest<EventResponse[]>(`/api/events/user-id/${userId}`);
  },

  filterEventsByDistance: async (minDist: number, maxDist: number) => {
    return apiRequest<{ event_title: string; event_start_date: string; route_distance: number; participant_count: number }[]>(`/api/events/filter?minDist=${minDist}&maxDist=${maxDist}`);
  },

  getDestinationsForEvent: async (eventId: string) => {
    return apiRequest<{ destination_id: string; latitude: number; longitude: number; order_in_route: number }[]>(`/api/events/${eventId}/destinations`);
  },

  // Updated: Removed CreatorId (Backend infers from token)
  createEvent: async (eventData: { Title: string; Description?: string; StartDate: string; }) => {
    return apiRequest<{ eventId: string; message: string, invitationCode: string }>('/api/events/create', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  deleteEvent: async (eventId: string) => {
    return apiRequest<{ message: string }>(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  addEventDistanceToAttendees: async (eventId: string) => {
    return apiRequest<{ message: string; updatedCount: number }>(`/api/events/${eventId}/add-distance-to-attendees`, {
      method: 'POST',
    });
  },

  createDestination: async (eventId: string, destinationData: { latitude: number; longitude: number; orderInRoute: number }) => {
    return apiRequest<{ message: string; destinationId: string }>(`/api/events/${eventId}/create-destination`, {
      method: 'POST',
      body: JSON.stringify(destinationData),
    });
  },

  updateRouteDistance: async (eventId: string, distance: number) => {
    return apiRequest<{ message: string }>(`/api/events/${eventId}/update-route-distance`, {
      method: 'POST',
      body: JSON.stringify({ distance }),
    });
  },

  getAttendedEvents: async () => {
    return apiRequest<{ event_id: string; title: string; description: string; start_date: string; invitation_code: string; creator_username: string; creator_full_name: string; route_distance_meters: number; participant_count: number }[]>('/api/events/attended-events');
  },

  getEventReport: async (eventId: string) => {
    return apiRequest<{ report: string }>(`/api/events/${eventId}/report`);
  },

  getEventParticipants: async (eventId: string) => {
    return apiRequest<{
      userId: string;
      username: string;
      firstName: string;
      lastName: string;
      hasCompleted: boolean;
    }[]>(`/api/events/${eventId}/participants`);
  },

  getInactiveUsers: async () => {
    return apiRequest<{ out_username: string; out_email: string }[]>('/api/events/admin/inactive-users');
  },

  getTotalEventCount: async () => {
    return apiRequest<{ totalEventCount: number }>('/api/events/admin/total-count');
  },

  getSystemLogs: async (limit: number = 100, severity?: string, tableName?: string) => {
    let url = `/api/events/admin/system-logs?limit=${limit}`;
    if (severity) url += `&severity=${severity}`;
    if (tableName) url += `&tableName=${tableName}`;
    return apiRequest<{
      logId: string;
      userId: string | null;
      actionType: string;
      tableName: string;
      recordId: string | null;
      oldData: any;
      newData: any;
      severity: string;
      createdAt: string;
    }[]>(url);
  },
};

export default { auth: authApi, events: eventsApi };