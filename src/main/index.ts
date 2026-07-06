import path from "node:path";
import { app, Menu, globalShortcut, BrowserWindow } from "electron";
import { initSqlite, resolveDbPath } from "./db/sqlite";
import { createLocalRepositories } from "./adapters/local-repositories";
import { OfferService } from "./services/offer.service";
import { QueueService } from "./services/queue.service";
import { registerOffersIpc } from "./ipc/offers.ipc";
import { registerQueueIpc } from "./ipc/queue.ipc";
import { registerCollectionIpc } from "./ipc/collection.ipc";
import { registerRapidApplyIpc } from "./ipc/rapid-apply.ipc";
import { registerCollectorIpc } from "./ipc/collector.ipc";
import { BrowserService } from "./collectors/browser.service";
import { CollectorService } from "./collectors/collector.service";
import { PracujCollector } from "./collectors/portals/pracuj.collector";

function createMainWindow(): BrowserWindow
{
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === "development")
  {
    void win.loadURL("http://localhost:5173");
  } else
  {
    void win.loadFile(path.join(__dirname, "../../index.html"));
  }

  return win;
}

async function bootstrap(): Promise<void>
{
  const dbPath = resolveDbPath(app);
  const dbContext = initSqlite(dbPath);
  const repositories = createLocalRepositories(dbContext);

  const offerService = new OfferService(repositories.offers);
  const queueService = new QueueService(repositories.offers, repositories.queue);
  const browserService = new BrowserService();
  const collectorService = new CollectorService(repositories.offers, repositories.searchRuns, browserService, [new PracujCollector()]);

  registerOffersIpc(offerService);
  registerQueueIpc(queueService);
  registerCollectionIpc(repositories.collectedUrls);
  registerCollectorIpc(collectorService);
  registerRapidApplyIpc();

  createMainWindow();
}

app.whenReady().then(() =>
{
  Menu.setApplicationMenu(null);

  void bootstrap();

  if (!app.isPackaged)
  {
    globalShortcut.register("CommandOrControl+Shift+I", () =>
    {
      const focusedWindow = BrowserWindow.getFocusedWindow() ?? createMainWindow();
      focusedWindow.webContents.toggleDevTools();
    });
  }

  app.on("activate", () =>
  {
    if (BrowserWindow.getAllWindows().length === 0)
    {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () =>
{
  if (process.platform !== "darwin")
  {
    app.quit();
  }
});
