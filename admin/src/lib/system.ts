import api from "./api";

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number;
  memory: { used: number; total: number; percentage: number };
  cpu: { usage: number };
  disk: { used: number; total: number; percentage: number };
  database: { status: string; responseTime: number };
  api: { status: string; responseTime: number };
  services: { name: string; status: string; lastChecked: string }[];
}

export interface ErrorLog {
  id: string;
  level: "error" | "warning" | "critical";
  message: string;
  stack?: string;
  source: string;
  userId?: string;
  requestId?: string;
  timestamp: string;
  resolved: boolean;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: "all" | "vendors" | "users";
  status: "draft" | "scheduled" | "sent";
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
}

export const systemService = {
  // Admin Logs
  getAdminLogs: async (params?: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get("/v1/admin/logs", { params });
    return response.data?.data ?? response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get("/v1/admin/audit-logs", { params });
    return response.data?.data ?? response.data;
  },

  // System Health
  getSystemHealth: async () => {
    const response = await api.get("/v1/admin/system/health");
    return response.data?.data ?? response.data;
  },

  // Error Logs
  getErrorLogs: async (params?: {
    page?: number;
    limit?: number;
    level?: string;
    source?: string;
    resolved?: boolean;
  }) => {
    const response = await api.get("/v1/admin/system/errors", { params });
    return response.data?.data ?? response.data;
  },

  resolveError: async (errorId: string) => {
    const response = await api.put(
      `/v1/admin/system/errors/${errorId}/resolve`,
    );
    return response.data?.data ?? response.data;
  },

  // Broadcast Notifications
  getBroadcasts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get("/v1/admin/broadcasts", { params });
    return response.data?.data ?? response.data;
  },

  createBroadcast: async (data: {
    title: string;
    message: string;
    targetAudience: "all" | "vendors" | "users";
    scheduledAt?: string;
  }) => {
    const response = await api.post("/v1/admin/broadcasts", data);
    return response.data?.data ?? response.data;
  },

  cancelBroadcast: async (broadcastId: string) => {
    const response = await api.put(
      `/v1/admin/broadcasts/${broadcastId}/cancel`,
    );
    return response.data?.data ?? response.data;
  },

  deleteBroadcast: async (broadcastId: string) => {
    const response = await api.delete(`/v1/admin/broadcasts/${broadcastId}`);
    return response.data?.data ?? response.data;
  },
};
