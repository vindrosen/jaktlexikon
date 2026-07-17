#!/usr/bin/env node
// Bildgenerator för Sveriges Jaktlexikon.
//
// Skriptet läser alla arter ur data/animals.json, räknar ut vilka bilder varje
// art ska ha (se RULES nedan), kontrollerar vilka som saknas på disk och
// skriver ut färdiga prompter för dem. Bilderna genereras via projektets
// OpenAI-MCP (bildgen) med filnamnet som anges – befintliga bilder rörs aldrig.
//
// Lägen:
//   node tools/generate-images.mjs            Sammanfattning + prompter för saknade bilder
//   node tools/generate-images.mjs --status   Endast sammanfattning
//   node tools/generate-images.mjs --json     Saknade bilder som JSON (filnamn + prompt)
//   node tools/generate-images.mjs --sync     Skriver in sökvägar till befintliga bilder i animals.json
//
// Arbetsflöde för nya bilder:
//   1. node tools/generate-images.mjs          → ger filnamn + prompt per saknad bild
//   2. Generera via bildgen-MCP:n (background: transparent, quality: high)
//      och flytta filerna från assets/generated/ till images/
//   3. powershell -File tools/make-thumbs.ps1  → miniatyrer för nya bilder
//   4. node tools/generate-images.mjs --sync   → skriver in sökvägarna i databasen
//
// Skriptet kan köras hur många gånger som helst – redan genererade bilder
// påverkas aldrig.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { IMAGE_TYPES, imagePath } from "../js/imageTypes.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DB = join(root, "data", "animals.json");
const animals = JSON.parse(readFileSync(DB, "utf8"));

// --- Regler: vilka bildtyper varje art ska ha ------------------------------

// Arter med horn/gevir får en hornbild. Härleds ur databasens horn-fält så att
// nya hjortdjur automatiskt kommer med.
const hasAntlers = (a) => Boolean(a.horn);

// Arter där hane och hona skiljer sig så tydligt att båda behöver egna bilder.
const DIMORPHIC = new Set([
  "tjader",
  "orre",
  "fasan",
  "grasand",
  "kricka",
  "blasand",
  "knipa",
  "storskrake",
]);

export function expectedTypes(animal) {
  const types = ["main", "head", "young", "tracks", "droppings"];
  if (hasAntlers(animal)) types.push("antlers");
  if (DIMORPHIC.has(animal.id)) types.push("male", "female");
  // Behåll den ordning som UI:t visar bilderna i.
  return IMAGE_TYPES.map((t) => t.key).filter((k) => types.includes(k));
}

// --- Prompter --------------------------------------------------------------

// Engelska namn används i prompterna. Arter som saknas här faller tillbaka på
// det vetenskapliga namnet.
const ENGLISH_NAMES = {
  alg: "moose",
  radjur: "European roe deer",
  kronhjort: "red deer",
  dovhjort: "fallow deer",
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
  tjader: "western capercaillie",
  orre: "black grouse",
  jarpe: "hazel grouse",
  dalripa: "willow ptarmigan",
  fjallripa: "rock ptarmigan",
  fasan: "common pheasant",
  rapphona: "grey partridge",
  ringduva: "common wood pigeon",
  grasand: "mallard",
  kricka: "Eurasian teal",
  blasand: "Eurasian wigeon",
  knipa: "common goldeneye",
  storskrake: "common merganser",
  kanadagas: "Canada goose",
  gragas: "greylag goose",
  morkulla: "Eurasian woodcock",
  kraka: "hooded crow",
  skata: "Eurasian magpie",
  kaja: "western jackdaw",
  notskrika: "Eurasian jay",
};

// Gemensam stilsvans – ger alla bilder samma uttryck, ljus och kameravinkel.
const STYLE =
  "Transparent background. Soft natural lighting from the upper left. No scenery, no ground, no background elements. " +
  "No shadows outside the subject. No text. No logo. No watermark. No frame. " +
  "Modern wildlife field guide illustration, as if drawn by the same illustrator as the rest of the series. " +
  "Consistent style across all species. High resolution.";

// Ungdjurets svenska benämning skiljer sig mellan arter – styr promptens motiv.
const YOUNG_TERM = {
  alg: "calf",
  radjur: "fawn",
  kronhjort: "calf",
  dovhjort: "fawn",
  vildsvin: "striped piglet",
  bjorn: "cub",
  varg: "pup",
  lodjur: "kitten",
  rodrav: "cub",
  baver: "kit",
  falthare: "leveret",
  skogshare: "leveret",
  vildkanin: "kitten",
};

const isBird = (a) =>
  ["Skogsfågel", "Fältvilt", "Sjöfågel & vadare", "Kråkfåglar"].includes(a.kategori);

