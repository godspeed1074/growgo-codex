function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}

function createInitialState(maxDepth) {
  return {
    maxDepth,
    currentDepth: 0,
    maxObservedDepth: 0,
    last30FunctionNames: [],
    activeCallStack: [],
    repeatedCallChain: [],
    recursionDetected: false,
    overflowPrevented: false,
    reasonCode: "TRACE_IDLE",
    totalEntryCount: 0,
    totalExitCount: 0
  };
}

function cloneArrayTail(values, limit = 30) {
  return values.slice(Math.max(0, values.length - limit));
}

export function createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
  maxDepth = 24
} = {}) {
  let state = createInitialState(maxDepth);

  function reset(reasonCode = "TRACE_RESET") {
    state = {
      ...createInitialState(maxDepth),
      reasonCode
    };
    return getTraceSnapshot();
  }

  function enter(functionName) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const nextStack = [...state.activeCallStack, normalizedFunctionName];
    const nextLast30 = cloneArrayTail([...state.last30FunctionNames, normalizedFunctionName]);
    const nextDepth = nextStack.length;
    const repeatedCallChain = nextStack.filter(
      (entry, index) => entry === normalizedFunctionName && index < nextStack.length - 1
    );

    state = {
      ...state,
      currentDepth: nextDepth,
      maxObservedDepth: Math.max(state.maxObservedDepth, nextDepth),
      last30FunctionNames: nextLast30,
      activeCallStack: nextStack,
      totalEntryCount: state.totalEntryCount + 1,
      repeatedCallChain:
        repeatedCallChain.length > 0
          ? cloneArrayTail([...repeatedCallChain, normalizedFunctionName])
          : state.repeatedCallChain,
      recursionDetected:
        state.recursionDetected || repeatedCallChain.length > 0,
      reasonCode:
        repeatedCallChain.length > 0 ? "TRACE_RECURSION_DETECTED" : state.reasonCode
    };

    if (nextDepth > maxDepth) {
      state = {
        ...state,
        overflowPrevented: true,
        reasonCode: "TRACE_MAX_DEPTH_EXCEEDED"
      };
      throw Object.assign(new Error("TRACE_MAX_DEPTH_EXCEEDED"), {
        reasonCode: "TRACE_MAX_DEPTH_EXCEEDED",
        traceSnapshot: getTraceSnapshot()
      });
    }
  }

  function exit(functionName) {
    const normalizedFunctionName =
      typeof functionName === "string" && functionName.trim()
        ? functionName.trim()
        : "anonymous";
    const nextStack = [...state.activeCallStack];
    const top = nextStack.pop() ?? null;

    state = {
      ...state,
      activeCallStack: nextStack,
      currentDepth: nextStack.length,
      totalExitCount: state.totalExitCount + 1,
      reasonCode:
        state.reasonCode === "TRACE_IDLE" && top === normalizedFunctionName
          ? "TRACE_ACTIVE"
          : state.reasonCode
    };
  }

  function wrap(functionName, fn) {
    return (...args) => {
      enter(functionName);
      try {
        return fn(...args);
      } finally {
        exit(functionName);
      }
    };
  }

  function wrapAsync(functionName, fn) {
    return async (...args) => {
      enter(functionName);
      try {
        return await fn(...args);
      } finally {
        exit(functionName);
      }
    };
  }

  function getTraceSnapshot() {
    return deepFreeze({
      schemaId: "ATLAS_CUSTOM25D_ONE_FRAME_EXECUTION_TRACE_001",
      maxDepth: state.maxDepth,
      currentDepth: state.currentDepth,
      maxObservedDepth: state.maxObservedDepth,
      last30FunctionNames: [...state.last30FunctionNames],
      activeCallStack: [...state.activeCallStack],
      repeatedCallChain: [...state.repeatedCallChain],
      recursionDetected: state.recursionDetected,
      overflowPrevented: state.overflowPrevented,
      reasonCode: state.reasonCode,
      totalEntryCount: state.totalEntryCount,
      totalExitCount: state.totalExitCount
    });
  }

  return deepFreeze({
    reset,
    wrap,
    wrapAsync,
    getTraceSnapshot
  });
}

export function installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
  globalObject = globalThis,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  trace
} = {}) {
  if (!globalObject || !trace || typeof trace.getTraceSnapshot !== "function") {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.getAtlasCustom25DOneFrameExecutionTrace = () =>
    trace.getTraceSnapshot();

  return namespace;
}
