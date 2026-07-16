# Sveriges Jaktlexikon – design v1

Datum: 2026-07-16. Spec från användarens /goal; mockup finns i `Mockup.png`.
V1 använder emojis istället för bilder, ingen backend, ingen inloggning.

## Mål

Snabb, responsiv webbapp där svenska jägare hittar fakta om jaktbara arter och
direkt ser vilka djur som får jagas ett visst datum i ett visst län.

## Teknikval

Vanilla HTML/CSS/JS med ES-moduler och hash-routing. Ingen byggkedja, inga
beroenden – snabbast möjliga laddning och enklast att vidareutveckla. React
valdes bort: appen har fyra vyer och behöver ingen komponentram i v1.
Data i JSON-filer som hämtas med `fetch`, därför krävs en enkel statisk
webbserver vid utveckling (`npx http-server`).

## Struktur

```
index.html            Skal + rot-element
css/style.css         Designsystem (mörkgrön palett från mockupen)
js/app.js             Start, router, delat tillstånd
js/data.js            Laddar JSON-filerna
js/favorites.js       Favoriter i localStorage (nyckel sjl:favoriter)
js/season.js          Jakttidslogik: period-/län-/datummatchning
js/views/home.js      Startsida: sök, snabbknappar, favoriter, artkort
js/views/animal.js    Djursida: fakta + jakttider + säsongskalender
js/views/jakttider.js Jakttidssida: län + datum → tillåtet/fredat
js/views/favoriter.js Favoritvy
data/animals.json     Arterna (id, namn, latinNamn, kategori, emoji, fakta …)
data/jakttider.json   Jakttider per art: perioder med län, start, slut, noter
data/lan.json         Sveriges 21 län med bokstavskoder
```

## Rutter

`#/` startsida · `#/djur/<id>` djursida · `#/jakttider` jakttider ·
`#/favoriter` favoriter. Valt län och favoriter persisteras i localStorage.

## Jakttidsmodell

Varje art har `perioder` (lista med `lan` = `"alla"` eller länkoder,
`start`/`slut` som `MM-DD`, valfri `beskrivning`), samt valfri `licensjakt`
och `not`. Perioder kan gå över årsskiftet (start > slut hanteras i logiken).
Licensjaktsarter (björn, varg, lodjur, älg) visas med badge.
Tydlig ansvarsfriskrivning på alla jakttidsytor: uppgifterna är förenklade –
kontrollera alltid Naturvårdsverket/länsstyrelsen.

## Design

Mörkgrön header/hero (#16281c-ton), ljus krämbakgrund, vita rundade kort med
mjuk skugga, grönt/rött för tillåtet/fredat, månadsstrip (J–D) på djursidan.
Bottennavigering på mobil, topplänkar på desktop. Emoji som artikon.

## Framtida funktioner

Förberett genom modulär struktur och datadriven rendering; listas i README.
