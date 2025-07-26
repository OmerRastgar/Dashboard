import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Search as SearchIcon, 
  User,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar
} from "lucide-react";

const userData = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    avatar: "/api/placeholder/32/32",
    totalReports: 45,
    mistakes: 8,
    accuracy: 82.2,
    avgProcessingTime: "2.5 hours",
    lastActivity: "2 hours ago",
    recentReports: [
      { id: 1, title: "Q3 Financial Report", status: "Completed", mistakes: 2, time: "3.2 hours" },
      { id: 2, title: "Inventory Analysis", status: "In Review", mistakes: 1, time: "1.8 hours" },
      { id: 3, title: "Sales Summary", status: "Completed", mistakes: 0, time: "2.1 hours" },
    ]
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@company.com",
    avatar: "/api/placeholder/32/32",
    totalReports: 62,
    mistakes: 5,
    accuracy: 91.9,
    avgProcessingTime: "1.8 hours",
    lastActivity: "1 day ago",
    recentReports: [
      { id: 4, title: "Marketing Analysis", status: "Completed", mistakes: 0, time: "1.5 hours" },
      { id: 5, title: "Budget Planning", status: "Completed", mistakes: 1, time: "2.2 hours" },
      { id: 6, title: "Team Performance", status: "Completed", mistakes: 0, time: "1.3 hours" },
    ]
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@company.com",
    avatar: "/api/placeholder/32/32",
    totalReports: 38,
    mistakes: 12,
    accuracy: 68.4,
    avgProcessingTime: "4.2 hours",
    lastActivity: "5 hours ago",
    recentReports: [
      { id: 7, title: "Cost Analysis", status: "Returned", mistakes: 4, time: "5.1 hours" },
      { id: 8, title: "Project Update", status: "In Review", mistakes: 2, time: "3.8 hours" },
      { id: 9, title: "Resource Planning", status: "Completed", mistakes: 1, time: "3.5 hours" },
    ]
  },
];

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<typeof userData>([]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = userData.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-accent";
    if (accuracy >= 75) return "text-primary";
    return "text-destructive";
  };

  const getAccuracyBadgeVariant = (accuracy: number) => {
    if (accuracy >= 90) return "default";
    if (accuracy >= 75) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Search</h1>
        <p className="text-muted-foreground">Search for users and view their individual performance metrics</p>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-gradient-primary hover:bg-gradient-hover">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users List */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Search Results</CardTitle>
              <CardDescription>Found {searchResults.length} user(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 rounded-lg border border-border hover:shadow-hover transition-all duration-200 cursor-pointer ${
                      selectedUser === user.id ? "ring-2 ring-primary bg-muted/50" : "hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getAccuracyBadgeVariant(user.accuracy)} className="mb-1">
                          {user.accuracy}% Accuracy
                        </Badge>
                        <div className="text-xs text-muted-foreground">{user.totalReports} reports</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Details */}
          {selectedUser && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">User Details</CardTitle>
                <CardDescription>
                  {searchResults.find(u => u.id === selectedUser)?.name} performance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const user = searchResults.find(u => u.id === selectedUser);
                  if (!user) return null;

                  return (
                    <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Total Reports</span>
                          </div>
                          <div className="text-xl font-bold text-foreground">{user.totalReports}</div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm font-medium">Mistakes</span>
                          </div>
                          <div className="text-xl font-bold text-foreground">{user.mistakes}</div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">Accuracy</span>
                          </div>
                          <div className={`text-xl font-bold ${getAccuracyColor(user.accuracy)}`}>
                            {user.accuracy}%
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Avg Time</span>
                          </div>
                          <div className="text-xl font-bold text-foreground">{user.avgProcessingTime}</div>
                        </div>
                      </div>

                      {/* Accuracy Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground">Accuracy Rate</span>
                          <span className={`text-sm font-medium ${getAccuracyColor(user.accuracy)}`}>
                            {user.accuracy}%
                          </span>
                        </div>
                        <Progress value={user.accuracy} className="h-2" />
                      </div>

                      {/* Recent Reports */}
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Recent Reports</h4>
                        <div className="space-y-3">
                          {user.recentReports.map((report) => (
                            <div key={report.id} className="p-3 rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-foreground">{report.title}</span>
                                <Badge 
                                  variant={
                                    report.status === "Completed" ? "default" : 
                                    report.status === "Returned" ? "destructive" : "secondary"
                                  }
                                >
                                  {report.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Mistakes: {report.mistakes}</span>
                                <span>Time: {report.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Last activity: {user.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {searchResults.length === 0 && !searchTerm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{userData.length}</div>
              <p className="text-xs text-accent">Searchable users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {(userData.reduce((sum, user) => sum + user.accuracy, 0) / userData.length).toFixed(1)}%
              </div>
              <p className="text-xs text-accent">Overall average</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {userData.reduce((sum, user) => sum + user.totalReports, 0)}
              </div>
              <p className="text-xs text-accent">All time</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}