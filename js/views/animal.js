// Djursidan: bildgalleri, expanderbara faktasektioner samt jakttider och regler.
//
// Sektionerna är datadrivna (se SECTIONS nedan) – en sektion visas bara om
// artens fält innehåller något. Nya fält läggs till i data/animals.json och
// i SECTIONS, utan att resten av vyn behöver ändras.

import { esc } from "../data.js";
import { isFavorite, getSelectedLan } from "../favorites.js";
import { renderGallery } from "../gallery.js";
import { IMAGE_TYPE_MAP } from "../imageTypes.js";
import {
  periodsForLan,
  formatRange,
  describePeriodArea,
  monthOpen,
  MONTH_LETTERS,
} from "../season.js";

// type: "text" (sträng), "list" (array) eller "rows" (etikett/fält-par).
// image: valfri bildtyp som visas inne i sektionen om arten har den.
const SECTIONS = [
  { label: "Om arten", emoji: "🌲", type: "text", field: "beskrivning", open: true },
  {
    label: "Snabbfakta",
    emoji: "📋",
    type: "rows",
    open: true,
    rows: [
      ["Familj", "familj"],
      ["Habitat", "habitat"],
      ["Föda", "foda"],
      ["Aktiv tid", "aktivitet"],
    ],
  },
  { label: "Kännetecken", emoji: "👀", type: "list", field: "kannetecken", image: "head" },
  {
    label: "Fortplantning",
    emoji: "🍼",
    type: "rows",
    rows: [
      ["Brunsttid", "brunsttid"],
      ["Fortplantning", "fortplantning"],
    ],
    image: "young",
  },
  { label: "Spår", emoji: "🐾", type: "text", field: "spar", image: "tracks" },
  { label: "Spillning", emoji: "💩", type: "text", field: "spillning", image: "droppings" },
  { label: "Horn och gevir", emoji: "🦌", type: "text", field: "horn", image: "antlers" },
  { label: "Utbredning i Sverige", emoji: "🗺️", type: "text", field: "utbredning" },
  { label: "Naturliga fiender", emoji: "⚔️", type: "text", field: "fiender" },
  { label: "Intressanta fakta", emoji: "💡", type: "list", field: "fakta" },
];

function sectionBody(animal, section) {
  switch (section.type) {
    case "text":
      return `<p class="section-text">${esc(animal[section.field])}</p>`;
    case "list":
      return `<ul class="bullet-list">${animal[section.field]
        .map((v) => `<li>${esc(v)}</li>`)
        .join("")}</ul>`;
    case "rows":
      return `<dl class="info-list">${section.rows
        .filter(([, field]) => animal[field])
        .map(([label, field]) => `<div><dt>${esc(label)}</dt><dd>${esc(animal[field])}</dd></div>`)
        .join("")}</dl>`;
    default:
      return "";
  }
}

