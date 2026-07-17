# Steg 3 – Komplett jaktlexikon: flera bilder och fler faktasektioner

Datum: 2026-07-17. Bygger vidare på
[v1-designen](2026-07-16-sveriges-jaktlexikon-design.md).

## Mål

Varje art ska ha flera illustrationer i ett galleri och detaljerad fakta i
expanderbara sektioner. All befintlig funktionalitet behålls.

## Datamodell

`data/animals.json` utökades med faktafälten `familj`, `brunsttid`,
`fortplantning`, `spar`, `spillning`, `horn` (endast arter med horn/gevir),
`fiender` och `utbredning`, samt ett `images`-objekt:

```json
"images": {
  "main": "images/alg.png",
  "head": "images/alg-head.png",
  "antlers": "images/alg-antlers.png"
}
```

`images` innehåller **endast de bildtyper som finns på disk** och skrivs
automatiskt av `tools/generate-images.mjs --sync`. Det är alltså disken som är
sanningen; databasen är ett index. Saknade typer utelämnas, och UI:t döljer dem
därmed automatiskt.

## Bildtyper

`js/imageTypes.js` är en ren modul (inga webbläsar- eller Node-beroenden) som
definierar ordning, etiketter och filnamnskonvention. Den importeras av både
UI:t och generatorn så att de aldrig kan hamna i otakt.

Konvention: huvudbild `images/<id>.png`, övriga `images/<id>-<typ>.png`.
Miniatyrer i `images/thumbs/` med samma filnamn.

En ny bildtyp läggs till genom att lägga till en post i `IMAGE_TYPES` och en
prompt i generatorns `bodyFor()`. Inga komponenter behöver ändras.

## Vilka bilder varje art ska ha

Reglerna ligger i generatorn (`expectedTypes`), inte i komponenterna:

- Alla arter: `main`, `head`, `young`, `tracks`, `droppings`
- Arter med horn/gevir: `antlers` – härleds ur databasens `horn`-fält, så nya
  hjortdjur kommer med automatiskt
- Tydligt könsskilda arter: `male` + `female` (mängden `DIMORPHIC`)

## Galleri

`js/gallery.js` renderar visare + flikrad utifrån `animal.images`. En bild kan
öppnas i lightbox med pilar, tangentbord (←/→/Esc) och klick utanför bilden.
Flikraden scrollar horisontellt på mobil. Arter med bara en bild får ingen
flikrad; arter utan bild faller tillbaka på emoji.

## Faktasektioner

`SECTIONS` i `js/views/animal.js` är en datadriven lista: varje post pekar ut
ett fält (`text`, `list` eller `rows`) och valfritt en bildtyp som visas inne i
sektionen (t.ex. spårbilden i Spår-sektionen). Sektioner utan innehåll renderas
inte alls – därför slipper arter utan horn en tom Horn-sektion. Sektionerna är
`<details>`-element, vilket ger bra läsbarhet på mobil utan JavaScript.

## Bildgenerator

`tools/generate-images.mjs` är idempotent och kan köras hur många gånger som
helst:

| Läge | Gör |
|---|---|
| (inget) | Sammanfattning + prompter för saknade bilder |
| `--status` | Endast sammanfattning |
| `--json` | Saknade bilder som JSON |
| `--sync` | Skriver in sökvägar till befintliga bilder i databasen |

Bilderna genereras via projektets OpenAI-MCP (bildgen), som anropas av
assistenten – ett fristående Node-skript kan inte anropa MCP:n själv. Skriptet
äger därför allt utom själva anropet: vilka bilder som saknas, exakt prompt,
filnamn och synk mot databasen. Befintliga bilder skrivs aldrig över.

## Förberett för steg 4

| Funktion | Hur arkitekturen bär den |
|---|---|
| AI-identifiering av foto, spår, spillning | Referensbilderna (`tracks`, `droppings`, `head`) finns redan per art i databasen och kan användas som facit/underlag |
| Ljudbibliotek | Samma mönster som bilder: en `sounds`-modul med typer + `sounds`-objekt per art, synkat från disk |
| Kartor över utbredning | Fältet `utbredning` finns; en karta kan läggas till som egen sektionstyp i `SECTIONS` |
| Sol, måne, väder | Egna vyer + moduler; `js/app.js` routing och `favorites.js` (valt län) finns redan |
| Offline-läge | Statisk app utan backend – en service worker kan cacha `data/`, `images/thumbs/` och koden |
| Premium | Sektionslistan och bildtyperna är data; en `premium`-flagga per post kan filtreras i renderingen |
