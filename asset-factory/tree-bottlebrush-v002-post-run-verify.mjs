import path from "node:path";
import {
  verifyTreeBottlebrushV002,
  writeTreeBottlebrushV002Verification
} from "./tree-bottlebrush-v002-production-verify.mjs";

let cwd = process.cwd();
let write = false;
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--cwd") {
    cwd = path.resolve(process.argv[index + 1] ?? cwd);
    index += 1;
  } else if (process.argv[index] === "--write") {
    write = true;
  } else {
    throw new Error(`Unsupported argument: ${process.argv[index]}`);
  }
}

const result = write
  ? writeTreeBottlebrushV002Verification({ cwd }).verification
  : verifyTreeBottlebrushV002({ cwd });
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.replacementReadiness.readyToReplaceV001 ? 0 : 1;
