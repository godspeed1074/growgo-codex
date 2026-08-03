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
    last50FunctionNames: [],
    last50Calls: [],
    activeCallStack: [],
    repeatedCallChain: [],
    recursionDetected: false,
    overflowPrevented: false,
    reasonCode: "TRACE_IDLE",
    totalEntryCount: 0,
    totalExitCount: 0
  };
}

function cloneArrayTail(values, limit = 50) {
  return values.slice(Math.max(0, values.length - limit));
}

function createTraceEvent({ phase, functionName, depth, repeatCount }) {
  return deepFreeze({
    phase,
    functionName,
    depth,
    repeatCount
  });
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
    const nextLast50 = cloneArrayTail([...state.last50FunctionNames, normalizedFunctionName]);
    const nextDepth = nextStack.length;
    const repeatCount =
      nextStack.filter((entry) => entry === normalizedFunctionName).length;
    const repeatedCallChain = nextStack.filter(
      (entry, index) => entry === normalizedFunctionName && index < nextStack.length - 1
    );
    const nextLast50Calls = cloneArrayTail([
      ...state.last50Calls,
      createTraceEvent({
        phase: "entry",
        functionName: normalizedFunctionName,
        depth: nextDepth,
        repeatCount
      })
    ]);

    state = {
      ...state,
      currentDepth: nextDepth,
      maxObservedDepth: Math.max(state.maxObservedDepth, nextDepth),
      last50FunctionNames: nextLast50,
      last50Calls: nextLast50Calls,
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
    const remainingRepeatCount = nextStack.filter(
      (entry) => entry === normalizedFunctionName
    ).length;
    const nextLast50Calls = cloneArrayTail([
      ...state.last50Calls,
      createTraceEvent({
        phase: "exit",
        functionName: normalizedFunctionName,
        depth: nextStack.length,
        repeatCount: remainingRepeatCount
      })
    ]);

    state = {
      ...state,
      activeCallStack: nextStack,
      last50Calls: nextLast50Calls,
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
      last50FunctionNames: [...state.last50FunctionNames],
      last50Calls: [...state.last50Calls],
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
    enter,
    exit,
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

  globalObject.__GROWGO_ATLAS_ONE_FRAME_TRACE__ = {
    enter: trace.enter,
    exit: trace.exit,
    getTraceSnapshot: trace.getTraceSnapshot
  };

  namespace.getAtlasCustom25DOneFrameExecutionTrace = () =>
    trace.getTraceSnapshot();

  return namespace;
}
