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

  it("upserts offers by sourceId and normalized url", async () => {
    const dbPath = path.resolve(process.cwd(), "data", `test-upsert-${Date.now()}.db`);
    const context = initSqlite(dbPath);
    const repos = createLocalRepositories(context);

    const first = await repos.offers.upsert({
      source: "pracuj",
      sourceId: "abc-123",
      url: "https://it.pracuj.pl/oferta/react-dev,abc-123?ref=feed",
      title: "React Dev"
    });

    expect(first.created).toBe(true);

    const second = await repos.offers.upsert({
      source: "pracuj",
      sourceId: "abc-123",
      url: "https://it.pracuj.pl/oferta/react-dev,abc-123",
      title: "React Dev Senior"
    });

    expect(second.created).toBe(false);
    expect(second.offer.id).toBe(first.offer.id);
    expect(second.offer.title).toBe("React Dev Senior");

    const third = await repos.offers.upsert({
      source: "pracuj",
      url: "https://it.pracuj.pl/oferta/ui-engineer,xyz-999?utm_source=test",
      title: "UI Engineer"
    });

    const fourth = await repos.offers.upsert({
      source: "pracuj",
      url: "https://it.pracuj.pl/oferta/ui-engineer,xyz-999",
      title: "UI Engineer Updated"
    });

    expect(third.offer.id).toBe(fourth.offer.id);
    expect(fourth.created).toBe(false);

    const all = await repos.offers.all();
    expect(all.length).toBe(2);

    context.sqlite.close();
    fs.rmSync(dbPath, { force: true });
  });
});
