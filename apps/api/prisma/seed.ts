// apps/api/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Basiskatalog nach DIN 18015-3 (Positionierungsplan) — TE-Breiten für
// Reihen-/Hutschienengeräte nach Herstellerangaben (Richtwerte, 1 TE = 17,5mm).
const CATALOG_ITEMS = [
  // Steckdosen & Schalter (kein TE-Wert — werden im Grundriss platziert, nicht im Schaltschrank)
  { code: "DIN18015-STECKDOSE-SCHUKO", category: "STECKDOSE", label: "Steckdose Schuko", svgIconUrl: "symbols/steckdose-schuko.svg", teWidth: null },
  { code: "DIN18015-STECKDOSE-DOPPEL", category: "STECKDOSE", label: "Steckdose Doppel", svgIconUrl: "symbols/steckdose-doppel.svg", teWidth: null },
  { code: "DIN18015-STECKDOSE-FI", category: "STECKDOSE", label: "Steckdose mit FI (Feuchtraum)", svgIconUrl: "symbols/steckdose-fi.svg", teWidth: null },
  { code: "DIN18015-SCHALTER-AUS", category: "SCHALTER", label: "Ausschalter", svgIconUrl: "symbols/schalter-aus.svg", teWidth: null },
  { code: "DIN18015-SCHALTER-WECHSEL", category: "SCHALTER", label: "Wechselschalter", svgIconUrl: "symbols/schalter-wechsel.svg", teWidth: null },
  { code: "DIN18015-SCHALTER-DIMMER", category: "SCHALTER", label: "Dimmschalter", svgIconUrl: "symbols/schalter-dimmer.svg", teWidth: null },
  { code: "DIN18015-TASTER-KNX", category: "KNX_SENSOR", label: "KNX-Tastsensor 4-fach", svgIconUrl: "symbols/knx-taster.svg", teWidth: null },
  { code: "DIN18015-BEWEGUNGSMELDER-KNX", category: "KNX_SENSOR", label: "KNX-Bewegungsmelder", svgIconUrl: "symbols/knx-bwm.svg", teWidth: null },
  { code: "DIN18015-LEUCHTE-DECKE", category: "LEUCHTE", label: "Deckenauslass", svgIconUrl: "symbols/leuchte-decke.svg", teWidth: null },
  { code: "DIN18015-LEUCHTE-WAND", category: "LEUCHTE", label: "Wandleuchte", svgIconUrl: "symbols/leuchte-wand.svg", teWidth: null },

  // Schaltschrank-/Hutschienengeräte (mit TE-Breite für Cabinet-Grid)
  { code: "REG-HAUPTSCHALTER-40A", category: "VERTEILER", label: "Hauptschalter 40A, 4-polig", svgIconUrl: "symbols/hauptschalter.svg", teWidth: 4 },
  { code: "REG-RCD-40-30-4P", category: "RCD", label: "RCD 40A/30mA, Typ A, 4-polig", svgIconUrl: "symbols/rcd.svg", teWidth: 4, defaultAttributes: { rcdType: "A", rcdSensitivityMa: 30 } },
  { code: "REG-LS-B16-1P", category: "LS_SCHALTER", label: "LS-Schalter B16, 1-polig", svgIconUrl: "symbols/ls.svg", teWidth: 1, defaultAttributes: { ratedCurrentA: 16 } },
  { code: "REG-LS-B16-3P", category: "LS_SCHALTER", label: "LS-Schalter B16, 3-polig", svgIconUrl: "symbols/ls.svg", teWidth: 3, defaultAttributes: { ratedCurrentA: 16 } },
  { code: "REG-LS-C10-1P", category: "LS_SCHALTER", label: "LS-Schalter C10, 1-polig", svgIconUrl: "symbols/ls.svg", teWidth: 1, defaultAttributes: { ratedCurrentA: 10 } },
  { code: "REG-KLEMME-REIHENKLEMME", category: "KLEMME", label: "Reihenklemme 2,5mm²", svgIconUrl: "symbols/klemme.svg", teWidth: 1 },
  { code: "REG-KNX-AKTOR-8FACH", category: "KNX_AKTOR", label: "KNX-Schaltaktor 8-fach, 16A", svgIconUrl: "symbols/knx-aktor.svg", teWidth: 4 },
  { code: "REG-KNX-DIMMAKTOR-4FACH", category: "KNX_AKTOR", label: "KNX-Dimmaktor 4-fach", svgIconUrl: "symbols/knx-dimmaktor.svg", teWidth: 6 },

  // Elemente für konventionelle Installationen (Relais/Schaltgeräte, Schütze)
  { code: "REG-RELAIS-1S-16A", category: "RELAIS", label: "Koppelrelais 1S, 16A", svgIconUrl: "symbols/relais.svg", teWidth: 1 },
  { code: "REG-RELAIS-2W-16A", category: "RELAIS", label: "Koppelrelais 2W, 16A", svgIconUrl: "symbols/relais.svg", teWidth: 1 },
  { code: "REG-SCHUETZ-25A-1S", category: "SCHUETZ", label: "Leistungsschütz 25A, 1S", svgIconUrl: "symbols/schuetz.svg", teWidth: 3 },
  { code: "REG-SCHUETZ-40A-3S", category: "SCHUETZ", label: "Leistungsschütz 40A, 3S", svgIconUrl: "symbols/schuetz.svg", teWidth: 4 },

  // Direktverbinder / potenzialfreie Kontakte
  { code: "REG-DIREKTVERBINDER", category: "DIREKTVERBINDER", label: "Direktverbinder (potenzialfrei)", svgIconUrl: "symbols/direktverbinder.svg", teWidth: null },

  // Varianten der Einspeisung
  { code: "REG-ZAEHLER-PV", category: "ZAEHLER", label: "PV-Einspeisezähler", svgIconUrl: "symbols/zaehler-pv.svg", teWidth: 3 },
  { code: "REG-ZAEHLER-WAERMEPUMPE", category: "ZAEHLER", label: "Wärmepumpenzähler", svgIconUrl: "symbols/zaehler-wp.svg", teWidth: 3 },

  // Unterverteilung (Anlage mehrerer Unterverteilungen)
  { code: "REG-UNTERVERTEILER", category: "VERTEILER", label: "Unterverteiler-Anschluss", svgIconUrl: "symbols/unterverteiler.svg", teWidth: 3 },
] as const;

async function main() {
  for (const item of CATALOG_ITEMS) {
    await prisma.symbolCatalogItem.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        category: item.category as any,
        label: item.label,
        svgIconUrl: item.svgIconUrl,
        teWidth: item.teWidth,
        defaultAttributes: ("defaultAttributes" in item ? item.defaultAttributes : {}) as any,
      },
    });
  }
  console.log(`Symbolkatalog geseedet: ${CATALOG_ITEMS.length} Einträge.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
