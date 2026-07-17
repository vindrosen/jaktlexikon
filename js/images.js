// Artbilder med emoji-fallback. Kort och listor använder miniatyrer
// (images/thumbs/<id>.png, skapas med tools/make-thumbs.ps1) medan djursidan
// visar originalbilden (images/<id>.png, genereras via tools/generate-images.mjs).
//
// Fallback-kedja när en fil saknas: miniatyr → originalbild → artens emoji.
// Därför kan bildbiblioteket byggas ut art för art utan kodändringar.

import { esc } from "./data.js";

export function animalVisual(animal, imgClass, emojiClass, variant = "thumb") {
  const src = variant === "full" ? `images/${animal.id}.png` : `images/thumbs/${animal.id}.png`;
  const fullSrc = variant === "full" ? "" : `images/${animal.id}.png`;
  return `<img class="art-img ${imgClass}" src="${src}" alt=""
    loading="lazy" data-full="${fullSrc}" data-emoji="${esc(animal.emoji)}"
    data-emoji-class="${emojiClass}" onerror="sjlImgFallback(this)" />`;
}

// Registreras globalt eftersom onerror-attributet anropas utanför modulscope.
window.sjlImgFallback = (img) => {
  const full = img.dataset.full;
  if (full) {
    // Miniatyren saknas – prova originalbilden innan emoji-fallback.
    img.dataset.full = "";
    img.src = full;
    return;
  }
  const span = document.createElement("span");
  span.className = img.dataset.emojiClass;
  span.setAttribute("aria-hidden", "true");
  span.textContent = img.dataset.emoji;
  img.replaceWith(span);
};