function bodyFor(animal, type) {
  const name = ENGLISH_NAMES[animal.id]
    ? `${ENGLISH_NAMES[animal.id]} (${animal.latinNamn})`
    : animal.latinNamn;
  const coat = isBird(animal) ? "plumage" : "fur";
  const young = YOUNG_TERM[animal.id] ?? (isBird(animal) ? "chick" : "juvenile");
  const feet = isBird(animal) ? "foot" : "paw or hoof";

  switch (type) {
    case "main":
      return (
        `Create a highly detailed realistic digital illustration of a ${name}. ` +
        `Show the entire animal standing naturally in side three-quarter view with accurate proportions, ` +
        `natural colors and realistic fur, feathers or antlers.`
      );
    case "head":
      return (
        `Create a highly detailed realistic digital illustration of the head and upper neck of a ${name}. ` +
        `Close-up portrait in three-quarter view with the gaze towards the viewer, accurate markings and realistic ${coat}.`
      );
    case "male":
      return (
        `Create a highly detailed realistic digital illustration of an adult male ${name}. ` +
        `Show the entire animal standing naturally in side three-quarter view with accurate proportions, ` +
        `natural colors and realistic ${coat} showing the typical male characteristics.`
      );
    case "female":
      return (
        `Create a highly detailed realistic digital illustration of an adult female ${name}. ` +
        `Show the entire animal standing naturally in side three-quarter view with accurate proportions, ` +
        `natural colors and realistic ${coat} showing the typical female characteristics.`
      );
    case "young":
      return (
        `Create a highly detailed realistic digital illustration of a young ${name} (${young}). ` +
        `Show the entire young animal standing naturally in side three-quarter view with accurate juvenile proportions ` +
        `and natural colors.`
      );
    case "antlers":
      return (
        `Create a highly detailed realistic digital illustration of a pair of shed antlers from a ${name}. ` +
        `Show both antlers from the front with accurate species-typical shape, tines and bone texture, natural colors.`
      );
    case "tracks":
      return (
        `Create a highly detailed realistic digital illustration of the ${feet} prints of a ${name}, seen straight from above. ` +
        `Show two clear species-typical prints pressed into soft mud with accurate shape, size relation and toe placement.`
      );
    case "droppings":
      return (
        `Create a highly detailed realistic digital illustration of the droppings of a ${name}. ` +
        `Show a small realistic pile with species-typical shape, size and texture, seen slightly from above, natural colors.`
      );
    default:
      throw new Error(`Okänd bildtyp: ${type}`);
  }
}

export function promptFor(animal, type) {
  return `${bodyFor(animal, type)} ${STYLE}`;
}

// --- Lägesval --------------------------------------------------------------

const missing = [];
const present = [];

for (const animal of animals) {
  for (const type of expectedTypes(animal)) {
    const rel = imagePath(animal.id, type);
    const entry = { id: animal.id, namn: animal.namn, type, file: rel };
    if (existsSync(join(root, rel))) present.push(entry);
    else missing.push({ ...entry, prompt: promptFor(animal, type) });
  }
}

const args = process.argv.slice(2);

if (args.includes("--sync")) {
  // Skriv in sökvägar till de bilder som faktiskt finns på disk.
  let changed = 0;
  for (const animal of animals) {
    const images = {};
    for (const type of IMAGE_TYPES.map((t) => t.key)) {
      const rel = imagePath(animal.id, type);
      if (existsSync(join(root, rel))) images[type] = rel;
    }
    if (JSON.stringify(animal.images ?? {}) !== JSON.stringify(images)) changed++;
    animal.images = images;
  }
  writeFileSync(DB, JSON.stringify(animals, null, 2) + "\n", "utf8");
  const total = animals.reduce((n, a) => n + Object.keys(a.images).length, 0);
  console.log(`Synkade ${total} bilder till databasen (${changed} arter uppdaterade).`);
} else if (args.includes("--json")) {
  console.log(JSON.stringify(missing, null, 2));
} else {
  const expected = present.length + missing.length;
  console.log(`Arter:            ${animals.length}`);
  console.log(`Förväntade bilder: ${expected}`);
  console.log(`Finns:             ${present.length}`);
  console.log(`Saknas:            ${missing.length}\n`);

  const perType = {};
  for (const m of missing) perType[m.type] = (perType[m.type] ?? 0) + 1;
  if (missing.length) {
    console.log("Saknas per bildtyp: " +
      Object.entries(perType).map(([t, n]) => `${t}=${n}`).join(", ") + "\n");
  }

  if (!args.includes("--status")) {
    for (const m of missing) {
      console.log(`--- ${m.file}  (${m.namn}, ${m.type}) ---`);
      console.log(m.prompt + "\n");
    }
  }
}
