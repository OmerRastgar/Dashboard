import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  Eye,
  User,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Users,
  Award,
  Target,
  Loader2
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  useSearchAllUsers,
  useUserProfile,
  useUserReports,
  useUserActivity,
  type UserProfile,
  type UserProfileDetailed,
  type ReportItem
} from "@/hooks/useApi";

export default function Arch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    department: "",
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // API hooks
  const { data: users = [], isLoading: usersLoading } = useSearchAllUsers(searchQuery, filters);
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(selectedUser || 0);
  const { data: userReports, isLoading: reportsLoading } = useUserReports(selectedUser || 0);
  const { data: userActivity, isLoading: activityLoading } = useUserActivity(selectedUser || 0);

  const handleViewProfile = (userId: number) => {
    setSelectedUser(userId);
    setProfileDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'issues': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Arch</h1>
          <p className="text-muted-foreground">Advanced user search and profile management</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, username, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="hover:bg-muted">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user_manager">User Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.department} onValueChange={(value) => setFilters({...filters, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usersLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-muted-foreground">Searching users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/api/users/${user.id}/avatar`} />
                    <AvatarFallback>
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground truncate">{user.full_name}</h3>
                      <Badge variant={user.is_active ? "default" : "secondary"} className="ml-2">
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    
                    {user.department && (
                      <div className="flex items-center mt-2">
                        <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{user.department}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.roles.slice(0, 2).map((role) => (
                        <Badge key={role.id} variant="outline" className="text-xs">
                          {role.display_name}
                        </Badge>
                      ))}
                      {user.roles.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.roles.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Report Summary */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Reports</span>
                        <span className="font-medium">{user.report_summary.total}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          <span>{user.report_summary.completed}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-blue-500" />
                          <span>{user.report_summary.in_progress}</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                          <span>{user.report_summary.issues}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => handleViewProfile(user.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed user information and activity
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading profile...</span>
            </div>
          ) : userProfile ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={userProfile.profile_picture} />
                        <AvatarFallback className="text-lg">
                          {userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium text-foreground">{userProfile.full_name}</h3>
                            <p className="text-sm text-muted-foreground">@{userProfile.username}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge variant={userProfile.is_active ? "default" : "secondary"}>
                              {userProfile.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{userProfile.email}</span>
                          </div>
                          {userProfile.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{userProfile.phone}</span>
                            </div>
                          )}
                          {userProfile.department && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{userProfile.department}</span>
                            </div>
                          )}
                          {userProfile.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{userProfile.location}</span>
                            </div>
                          )}
                        </div>

                        {userProfile.bio && (
                          <div>
                            <h4 className="font-medium mb-2">Bio</h4>
                            <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Roles</h4>
                          <div className="flex flex-wrap gap-2">
                            {userProfile.roles.map((role) => (
                              <Badge key={role.id} variant="outline">
                                {role.display_name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {userProfile.skills && userProfile.skills.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {userProfile.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold">{userProfile.report_summary.completed}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold">{userProfile.report_summary.in_progress}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold">{userProfile.report_summary.issues}</p>
                          <p className="text-xs text-muted-foreground">Issues</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                          <p className="text-2xl font-bold">{userProfile.report_summary.total}</p>
                          <p className="text-xs text-muted-foreground">Total Reports</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading reports...</span>
                  </div>
                ) : userReports ? (
                  <div className="space-y-6">
                    {/* Reports Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Reports Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{userReports.statistics.completed_count}</p>
                            <p className="text-sm text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{userReports.statistics.in_progress_count}</p>
                            <p className="text-sm text-muted-foreground">In Progress</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{userReports.statistics.issues_count}</p>
                            <p className="text-sm text-muted-foreground">Issues</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{userReports.statistics.completion_rate}%</p>
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Reports */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Reports</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...userReports.completed_reports, ...userReports.in_progress_reports, ...userReports.issues_reports]
                            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                            .slice(0, 10)
                            .map((report) => (
                              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{report.title}</h4>
                                    <Badge className={getStatusColor(report.status)}>
                                      {report.status.replace('_', ' ')}
                                    </Badge>
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(report.priority)}`} />
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{report.type}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                    <span>Updated: {formatDate(report.updated_at)}</span>
                                    {report.due_date && (
                                      <span>Due: {formatDate(report.due_date)}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{report.progress_percentage}%</div>
                                  <Progress value={report.progress_percentage} className="w-20 mt-1" />
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading activity...</span>
                  </div>
                ) : userActivity ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Activity className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.activity_type}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {userProfile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span>{userProfile.performance_metrics.completion_rate}%</span>
                          </div>
                          <Progress value={userProfile.performance_metrics.completion_rate} className="mt-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Efficiency Score</span>
                            <span>{userProfile.performance_metrics.efficiency_score}%</span>
                          </div>
                          <Progress value={userProfile.performance_metrics.efficiency_score} className="mt-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Average Rating</span>
                            <span>{userProfile.performance_metrics.average_rating}/5</span>
                          </div>
                          <Progress value={(userProfile.performance_metrics.average_rating / 5) * 100} className="mt-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Key Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Hours</span>
                          <span className="font-medium">{userProfile.performance_metrics.total_hours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Member Since</span>
                          <span className="font-medium">{formatDate(userProfile.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Login</span>
                          <span className="font-medium">
                            {userProfile.last_login ? formatDateTime(userProfile.last_login) : 'Never'}
                          </span>
                        </div>
                        {userProfile.manager && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Manager</span>
                            <span className="font-medium">{userProfile.manager}</span>
                          </div>
                        )}
                        {userProfile.team && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Team</span>
                            <span className="font-medium">{userProfile.team}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}