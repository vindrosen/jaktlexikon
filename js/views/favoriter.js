// Favoritvyn: alla arter användaren har markerat med hjärta.

import { getFavorites } from "../favorites.js";
import { cardGrid } from "./home.js";

export function renderFavoriter(root, state) {
  const favs = getFavorites()
    .map((id) => state.data.byId.get(id))
    .filter(Boolean);

  root.innerHTML = `
    <h1 class="view-title">❤️ Mina favoriter</h1>
    <p class="view-sub">Favoriter sparas lokalt i din webbläsare.</p>
    ${
      favs.length
        ? cardGrid(favs)
        : `<div class="empty-state">
             <span class="emoji">🤍</span>
             Du har inga favoriter ännu.<br />
             Tryck på hjärtat på ett djurkort för att spara det här.
           </div>`
    }`;
}
