import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealthCheck, useInitSampleData } from "@/hooks/useApi";
import { Loader2, CheckCircle, XCircle, Database } from "lucide-react";

export function BackendTest() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useHealthCheck();
  const initSampleDataMutation = useInitSampleData();
  
  const handleInitSampleData = async () => {
    try {
      await initSampleDataMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to initialize sample data:", error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backend Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Check Status */}
        <div className="flex items-center justify-between">
          <span>Backend Status:</span>
          {healthLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : healthError ? (
            <div className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Online</span>
            </div>
          )}
        </div>

        {/* Database Status */}
        {healthData && (
          <div className="flex items-center justify-between">
            <span>Database:</span>
            {healthData.database.status === "success" ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Error</span>
              </div>
            )}
          </div>
        )}

        {/* Initialize Sample Data Button */}
        <Button 
          onClick={handleInitSampleData}
          disabled={initSampleDataMutation.isPending || !!healthError}
          className="w-full"
        >
          {initSampleDataMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Initialize Sample Data
        </Button>

        {/* Error Display */}
        {healthError && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            Error: {healthError.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}