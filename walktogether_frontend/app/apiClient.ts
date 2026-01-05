const API_BASE_URL = 'http://192.168.1.221:5068'; // Adjust if needed (backend URL)

import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// JWT decode helper (handles base64url)
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    // Convert base64url to base64
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

// Helper to get userId from token (for backward compatibility)
export const getUserIdFromToken = (token: string): string | null => {
  return getUserInfoFromToken(token).userId;
};

// Helper to get auth headers
export const getAuthHeaders = async (): Promise<Record<string, string> | null> => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : null;
};

// Helper to get stored userId
export const getStoredUserId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('userId');
};

// Helper to get stored username
export const getStoredUsername = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('username');
};

// Helper to get stored user role
export const getStoredUserRole = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('userRole');
};


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

  
  loginWithStorage: async (credentials: { identifier: string; password: string }) => {
    const loginResult = await authApi.login(credentials);
    if (loginResult.data) {
      const token = loginResult.data.token;
      const userInfo = getUserInfoFromToken(token);
      
      await AsyncStorage.setItem('userToken', token);
      if (userInfo.userId) {
        await AsyncStorage.setItem('userId', userInfo.userId);
      }
      if (userInfo.username) {
        await AsyncStorage.setItem('username', userInfo.username);
      }
      if (userInfo.role) {
        await AsyncStorage.setItem('userRole', userInfo.role);
      }
    }
    return loginResult;
  },

  changePassword: async (passwordData: { oldPassword: string; newPassword: string }) => {
    const headers = await getAuthHeaders();
    const userId = await getStoredUserId();
    if (!headers || !userId) return { error: 'Not authenticated' };

    return apiRequest<{ message: string }>('/api/users/change-password', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...passwordData }),
    });
  },

  changeUsername: async (usernameData: { newUsername: string }) => {
    const headers = await getAuthHeaders();
    const userId = await getStoredUserId();
    if (!headers || !userId) return { error: 'Not authenticated' };

    return apiRequest<{ message: string }>('/api/users/change-username', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...usernameData }),
    });
  },

  // Logout helper
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('userRole');
  },
};


export const eventsApi = {
  createRoute: async (eventId: string, waypoints: Array<{ latitude: number; longitude: number }>, token?: string) => {
    let headers: Record<string, string> = {};
    
    // Use provided token or fall back to stored token
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      const authHeaders = await getAuthHeaders();
      if (authHeaders) headers = { ...headers, ...authHeaders };
    }

    return apiRequest<{ message: string; polyline: string; distance: number }>(`/api/events/${eventId}/create-route`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(waypoints), // Now sends [{ latitude: ..., longitude: ... }]
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
    return apiRequest<Array<{ id: string; title: string; description: string; start_date: string; invitation_code: string; creator_id: string }>>(`/api/events/user/${username}`);
  },

  filterEventsByDistance: async (minDist: number, maxDist: number) => {
    return apiRequest<Array<{ event_title: string; event_start_date: string; route_distance: number; participant_count: number }>>(`/api/events/filter?minDist=${minDist}&maxDist=${maxDist}`);
  },

  getDestinationsForEvent: async (eventId: string) => {
    return apiRequest<Array<{ destination_id: string; latitude: number; longitude: number; order_in_route: number }>>(`/api/events/${eventId}/destinations`);
  },

  createEvent: async (eventData: { CreatorId?: string; Title: string; Description?: string; StartDate: string; RoutePolyline?: string; WaypointsJson?: string; TotalDistanceMeters?: number; EstimatedDurationSeconds?: number }) => {
    return apiRequest<{ eventId: string; message: string }>('/api/events/create', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },
};


export default { auth: authApi, events: eventsApi };