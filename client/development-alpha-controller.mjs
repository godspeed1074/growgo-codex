import {
  buildDevelopmentAlphaRuntimeContract
} from "./development-alpha-contract.mjs";

export function createDevelopmentAlphaController(dependencies) {
  const deps = validateDependencies(dependencies);
  let initPromise = null;
  let runtime = null;
  let authUnsubscribe = null;
  let lastBootstrapUid = null;
  let snapshotInFlight = false;
  let snapshotRequestCount = 0;
  let state = buildInitialState();

  function publish(partialState) {
    state = Object.freeze({
      ...state,
      ...partialState
    });
    deps.render(state);
    return state;
  }

  async function ensureInitialized() {
    if (initPromise) {
      return initPromise;
    }

    publish({
      initializationStatus: "initializing",
      genericError: null
    });

    initPromise = (async () => {
      const config = deps.readConfig();
      const runtimeContract = buildDevelopmentAlphaRuntimeContract(config);

      publish({
        environment: runtimeContract.environment,
        connectionMode: runtimeContract.connectionMode,
        initializationAllowed: runtimeContract.initializationAllowed,
        blockedReasons: runtimeContract.blockedReasons,
        missingFirebaseFields: runtimeContract.missingFirebaseFields
      });

      if (!runtimeContract.initializationAllowed) {
        publish({
          initializationStatus: "blocked",
          authStatus:
            runtimeContract.blockedReasons.includes("emergency-disabled")
              ? "emergency-disabled"
              : "error",
          genericError: "Development backend client configuration is unavailable."
        });
        return null;
      }

      runtime = await deps.createRuntime(runtimeContract);
      authUnsubscribe = runtime.onAuthStateChanged(handleAuthStateChanged);

      publish({
        initializationStatus: "initialized",
        authStatus: "signed-out",
        genericError: null
      });

      return runtime;
    })().catch((error) => {
      publish({
        initializationStatus: "error",
        authStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
      throw error;
    });

    return initPromise;
  }

  async function signIn() {
    const activeRuntime = await ensureInitialized();
    if (!activeRuntime) {
      return state;
    }

    publish({
      authStatus: "signing-in",
      genericError: null
    });

    try {
      await activeRuntime.signIn();
    } catch (error) {
      publish({
        authStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }

    return state;
  }

  async function signOut() {
    if (!runtime) {
      publish({
        authStatus: "signed-out",
        playerSnapshot: null,
        invitedStatus: "unknown",
        bootstrapStatus: "idle",
        snapshotStatus: "idle"
      });
      return state;
    }

    await runtime.signOut();
    lastBootstrapUid = null;
    snapshotInFlight = false;
    snapshotRequestCount = 0;
    publish({
      authStatus: "signed-out",
      playerSnapshot: null,
      invitedStatus: "unknown",
      bootstrapStatus: "idle",
      snapshotStatus: "idle"
    });

    return state;
  }

  async function refreshSnapshot() {
    if (!runtime || !state.user) {
      return state;
    }

    if (snapshotInFlight || snapshotRequestCount >= 2) {
      return state;
    }

    snapshotInFlight = true;
    snapshotRequestCount += 1;
    publish({
      snapshotStatus: "loading",
      genericError: null
    });

    try {
      const snapshot = await runtime.getPlayerSnapshot();
      publish({
        snapshotStatus: "ready",
        playerSnapshot: snapshot,
        genericError: null
      });
    } catch (error) {
      if (deps.isUnauthorizedError(error)) {
        publish({
          authStatus: "unauthorized",
          invitedStatus: "server-denied",
          snapshotStatus: "error",
          genericError: deps.toClientSafeError(error)
        });
      } else {
        publish({
          snapshotStatus: "error",
          genericError: deps.toClientSafeError(error)
        });
      }
    } finally {
      snapshotInFlight = false;
    }

    return state;
  }

  async function handleAuthStateChanged(user) {
    if (!user) {
      lastBootstrapUid = null;
      snapshotInFlight = false;
      snapshotRequestCount = 0;
      publish({
        user: null,
        authStatus: "signed-out",
        invitedStatus: "unknown",
        bootstrapStatus: "idle",
        snapshotStatus: "idle",
        playerSnapshot: null
      });
      return;
    }

    publish({
      user: sanitizeUser(user),
      authStatus: "signed-in",
      invitedStatus: evaluateClientInviteMirror(user, deps.readConfig()),
      bootstrapStatus: "pending",
      snapshotStatus: "idle",
      genericError: null
    });

    if (lastBootstrapUid === user.uid) {
      return refreshSnapshot();
    }

    try {
      lastBootstrapUid = user.uid;
      await runtime.bootstrapPlayer({
        requestId: deps.createRequestId("bootstrap")
      });
      publish({
        bootstrapStatus: "complete"
      });
      await refreshSnapshot();
    } catch (error) {
      if (deps.isUnauthorizedError(error)) {
        publish({
          authStatus: "unauthorized",
          invitedStatus: "server-denied",
          bootstrapStatus: "denied",
          snapshotStatus: "idle",
          genericError: deps.toClientSafeError(error)
        });
        return;
      }

      publish({
        bootstrapStatus: "error",
        genericError: deps.toClientSafeError(error)
      });
    }
  }

  function dispose() {
    if (typeof authUnsubscribe === "function") {
      authUnsubscribe();
    }
    authUnsubscribe = null;
  }

  return Object.freeze({
    ensureInitialized,
    signIn,
    signOut,
    refreshSnapshot,
    getState() {
      return state;
    },
    dispose
  });
}

function buildInitialState() {
  return Object.freeze({
    environment: "unknown",
    connectionMode: null,
    initializationAllowed: false,
    initializationStatus: "idle",
    authStatus: "signed-out",
    invitedStatus: "unknown",
    bootstrapStatus: "idle",
    snapshotStatus: "idle",
    blockedReasons: Object.freeze([]),
    missingFirebaseFields: Object.freeze([]),
    genericError: null,
    user: null,
    playerSnapshot: null
  });
}

function validateDependencies(dependencies) {
  const requiredFunctions = [
    "readConfig",
    "createRuntime",
    "render",
    "toClientSafeError",
    "isUnauthorizedError",
    "createRequestId"
  ];

  for (const key of requiredFunctions) {
    if (typeof dependencies?.[key] !== "function") {
      throw new Error(`Missing controller dependency: ${key}`);
    }
  }

  return dependencies;
}

function sanitizeUser(user) {
  return Object.freeze({
    uid: user.uid,
    email: typeof user.email === "string" ? user.email : null,
    emailVerified: user.emailVerified === true,
    providerId: Array.isArray(user.providerData)
      ? user.providerData.find((entry) => typeof entry?.providerId === "string")
          ?.providerId ?? null
      : null
  });
}

function evaluateClientInviteMirror(user, rawConfig) {
  const inviteMirror = rawConfig?.inviteMirror;
  if (!inviteMirror || typeof inviteMirror !== "object") {
    return "unknown";
  }

  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) {
    return "client-denied";
  }

  const allowedEmails = Array.isArray(inviteMirror.allowedEmails)
    ? inviteMirror.allowedEmails
        .filter((value) => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
    : [];
  const requiredProvider =
    typeof inviteMirror.requiredProvider === "string"
      ? inviteMirror.requiredProvider
      : null;

  if (requiredProvider && !user.providerData?.some((entry) => entry?.providerId === requiredProvider)) {
    return "client-denied";
  }

  if (allowedEmails.length === 0) {
    return "unknown";
  }

  return allowedEmails.includes(email) ? "client-allowed" : "client-denied";
}
