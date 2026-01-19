import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

// Types
export interface AttendanceRecord {
  id: string;
  sessionId: number;
  name: string;
  studentId: string;
  department?: string;
  ipAddress: string;
  device: string;
  timestamp: Date | string;
  status: 'present' | 'late';
}

export interface Session {
  id: number;
  name: string | null;
  authorizedIp: string | null;
  startTime: string | Date;
  endTime: string | Date | null;
  isActive: boolean;
}

interface WebSocketMessage {
  type: "attendance_recorded" | "session_toggled" | "records_cleared" | "initial_data";
  data?: any;
}

interface SystemContextType {
  sessionActive: boolean;
  activeSession: Session | null;
  records: AttendanceRecord[];
  isAuthenticated: boolean;
  login: (password: string) => { success: boolean; error?: string; remainingAttempts?: number };
  logout: () => void;
  toggleSession: (name?: string, lateThreshold?: number) => Promise<void>;
  markAttendance: (data: Omit<AttendanceRecord, 'id' | 'timestamp' | 'ipAddress' | 'device' | 'status'>) => Promise<void>;
  exportData: (format: 'slides' | 'csv' | 'pdf' | 'excel') => Promise<void>;
  resetSession: () => Promise<void>;
  // New features
  searchRecords: (query: string, filters?: any, sort?: any) => Promise<AttendanceRecord[]>;
  getStats: () => Promise<any>;
  bulkDelete: (ids: string[]) => Promise<void>;
  enableNotifications: boolean;
  setEnableNotifications: (enable: boolean) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// Default admin password - can be changed
const ADMIN_PASSWORD = 'admin123';
const AUTH_KEY = 'admin_authenticated';
const API_BASE = '/api';
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// Device ID key stored in localStorage to identify a device across sessions
const DEVICE_ID_KEY = 'attendance:deviceId';

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        id = (crypto as any).randomUUID();
      } else {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (err) {
    // Fallback in environments without localStorage
    return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [enableNotifications, setEnableNotifications] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Clean up audio context if needed
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = () => {
    if (!enableNotifications) return;

    try {
      const audio = new Audio('/notification.mp3'); // We'll need to add this file or use a synthetic sound
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.error('Failed to play sound', e);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('[websocket] Connected');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('[websocket] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[websocket] Error:', error);
        };

        ws.onclose = () => {
          console.log('[websocket] Disconnected, reconnecting...');
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('[websocket] Failed to connect:', error);
        // Retry connection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Load initial data from API
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [recordsRes, sessionRes] = await Promise.all([
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/session`),
      ]);

      if (recordsRes.ok) {
        const contentType = recordsRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const { records: fetchedRecords } = await recordsRes.json();
            setRecords(fetchedRecords.map((r: any) => ({
              ...r,
              timestamp: new Date(r.timestamp),
            })));
          } catch (parseError) {
            console.error('[api] Error parsing records response:', parseError);
          }
        } else {
          console.warn('[api] Records response is not JSON:', contentType);
        }
      }

      if (sessionRes.ok) {
        const contentType = sessionRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const { active, session } = await sessionRes.json();
            setSessionActive(active);
            setActiveSession(session);
          } catch (parseError) {
            console.error('[api] Error parsing session response:', parseError);
          }
        } else {
          console.warn('[api] Session response is not JSON:', contentType);
        }
      }
    } catch (error) {
      console.error('[api] Error fetching initial data:', error);
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'initial_data':
        if (message.data) {
          setRecords(message.data.records.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })));
          setSessionActive(message.data.sessionActive);
        }
        break;
      case 'attendance_recorded':
        if (message.data) {
          playNotificationSound();
          const newRecord = {
            ...message.data,
            timestamp: new Date(message.data.timestamp),
          };
          setRecords(prev => [newRecord, ...prev]);
        }
        break;
      case 'session_toggled':
        if (message.data && message.data.active !== undefined) {
          console.log(`[websocket] Session toggled to: ${message.data.active ? 'Active' : 'Inactive'}`);
          setSessionActive(message.data.active);
          setActiveSession(message.data.session || null);
        }
        break;
      case 'records_cleared':
        setRecords([]);
        break;
    }
  };

  const login = (password: string): { success: boolean; error?: string; remainingAttempts?: number } => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return { success: true };
    }
    return { success: false, error: "Incorrect password", remainingAttempts: 3 }; // Mock attempts
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const toggleSession = async (name?: string, lateThreshold?: number) => {
    try {
      const res = await fetch(`${API_BASE}/session/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lateThreshold }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to toggle session';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Server returned ${res.status}: ${res.statusText}`;
        }
        console.error('[api] Failed to toggle session:', errorMessage);
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      const { active, session } = responseData;
      // WebSocket will also update, but we set it here immediately
      setSessionActive(active);
      setActiveSession(session);
    } catch (error: any) {
      console.error('[api] Error toggling session:', error);
      // Re-throw with a user-friendly message
      throw new Error(error.message || 'Failed to toggle session. Please try again.');
    }
  };

  const markAttendance = async (data: Omit<AttendanceRecord, 'id' | 'timestamp' | 'ipAddress' | 'device' | 'status'>) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({ ...data, deviceId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit attendance');
      }

      const { record } = await res.json();
      // WebSocket will handle update
    } catch (error) {
      console.error('[api] Error submitting attendance:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error('Failed to delete records');

      // Update local state immediately
      setRecords(prev => prev.filter(r => !ids.includes(r.id)));
    } catch (error) {
      console.error('Error bulk deleting:', error);
      throw error;
    }
  };

  const searchRecords = async (query: string, filters?: any, sort?: any): Promise<AttendanceRecord[]> => {
    // Client-side filtering
    let results = [...records];

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(r =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.studentId.toLowerCase().includes(lowerQuery) ||
        (r.department && r.department.toLowerCase().includes(lowerQuery))
      );
    }

    if (filters) {
      if (filters.department && filters.department !== 'all') {
        results = results.filter(r => r.department === filters.department);
      }
      if (filters.status && filters.status !== 'all') {
        results = results.filter(r => r.status === filters.status);
      }
    }

    if (sort) {
      results.sort((a, b) => {
        const valA = (a as any)[sort.by];
        const valB = (b as any)[sort.by];

        if (valA < valB) return sort.order === 'asc' ? -1 : 1;
        if (valA > valB) return sort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  };

  const getStats = async () => {
    // Calculate stats client-side from records
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;

    const departmentBreakdown = records.reduce((acc: any, r) => {
      const dept = r.department || 'Other';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Hourly breakdown
    const hourlyBreakdown = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    records.forEach(r => {
      const hour = r.timestamp.getHours();
      hourlyBreakdown[hour].count++;
    });

    return {
      total,
      present,
      late,
      departmentBreakdown,
      hourlyBreakdown
    };
  };

  const exportData = async (format: 'slides' | 'csv' | 'pdf' | 'excel') => {
    // Real CSV Export Implementation
    if (format === 'csv' || format === 'excel') {
      const headers = ['Name', 'ID', 'Department', 'Time', 'Device', 'IP', 'Status'];
      const rows = records.map(r => [
        r.name,
        r.studentId,
        r.department || '',
        r.timestamp.toLocaleString(),
        r.device,
        r.ipAddress,
        r.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Exporting to ${format}...`);
        resolve();
      }, 1500);
    });
  };

  const resetSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRecords([]);
        // WebSocket will also notify, but we update immediately
      } else {
        console.error('[api] Failed to reset session');
      }
    } catch (error) {
      console.error('[api] Error resetting session:', error);
    }
  };

  return (
    <SystemContext.Provider value={{
      sessionActive,
      activeSession,
      records,
      isAuthenticated,
      login,
      logout,
      toggleSession,
      markAttendance,
      exportData,
      resetSession,
      searchRecords,
      getStats,
      bulkDelete,
      enableNotifications,
      setEnableNotifications
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
