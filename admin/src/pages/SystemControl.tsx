import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Globe,
  Server,
  Shield,
  X,
} from "lucide-react";
import {
  systemService,
  type AdminLog,
  type AuditLog,
  type SystemHealth,
  type ErrorLog,
  type BroadcastNotification,
} from "../lib/system";
import { PageHeader } from "../components/ui/PageHeader";
import { FiltersBar } from "../components/ui/FiltersBar";
import { SearchInput } from "../components/ui/SearchInput";
import { PageLoader } from "../components/ui/PageLoader";
import { EmptyState } from "../components/ui/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import * as Dialog from "@radix-ui/react-dialog";

type TabType = "health" | "adminLogs" | "auditLogs" | "errors" | "broadcasts";

export default function SystemControl() {
  const [activeTab, setActiveTab] = useState<TabType>("health");
  const [isLoading, setIsLoading] = useState(true);

  // Health state
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Admin logs state
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [adminPage, setAdminPage] = useState(1);
  const [adminTotal, setAdminTotal] = useState(0);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Error logs state
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorPage, setErrorPage] = useState(1);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorFilter, setErrorFilter] = useState<
    "all" | "unresolved" | "resolved"
  >("unresolved");

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [broadcastPage, setBroadcastPage] = useState(1);
  const [broadcastTotal, setBroadcastTotal] = useState(0);
  const [newBroadcast, setNewBroadcast] = useState<{
    open: boolean;
    title: string;
    message: string;
    audience: "all" | "vendors" | "users";
  } | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await systemService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error("Failed to load system health:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminLogs = async () => {
    setIsLoading(true);
    try {
      const data = await systemService.getAdminLogs({
        page: adminPage,
        limit: 10,
      });
      setAdminLogs(data.data ?? []);
      setAdminTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to load admin logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await systemService.getAuditLogs({
        page: auditPage,
        limit: 10,
      });
      setAuditLogs(data.data ?? []);
      setAuditTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorLogs = async () => {
    setIsLoading(true);
    try {
      const data = await systemService.getErrorLogs({
        page: errorPage,
        limit: 10,
        resolved:
          errorFilter === "resolved"
            ? true
            : errorFilter === "unresolved"
              ? false
              : undefined,
      });
      setErrorLogs(data.data ?? []);
      setErrorTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to load error logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const data = await systemService.getBroadcasts({
        page: broadcastPage,
        limit: 10,
      });
      setBroadcasts(data.data ?? []);
      setBroadcastTotal(data.pagination?.total ?? 0);
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    switch (activeTab) {
      case "health":
        fetchHealth();
        break;
      case "adminLogs":
        fetchAdminLogs();
        break;
      case "auditLogs":
        fetchAuditLogs();
        break;
      case "errors":
        fetchErrorLogs();
        break;
      case "broadcasts":
        fetchBroadcasts();
        break;
    }
  }, [activeTab, adminPage, auditPage, errorPage, errorFilter, broadcastPage]);

  const handleResolveError = async (errorId: string) => {
    try {
      await systemService.resolveError(errorId);
      setErrorLogs((prev) =>
        prev.map((e) => (e.id === errorId ? { ...e, resolved: true } : e)),
      );
      toast.success("Error marked as resolved.");
    } catch (err) {
      toast.error("Failed to resolve error.");
    }
  };

  const handleCreateBroadcast = async () => {
    if (
      !newBroadcast ||
      !newBroadcast.title.trim() ||
      !newBroadcast.message.trim()
    )
      return;
    try {
      await systemService.createBroadcast({
        title: newBroadcast.title,
        message: newBroadcast.message,
        targetAudience: newBroadcast.audience,
      });
      toast.success("Broadcast notification created.");
      setNewBroadcast(null);
      fetchBroadcasts();
    } catch (err) {
      toast.error("Failed to create broadcast.");
    }
  };

  const handleCancelBroadcast = async (id: string) => {
    try {
      await systemService.cancelBroadcast(id);
      toast.success("Broadcast cancelled.");
      fetchBroadcasts();
    } catch (err) {
      toast.error("Failed to cancel broadcast.");
    }
  };

  const tabs = [
    { id: "health", label: "System Health", icon: Activity },
    { id: "adminLogs", label: "Admin Logs", icon: Shield },
    { id: "auditLogs", label: "Audit Logs", icon: FileText },
    { id: "errors", label: "Error Logs", icon: AlertTriangle },
    { id: "broadcasts", label: "Broadcasts", icon: Bell },
  ];

  const filteredAdminLogs = useMemo(() => {
    if (!searchTerm) return adminLogs;
    const q = searchTerm.toLowerCase();
    return adminLogs.filter(
      (log) =>
        log.adminName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q),
    );
  }, [adminLogs, searchTerm]);

  const filteredAuditLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;
    const q = searchTerm.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q),
    );
  }, [auditLogs, searchTerm]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-600 bg-emerald-50";
      case "degraded":
        return "text-amber-600 bg-amber-50";
      case "down":
        return "text-rose-600 bg-rose-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Control"
        description="Monitor system health, view logs, and manage broadcasts."
      />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {isLoading ? (
            <PageLoader rows={6} />
          ) : !health ? (
            <EmptyState
              title="Unable to load system health"
              description="System health data is unavailable."
            />
          ) : (
            <>
              {/* Status Overview */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`rounded-full p-3 ${getHealthColor(health.status)}`}
                    >
                      <Server className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">System Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {health.status}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Uptime</p>
                      <p className="text-lg font-semibold">
                        {Math.floor(health.uptime / 3600)}h
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-full bg-purple-50 p-3 text-purple-600">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Database</p>
                      <p className="text-lg font-semibold capitalize">
                        {health.database.status}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">API Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {health.api.status}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Usage */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        {health.memory.used} MB
                      </span>
                      <span className="text-slate-500">
                        {health.memory.total} MB
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-indigo-500"
                        style={{ width: `${health.memory.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {health.memory.percentage}% used
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CPU Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-500">Current</span>
                      <span className="text-slate-500">100%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-emerald-500"
                        style={{ width: `${health.cpu.usage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {health.cpu.usage}% used
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Disk Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        {health.disk.used} GB
                      </span>
                      <span className="text-slate-500">
                        {health.disk.total} GB
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-amber-500"
                        style={{ width: `${health.disk.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {health.disk.percentage}% used
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {health.services.map((service, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        {service.status === "healthy" ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : service.status === "degraded" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <X className="h-5 w-5 text-rose-500" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {service.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Last checked:{" "}
                            {new Date(service.lastChecked).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Admin Logs Tab */}
      {activeTab === "adminLogs" && (
        <div className="space-y-4">
          <FiltersBar>
            <SearchInput
              placeholder="Search admin logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FiltersBar>
          {isLoading ? (
            <PageLoader rows={8} />
          ) : filteredAdminLogs.length === 0 ? (
            <EmptyState
              title="No admin logs"
              description="No admin activity logs found."
            />
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdminLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.adminName}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell>{log.entityType}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.details || "-"}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Pagination
                page={adminPage}
                pageSize={10}
                total={adminTotal}
                onPageChange={setAdminPage}
              />
            </>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "auditLogs" && (
        <div className="space-y-4">
          <FiltersBar>
            <SearchInput
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FiltersBar>
          {isLoading ? (
            <PageLoader rows={8} />
          ) : filteredAuditLogs.length === 0 ? (
            <EmptyState
              title="No audit logs"
              description="No audit trail found."
            />
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.userName}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell>{log.resource}</TableCell>
                          <TableCell className="text-slate-500">
                            {log.ipAddress || "-"}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Pagination
                page={auditPage}
                pageSize={10}
                total={auditTotal}
                onPageChange={setAuditPage}
              />
            </>
          )}
        </div>
      )}

      {/* Error Logs Tab */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          <FiltersBar>
            <div className="flex gap-3">
              <SearchInput
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={errorFilter}
                onChange={(e) => {
                  setErrorPage(1);
                  setErrorFilter(e.target.value as typeof errorFilter);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All Errors</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </FiltersBar>
          {isLoading ? (
            <PageLoader rows={8} />
          ) : errorLogs.length === 0 ? (
            <EmptyState
              title="No error logs"
              description="No system errors found."
            />
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                log.level === "critical"
                                  ? "bg-rose-100 text-rose-700"
                                  : log.level === "error"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {log.level}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {log.message}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {log.source}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {log.resolved ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="h-4 w-4" /> Resolved
                              </span>
                            ) : (
                              <button
                                onClick={() => handleResolveError(log.id)}
                                className="text-sm text-indigo-600 hover:underline"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Pagination
                page={errorPage}
                pageSize={10}
                total={errorTotal}
                onPageChange={setErrorPage}
              />
            </>
          )}
        </div>
      )}

      {/* Broadcasts Tab */}
      {activeTab === "broadcasts" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setNewBroadcast({
                  open: true,
                  title: "",
                  message: "",
                  audience: "all",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Bell className="h-4 w-4" /> New Broadcast
            </button>
          </div>
          {isLoading ? (
            <PageLoader rows={6} />
          ) : broadcasts.length === 0 ? (
            <EmptyState
              title="No broadcasts"
              description="No broadcast notifications sent yet."
            />
          ) : (
            <>
              <div className="grid gap-4">
                {broadcasts.map((broadcast) => (
                  <Card key={broadcast.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {broadcast.title}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                broadcast.status === "sent"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : broadcast.status === "scheduled"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {broadcast.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {broadcast.message}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                            <span>To: {broadcast.targetAudience}</span>
                            <span>By: {broadcast.createdBy}</span>
                            {broadcast.sentAt && (
                              <span>
                                Sent:{" "}
                                {new Date(broadcast.sentAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {broadcast.status !== "sent" && (
                          <button
                            onClick={() => handleCancelBroadcast(broadcast.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Pagination
                page={broadcastPage}
                pageSize={10}
                total={broadcastTotal}
                onPageChange={setBroadcastPage}
              />
            </>
          )}
        </div>
      )}

      {/* Create Broadcast Dialog */}
      <Dialog.Root
        open={newBroadcast?.open}
        onOpenChange={(open) => {
          if (!open) setNewBroadcast(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Create Broadcast Notification
            </Dialog.Title>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={newBroadcast?.title ?? ""}
                  onChange={(e) =>
                    newBroadcast &&
                    setNewBroadcast({ ...newBroadcast, title: e.target.value })
                  }
                  placeholder="Notification title"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  value={newBroadcast?.message ?? ""}
                  onChange={(e) =>
                    newBroadcast &&
                    setNewBroadcast({
                      ...newBroadcast,
                      message: e.target.value,
                    })
                  }
                  placeholder="Notification message..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Target Audience
                </label>
                <select
                  value={newBroadcast?.audience ?? "all"}
                  onChange={(e) =>
                    newBroadcast &&
                    setNewBroadcast({
                      ...newBroadcast,
                      audience: e.target.value as "all" | "vendors" | "users",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="vendors">Vendors Only</option>
                  <option value="users">Regular Users Only</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewBroadcast(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBroadcast}
                disabled={
                  !newBroadcast?.title.trim() || !newBroadcast?.message.trim()
                }
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send Broadcast
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
