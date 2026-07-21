import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/firestoreEmulatorHost.js"
    )
  );
}

test("parseSafeFirestoreEmulatorHost accepts only loopback host and valid port formats", async () => {
  const module = await loadModule();

  assert.deepEqual(
    module.parseSafeFirestoreEmulatorHost("localhost:8088"),
    {
      host: "localhost",
      port: 8088,
      normalizedHostPort: "localhost:8088"
    }
  );
  assert.deepEqual(
    module.parseSafeFirestoreEmulatorHost("127.0.0.1:8088"),
    {
      host: "127.0.0.1",
      port: 8088,
      normalizedHostPort: "127.0.0.1:8088"
    }
  );
  assert.deepEqual(
    module.parseSafeFirestoreEmulatorHost("[::1]:8088"),
    {
      host: "::1",
      port: 8088,
      normalizedHostPort: "[::1]:8088"
    }
  );
});

test("parseSafeFirestoreEmulatorHost rejects malformed, remote, and unsafe values", async () => {
  const module = await loadModule();

  for (const value of [
    undefined,
    null,
    "",
    " localhost:8088",
    "localhost:8088 ",
    "http://localhost:8088",
    "https://localhost:8088",
    "localhost",
    "localhost:0",
    "localhost:65536",
    "localhost:abc",
    "localhost:8088/path",
    "localhost:8088?x=1",
    "user@localhost:8088",
    "192.168.1.10:8088",
    "example.com:8088",
    "::1:8088",
    "127.0.0.1 :8088",
    "127.0.0.1:8088/extra"
  ]) {
    assert.equal(module.parseSafeFirestoreEmulatorHost(value), null);
  }
});
