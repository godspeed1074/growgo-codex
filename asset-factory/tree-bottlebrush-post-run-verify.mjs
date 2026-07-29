import path from "node:path";
import { verifyTreeBottlebrushOutputs } from "./tree-bottlebrush-production-run.mjs";

function parseArguments(argv) {
  const options = {
    cwd: process.cwd()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--cwd") {
      options.cwd = path.resolve(argv[index + 1] ?? process.cwd());
      index += 1;
      continue;
    }
    throw new Error(`Unsupported argument: ${value}`);
  }

  return options;
}

const options = parseArguments(process.argv.slice(2));
const verification = verifyTreeBottlebrushOutputs(undefined, {
  cwd: options.cwd
});

console.log(JSON.stringify(verification, null, 2));
process.exitCode = verification.registrationGate.ready ? 0 : 1;
