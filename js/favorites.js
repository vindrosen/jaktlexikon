// Favoriter sparas lokalt i webbläsaren (localStorage).

const KEY = "sjl:favoriter";

export function getFavorites() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const i = favs.indexOf(id);
  if (i === -1) favs.push(id);
  else favs.splice(i, 1);
  localStorage.setItem(KEY, JSON.stringify(favs));
  return i === -1;
}

// Valt län delas mellan vyerna och sparas mellan besök.
const LAN_KEY = "sjl:lan";

export function getSelectedLan() {
  return localStorage.getItem(LAN_KEY) || "AB";
}

export function setSelectedLan(kod) {
  localStorage.setItem(LAN_KEY, kod);
}
