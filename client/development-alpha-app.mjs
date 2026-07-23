import { createDevelopmentAlphaController } from "./development-alpha-controller.mjs";
import { createDevelopmentAlphaFirebaseRuntime } from "./development-alpha-runtime.mjs";

const CLIENT_CONFIG_GLOBAL = "__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__";

const panel = buildPanel();
const elements = bindPanelElements(panel);

const controller = createDevelopmentAlphaController({
  readConfig() {
    return globalThis[CLIENT_CONFIG_GLOBAL] ?? null;
  },
  async createRuntime(runtimeContract) {
    return createDevelopmentAlphaFirebaseRuntime(runtimeContract);
  },
  render(state) {
    renderPanel(elements, state);
  },
  toClientSafeError(error) {
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "The development backend is unavailable right now.";
  },
  isUnauthorizedError(error) {
    return (
      error?.code === "permission-denied" ||
      error?.code === "functions/permission-denied"
    );
  },
  createRequestId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
});

elements.signInButton.addEventListener("click", () => {
  controller.signIn().catch(() => {});
});
elements.signOutButton.addEventListener("click", () => {
  controller.signOut().catch(() => {});
});
elements.refreshButton.addEventListener("click", () => {
  controller.refreshSnapshot().catch(() => {});
});

controller.ensureInitialized().catch(() => {});

function buildPanel() {
  const panel = document.createElement("section");
  panel.id = "developmentAlphaStatusPanel";
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.bottom = "12px";
  panel.style.zIndex = "5000";
  panel.style.width = "min(320px, calc(100vw - 24px))";
  panel.style.background = "rgba(7, 20, 33, 0.92)";
  panel.style.color = "#f4f8ff";
  panel.style.border = "1px solid rgba(148, 178, 220, 0.35)";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  panel.style.padding = "12px";
  panel.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;">
      <div>
        <div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.72;">Development backend</div>
        <strong style="font-size:15px;">Private alpha status</strong>
      </div>
      <div id="developmentAlphaStatusBadge" style="font-size:11px;padding:4px 6px;border-radius:999px;background:#243447;">Blocked</div>
    </div>
    <div id="developmentAlphaSummary" style="font-size:13px;line-height:1.4;margin-bottom:8px;"></div>
    <div id="developmentAlphaSnapshot" style="font-size:12px;line-height:1.5;opacity:0.9;margin-bottom:10px;"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="developmentAlphaSignInButton" type="button" style="${buttonStyle("#5f7cff")}">Sign in</button>
      <button id="developmentAlphaRefreshButton" type="button" style="${buttonStyle("#1f7a5c")}">Refresh</button>
      <button id="developmentAlphaSignOutButton" type="button" style="${buttonStyle("#5c6470")}">Sign out</button>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function bindPanelElements(panel) {
  return {
    badge: panel.querySelector("#developmentAlphaStatusBadge"),
    summary: panel.querySelector("#developmentAlphaSummary"),
    snapshot: panel.querySelector("#developmentAlphaSnapshot"),
    signInButton: panel.querySelector("#developmentAlphaSignInButton"),
    refreshButton: panel.querySelector("#developmentAlphaRefreshButton"),
    signOutButton: panel.querySelector("#developmentAlphaSignOutButton")
  };
}

function renderPanel(elements, state) {
  elements.badge.textContent = summarizeBadge(state);
  elements.summary.innerHTML = [
    line("Environment", state.environment),
    line("Connection", state.connectionMode ?? "blocked"),
    line("Auth", state.authStatus),
    line("Invite", state.invitedStatus)
  ].join("");

  if (state.playerSnapshot) {
    elements.snapshot.innerHTML = [
      line("UID", state.user?.uid ?? "n/a"),
      line("Email", state.user?.email ?? "n/a"),
      line("Level", String(state.playerSnapshot.level)),
      line("XP", String(state.playerSnapshot.xp)),
      line("Coins", String(state.playerSnapshot.coins))
    ].join("");
  } else if (state.genericError) {
    elements.snapshot.textContent = state.genericError;
  } else if (state.blockedReasons.length > 0) {
    elements.snapshot.textContent = `Blocked: ${state.blockedReasons.join(", ")}`;
  } else {
    elements.snapshot.textContent =
      "No backend snapshot loaded. Sign in to the invited development alpha.";
  }

  elements.signInButton.disabled =
    state.initializationStatus !== "initialized" ||
    state.authStatus === "signed-in" ||
    state.authStatus === "signing-in";
  elements.signOutButton.disabled = state.authStatus !== "signed-in";
  elements.refreshButton.disabled =
    state.authStatus !== "signed-in" ||
    state.snapshotStatus === "loading" ||
    state.bootstrapStatus === "pending";
}

function summarizeBadge(state) {
  if (state.authStatus === "signed-in" && state.playerSnapshot) {
    return "Connected";
  }

  if (state.authStatus === "unauthorized") {
    return "Denied";
  }

  if (state.initializationStatus === "initialized") {
    return "Ready";
  }

  if (state.initializationStatus === "initializing") {
    return "Starting";
  }

  return "Blocked";
}

function line(label, value) {
  return `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;
}

function buttonStyle(background) {
  return [
    "appearance:none",
    "border:none",
    "border-radius:6px",
    "padding:8px 10px",
    "font:inherit",
    "font-size:12px",
    "font-weight:600",
    "cursor:pointer",
    "color:#fff",
    `background:${background}`
  ].join(";");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
