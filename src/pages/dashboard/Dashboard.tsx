import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const reportsData = [
  { month: "Jan", issues: 45, returns: 23 },
  { month: "Feb", issues: 52, returns: 28 },
  { month: "Mar", issues: 38, returns: 19 },
  { month: "Apr", issues: 41, returns: 25 },
  { month: "May", issues: 35, returns: 17 },
  { month: "Jun", issues: 42, returns: 22 },
];

const employeeData = [
  { name: "John Doe", reports: 45, accuracy: 92 },
  { name: "Jane Smith", reports: 52, accuracy: 88 },
  { name: "Mike Wilson", reports: 38, accuracy: 95 },
  { name: "Sarah Brown", reports: 41, accuracy: 91 },
  { name: "Tom Davis", reports: 35, accuracy: 87 },
];

const statusData = [
  { name: "Completed", value: 68, color: "hsl(215 70% 50%)" },
  { name: "In Progress", value: 22, color: "hsl(215 65% 55%)" },
  { name: "Issues", value: 10, color: "hsl(0 75% 60%)" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your system metrics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,247</div>
            <p className="text-xs text-accent">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">253</div>
            <p className="text-xs text-destructive">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
            <p className="text-xs text-accent">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">91.2%</div>
            <p className="text-xs text-accent">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Issues Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Reports & Issues</CardTitle>
            <CardDescription>Monthly overview of report issues and returns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }} 
                />
                <Bar dataKey="issues" fill="hsl(215 70% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" fill="hsl(0 75% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Status Distribution */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Report Status</CardTitle>
            <CardDescription>Current status distribution of all reports</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Employee Performance</CardTitle>
          <CardDescription>Individual employee report processing and accuracy metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reports Processed</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Accuracy Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Performance</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((employee, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{employee.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{employee.reports}</td>
                    <td className="py-3 px-4 text-muted-foreground">{employee.accuracy}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-24 bg-muted rounded-full h-2 mr-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${employee.accuracy}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{employee.accuracy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}