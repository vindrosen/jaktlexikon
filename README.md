# Sveriges Jaktlexikon 🫎

En snabb, responsiv webbapp för svenska jägare: fakta om jaktbara arter och
svar på frågan **"Får jag jaga idag?"** – per län och datum.

Version 1 använder emojis istället för bilder, kräver ingen inloggning och
har ingen backend. All data ligger i JSON-filer och favoriter sparas i
webbläsarens localStorage.

## Kom igång

Appen är statisk men läser data med `fetch`, så den behöver köras via en
webbserver (inte öppnas som fil):

```bash
npx http-server -p 4519 -c-1
# eller
python -m http.server 4519
```

Öppna sedan <http://localhost:4519>.

## Funktioner

- **Startsida** med sökfält (svenskt + vetenskapligt namn, filtrering utan
  omladdning), snabbknappar och artkort grupperade per kategori
- **Djursida** med bildgalleri (illustration, närbild, hane/hona, ungdjur,
  horn/gevir, spår, spillning – bilder som saknas döljs automatiskt) och
  expanderbara faktasektioner: om arten, snabbfakta, kännetecken,
  fortplantning, spår, spillning, horn och gevir, utbredning i Sverige,
  naturliga fiender och intressanta fakta. Längst ner jakttider, regler och
  en jaktsäsongskalender (månad för månad, per län)
- **Jakttider**: välj län och datum → gröna kort för *Tillåtet idag* och
  röda för *Fredat idag*; licensjaktsarter är markerade
- **Favoriter** med hjärtknapp, sparas lokalt i webbläsaren

## Struktur

```
index.html            Skal, navigering
css/style.css         Designsystem (mörkgrön skogspalett)
js/app.js             Start, hash-routing, delade händelser
js/data.js            Datainläsning
js/favorites.js       Favoriter + valt län (localStorage)
js/season.js          Jakttidslogik (period/län/datum)
js/imageTypes.js      Bildtyper + filnamnskonvention (delas av UI och verktyg)
js/images.js          Artbilder med fallback-kedja bild → emoji
js/gallery.js         Bildgalleri med flikar och lightbox
js/views/             En modul per vy (hem, djur, jakttider, favoriter)
data/animals.json     38 arter med fakta och bildindex
data/jakttider.json   Jakttider per art – separat fil, enkel att uppdatera
data/lan.json         Sveriges 21 län
images/               AI-genererade illustrationer (PNG, transparent)
images/thumbs/        256 px-miniatyrer för kort, listor och gallerinflikar
tools/                Skript för bildgenerering och miniatyrer
docs/superpowers/specs/  Designdokument
```

## Artbilder 🎨

Alla illustrationer är AI-genererade (gpt-image-1.5, 1024×1024 PNG med
transparent bakgrund) från en gemensam promptmall, så att hela biblioteket
ser ut att komma från samma illustratör. Varje art kan ha åtta bildtyper:

| Typ | Fil | Gäller |
|---|---|---|
| `main` | `images/<id>.png` | alla arter |
| `head` | `images/<id>-head.png` | alla arter |
| `young` | `images/<id>-young.png` | alla arter |
| `tracks` | `images/<id>-tracks.png` | alla arter |
| `droppings` | `images/<id>-droppings.png` | alla arter |
| `antlers` | `images/<id>-antlers.png` | arter med `horn`-fält |
| `male` / `female` | `images/<id>-male.png` … | tydligt könsskilda arter |

Databasens `images`-objekt indexerar bara de bilder som faktiskt finns – UI:t
döljer resten automatiskt. Saknas alla bilder visas artens emoji.

Arbetsflöde (kan köras om hur många gånger som helst – befintliga bilder
skrivs aldrig över):

1. Lägg ev. till arten i `data/animals.json` och `data/jakttider.json`
2. `node tools/generate-images.mjs` – visar vilka bilder som saknas och skriver
   ut färdig prompt + filnamn för varje
3. Generera via bildgen-MCP:n (`background: transparent`, `quality: high`) och
   flytta filerna från `assets/generated/` till `images/`
4. `powershell -File tools/make-thumbs.ps1` – miniatyrer för nya bilder
5. `node tools/generate-images.mjs --sync` – skriver in sökvägarna i databasen

Nya bildtyper läggs till i `js/imageTypes.js` + generatorns promptmall; varken
galleriet eller vyerna behöver ändras.

## Viktigt om jakttiderna ⚠️

Jakttiderna i `data/jakttider.json` är kontrollerade mot **jaktförordningen
(1987:905) bilaga 1–4** (riksdagens konsoliderade text, 2026-07-17) men är
**förenklade till länsnivå**. Lokala avvikelser förekommer – t.ex.
lappmarksgränsen, Norrbottens gränsälvsområde och kommunspecifika regler
(Torsby, Älvdalen). Licensjakt (älg, björn, varg, lodjur) kräver beslut och
tilldelning och kan avlysas. Kontrollera alltid aktuella jakttider hos
[Naturvårdsverket](https://www.naturvardsverket.se) och din länsstyrelse
innan jakt.

## Framtida funktioner (förberett, ej byggt)

Strukturen är modulär och datadriven för att enkelt kunna byggas ut med:
AI-genererade illustrationer, identifiering via foto, spårguide,
spillningsguide, läten, offline-stöd (PWA), sol- och måninformation, väder,
premiumfunktioner, AI-assistent och pushnotiser inför jaktstarter.
