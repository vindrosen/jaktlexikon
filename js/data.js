// Laddar appens JSON-data. All data är statisk i version 1 och hämtas en gång
// vid start – därefter delas den via app-tillståndet.

export async function loadData() {
  const [animals, jakttider, lan] = await Promise.all([
    fetchJson("data/animals.json"),
    fetchJson("data/jakttider.json"),
    fetchJson("data/lan.json"),
  ]);

  const byId = new Map(animals.map((a) => [a.id, a]));
  const lanByKod = new Map(lan.map((l) => [l.kod, l.namn]));

  return { animals, jakttider, lan, byId, lanByKod };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kunde inte läsa ${url} (${res.status})`);
  return res.json();
}

// Enkel HTML-escape för strängar som renderas med innerHTML.
export function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
