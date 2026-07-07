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
import { registerDebugIpc } from "./ipc/debug.ipc";
import { BrowserService } from "./collectors/browser.service";
import { CollectorService } from "./collectors/collector.service";
import { PracujCollector } from "./collectors/portals/pracuj.collector";
import { AppLogger } from "./logging/logger";
import { RapidApplyService } from "./rapid-apply/rapid-apply.service";
import { PracujRapidApplyAdapter } from "./rapid-apply/portals/pracuj.apply";
import { JustJoinItRapidApplyAdapter } from "./rapid-apply/portals/justjoinit.apply";

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

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl)
  {
    void win.loadURL(rendererUrl);
  } else
  {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return win;
}

async function bootstrap(): Promise<void>
{
  const dbPath = resolveDbPath(app);
  const dataDir = path.dirname(dbPath);
  const dbContext = initSqlite(dbPath);
  const repositories = createLocalRepositories(dbContext);
  const logger = new AppLogger(dataDir);

  const offerService = new OfferService(repositories.offers);
  const queueService = new QueueService(repositories.offers, repositories.queue);
  const browserService = new BrowserService();
  const collectorService = new CollectorService(repositories.offers, repositories.searchRuns, browserService, [new PracujCollector()]);
  const rapidApplyService = new RapidApplyService(
    repositories.offers,
    repositories.applicationAttempts,
    logger,
    [new PracujRapidApplyAdapter(browserService), new JustJoinItRapidApplyAdapter()]
  );

  registerOffersIpc(offerService);
  registerQueueIpc(queueService);
  registerCollectionIpc(repositories.collectedUrls);
  registerCollectorIpc(collectorService);
  registerRapidApplyIpc(rapidApplyService);
  registerDebugIpc({
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    dbPath,
    dataDir,
    logger,
    collectorService,
    rapidApplyService,
    repositories
  });

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
