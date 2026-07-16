// Jakttidssidan: välj län och datum – se vad som är tillåtet respektive fredat.

import { esc } from "../data.js";
import { getSelectedLan, setSelectedLan } from "../favorites.js";
import { statusForDate, formatRange, toMmDd } from "../season.js";

let selectedDate = null; // behålls bara under sessionen

function getDate() {
  if (!selectedDate) selectedDate = toIsoDate(new Date());
  return selectedDate;
}

function toIsoDate(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function prettyDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function seasonRow(animal, status, allowed) {
  const ranges = (allowed ? status.matched : status.periods)
    .map((p) => formatRange(p))
    .join("<br />");
  const desc = allowed
    ? status.matched.map((p) => p.beskrivning).filter(Boolean).join(" · ")
    : "";
  return `
    <a class="season-card ${allowed ? "ok" : "stop"}" href="#/djur/${animal.id}">
      <span class="emoji" aria-hidden="true">${animal.emoji}</span>
      <span class="name">${esc(animal.namn)}
        ${desc ? `<small>${esc(desc)}</small>` : ""}
        ${!allowed && !status.periods.length ? `<small>Ingen allmän jakttid i länet</small>` : ""}
      </span>
      <span class="range">${ranges || "–"}</span>
    </a>`;
}

function renderResults(state) {
  const lanKod = getSelectedLan();
  const iso = getDate();
  const mmdd = iso.slice(5);
  const { animals, jakttider } = state.data;

  const allowed = [];
  const closed = [];

  for (const animal of animals) {
    const art = jakttider.arter[animal.id];
    const status = statusForDate(art, lanKod, mmdd);
    (status.huntable ? allowed : closed).push({ animal, status, art });
  }

  const bySwedish = (a, b) => a.animal.namn.localeCompare(b.animal.namn, "sv");
  allowed.sort(bySwedish);
  closed.sort(bySwedish);

  const licens = allowed.filter(({ art }) => art?.licensjakt);

  return `
    <p class="view-sub" style="margin-top:0">
      ${esc(state.data.lanByKod.get(lanKod) ?? lanKod)} · ${esc(prettyDate(iso))}
    </p>
    <div class="two-col">
      <div class="result-col">
        <h2>✅ Tillåtet idag <span class="pill ok">${allowed.length}</span></h2>
        ${
          allowed.length
            ? allowed.map(({ animal, status }) => seasonRow(animal, status, true)).join("")
            : `<div class="empty-state">Inga arter får jagas detta datum i valt län.</div>`
        }
        ${
          licens.length
            ? `<div class="notice">⚠️ <span>Arter märkta med licensjakt (${licens
                .map(({ animal }) => esc(animal.namn.toLowerCase()))
                .join(", ")}) kräver särskild tilldelning och kan vara avlysta.</span></div>`
            : ""
        }
      </div>
      <div class="result-col">
        <h2>⛔ Fredat idag <span class="pill stop">${closed.length}</span></h2>
        ${closed.map(({ animal, status }) => seasonRow(animal, status, false)).join("")}
      </div>
    </div>
    <div class="notice subtle">⚠️ <span>${esc(jakttider.disclaimer)}</span></div>`;
}

export function renderJakttider(root, state) {
  const lanKod = getSelectedLan();

  const lanOptions = state.data.lan
    .map(
      (l) =>
        `<option value="${l.kod}" ${l.kod === lanKod ? "selected" : ""}>${esc(l.namn)}</option>`
    )
    .join("");

  root.innerHTML = `
    <h1 class="view-title">📅 Jakttider – Får jag jaga idag?</h1>
    <p class="view-sub">Välj län och datum för att se vilka arter som får jagas. Säsong ${esc(
      state.data.jakttider.sasong
    )}.</p>
    <div class="filters">
      <div>
        <label for="lan-select">Län</label>
        <select id="lan-select">${lanOptions}</select>
      </div>
      <div>
        <label for="date-input">Datum</label>
        <input id="date-input" type="date" value="${getDate()}" />
      </div>
    </div>
    <div id="jakt-results">${renderResults(state)}</div>`;

  root.querySelector("#lan-select").addEventListener("change", (e) => {
    setSelectedLan(e.target.value);
    root.querySelector("#jakt-results").innerHTML = renderResults(state);
  });

  root.querySelector("#date-input").addEventListener("change", (e) => {
    if (e.target.value) selectedDate = e.target.value;
    root.querySelector("#jakt-results").innerHTML = renderResults(state);
  });
}

// "Får jag jaga idag?"-knappen nollställer datumet till idag.
export function resetToToday() {
  selectedDate = toIsoDate(new Date());
}
