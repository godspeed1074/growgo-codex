import { execFileSync as defaultExecFileSync } from "node:child_process";

export const blenderRuntimeConfigurationRequiredFields = Object.freeze([
  "executable",
  "versionCompatibility",
  "exportConfiguration"
]);

export const blenderRuntimeConfigurationDefinition = deepFreeze({
  executable: {
    executableName: "blender",
    executablePath: null,
    versionArguments: ["--version"],
    pathSearchAllowed: true
  },
  versionCompatibility: {
    minimumSupportedVersion: "4.0.0",
    maximumTestedVersion: "4.5.99",
    supportedMajorVersions: [4]
  },
  exportConfiguration: {
    format: "glb",
    extension: ".glb",
    binary: true,
    validationProfile: "prototype-glb-export"
  }
});

const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){2}$/;
const blenderVersionOutputPattern = /Blender\s+(\d+\.\d+\.\d+)/i;
const supportedExportFormat = "glb";

export function createBlenderRuntimeConfiguration(
  rawConfiguration = blenderRuntimeConfigurationDefinition
) {
  return normalizeBlenderRuntimeConfiguration(rawConfiguration);
}

export function validateBlenderRuntimeConfiguration(
  rawConfiguration = blenderRuntimeConfigurationDefinition
) {
  try {
    const configuration = normalizeBlenderRuntimeConfiguration(rawConfiguration);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimeConfiguration: Object.freeze({
        configuration,
        compatibility: Object.freeze({
          executableConfigurationValidated: true,
          versionCompatibilityValidated: true,
          glbExportConfigurationValidated: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BlenderRuntimeConfigurationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      runtimeConfiguration: null
    });
  }
}

export function detectBlenderRuntime(
  rawConfiguration = blenderRuntimeConfigurationDefinition,
  options = {}
) {
  try {
    const configuration = normalizeBlenderRuntimeConfiguration(rawConfiguration);
    const execFileSync =
      typeof options.execFileSync === "function"
        ? options.execFileSync
        : defaultExecFileSync;

    const executable = resolveExecutable(configuration.executable);
    const combinedOutput = executeVersionProbe(execFileSync, executable, configuration);
    const version = parseBlenderVersion(combinedOutput);

    validateSupportedVersion(version, configuration.versionCompatibility);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimeDetection: Object.freeze({
        executable,
        version,
        exportConfiguration: configuration.exportConfiguration,
        compatibility: Object.freeze({
          executableAvailable: true,
          versionDetected: true,
          versionSupported: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BlenderRuntimeConfigurationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      runtimeDetection: null
    });
  }
}

function resolveExecutable(executableConfiguration) {
  if (executableConfiguration.executablePath !== null) {
    return executableConfiguration.executablePath;
  }

  if (!executableConfiguration.pathSearchAllowed) {
    throw createValidationError(
      "blender_executable_unavailable",
      "Blender executable path search is disabled and no explicit executable path is configured."
    );
  }

  return executableConfiguration.executableName;
}

function executeVersionProbe(execFileSync, executable, configuration) {
  try {
    const stdout = execFileSync(
      executable,
      configuration.executable.versionArguments,
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    return normalizeVersionOutput(stdout);
  } catch (error) {
    const stdout = normalizeVersionOutput(error?.stdout);
    const stderr = normalizeVersionOutput(error?.stderr);

    if (error?.code === "ENOENT") {
      throw createValidationError(
        "blender_executable_unavailable",
        `Blender executable ${executable} is not available in the current environment.`
      );
    }

    const combinedOutput = [stdout, stderr].filter(Boolean).join("\n").trim();
    if (!combinedOutput) {
      throw createValidationError(
        "blender_executable_unavailable",
        `Blender executable ${executable} could not be executed successfully.`
      );
    }

    return combinedOutput;
  }
}

function parseBlenderVersion(output) {
  const match = output.match(blenderVersionOutputPattern);
  if (!match) {
    throw createValidationError(
      "blender_version_detection_failed",
      "Blender version could not be detected from the executable output."
    );
  }

  return normalizeVersion(match[1], "detected Blender version");
}

function validateSupportedVersion(version, versionCompatibility) {
  const minimumSupported = versionCompatibility.minimumSupportedVersion;
  const maximumTested = versionCompatibility.maximumTestedVersion;
  const majorVersion = parseVersion(version).major;

  if (!versionCompatibility.supportedMajorVersions.includes(majorVersion)) {
    throw createValidationError(
      "unsupported_blender_version",
      `Blender version ${version} is not within the approved major-version compatibility range.`
    );
  }

  if (compareVersions(version, minimumSupported) < 0) {
    throw createValidationError(
      "unsupported_blender_version",
      `Blender version ${version} is older than the minimum supported version ${minimumSupported}.`
    );
  }

  if (compareVersions(version, maximumTested) > 0) {
    throw createValidationError(
      "unsupported_blender_version",
      `Blender version ${version} is newer than the maximum tested version ${maximumTested}.`
    );
  }
}

function normalizeBlenderRuntimeConfiguration(rawConfiguration) {
  const configuration = asPlainObject(
    rawConfiguration,
    "Blender runtime configuration"
  );
  assertRequiredFields(configuration);

  return deepFreeze({
    executable: normalizeExecutableConfiguration(configuration.executable),
    versionCompatibility: normalizeVersionCompatibility(
      configuration.versionCompatibility
    ),
    exportConfiguration: normalizeExportConfiguration(
      configuration.exportConfiguration
    )
  });
}

function normalizeExecutableConfiguration(rawExecutable) {
  const executable = asPlainObject(rawExecutable, "executable");
  const executableName = normalizeNonEmptyString(
    executable.executableName,
    "executable.executableName"
  );
  const executablePath =
    executable.executablePath === null
      ? null
      : normalizeNonEmptyString(
          executable.executablePath,
          "executable.executablePath"
        );
  const versionArguments = normalizeStringArray(
    executable.versionArguments,
    "executable.versionArguments"
  );
  const pathSearchAllowed = normalizeBoolean(
    executable.pathSearchAllowed,
    "executable.pathSearchAllowed"
  );

  return deepFreeze({
    executableName,
    executablePath,
    versionArguments,
    pathSearchAllowed
  });
}

function normalizeVersionCompatibility(rawVersionCompatibility) {
  const versionCompatibility = asPlainObject(
    rawVersionCompatibility,
    "versionCompatibility"
  );
  const minimumSupportedVersion = normalizeVersion(
    versionCompatibility.minimumSupportedVersion,
    "versionCompatibility.minimumSupportedVersion"
  );
  const maximumTestedVersion = normalizeVersion(
    versionCompatibility.maximumTestedVersion,
    "versionCompatibility.maximumTestedVersion"
  );
  const supportedMajorVersions = normalizeSupportedMajorVersions(
    versionCompatibility.supportedMajorVersions
  );

  if (compareVersions(minimumSupportedVersion, maximumTestedVersion) > 0) {
    throw createValidationError(
      "invalid_version_range",
      "Minimum supported Blender version cannot be newer than the maximum tested version."
    );
  }

  return deepFreeze({
    minimumSupportedVersion,
    maximumTestedVersion,
    supportedMajorVersions
  });
}

function normalizeExportConfiguration(rawExportConfiguration) {
  const exportConfiguration = asPlainObject(
    rawExportConfiguration,
    "exportConfiguration"
  );
  const format = normalizeLowercaseToken(
    exportConfiguration.format,
    "exportConfiguration.format"
  );
  const extension = normalizeNonEmptyString(
    exportConfiguration.extension,
    "exportConfiguration.extension"
  );
  const binary = normalizeBoolean(
    exportConfiguration.binary,
    "exportConfiguration.binary"
  );
  const validationProfile = normalizeNonEmptyString(
    exportConfiguration.validationProfile,
    "exportConfiguration.validationProfile"
  );

  if (format !== supportedExportFormat) {
    throw createValidationError(
      "unsupported_export_format",
      `Blender runtime configuration supports only ${supportedExportFormat} export format.`
    );
  }

  if (extension !== ".glb") {
    throw createValidationError(
      "unsupported_export_format",
      "Blender runtime configuration must preserve the .glb export extension."
    );
  }

  if (!binary) {
    throw createValidationError(
      "unsupported_export_format",
      "Blender runtime configuration requires binary GLB export."
    );
  }

  return deepFreeze({
    format,
    extension,
    binary,
    validationProfile
  });
}

function normalizeSupportedMajorVersions(rawMajorVersions) {
  if (!Array.isArray(rawMajorVersions) || rawMajorVersions.length === 0) {
    throw createValidationError(
      "invalid_supported_major_versions",
      "versionCompatibility.supportedMajorVersions must be a non-empty array."
    );
  }

  return deepFreeze(
    rawMajorVersions.map((value, index) => {
      if (!Number.isInteger(value) || value < 1) {
        throw createValidationError(
          "invalid_supported_major_versions",
          `versionCompatibility.supportedMajorVersions[${index}] must be a positive integer.`
        );
      }

      return value;
    })
  );
}

function normalizeVersion(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!versionPattern.test(value)) {
    throw createValidationError(
      "invalid_version",
      `Field ${fieldName} must use semantic version format x.y.z.`
    );
  }

  return value;
}

function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);

  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

function parseVersion(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return Object.freeze({ major, minor, patch });
}

function normalizeVersionOutput(output) {
  return typeof output === "string" ? output.trim() : "";
}

function normalizeLowercaseToken(rawValue, fieldName) {
  return normalizeNonEmptyString(rawValue, fieldName).toLowerCase();
}

function normalizeStringArray(rawValue, fieldName) {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `Field ${fieldName} must be a non-empty array of strings.`
    );
  }

  return deepFreeze(
    rawValue.map((value, index) =>
      normalizeNonEmptyString(value, `${fieldName}[${index}]`)
    )
  );
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

function assertRequiredFields(configuration) {
  for (const fieldName of blenderRuntimeConfigurationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(configuration, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Blender runtime configuration is missing required field ${fieldName}.`
      );
    }
  }
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be provided as a plain object.`
    );
  }

  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BlenderRuntimeConfigurationValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
