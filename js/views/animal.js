// Djursidan: fakta om arten samt jakttider, regler och säsongskalender.

import { esc } from "../data.js";
import { isFavorite, getSelectedLan } from "../favorites.js";
import { animalVisual } from "../images.js";
import {
  periodsForLan,
  formatRange,
  describePeriodArea,
  monthOpen,
  MONTH_LETTERS,
} from "../season.js";

function infoRow(label, value) {
  return `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
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
      ${animalVisual(animal, "hero-img", "big-emoji", "full")}
      <h1>${esc(animal.namn)}</h1>
      <p class="latin">${esc(animal.latinNamn)}</p>
      <span class="badge category">${esc(animal.kategori)}</span>
    </section>

    <div class="stat-row">
      <div class="stat"><span class="label">⚖️ Vikt</span><span class="value">${esc(animal.vikt)}</span></div>
      <div class="stat"><span class="label">📏 Längd</span><span class="value">${esc(animal.langd)}</span></div>
      <div class="stat"><span class="label">⏳ Livslängd</span><span class="value">${esc(animal.livslangd)}</span></div>
    </div>

    <div class="content-card">
      <h2>🌲 Om arten</h2>
      <p style="margin:0">${esc(animal.beskrivning)}</p>
    </div>

    <div class="content-card">
      <h2>📋 Snabbfakta</h2>
      <dl class="info-list">
        ${infoRow("Habitat", animal.habitat)}
        ${infoRow("Föda", animal.foda)}
        ${infoRow("Aktiv tid", animal.aktivitet)}
      </dl>
    </div>

    <div class="content-card">
      <h2>👀 Kännetecken</h2>
      <ul class="bullet-list">
        ${animal.kannetecken.map((k) => `<li>${esc(k)}</li>`).join("")}
      </ul>
    </div>

    <div class="content-card">
      <h2>💡 Intressanta fakta</h2>
      <ul class="bullet-list">
        ${animal.fakta.map((f) => `<li>${esc(f)}</li>`).join("")}
      </ul>
    </div>

    <div id="season-section">${seasonSection(animal, state)}</div>`;
}

// Anropas via delegerad change-lyssnare i app.js när länet byts.
export function refreshSeasonSection(root, state, id) {
  const animal = state.data.byId.get(id);
  const section = root.querySelector("#season-section");
  if (animal && section) section.innerHTML = seasonSection(animal, state);
}
