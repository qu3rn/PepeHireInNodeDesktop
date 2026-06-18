import { useState } from "react";
import { OffersPage } from "./routes/OffersPage";
import { JobSearchPage } from "./routes/JobSearchPage";
import { ApplyQueuePage } from "./routes/ApplyQueuePage";
import { RapidApplyPage } from "./routes/RapidApplyPage";

type Page = "offers" | "search" | "queue" | "rapid";

export function App() {
  const [page, setPage] = useState<Page>("offers");

  return (
    <div className="app">
      <h1>Pepe Hire Desktop</h1>
      <nav>
        <button onClick={() => setPage("offers")}>Offers</button>
        <button onClick={() => setPage("search")}>Job Search</button>
        <button onClick={() => setPage("queue")}>Queue</button>
        <button onClick={() => setPage("rapid")}>Rapid Apply</button>
      </nav>

      {page === "offers" && <OffersPage />}
      {page === "search" && <JobSearchPage />}
      {page === "queue" && <ApplyQueuePage />}
      {page === "rapid" && <RapidApplyPage />}
    </div>
  );
}
