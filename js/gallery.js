// Bildgalleri för djursidan. Renderar en visare med flikar för de bildtyper
// arten faktiskt har (animal.images) – saknade typer utelämnas automatiskt.
// Bilden kan öppnas i större format i en lightbox.
//
// Modulen är helt datadriven: nya bildtyper läggs till i js/imageTypes.js och
// dyker upp här utan kodändring.

import { esc } from "./data.js";
import { IMAGE_TYPES, IMAGE_TYPE_MAP, thumbPath } from "./imageTypes.js";

// Bildtyper arten har, i den ordning som IMAGE_TYPES anger.
export function availableTypes(animal) {
  const images = animal.images ?? {};
  return IMAGE_TYPES.filter((t) => images[t.key]).map((t) => t.key);
}

export function renderGallery(animal) {
  const types = availableTypes(animal);

  // Utan bilder faller vi tillbaka på artens emoji.
  if (!types.length) {
    return `<div class="gallery"><span class="big-emoji" aria-hidden="true">${animal.emoji}</span></div>`;
  }

  const first = types[0];
  const tabs = types
    .map((key, i) => {
      const t = IMAGE_TYPE_MAP[key];
      return `<button class="gallery-tab ${i === 0 ? "active" : ""}" data-gallery-tab="${key}"
        aria-label="${esc(t.label)}" title="${esc(t.label)}">
        <img src="${thumbPath(animal.id, key)}" alt="" loading="lazy" />
        <span>${t.emoji} ${esc(t.label)}</span>
      </button>`;
    })
    .join("");

  return `
    <div class="gallery" data-gallery data-animal="${animal.id}">
      <button class="gallery-view" data-gallery-view aria-label="Visa bilden i större format">
        <img id="gallery-img" src="${animal.images[first]}" alt="${esc(animal.namn)} – ${esc(
          IMAGE_TYPE_MAP[first].label
        )}" />
        <span class="gallery-zoom" aria-hidden="true">⤢</span>
      </button>
      ${types.length > 1 ? `<div class="gallery-tabs">${tabs}</div>` : ""}
    </div>`;
}

// Installeras en gång vid appstart. Sköter flikbyte, lightbox och tangentbord.
export function installGallery(getAnimal) {
  let current = null; // { animal, types, index }

  const open = (animal, key) => {
    const types = availableTypes(animal);
    current = { animal, types, index: types.indexOf(key) };
    show();
    document.getElementById("lightbox").hidden = false;
    document.body.classList.add("no-scroll");
  };

  const close = () => {
    document.getElementById("lightbox").hidden = true;
    document.body.classList.remove("no-scroll");
    current = null;
  };

  const step = (delta) => {
    if (!current) return;
    current.index = (current.index + delta + current.types.length) % current.types.length;
    show();
  };

  const show = () => {
    const { animal, types, index } = current;
    const key = types[index];
    document.getElementById("lightbox-img").src = animal.images[key];
    document.getElementById("lightbox-img").alt = `${animal.namn} – ${IMAGE_TYPE_MAP[key].label}`;
    document.getElementById("lightbox-caption").textContent =
      `${animal.namn} · ${IMAGE_TYPE_MAP[key].label} (${index + 1}/${types.length})`;
    document.getElementById("lightbox-nav").hidden = types.length < 2;
  };

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-gallery-tab]");
    if (tab) {
      const animal = getAnimal();
      if (!animal) return;
      const key = tab.dataset.galleryTab;
      const img = document.getElementById("gallery-img");
      img.src = animal.images[key];
      img.alt = `${animal.namn} – ${IMAGE_TYPE_MAP[key].label}`;
      tab.closest(".gallery-tabs")
        .querySelectorAll(".gallery-tab")
        .forEach((b) => b.classList.toggle("active", b === tab));
      return;
    }

    if (e.target.closest("[data-gallery-view]")) {
      const animal = getAnimal();
      if (!animal) return;
      const active = document.querySelector(".gallery-tab.active");
      open(animal, active ? active.dataset.galleryTab : availableTypes(animal)[0]);
      return;
    }

    // Liten bild inne i en faktasektion (t.ex. spårbilden) öppnar också lightboxen.
    const inline = e.target.closest("[data-open-image]");
    if (inline) {
      const animal = getAnimal();
      if (animal) open(animal, inline.dataset.openImage);
      return;
    }

    if (e.target.closest("[data-lightbox-prev]")) return step(-1);
    if (e.target.closest("[data-lightbox-next]")) return step(1);
    if (e.target.closest("[data-lightbox-close]")) return close();

    // Klick vid sidan om bilden stänger också lightboxen.
    if (current && (e.target.id === "lightbox" || e.target.classList.contains("lightbox-inner"))) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!current) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}
