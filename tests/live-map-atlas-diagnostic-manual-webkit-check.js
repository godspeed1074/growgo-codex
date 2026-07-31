"use strict";

const DEFAULT_URL = "http://localhost:8000";
const TEST_URL = process.env.GROWGO_TEST_URL || DEFAULT_URL;
const WEBKIT_LAUNCH_TIMEOUT_MS = Number.parseInt(
  process.env.GROWGO_WEBKIT_LAUNCH_TIMEOUT_MS || "45000",
  10
);
const EFFECTIVE_WEBKIT_LAUNCH_TIMEOUT_MS =
  Number.isFinite(WEBKIT_LAUNCH_TIMEOUT_MS) && WEBKIT_LAUNCH_TIMEOUT_MS > 0
    ? WEBKIT_LAUNCH_TIMEOUT_MS
    : 45000;
const HARNESS_TIMEOUT_MS = EFFECTIVE_WEBKIT_LAUNCH_TIMEOUT_MS + 20000;

function printAndExit(summary, exitCode) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(exitCode);
}

async function main() {
  let playwright;
  let browser;
  let page;
  let currentStage = "load-dependency";

  const timeoutHandle = setTimeout(() => {
    printAndExit(
      {
        ok: false,
        url: TEST_URL,
        stage: currentStage,
        fatalError: `Timed out after ${HARNESS_TIMEOUT_MS}ms`
      },
      1
    );
  }, HARNESS_TIMEOUT_MS);

  try {
    playwright = require("playwright");
  } catch (error) {
    clearTimeout(timeoutHandle);
    printAndExit(
      {
        ok: false,
        url: TEST_URL,
        stage: currentStage,
        dependencyAvailable: false,
        fatalError: error && error.message ? error.message : String(error)
      },
      1
    );
  }

  const consoleErrors = [];
  const pageErrors = [];

  try {
    currentStage = "launch-browser";
    browser = await playwright.webkit.launch({
      headless: true,
      timeout: EFFECTIVE_WEBKIT_LAUNCH_TIMEOUT_MS
    });

    currentStage = "open-page";
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(20000);
    page.setDefaultTimeout(20000);

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error && error.message ? error.message : String(error));
    });

    currentStage = "navigate";
    const response = await page.goto(TEST_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    currentStage = "wait-for-map";
    await page.waitForFunction(
      () => {
        const namespace = window.GrowGoDeveloperDiagnostics;
        return (
          namespace &&
          typeof namespace.getGrowGoMap === "function" &&
          typeof namespace.getAtlasDiagnosticForCurrentMapCentre === "function" &&
          namespace.getGrowGoMap() &&
          typeof namespace.getGrowGoMap().getCenter === "function"
        );
      },
      { timeout: 20000 }
    );

    currentStage = "capture-pre-pan";
    const beforePan = await page.evaluate(() => {
      const namespace = window.GrowGoDeveloperDiagnostics;
      const map = namespace.getGrowGoMap();
      const mapIdentity = {
        hasGetCenter: typeof map.getCenter === "function",
        hasPanTo: typeof map.panTo === "function",
        hasSetView: typeof map.setView === "function"
      };
      const approvedDiagnostic = namespace.getAtlasDiagnosticForCurrentMapCentre();
      return {
        mapIdentity,
        approvedDiagnostic
      };
    });

    currentStage = "manual-pan";
    await page.evaluate(() => {
      const map = window.GrowGoDeveloperDiagnostics.getGrowGoMap();
      map.panTo([-38.13, 144.62], { animate: false });
    });

    await page.waitForTimeout(1000);

    currentStage = "capture-post-pan";
    const afterPan = await page.evaluate(() => {
      const namespace = window.GrowGoDeveloperDiagnostics;
      return {
        unsupportedDiagnostic: namespace.getAtlasDiagnosticForCurrentMapCentre()
      };
    });

    const summary = {
      ok:
        !!response &&
        response.ok() &&
        beforePan.approvedDiagnostic?.diagnosticStatus === "resolved" &&
        afterPan.unsupportedDiagnostic?.diagnosticStatus === "blocked" &&
        afterPan.unsupportedDiagnostic?.reasonCode === "REGION_OUT_OF_SCOPE" &&
        pageErrors.length === 0,
      url: TEST_URL,
      stage: currentStage,
      pageLoaded: !!response && response.ok(),
      status: response ? response.status() : null,
      beforePan,
      afterPan,
      pageErrors,
      consoleErrors
    };

    clearTimeout(timeoutHandle);
    printAndExit(summary, summary.ok ? 0 : 1);
  } catch (error) {
    clearTimeout(timeoutHandle);
    printAndExit(
      {
        ok: false,
        url: TEST_URL,
        stage: currentStage,
        pageErrors,
        consoleErrors,
        fatalError: error && error.message ? error.message : String(error)
      },
      1
    );
  } finally {
    clearTimeout(timeoutHandle);
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

main();
