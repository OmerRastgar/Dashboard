import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  User,
  Activity,
  Database,
  FileText,
  TrendingUp,
  Clock,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useLogs,
  useLogStats,
  useExportLogs,
  type LogEntry,
  type LogStats
} from "@/hooks/useApi";

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    severity: "",
    action: "",
    username: "",
    module: "",
    days: 30,
    status: "",
    skip: 0,
    limit: 100,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [statsTimeRange, setStatsTimeRange] = useState(30);

  const { toast } = useToast();
  const permissions = usePermissions();

  // API hooks - using real data from database
  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useLogs(filters);
  const { data: logStats, isLoading: statsLoading, refetch: refetchStats } = useLogStats(statsTimeRange);
  const exportLogsMutation = useExportLogs();

  // Refresh function
  const handleRefresh = () => {
    refetchLogs();
    refetchStats();
    toast({
      title: "Refreshed",
      description: "Audit log data has been refreshed",
    });
  };

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      action: searchTerm,
      skip: 0
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      skip: 0
    }));
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    if (!permissions.canExportLogs()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export logs",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await exportLogsMutation.mutateAsync({
        format,
        filters: {
          severity: filters.severity || undefined,
          action: filters.action || undefined,
          username: filters.username || undefined,
          module: filters.module || undefined,
          days: filters.days,
          status: filters.status || undefined,
        }
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Audit logs exported as ${format.toUpperCase()} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  // Get severity color and icon
  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: AlertTriangle,
          bgColor: 'bg-red-500'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          icon: AlertCircle,
          bgColor: 'bg-orange-500'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Info,
          bgColor: 'bg-yellow-500'
        };
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: Info,
          bgColor: 'bg-blue-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          icon: Info,
          bgColor: 'bg-gray-500'
        };
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'success':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: CheckCircle
        };
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: XCircle
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          icon: Info
        };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Toggle log expansion
  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // View log details
  const viewLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setLogDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor all system activities and security events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {permissions.canExportLogs() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <Database className="h-4 w-4 mr-2" />
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by action, details, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Select value={filters.severity || "all"} onValueChange={(value) => handleFilterChange('severity', value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.module || "all"} onValueChange={(value) => handleFilterChange('module', value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      <SelectItem value="user_management">User Management</SelectItem>
                      <SelectItem value="role_management">Role Management</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Username"
                    value={filters.username}
                    onChange={(e) => handleFilterChange('username', e.target.value)}
                  />

                  <Select value={filters.days.toString()} onValueChange={(value) => handleFilterChange('days', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                System Activity Logs ({logs.length} entries)
              </CardTitle>
              <CardDescription>
                Real-time monitoring of all system activities and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No logs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const severityInfo = getSeverityInfo(log.severity);
                    const statusInfo = getStatusInfo(log.status);
                    const SeverityIcon = severityInfo.icon;
                    const StatusIcon = statusInfo.icon;
                    const isExpanded = expandedLogs.has(log.id);

                    return (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-1 h-16 rounded-full ${severityInfo.bgColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={severityInfo.color}>
                                  <SeverityIcon className="h-3 w-3 mr-1" />
                                  {log.severity.toUpperCase()}
                                </Badge>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {log.status.toUpperCase()}
                                </Badge>
                                {log.module && (
                                  <Badge variant="outline">
                                    {log.module}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm">
                                <span className="font-medium text-foreground">{log.action}</span>
                                {log.username && (
                                  <div className="flex items-center text-muted-foreground">
                                    <User className="h-3 w-3 mr-1" />
                                    {log.username}
                                  </div>
                                )}
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(log.timestamp)}
                                </div>
                              </div>

                              {log.details && (
                                <p className="text-sm text-muted-foreground mt-2 truncate">
                                  {isExpanded ? log.details : `${log.details.substring(0, 100)}${log.details.length > 100 ? '...' : ''}`}
                                </p>
                              )}

                              {isExpanded && (
                                <div className="mt-4 space-y-2 text-xs">
                                  {log.resource && (
                                    <div className="flex">
                                      <span className="font-medium w-20">Resource:</span>
                                      <span className="text-muted-foreground">{log.resource}</span>
                                    </div>
                                  )}
                                  {log.ip_address && (
                                    <div className="flex">
                                      <span className="font-medium w-20">IP:</span>
                                      <span className="text-muted-foreground">{log.ip_address}</span>
                                    </div>
                                  )}
                                  {log.session_id && (
                                    <div className="flex">
                                      <span className="font-medium w-20">Session:</span>
                                      <span className="text-muted-foreground font-mono">{log.session_id}</span>
                                    </div>
                                  )}
                                  {log.request_id && (
                                    <div className="flex">
                                      <span className="font-medium w-20">Request:</span>
                                      <span className="text-muted-foreground font-mono">{log.request_id}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLogExpansion(log.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewLogDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Time Range Selector */}
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Time Range:</span>
                <Select value={statsTimeRange.toString()} onValueChange={(value) => setStatsTimeRange(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading analytics...</span>
            </div>
          ) : logStats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Activity className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{logStats.total_logs}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{logStats.severity_breakdown.critical}</p>
                        <p className="text-xs text-muted-foreground">Critical Events</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{logStats.status_breakdown.success}</p>
                        <p className="text-xs text-muted-foreground">Successful</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{logStats.unique_users}</p>
                        <p className="text-xs text-muted-foreground">Active Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Severity Breakdown */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Severity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(logStats.severity_breakdown).map(([severity, count]) => {
                      const severityInfo = getSeverityInfo(severity);
                      const percentage = logStats.total_logs > 0 ? (count / logStats.total_logs) * 100 : 0;

                      return (
                        <div key={severity} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{severity}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Actions and Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Top Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {logStats.top_actions.map((item, index) => (
                        <div key={item.action} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm">{item.action}</span>
                          </div>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Most Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {logStats.top_users.map((item, index) => (
                        <div key={item.username} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm">{item.username}</span>
                          </div>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Log Detail Dialog */}
      <Dialog open={logDetailOpen} onOpenChange={setLogDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about this log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Severity:</span>
                  <Badge className={`ml-2 ${getSeverityInfo(selectedLog.severity).color}`}>
                    {selectedLog.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={`ml-2 ${getStatusInfo(selectedLog.status).color}`}>
                    {selectedLog.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div><span className="font-medium">Action:</span> {selectedLog.action}</div>
                <div><span className="font-medium">Timestamp:</span> {formatDate(selectedLog.timestamp)}</div>
                {selectedLog.username && <div><span className="font-medium">User:</span> {selectedLog.username}</div>}
                {selectedLog.resource && <div><span className="font-medium">Resource:</span> {selectedLog.resource}</div>}
                {selectedLog.module && <div><span className="font-medium">Module:</span> {selectedLog.module}</div>}
                {selectedLog.ip_address && <div><span className="font-medium">IP Address:</span> {selectedLog.ip_address}</div>}
              </div>

              {selectedLog.details && (
                <div>
                  <span className="font-medium">Details:</span>
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    {selectedLog.details}
                  </div>
                </div>
              )}

              {(selectedLog.before_data || selectedLog.after_data) && (
                <div className="space-y-4">
                  {selectedLog.before_data && (
                    <div>
                      <span className="font-medium">Before:</span>
                      <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                        {selectedLog.before_data}
                      </pre>
                    </div>
                  )}
                  {selectedLog.after_data && (
                    <div>
                      <span className="font-medium">After:</span>
                      <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                        {selectedLog.after_data}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {(selectedLog.session_id || selectedLog.request_id || selectedLog.user_agent) && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  {selectedLog.session_id && <div><span className="font-medium">Session ID:</span> {selectedLog.session_id}</div>}
                  {selectedLog.request_id && <div><span className="font-medium">Request ID:</span> {selectedLog.request_id}</div>}
                  {selectedLog.user_agent && <div><span className="font-medium">User Agent:</span> {selectedLog.user_agent}</div>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}