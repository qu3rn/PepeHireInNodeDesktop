import { useState } from "react";
import { Briefcase, Search, ListOrdered, Zap } from "lucide-react";
import { cn } from "./lib/cn";
import { OffersPage } from "./routes/OffersPage";
import { JobSearchPage } from "./routes/JobSearchPage";
import { ApplyQueuePage } from "./routes/ApplyQueuePage";
import { RapidApplyPage } from "./routes/RapidApplyPage";

type Page = "offers" | "search" | "queue" | "rapid";

const NAV_ITEMS = [
  { id: "offers" as Page, label: "Offers", Icon: Briefcase },
  { id: "search" as Page, label: "Job Search", Icon: Search },
  { id: "queue" as Page, label: "Apply Queue", Icon: ListOrdered },
  { id: "rapid" as Page, label: "Rapid Apply", Icon: Zap }
] as const;

export function App() {
  const [page, setPage] = useState<Page>("offers");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-48 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-4">
          <p className="text-sm font-bold text-gray-900">Pepe Hire</p>
          <p className="mt-0.5 text-xs text-gray-400">Desktop — Phase 1</p>
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {page === "offers" && <OffersPage />}
        {page === "search" && <JobSearchPage />}
        {page === "queue" && <ApplyQueuePage />}
        {page === "rapid" && <RapidApplyPage />}
      </main>
    </div>
  );
}

