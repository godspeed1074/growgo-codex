export interface SafeFirestoreEmulatorHost {
  host: "localhost" | "127.0.0.1" | "::1";
  port: number;
  normalizedHostPort: string;
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function parseSafeFirestoreEmulatorHost(
  value: unknown
): SafeFirestoreEmulatorHost | null {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    return null;
  }

  if (
    /\s/.test(value) ||
    value.includes("://") ||
    value.includes("/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("@")
  ) {
    return null;
  }

  const ipv6Match = /^\[(::1)\]:(\d+)$/.exec(value);
  if (ipv6Match) {
    const port = parsePort(ipv6Match[2]);
    if (port === null) {
      return null;
    }

    return {
      host: "::1",
      port,
      normalizedHostPort: `[::1]:${port}`
    };
  }

  const hostPortMatch = /^([^:]+):(\d+)$/.exec(value);
  if (!hostPortMatch) {
    return null;
  }

  const [, host, rawPort] = hostPortMatch;
  if (!LOOPBACK_HOSTNAMES.has(host)) {
    return null;
  }

  const port = parsePort(rawPort);
  if (port === null) {
    return null;
  }

  return {
    host: host as "localhost" | "127.0.0.1",
    port,
    normalizedHostPort: `${host}:${port}`
  };
}

function parsePort(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return port;
}
