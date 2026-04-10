import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const rootDir = process.cwd();
const screenshotDir = path.join(rootDir, "docs", "screenshots");
const apiUrl = "http://127.0.0.1:3001/api/overview?personScope=all";
const frontendUrl = "http://127.0.0.1:4173";

const sharedEnv = {
  ...process.env,
  APP_DB_PATH: "./var/readme-screenshots.sqlite",
  ICLOUD_DOCUMENT_ROOT: "./demo/icloud-root",
  PERSON_FOLDER_MAP_JSON: '{"me":"Me","wife":"Wife"}',
  PAPERLESS_MODE: "fake",
  MACOS_BRIDGE_MODE: "fake",
  MACOS_CALENDAR_ID: "household-medical-demo",
};

function startProcess(command, args) {
  return spawn(command, args, {
    cwd: rootDir,
    env: sharedEnv,
    stdio: "inherit",
  });
}

async function waitForReady(url, label) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Poll until the local service is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

async function isReady(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });

  const children = [];
  const apiReady = await isReady(apiUrl);
  const frontendReady = await isReady(frontendUrl);

  if (!apiReady) {
    children.push(startProcess("bun", ["run", "dev:server"]));
  }

  if (!frontendReady) {
    children.push(startProcess("bun", ["run", "dev:web"]));
  }

  const stopChildren = () => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    }
  };

  process.on("exit", stopChildren);
  process.on("SIGINT", () => {
    stopChildren();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    stopChildren();
    process.exit(143);
  });

  try {
    await waitForReady(apiUrl, "API");
    await waitForReady(frontendUrl, "frontend");

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1080 },
      colorScheme: "light",
    });

    const shots = [
      {
        url: "http://127.0.0.1:4173/?personScope=all",
        path: path.join(screenshotDir, "home-dashboard.png"),
      },
      {
        url: "http://127.0.0.1:4173/admin?personScope=wife",
        path: path.join(screenshotDir, "admin-workspace.png"),
      },
      {
        url: "http://127.0.0.1:4173/documents?personScope=all",
        path: path.join(screenshotDir, "documents-import.png"),
      },
    ];

    for (const shot of shots) {
      await page.goto(shot.url, { waitUntil: "networkidle" });
      await page.screenshot({
        path: shot.path,
        fullPage: true,
      });
    }

    await browser.close();
  } finally {
    stopChildren();
  }
}

await main();
