import path from "node:path";
import { writeBuildingCivicSportsPavilionRegistrationRecord } from "./building-civic-sports-pavilion-registration.mjs";

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
const result = writeBuildingCivicSportsPavilionRegistrationRecord(undefined, options);
console.log(JSON.stringify(result, null, 2));
