// Startsidan: sök, snabbknappar, favoriter och artkort per kategori.

import { esc } from "../data.js";
import { getFavorites, isFavorite } from "../favorites.js";

const CATEGORY_ORDER = [
  "Klövvilt",
  "Rovdjur",
  "Smådjur",
  "Skogsfågel",
  "Fältvilt",
  "Sjöfågel & vadare",
  "Kråkfåglar",
];

export function animalCard(animal) {
  const fav = isFavorite(animal.id);
  return `
    <div class="animal-card">
      <a class="card-hit" href="#/djur/${animal.id}" aria-label="${esc(animal.namn)}"></a>
      <button class="fav-btn ${fav ? "is-fav" : ""}" data-fav="${animal.id}"
        aria-label="${fav ? "Ta bort favorit" : "Lägg till favorit"}" title="Favorit">❤️</button>
      <span class="emoji" aria-hidden="true">${animal.emoji}</span>
      <h3>${esc(animal.namn)}</h3>
      <p class="latin">${esc(animal.latinNamn)}</p>
      <p class="desc">${esc(animal.beskrivning)}</p>
    </div>`;
}

export function cardGrid(animals) {
  return `<div class="card-grid">${animals.map(animalCard).join("")}</div>`;
}

function matchesQuery(animal, q) {
  return (
    animal.namn.toLowerCase().includes(q) ||
    animal.latinNamn.toLowerCase().includes(q)
  );
}

function renderLists(state) {
  const { animals } = state.data;
  const q = state.searchQuery.trim().toLowerCase();

  if (q) {
    const hits = animals.filter((a) => matchesQuery(a, q));
    return `
      <div class="section-head">
        <h2>Sökresultat</h2>
        <span class="count">${hits.length} träff${hits.length === 1 ? "" : "ar"}</span>
      </div>
      ${
        hits.length
          ? cardGrid(hits)
          : `<div class="empty-state"><span class="emoji">🔍</span>Inga arter matchar &quot;${esc(state.searchQuery)}&quot;.</div>`
      }`;
  }

  const favIds = getFavorites();
  const favs = favIds.map((id) => state.data.byId.get(id)).filter(Boolean);

  let html = "";
  if (favs.length) {
    html += `
      <div class="section-head">
        <h2>❤️ Mina favoriter</h2>
        <span class="count">${favs.length} st</span>
      </div>
      ${cardGrid(favs)}`;
  }

  for (const cat of CATEGORY_ORDER) {
    const list = animals.filter((a) => a.kategori === cat);
    if (!list.length) continue;
    html += `
      <div class="section-head">
        <h2>${esc(cat)}</h2>
        <span class="count">${list.length} arter</span>
      </div>
      ${cardGrid(list)}`;
  }
  return html;
}

export function renderHome(root, state) {
  root.innerHTML = `
    <section class="hero">
      <h1>Sveriges Jaktlexikon</h1>
      <p>All information du behöver – snabbt och enkelt.</p>
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input id="search" type="search" placeholder="Sök djur eller latinskt namn…"
          value="${esc(state.searchQuery)}" autocomplete="off" />
      </div>
      <div class="quick-actions">
        <a class="quick-btn" href="#/jakttider">📅 Jakttider</a>
        <a class="quick-btn ghost" href="#/jakttider?idag=1">🎯 Får jag jaga idag?</a>
      </div>
    </section>
    <div id="home-lists">${renderLists(state)}</div>`;

  const input = root.querySelector("#search");
  input.addEventListener("input", () => {
    state.searchQuery = input.value;
    root.querySelector("#home-lists").innerHTML = renderLists(state);
  });
}

// Används av app.js för att uppdatera listorna (t.ex. efter favorit-ändring)
// utan att röra sökfältet.
export function refreshHomeLists(root, state) {
  const lists = root.querySelector("#home-lists");
  if (lists) lists.innerHTML = renderLists(state);
}
