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
const HARNESS_TIMEOUT_MS = EFFECTIVE_WEBKIT_LAUNCH_TIMEOUT_MS + 15000;

const KNOWN_HELPERS = [
  "createCustom25DVisualManualRendererStateContainerShell",
  "createCustom25DVisualManualRendererInstanceShell",
  "createCustom25DVisualManualRendererLifecycleMethodShell",
  "getCustom25DVisualManualRendererInstanceShellReadinessReport",
  "getCustom25DVisualManualRendererLifecycleMethodShellReadinessReport",
  "getCustom25DVisualManualRendererCallableLifecycleMethodReadinessReport"
];

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
        pageLoaded: false,
        namespaceExists: false,
        dependencyAvailable: true,
        stage: currentStage,
        pageErrors: [],
        consoleErrors: [],
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
        pageLoaded: false,
        namespaceExists: false,
        dependencyAvailable: false,
        pageErrors: [],
        consoleErrors: [],
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
    page.setDefaultNavigationTimeout(15000);
    page.setDefaultTimeout(15000);

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
      timeout: 15000
    });

    currentStage = "settle";
    await page.waitForTimeout(1000);

    currentStage = "evaluate-namespace";
    const namespaceSummary = await page.evaluate((knownHelpers) => {
      const namespace =
        typeof window !== "undefined" ? window.GrowGoCustom25DVisualManualTests : null;
      const namespaceExists = !!namespace && typeof namespace === "object";
      const helperAvailability = {};

      for (const helperName of knownHelpers) {
        helperAvailability[helperName] =
          namespaceExists && typeof namespace[helperName] === "function";
      }

      return {
        namespaceExists,
        namespaceType: namespace === null ? "null" : typeof namespace,
        helperAvailability,
        helperCount: namespaceExists ? Object.keys(namespace).length : 0
      };
    }, KNOWN_HELPERS);

    const summary = {
      ok:
        !!response &&
        response.ok() &&
        namespaceSummary.namespaceExists &&
        pageErrors.length === 0,
      url: TEST_URL,
      stage: currentStage,
      pageLoaded: !!response && response.ok(),
      status: response ? response.status() : null,
      namespaceExists: namespaceSummary.namespaceExists,
      namespaceType: namespaceSummary.namespaceType,
      helperCount: namespaceSummary.helperCount,
      helperAvailability: namespaceSummary.helperAvailability,
      pageErrors,
      consoleErrors
    };

    const exitCode =
      summary.pageLoaded &&
      summary.namespaceExists &&
      pageErrors.length === 0
        ? 0
        : 1;

    clearTimeout(timeoutHandle);
    printAndExit(summary, exitCode);
  } catch (error) {
    clearTimeout(timeoutHandle);
    printAndExit(
      {
        ok: false,
        url: TEST_URL,
        pageLoaded: false,
        namespaceExists: false,
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
