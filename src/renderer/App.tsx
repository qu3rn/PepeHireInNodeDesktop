import { useState } from "react";
import { BarChart3, Briefcase, Bug, Calculator, ListOrdered, Settings, Search, Users, Zap } from "lucide-react";
import { cn } from "./lib/cn";
import { DashboardPage } from "./routes/DashboardPage";
import { OffersPage } from "./routes/OffersPage";
import { JobSearchPage } from "./routes/JobSearchPage";
import { ApplyQueuePage } from "./routes/ApplyQueuePage";
import { RapidApplyPage } from "./routes/RapidApplyPage";
import { RateCalculatorPage } from "./routes/RateCalculatorPage";
import { ApplicationsPage } from "./routes/ApplicationsPage";
import { DebugPage } from "./routes/DebugPage";
import { SettingsPage } from "./routes/SettingsPage";

type Page = "dashboard" | "offers" | "search" | "queue" | "rapid" | "calculator" | "applications" | "debug" | "settings";

const NAV_ITEMS = [
  { id: "dashboard" as Page, label: "Dashboard", Icon: BarChart3 },
  { id: "offers" as Page, label: "Offers", Icon: Briefcase },
  { id: "search" as Page, label: "Job Search", Icon: Search },
  { id: "queue" as Page, label: "Apply Queue", Icon: ListOrdered },
  { id: "rapid" as Page, label: "Rapid Apply", Icon: Zap },
  { id: "calculator" as Page, label: "Rate Calculator", Icon: Calculator },
  { id: "applications" as Page, label: "Applications", Icon: Users },
  { id: "debug" as Page, label: "Debug", Icon: Bug },
  { id: "settings" as Page, label: "Settings", Icon: Settings }
] as const;

export function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Sidebar */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <p className="text-sm font-bold text-[var(--text)]">Pepe Hire</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Desktop Edition</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                page === id
                  ? "bg-[color:rgba(47,124,255,0.16)] text-[var(--text)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", page === id ? "text-[var(--primary)]" : "text-[var(--text-muted)]")} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        {page === "dashboard" && <DashboardPage />}
        {page === "offers" && <OffersPage />}
        {page === "search" && <JobSearchPage />}
        {page === "queue" && <ApplyQueuePage />}
        {page === "rapid" && <RapidApplyPage />}
        {page === "calculator" && <RateCalculatorPage />}
        {page === "applications" && <ApplicationsPage />}
        {page === "debug" && <DebugPage />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
