import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "../components/ui";
import { Bug } from "lucide-react";

export function DebugPage() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-[var(--text)]">Debug</h2>
      <Card>
        <CardHeader>
          <CardTitle>Collector Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Bug className="h-8 w-8" />}
            title="Debug tools coming later"
            description="Phase 1 keeps this as a skeleton only."
          />
        </CardContent>
      </Card>
    </div>
  );
}
