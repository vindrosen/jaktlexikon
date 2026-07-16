// Jakttidslogik: matchar art, län och datum mot perioderna i jakttider.json.
// Datum jämförs som "MM-DD"-strängar, vilket fungerar lexikografiskt eftersom
// de är nollutfyllda. Perioder kan gå över årsskiftet (start > slut).

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function toMmDd(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

export function periodAppliesToLan(period, lanKod) {
  return period.lan.includes("alla") || period.lan.includes(lanKod);
}

export function inPeriod(mmdd, period) {
  const { start, slut } = period;
  if (start <= slut) return mmdd >= start && mmdd <= slut;
  return mmdd >= start || mmdd <= slut; // går över årsskiftet
}

// Perioder för en art i ett visst län.
export function periodsForLan(art, lanKod) {
  return (art?.perioder ?? []).filter((p) => periodAppliesToLan(p, lanKod));
}

// Status för en art i ett län på ett datum:
// { huntable, matched: [perioder som gäller nu], periods: [alla i länet] }
export function statusForDate(art, lanKod, mmdd) {
  const periods = periodsForLan(art, lanKod);
  const matched = periods.filter((p) => inPeriod(mmdd, p));
  return { huntable: matched.length > 0, matched, periods };
}

export function formatDay(mmdd) {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function formatRange(period) {
  if (period.start === "01-01" && period.slut === "12-31") return "Hela året";
  return `${formatDay(period.start)} – ${formatDay(period.slut)}`;
}

// Är någon del av en given månad (0–11) öppen för jakt i länet?
export function monthOpen(art, lanKod, monthIndex) {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const monthStart = `${mm}-01`;
  const monthEnd = `${mm}-31`; // räcker för överlappstest med MM-DD-strängar
  return periodsForLan(art, lanKod).some((p) => {
    if (p.start <= p.slut) return p.start <= monthEnd && p.slut >= monthStart;
    // Period över årsskiftet: öppen om månaden ligger efter starten eller före slutet.
    return monthEnd >= p.start || monthStart <= p.slut;
  });
}

export const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Beskriver vilka län en period gäller, t.ex. "Norra Sverige" eller länsnamn.
export function describePeriodArea(period, lanByKod) {
  if (period.beskrivning) return period.beskrivning;
  if (period.lan.includes("alla")) return "Hela landet";
  return period.lan.map((k) => lanByKod.get(k) ?? k).join(", ");
}
