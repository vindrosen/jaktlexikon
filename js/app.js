// Appens startpunkt: laddar data, hanterar hash-routing och delade händelser.

import { loadData } from "./data.js";
import { toggleFavorite, setSelectedLan } from "./favorites.js";
import { installGallery } from "./gallery.js";
import { renderHome, refreshHomeLists } from "./views/home.js";
import { renderAnimal, refreshSeasonSection } from "./views/animal.js";
import { renderJakttider, resetToToday } from "./views/jakttider.js";
import { renderFavoriter } from "./views/favoriter.js";

const state = {
  data: null,
  route: { name: "home" },
  searchQuery: "",
};

const root = document.getElementById("app");

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query] = hash.split("?");
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "djur" && parts[1]) return { name: "djur", id: parts[1] };
  if (parts[0] === "jakttider") return { name: "jakttider", query };
  if (parts[0] === "favoriter") return { name: "favoriter" };
  return { name: "home" };
}

function render() {
  state.route = parseRoute();

  switch (state.route.name) {
    case "djur":
      renderAnimal(root, state, state.route.id);
      break;
    case "jakttider":
      if (state.route.query?.includes("idag=1")) resetToToday();
      renderJakttider(root, state);
      break;
    case "favoriter":
      renderFavoriter(root, state);
      break;
    default:
      renderHome(root, state);
  }

  updateNav();
  window.scrollTo({ top: 0 });
}

function updateNav() {
  const name = state.route.name === "djur" ? "home" : state.route.name;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === name);
  });
}

// Delegerade händelser -----------------------------------------------------

// Favoritknappar finns i flera vyer – hantera dem centralt.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fav]");
  if (!btn) return;
  e.preventDefault();

  const nowFav = toggleFavorite(btn.dataset.fav);
  btn.classList.toggle("is-fav", nowFav);
  btn.setAttribute("aria-label", nowFav ? "Ta bort favorit" : "Lägg till favorit");

  if (state.route.name === "home") refreshHomeLists(root, state);
  if (state.route.name === "favoriter") renderFavoriter(root, state);
});

// Länsväljaren på djursidan.
document.addEventListener("change", (e) => {
  if (e.target.id !== "animal-lan") return;
  setSelectedLan(e.target.value);
  if (state.route.name === "djur") refreshSeasonSection(root, state, state.route.id);
});

// Start ----------------------------------------------------------------------

async function init() {
  try {
    state.data = await loadData();
  } catch (err) {
    root.innerHTML = `
      <div class="empty-state" style="margin-top:2rem">
        <span class="emoji">⚠️</span>
        Kunde inte ladda appens data.<br />
        <small>${err.message}. Kör appen via en webbserver, t.ex. <code>npx http-server</code>.</small>
      </div>`;
    return;
  }

  // Galleriet behöver veta vilken art som visas just nu.
  installGallery(() =>
    state.route.name === "djur" ? state.data.byId.get(state.route.id) : null
  );

  window.addEventListener("hashchange", render);
  render();
}

init();
