#!/usr/bin/env node
// Läser alla arter ur data/animals.json och listar de som ännu saknar bild i
// images/. För varje saknad art skrivs den färdiga bildprompten ut
// (promptmallen med artens engelska namn insatt). Bilderna genereras sedan via
// projektets bildgen-MCP (OpenAI) med filename "<id>.png", background
// "transparent", quality "high" – och flyttas från assets/generated/ till
// images/. Befintliga bilder genereras aldrig om.
//
// Användning:
//   node tools/generate-images.mjs          # lista saknade arter + prompter
//   node tools/generate-images.mjs --status # endast sammanfattning

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const animals = JSON.parse(readFileSync(join(root, "data", "animals.json"), "utf8"));

// Engelskt namn per art – används i bildprompten. Nya arter utan post här
// faller tillbaka på det vetenskapliga namnet.
const ENGLISH_NAMES = {
  alg: "moose",
  radjur: "European roe deer",
  kronhjort: "red deer stag",
  dovhjort: "fallow deer buck",
  vildsvin: "wild boar",
  rodrav: "red fox",
  gravling: "European badger",
  mard: "European pine marten",
  mink: "American mink",
  iller: "European polecat",
  mardhund: "raccoon dog",
  bjorn: "brown bear",
  lodjur: "Eurasian lynx",
  varg: "grey wolf",
  falthare: "European brown hare",
  skogshare: "mountain hare",
  vildkanin: "European rabbit",
  baver: "Eurasian beaver",
  tjader: "male western capercaillie",
  orre: "male black grouse",
  jarpe: "hazel grouse",
  dalripa: "willow ptarmigan in autumn plumage",
  fjallripa: "rock ptarmigan in winter plumage",
  fasan: "male common pheasant",
  rapphona: "grey partridge",
  ringduva: "common wood pigeon",
  grasand: "mallard drake",
  kricka: "Eurasian teal drake",
  blasand: "Eurasian wigeon drake",
  knipa: "common goldeneye drake",
  storskrake: "common merganser drake",
  kanadagas: "Canada goose",
  gragas: "greylag goose",
  morkulla: "Eurasian woodcock",
  kraka: "hooded crow",
  skata: "Eurasian magpie",
  kaja: "western jackdaw",
  notskrika: "Eurasian jay",
};

const PROMPT_TEMPLATE =
  "Create a highly detailed realistic digital illustration of a [ANIMAL NAME]. " +
  "Show the entire animal standing naturally with accurate proportions, natural colors " +
  "and realistic fur, feathers or antlers. Transparent background. Soft natural lighting. " +
  "No scenery. No shadows outside the animal. No text. No logo. No watermark. " +
  "Modern wildlife field guide illustration. Consistent style across all species. High resolution.";

export function promptFor(animal) {
  const name = ENGLISH_NAMES[animal.id]
    ? `${ENGLISH_NAMES[animal.id]} (${animal.latinNamn})`
    : animal.latinNamn;
  return PROMPT_TEMPLATE.replace("[ANIMAL NAME]", name);
}

const missing = animals.filter((a) => !existsSync(join(root, "images", `${a.id}.png`)));
const done = animals.length - missing.length;

console.log(`Arter i databasen: ${animals.length}`);
console.log(`Har bild:          ${done}`);
console.log(`Saknar bild:       ${missing.length}\n`);

if (!process.argv.includes("--status")) {
  for (const a of missing) {
    console.log(`--- ${a.id}.png (${a.namn}) ---`);
    console.log(promptFor(a) + "\n");
  }
}
