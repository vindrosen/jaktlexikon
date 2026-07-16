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
- **Djursida** med beskrivning, vikt, längd, livslängd, habitat, föda,
  aktiv tid, kännetecken, intressanta fakta samt jakttider, regler och en
  jaktsäsongskalender (månad för månad, per län)
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
js/views/             En modul per vy (hem, djur, jakttider, favoriter)
data/animals.json     31 arter med fakta
data/jakttider.json   Jakttider per art – separat fil, enkel att uppdatera
data/lan.json         Sveriges 21 län
docs/superpowers/specs/  Designdokument
```

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
