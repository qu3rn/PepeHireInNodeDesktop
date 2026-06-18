import path from "node:path";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { initSqlite } from "../src/main/db/sqlite";
import { createLocalRepositories } from "../src/main/adapters/local-repositories";

describe("sqlite repositories", () => {
  it("supports offer CRUD and queue build", async () => {
    const dbPath = path.resolve(process.cwd(), "data", `test-${Date.now()}.db`);
    const context = initSqlite(dbPath);
    const repos = createLocalRepositories(context);

    const offer = await repos.offers.create({
      source: "manual",
      url: "https://example.com/job-1",
      title: "React Frontend",
      technologies: ["React"],
      score: 80,
      decision: "apply",
      reasons: ["React"]
    });

    expect(offer.id).toBeTruthy();

    const list = await repos.offers.list({ page: 1, pageSize: 25 });
    expect(list.total).toBe(1);

    const built = await repos.queue.buildFromOffers(await repos.offers.all());
    expect(built).toBe(1);

    const next = await repos.queue.getNext();
    expect(next?.offerId).toBe(offer.id);

    context.sqlite.close();
    fs.rmSync(dbPath, { force: true });
  });
});
