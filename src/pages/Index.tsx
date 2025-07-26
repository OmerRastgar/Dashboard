import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackendTest } from "@/components/BackendTest";
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Shield, 
  Search, 
  FileText,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-dashboard-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Dashboard System</h1>
            </div>
            <Link to="/dashboard">
              <Button className="bg-gradient-primary hover:bg-gradient-hover">
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Professional Dashboard
            <span className="block text-primary">Analytics Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Comprehensive system for managing users, roles, and tracking all activities with detailed 
            analytics and audit logging capabilities.
          </p>
          
          {/* Backend Test Component */}
          <div className="flex justify-center mb-8">
            <BackendTest />
          </div>
          
          <Link to="/dashboard">
            <Button size="lg" className="bg-gradient-primary hover:bg-gradient-hover text-lg px-8 py-3">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">Dashboard Features</h3>
            <p className="text-muted-foreground text-lg">Everything you need to manage and monitor your system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Analytics & Metrics</CardTitle>
                <CardDescription>
                  Comprehensive dashboards with real-time metrics, report tracking, and performance analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Complete user lifecycle management with activation, deactivation, and detailed user profiles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Role & Permissions</CardTitle>
                <CardDescription>
                  Flexible role-based access control with customizable permissions and group management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Powerful search capabilities to find users and analyze individual performance metrics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Audit Logging</CardTitle>
                <CardDescription>
                  Complete audit trail of all system activities with detailed logging and compliance tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>
                  Live system monitoring with instant notifications and performance tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1,247</div>
              <div className="text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">156</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">91.2%</div>
              <div className="text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-muted-foreground">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-dashboard-header py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Professional Dashboard System - Built with modern technologies for optimal performance
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
