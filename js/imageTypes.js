// Delad, ren modul (inga webbläsar- eller Node-beroenden) som definierar
// appens bildtyper. Importeras både av UI:t (js/gallery.js) och av
// bildgeneratorn (tools/generate-images.mjs) så att båda alltid är överens
// om ordning, etiketter och filnamnskonvention.
//
// Filnamnskonvention:  huvudbild = images/<id>.png
//                      övriga    = images/<id>-<typ>.png
// Nya bildtyper läggs till här – inga komponenter behöver skrivas om.

export const IMAGE_TYPES = [
  { key: "main", label: "Illustration", emoji: "🖼️" },
  { key: "head", label: "Närbild", emoji: "🔍" },
  { key: "male", label: "Hane", emoji: "♂️" },
  { key: "female", label: "Hona", emoji: "♀️" },
  { key: "young", label: "Ungdjur", emoji: "🐣" },
  { key: "antlers", label: "Horn/Gevir", emoji: "🦌" },
  { key: "tracks", label: "Spår", emoji: "🐾" },
  { key: "droppings", label: "Spillning", emoji: "💩" },
];

export const IMAGE_TYPE_MAP = Object.fromEntries(IMAGE_TYPES.map((t) => [t.key, t]));

// Relativ sökväg (från projektroten) för en arts bild av en viss typ.
export function imagePath(id, type) {
  return type === "main" ? `images/${id}.png` : `images/${id}-${type}.png`;
}

export function thumbPath(id, type) {
  const file = type === "main" ? `${id}.png` : `${id}-${type}.png`;
  return `images/thumbs/${file}`;
}
