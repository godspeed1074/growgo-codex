import path from "node:path";
import { writeTreeBottlebrushV002Promotion } from "./tree-bottlebrush-v002-promotion.mjs";

let cwd = process.cwd();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--cwd") {
    cwd = path.resolve(process.argv[index + 1] ?? cwd);
    index += 1;
  } else {
    throw new Error(`Unsupported argument: ${process.argv[index]}`);
  }
}

console.log(JSON.stringify(writeTreeBottlebrushV002Promotion({ cwd }), null, 2));