function hasContent(animal, section) {
  if (section.type === "rows") return section.rows.some(([, field]) => animal[field]);
  const value = animal[section.field];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function renderSection(animal, section) {
  if (!hasContent(animal, section)) return "";

  const imgKey = section.image;
  const imgSrc = imgKey && animal.images?.[imgKey];
  const image = imgSrc
    ? `<button class="section-img" data-open-image="${imgKey}"
         aria-label="Visa ${esc(IMAGE_TYPE_MAP[imgKey].label.toLowerCase())} i större format">
         <img src="${imgSrc}" alt="${esc(animal.namn)} – ${esc(IMAGE_TYPE_MAP[imgKey].label)}" loading="lazy" />
       </button>`
    : "";

  return `
    <details class="section-card" ${section.open ? "open" : ""}>
      <summary><span class="section-emoji" aria-hidden="true">${section.emoji}</span>${esc(
        section.label
      )}</summary>
      <div class="section-body ${image ? "has-img" : ""}">
        <div class="section-main">${sectionBody(animal, section)}</div>
        ${image}
      </div>
    </details>`;
}

function seasonCalendar(art, lanKod) {
  return MONTH_LETTERS.map((letter, i) => {
    const open = art ? monthOpen(art, lanKod, i) : false;
    return `<div class="month ${open ? "open" : ""}"><div class="bar"></div>${letter}</div>`;
  }).join("");
}

function seasonSection(animal, state) {
  const art = state.data.jakttider.arter[animal.id];
  const lanKod = getSelectedLan();
  const { lanByKod, lan } = state.data;

  if (!art || !art.perioder?.length) {
    return `<div class="content-card">
      <h2>📅 Jakttider</h2>
      <p>Arten saknar allmän jakttid.</p>
    </div>`;
  }

  const rows = art.perioder
    .map(
      (p) => `
      <div class="period-row">
        <span class="where">${esc(describePeriodArea(p, lanByKod))}</span>
        <span class="dates">${formatRange(p)}</span>
      </div>`
    )
    .join("");

  const lanOptions = lan
    .map(
      (l) =>
        `<option value="${l.kod}" ${l.kod === lanKod ? "selected" : ""}>${esc(l.namn)}</option>`
    )
    .join("");

  const inLan = periodsForLan(art, lanKod).length > 0;

  return `
    <div class="content-card">
      <h2>📅 Jakttider ${art.licensjakt ? '<span class="badge">Licensjakt</span>' : ""}</h2>
      ${rows}
      ${art.not ? `<div class="notice">ℹ️ <span>${esc(art.not)}</span></div>` : ""}
    </div>

    <div class="content-card">
      <h2>🗓️ Jaktsäsongskalender</h2>
      <div class="filters" style="margin-bottom:0.4rem">
        <div>
          <label for="animal-lan">Län</label>
          <select id="animal-lan">${lanOptions}</select>
        </div>
      </div>
      ${
        inLan
          ? `<div class="month-strip">${seasonCalendar(art, lanKod)}</div>
             <div class="legend">
               <span><span class="dot ok"></span>Tillåtet (hela eller del av månaden)</span>
               <span><span class="dot stop"></span>Fredat</span>
             </div>`
          : `<p>Ingen allmän jakttid för ${esc(animal.namn.toLowerCase())} i ${esc(
              lanByKod.get(lanKod) ?? lanKod
            )}.</p>`
      }
    </div>

    <div class="notice subtle">
      ⚠️ <span>${esc(state.data.jakttider.disclaimer)}</span>
    </div>`;
}

export function renderAnimal(root, state, id) {
  const animal = state.data.byId.get(id);
  if (!animal) {
    root.innerHTML = `
      <div class="empty-state" style="margin-top:2rem">
        <span class="emoji">🧭</span>
        Arten hittades inte. <a href="#/">Till startsidan</a>
      </div>`;
    return;
  }

  const fav = isFavorite(animal.id);

  root.innerHTML = `
    <section class="animal-hero">
      <div class="animal-hero-top">
        <a class="back-link" href="#/">← Tillbaka</a>
        <span class="spacer"></span>
        <button class="fav-btn large ${fav ? "is-fav" : ""}" data-fav="${animal.id}"
          aria-label="${fav ? "Ta bort favorit" : "Lägg till favorit"}">❤️</button>
      </div>
      ${renderGallery(animal)}
      <h1>${esc(animal.namn)}</h1>
      <p class="latin">${esc(animal.latinNamn)}</p>
      <span class="badge category">${esc(animal.kategori)}</span>
    </section>

    <div class="stat-row">
      <div class="stat"><span class="label">⚖️ Vikt</span><span class="value">${esc(animal.vikt)}</span></div>
      <div class="stat"><span class="label">📏 Längd</span><span class="value">${esc(animal.langd)}</span></div>
      <div class="stat"><span class="label">⏳ Livslängd</span><span class="value">${esc(animal.livslangd)}</span></div>
    </div>

    ${SECTIONS.map((s) => renderSection(animal, s)).join("")}

    <div id="season-section">${seasonSection(animal, state)}</div>`;
}

// Anropas via delegerad change-lyssnare i app.js när länet byts.
export function refreshSeasonSection(root, state, id) {
  const animal = state.data.byId.get(id);
  const section = root.querySelector("#season-section");
  if (animal && section) section.innerHTML = seasonSection(animal, state);
}
