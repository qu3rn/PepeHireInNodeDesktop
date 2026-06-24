import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "../components/ui";
import { Users } from "lucide-react";

export function ApplicationsPage() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-[var(--text)]">Applications</h2>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Applications page skeleton"
            description="Phase 1 keeps application history local and lightweight."
          />
        </CardContent>
      </Card>
    </div>
  );
}
