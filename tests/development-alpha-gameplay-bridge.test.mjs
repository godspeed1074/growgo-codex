import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../client/development-alpha-app.mjs", import.meta.url), "utf8");
const method = source.slice(
  source.indexOf("  isActive() {"),
  source.indexOf("  async capturePin(payload) {")
);
const isActive = method
  .replace("  isActive() {", "function isActive() {")
  .replace(/},\s*$/, "}");

test("authenticated completed profiles use the secure gameplay bridge in live and emulator modes", () => {
  const state = {
    connectionMode: "emulator",
    authStatus: "signed-in",
    playerSnapshot: { profileComplete: true }
  };
  const context = vm.createContext({ controller: { getState: () => state } });
  vm.runInContext(isActive, context);

  assert.equal(context.isActive(), true);
  state.connectionMode = "live";
  assert.equal(context.isActive(), true);
  state.connectionMode = "unknown";
  assert.equal(context.isActive(), false);
  state.connectionMode = "emulator";
  state.authStatus = "signed-out";
  assert.equal(context.isActive(), false);
});
