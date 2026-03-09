/**
 * Public Holiday Calendar & Sunday Work Rules Engine
 *
 * Comprehensive European public holiday database with Easter-based moveable
 * feast calculation (Computus) and country-specific Sunday work restrictions.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicHolidayDef {
  name: string;
  nameLocal: string;
  month: number; // 1-12
  day: number; // 1-31 (0 if calculated, e.g. Easter)
  isMoveable: boolean; // Easter-based?
  easterOffset?: number; // Days from Easter Sunday (0=Easter, 1=Easter Mon, etc.)
}

export interface HolidayDate {
  name: string;
  nameLocal: string;
  date: Date;
  isMoveable: boolean;
}

export interface SundayWorkRules {
  restricted: boolean;
  premiumRequired: boolean;
  defaultPremium: number; // e.g. 1.5 = 50% premium, 2.0 = double time
  requiresJustification: boolean;
  exceptions: string[];
  legalReference: string;
}

export interface SundayWorkViolation {
  type: "SUNDAY_WORK_RESTRICTED" | "SUNDAY_WORK_NO_JUSTIFICATION" | "HOLIDAY_WORK";
  severity: "WARN" | "ERROR";
  message: string;
  premiumMultiplier: number;
  legalReference: string;
}

// ─── Sunday Work Rules ───────────────────────────────────────────────────────

export const SUNDAY_RULES: Record<string, SundayWorkRules> = {
  NO: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 1.5,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality", "transport", "retail_food"],
    legalReference: "AML \u00A710-10",
  },
  SE: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "ATL",
  },
  DK: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "Arbejdstidsloven",
  },
  FI: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "Ty\u00F6aikalaki \u00A733",
  },
  DE: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 1.5,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality", "emergency", "media"],
    legalReference: "ArbZG \u00A79, GewO \u00A79",
  },
  AT: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality"],
    legalReference: "ARG \u00A73",
  },
  CH: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 1.5,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality", "retail"],
    legalReference: "ArG \u00A718",
  },
  FR: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality", "tourism"],
    legalReference: "Code du Travail L3132",
  },
  BE: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality"],
    legalReference: "Loi 16/3/1971 Art 11",
  },
  NL: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "ATW",
  },
  ES: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 1.75,
    requiresJustification: false,
    exceptions: ["hospitality", "retail"],
    legalReference: "ET Art 37.2",
  },
  PT: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: true,
    exceptions: ["healthcare", "hospitality"],
    legalReference: "CT Art 229",
  },
  IT: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "D.Lgs 66/2003",
  },
  PL: {
    restricted: true,
    premiumRequired: true,
    defaultPremium: 2.0,
    requiresJustification: true,
    exceptions: ["healthcare", "transport"],
    legalReference: "KP Art 151\u00B9\u2070",
  },
  GB: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "Sunday Trading Act 1994",
  },
  IE: {
    restricted: false,
    premiumRequired: false,
    defaultPremium: 1.0,
    requiresJustification: false,
    exceptions: [],
    legalReference: "OWTA 1997",
  },
};

// ─── Holiday Definitions Per Country ─────────────────────────────────────────

const HOLIDAYS: Record<string, PublicHolidayDef[]> = {
  NO: [
    { name: "New Year's Day", nameLocal: "Nytt\u00E5rsdag", month: 1, day: 1, isMoveable: false },
    { name: "Maundy Thursday", nameLocal: "Skj\u00E6rtorsdag", month: 0, day: 0, isMoveable: true, easterOffset: -3 },
    { name: "Good Friday", nameLocal: "Langfredag", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "F\u00F8rste p\u00E5skedag", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "Andre p\u00E5skedag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Arbeidernes dag", month: 5, day: 1, isMoveable: false },
    { name: "Constitution Day", nameLocal: "Grunnlovsdag", month: 5, day: 17, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Kristi himmelfartsdag", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Sunday", nameLocal: "F\u00F8rste pinsedag", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Whit Monday", nameLocal: "Andre pinsedag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Christmas Day", nameLocal: "F\u00F8rste juledag", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Andre juledag", month: 12, day: 26, isMoveable: false },
  ],
  DE: [
    { name: "New Year's Day", nameLocal: "Neujahr", month: 1, day: 1, isMoveable: false },
    { name: "Good Friday", nameLocal: "Karfreitag", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Monday", nameLocal: "Ostermontag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Tag der Arbeit", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Christi Himmelfahrt", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Monday", nameLocal: "Pfingstmontag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "German Unity Day", nameLocal: "Tag der Deutschen Einheit", month: 10, day: 3, isMoveable: false },
    { name: "Christmas Day", nameLocal: "1. Weihnachtstag", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "2. Weihnachtstag", month: 12, day: 26, isMoveable: false },
  ],
  SE: [
    { name: "New Year's Day", nameLocal: "Ny\u00E5rsdagen", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "Trettondedag jul", month: 1, day: 6, isMoveable: false },
    { name: "Good Friday", nameLocal: "L\u00E5ngfredagen", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "P\u00E5skdagen", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "Annandag p\u00E5sk", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "F\u00F6rsta maj", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Kristi himmelf\u00E4rdsdag", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "National Day", nameLocal: "Sveriges nationaldag", month: 6, day: 6, isMoveable: false },
    { name: "Whit Sunday", nameLocal: "Pingstdagen", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Christmas Eve", nameLocal: "Julafton", month: 12, day: 24, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Juldagen", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Annandag jul", month: 12, day: 26, isMoveable: false },
    { name: "New Year's Eve", nameLocal: "Ny\u00E5rsafton", month: 12, day: 31, isMoveable: false },
  ],
  FR: [
    { name: "New Year's Day", nameLocal: "Jour de l'An", month: 1, day: 1, isMoveable: false },
    { name: "Easter Monday", nameLocal: "Lundi de P\u00E2ques", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "F\u00EAte du Travail", month: 5, day: 1, isMoveable: false },
    { name: "Victory Day", nameLocal: "Victoire 1945", month: 5, day: 8, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Ascension", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Monday", nameLocal: "Lundi de Pentec\u00F4te", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Bastille Day", nameLocal: "F\u00EAte nationale", month: 7, day: 14, isMoveable: false },
    { name: "Assumption", nameLocal: "Assomption", month: 8, day: 15, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Toussaint", month: 11, day: 1, isMoveable: false },
    { name: "Armistice Day", nameLocal: "Armistice", month: 11, day: 11, isMoveable: false },
    { name: "Christmas Day", nameLocal: "No\u00EBl", month: 12, day: 25, isMoveable: false },
  ],
  DK: [
    { name: "New Year's Day", nameLocal: "Nyt\u00E5rsdag", month: 1, day: 1, isMoveable: false },
    { name: "Maundy Thursday", nameLocal: "Sk\u00E6rtorsdag", month: 0, day: 0, isMoveable: true, easterOffset: -3 },
    { name: "Good Friday", nameLocal: "Langfredag", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "P\u00E5skedag", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "2. p\u00E5skedag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Arbejdernes kampdag", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Kristi himmelfartsdag", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Sunday", nameLocal: "Pinsedag", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Whit Monday", nameLocal: "2. pinsedag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Constitution Day", nameLocal: "Grundlovsdag", month: 6, day: 5, isMoveable: false },
    { name: "Christmas Eve", nameLocal: "Juleaften", month: 12, day: 24, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Juledag", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "2. juledag", month: 12, day: 26, isMoveable: false },
  ],
  FI: [
    { name: "New Year's Day", nameLocal: "Uudenvuodenp\u00E4iv\u00E4", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "Loppiainen", month: 1, day: 6, isMoveable: false },
    { name: "Good Friday", nameLocal: "Pitk\u00E4perjantai", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "P\u00E4\u00E4si\u00E4isp\u00E4iv\u00E4", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "2. p\u00E4\u00E4si\u00E4isp\u00E4iv\u00E4", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Vappu", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Helatorstai", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Sunday", nameLocal: "Hell\u00E4ntaip\u00E4iv\u00E4", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Midsummer Eve", nameLocal: "Juhannusaatto", month: 0, day: 0, isMoveable: false },
    { name: "Independence Day", nameLocal: "Itsen\u00E4isyysp\u00E4iv\u00E4", month: 12, day: 6, isMoveable: false },
    { name: "Christmas Eve", nameLocal: "Jouluaatto", month: 12, day: 24, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Joulup\u00E4iv\u00E4", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Tapaninp\u00E4iv\u00E4", month: 12, day: 26, isMoveable: false },
  ],
  GB: [
    { name: "New Year's Day", nameLocal: "New Year's Day", month: 1, day: 1, isMoveable: false },
    { name: "Good Friday", nameLocal: "Good Friday", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Monday", nameLocal: "Easter Monday", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Early May Bank Holiday", nameLocal: "Early May Bank Holiday", month: 5, day: 0, isMoveable: false },
    { name: "Spring Bank Holiday", nameLocal: "Spring Bank Holiday", month: 5, day: 0, isMoveable: false },
    { name: "Summer Bank Holiday", nameLocal: "Summer Bank Holiday", month: 8, day: 0, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Christmas Day", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Boxing Day", month: 12, day: 26, isMoveable: false },
  ],
  IE: [
    { name: "New Year's Day", nameLocal: "L\u00E1 Caille", month: 1, day: 1, isMoveable: false },
    { name: "St Brigid's Day", nameLocal: "L\u00E1 Fh\u00E9ile Br\u00EDde", month: 2, day: 1, isMoveable: false },
    { name: "St Patrick's Day", nameLocal: "L\u00E1 Fh\u00E9ile P\u00E1draig", month: 3, day: 17, isMoveable: false },
    { name: "Easter Monday", nameLocal: "Luan C\u00E1sca", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "May Bank Holiday", nameLocal: "L\u00E1 Saoire Bealtaine", month: 5, day: 0, isMoveable: false },
    { name: "June Bank Holiday", nameLocal: "L\u00E1 Saoire Meitheamh", month: 6, day: 0, isMoveable: false },
    { name: "August Bank Holiday", nameLocal: "L\u00E1 Saoire L\u00FAnasa", month: 8, day: 0, isMoveable: false },
    { name: "October Bank Holiday", nameLocal: "L\u00E1 Saoire Dheireadh F\u00F3mhair", month: 10, day: 0, isMoveable: false },
    { name: "Christmas Day", nameLocal: "L\u00E1 Nollag", month: 12, day: 25, isMoveable: false },
    { name: "St Stephen's Day", nameLocal: "L\u00E1 Fh\u00E9ile Stiof\u00E1in", month: 12, day: 26, isMoveable: false },
  ],
  NL: [
    { name: "New Year's Day", nameLocal: "Nieuwjaarsdag", month: 1, day: 1, isMoveable: false },
    { name: "Good Friday", nameLocal: "Goede Vrijdag", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "Eerste paasdag", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "Tweede paasdag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "King's Day", nameLocal: "Koningsdag", month: 4, day: 27, isMoveable: false },
    { name: "Liberation Day", nameLocal: "Bevrijdingsdag", month: 5, day: 5, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Hemelvaartsdag", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Sunday", nameLocal: "Eerste pinksterdag", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Whit Monday", nameLocal: "Tweede pinksterdag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Christmas Day", nameLocal: "Eerste kerstdag", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Tweede kerstdag", month: 12, day: 26, isMoveable: false },
  ],
  ES: [
    { name: "New Year's Day", nameLocal: "A\u00F1o Nuevo", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "D\u00EDa de Reyes", month: 1, day: 6, isMoveable: false },
    { name: "Good Friday", nameLocal: "Viernes Santo", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Labour Day", nameLocal: "Fiesta del Trabajo", month: 5, day: 1, isMoveable: false },
    { name: "Assumption", nameLocal: "Asunci\u00F3n de la Virgen", month: 8, day: 15, isMoveable: false },
    { name: "National Day", nameLocal: "Fiesta Nacional de Espa\u00F1a", month: 10, day: 12, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Todos los Santos", month: 11, day: 1, isMoveable: false },
    { name: "Constitution Day", nameLocal: "D\u00EDa de la Constituci\u00F3n", month: 12, day: 6, isMoveable: false },
    { name: "Immaculate Conception", nameLocal: "Inmaculada Concepci\u00F3n", month: 12, day: 8, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Navidad", month: 12, day: 25, isMoveable: false },
  ],
  IT: [
    { name: "New Year's Day", nameLocal: "Capodanno", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "Epifania", month: 1, day: 6, isMoveable: false },
    { name: "Easter Sunday", nameLocal: "Pasqua", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "Luned\u00EC dell'Angelo", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Liberation Day", nameLocal: "Festa della Liberazione", month: 4, day: 25, isMoveable: false },
    { name: "Labour Day", nameLocal: "Festa dei Lavoratori", month: 5, day: 1, isMoveable: false },
    { name: "Republic Day", nameLocal: "Festa della Repubblica", month: 6, day: 2, isMoveable: false },
    { name: "Assumption", nameLocal: "Ferragosto", month: 8, day: 15, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Ognissanti", month: 11, day: 1, isMoveable: false },
    { name: "Immaculate Conception", nameLocal: "Immacolata Concezione", month: 12, day: 8, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Natale", month: 12, day: 25, isMoveable: false },
    { name: "St Stephen's Day", nameLocal: "Santo Stefano", month: 12, day: 26, isMoveable: false },
  ],
  PL: [
    { name: "New Year's Day", nameLocal: "Nowy Rok", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "\u015Awi\u0119to Trzech Kr\u00F3li", month: 1, day: 6, isMoveable: false },
    { name: "Easter Sunday", nameLocal: "Wielkanoc", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Easter Monday", nameLocal: "Poniedzia\u0142ek Wielkanocny", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "\u015Awi\u0119to Pracy", month: 5, day: 1, isMoveable: false },
    { name: "Constitution Day", nameLocal: "\u015Awi\u0119to Konstytucji", month: 5, day: 3, isMoveable: false },
    { name: "Whit Sunday", nameLocal: "Zielone \u015Awi\u0105tki", month: 0, day: 0, isMoveable: true, easterOffset: 49 },
    { name: "Corpus Christi", nameLocal: "Bo\u017Ce Cia\u0142o", month: 0, day: 0, isMoveable: true, easterOffset: 60 },
    { name: "Assumption", nameLocal: "Wniebowzi\u0119cie NMP", month: 8, day: 15, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Wszystkich \u015Awi\u0119tych", month: 11, day: 1, isMoveable: false },
    { name: "Independence Day", nameLocal: "\u015Awi\u0119to Niepodleg\u0142o\u015Bci", month: 11, day: 11, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Bo\u017Ce Narodzenie", month: 12, day: 25, isMoveable: false },
    { name: "Boxing Day", nameLocal: "Drugi dzie\u0144 \u015Awi\u0105t", month: 12, day: 26, isMoveable: false },
  ],
  PT: [
    { name: "New Year's Day", nameLocal: "Ano Novo", month: 1, day: 1, isMoveable: false },
    { name: "Good Friday", nameLocal: "Sexta-feira Santa", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Sunday", nameLocal: "Domingo de P\u00E1scoa", month: 0, day: 0, isMoveable: true, easterOffset: 0 },
    { name: "Freedom Day", nameLocal: "Dia da Liberdade", month: 4, day: 25, isMoveable: false },
    { name: "Labour Day", nameLocal: "Dia do Trabalhador", month: 5, day: 1, isMoveable: false },
    { name: "Portugal Day", nameLocal: "Dia de Portugal", month: 6, day: 10, isMoveable: false },
    { name: "Corpus Christi", nameLocal: "Corpo de Deus", month: 0, day: 0, isMoveable: true, easterOffset: 60 },
    { name: "Assumption", nameLocal: "Assun\u00E7\u00E3o de Nossa Senhora", month: 8, day: 15, isMoveable: false },
    { name: "Republic Day", nameLocal: "Implanta\u00E7\u00E3o da Rep\u00FAblica", month: 10, day: 5, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Dia de Todos os Santos", month: 11, day: 1, isMoveable: false },
    { name: "Restoration of Independence", nameLocal: "Restaura\u00E7\u00E3o da Independ\u00EAncia", month: 12, day: 1, isMoveable: false },
    { name: "Immaculate Conception", nameLocal: "Imaculada Concei\u00E7\u00E3o", month: 12, day: 8, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Natal", month: 12, day: 25, isMoveable: false },
  ],
  AT: [
    { name: "New Year's Day", nameLocal: "Neujahr", month: 1, day: 1, isMoveable: false },
    { name: "Epiphany", nameLocal: "Heilige Drei K\u00F6nige", month: 1, day: 6, isMoveable: false },
    { name: "Easter Monday", nameLocal: "Ostermontag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Staatsfeiertag", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Christi Himmelfahrt", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Monday", nameLocal: "Pfingstmontag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Corpus Christi", nameLocal: "Fronleichnam", month: 0, day: 0, isMoveable: true, easterOffset: 60 },
    { name: "Assumption", nameLocal: "Mari\u00E4 Himmelfahrt", month: 8, day: 15, isMoveable: false },
    { name: "National Day", nameLocal: "Nationalfeiertag", month: 10, day: 26, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Allerheiligen", month: 11, day: 1, isMoveable: false },
    { name: "Immaculate Conception", nameLocal: "Mari\u00E4 Empf\u00E4ngnis", month: 12, day: 8, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Christtag", month: 12, day: 25, isMoveable: false },
    { name: "St Stephen's Day", nameLocal: "Stefanitag", month: 12, day: 26, isMoveable: false },
  ],
  CH: [
    { name: "New Year's Day", nameLocal: "Neujahr", month: 1, day: 1, isMoveable: false },
    { name: "Good Friday", nameLocal: "Karfreitag", month: 0, day: 0, isMoveable: true, easterOffset: -2 },
    { name: "Easter Monday", nameLocal: "Ostermontag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Ascension Day", nameLocal: "Auffahrt", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Monday", nameLocal: "Pfingstmontag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "National Day", nameLocal: "Bundesfeiertag", month: 8, day: 1, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Weihnachtstag", month: 12, day: 25, isMoveable: false },
    { name: "St Stephen's Day", nameLocal: "Stephanstag", month: 12, day: 26, isMoveable: false },
  ],
  BE: [
    { name: "New Year's Day", nameLocal: "Nieuwjaar", month: 1, day: 1, isMoveable: false },
    { name: "Easter Monday", nameLocal: "Paasmaandag", month: 0, day: 0, isMoveable: true, easterOffset: 1 },
    { name: "Labour Day", nameLocal: "Dag van de Arbeid", month: 5, day: 1, isMoveable: false },
    { name: "Ascension Day", nameLocal: "Onze-Lieve-Heer-Hemelvaart", month: 0, day: 0, isMoveable: true, easterOffset: 39 },
    { name: "Whit Monday", nameLocal: "Pinkstermaandag", month: 0, day: 0, isMoveable: true, easterOffset: 50 },
    { name: "Belgian National Day", nameLocal: "Nationale feestdag", month: 7, day: 21, isMoveable: false },
    { name: "Assumption", nameLocal: "Onze-Lieve-Vrouw-Hemelvaart", month: 8, day: 15, isMoveable: false },
    { name: "All Saints' Day", nameLocal: "Allerheiligen", month: 11, day: 1, isMoveable: false },
    { name: "Armistice Day", nameLocal: "Wapenstilstand", month: 11, day: 11, isMoveable: false },
    { name: "Christmas Day", nameLocal: "Kerstmis", month: 12, day: 25, isMoveable: false },
  ],
};

// ─── Easter Calculation (Computus - Anonymous Gregorian Algorithm) ────────────

/**
 * Calculates Easter Sunday for a given year using the Anonymous Gregorian
 * algorithm (Computus). Valid for any year in the Gregorian calendar.
 */
export function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ─── UK/IE Bank Holiday Helpers ──────────────────────────────────────────────

/** First Monday of a given month */
function firstMondayOf(year: number, month: number): Date {
  const d = new Date(year, month - 1, 1);
  const dayOfWeek = d.getDay();
  const offset = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  return new Date(year, month - 1, 1 + offset);
}

/** Last Monday of a given month */
function lastMondayOf(year: number, month: number): Date {
  const d = new Date(year, month, 0); // last day of month
  const dayOfWeek = d.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return new Date(year, month - 1, d.getDate() - offset);
}

/** Finland midsummer eve: Friday between 19-25 June */
function finnishMidsummerEve(year: number): Date {
  for (let day = 19; day <= 25; day++) {
    const d = new Date(year, 5, day); // June = month 5
    if (d.getDay() === 5) return d; // Friday
  }
  return new Date(year, 5, 19); // fallback
}

// ─── Holiday Resolution ──────────────────────────────────────────────────────

/**
 * Resolves a moveable holiday definition to its concrete date in a given year.
 */
function resolveHolidayDate(def: PublicHolidayDef, year: number): Date | null {
  if (def.isMoveable && def.easterOffset !== undefined) {
    const easter = calculateEasterSunday(year);
    const resolved = new Date(easter);
    resolved.setDate(resolved.getDate() + def.easterOffset);
    return resolved;
  }

  if (def.day === 0) {
    // Bank holidays that need special calculation — skip in generic resolver
    return null;
  }

  return new Date(year, def.month - 1, def.day);
}

/**
 * Resolves bank holidays for GB and IE that depend on "first/last Monday" rules.
 */
function resolveSpecialHolidays(countryCode: string, year: number): HolidayDate[] {
  const results: HolidayDate[] = [];
  const cc = countryCode.toUpperCase();

  if (cc === "GB") {
    // Early May: first Monday in May
    results.push({
      name: "Early May Bank Holiday",
      nameLocal: "Early May Bank Holiday",
      date: firstMondayOf(year, 5),
      isMoveable: false,
    });
    // Spring: last Monday in May
    results.push({
      name: "Spring Bank Holiday",
      nameLocal: "Spring Bank Holiday",
      date: lastMondayOf(year, 5),
      isMoveable: false,
    });
    // Summer: last Monday in August
    results.push({
      name: "Summer Bank Holiday",
      nameLocal: "Summer Bank Holiday",
      date: lastMondayOf(year, 8),
      isMoveable: false,
    });
  }

  if (cc === "IE") {
    // May: first Monday in May
    results.push({
      name: "May Bank Holiday",
      nameLocal: "L\u00E1 Saoire Bealtaine",
      date: firstMondayOf(year, 5),
      isMoveable: false,
    });
    // June: first Monday in June
    results.push({
      name: "June Bank Holiday",
      nameLocal: "L\u00E1 Saoire Meitheamh",
      date: firstMondayOf(year, 6),
      isMoveable: false,
    });
    // August: first Monday in August
    results.push({
      name: "August Bank Holiday",
      nameLocal: "L\u00E1 Saoire L\u00FAnasa",
      date: firstMondayOf(year, 8),
      isMoveable: false,
    });
    // October: last Monday in October
    results.push({
      name: "October Bank Holiday",
      nameLocal: "L\u00E1 Saoire Dheireadh F\u00F3mhair",
      date: lastMondayOf(year, 10),
      isMoveable: false,
    });
  }

  if (cc === "FI") {
    results.push({
      name: "Midsummer Eve",
      nameLocal: "Juhannusaatto",
      date: finnishMidsummerEve(year),
      isMoveable: false,
    });
  }

  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all public holidays for a given country and year.
 * Calculates Easter-based moveable feasts and bank holiday dates.
 */
export function getPublicHolidays(countryCode: string, year: number): HolidayDate[] {
  const cc = countryCode.toUpperCase();
  const defs = HOLIDAYS[cc];

  if (!defs) {
    return [];
  }

  const holidays: HolidayDate[] = [];

  for (const def of defs) {
    // Skip bank-holiday-style entries with day=0 and no Easter offset
    if (def.day === 0 && !def.isMoveable) {
      continue;
    }

    const date = resolveHolidayDate(def, year);
    if (date) {
      holidays.push({
        name: def.name,
        nameLocal: def.nameLocal,
        date,
        isMoveable: def.isMoveable,
      });
    }
  }

  // Add special bank holidays (GB, IE, FI)
  const specials = resolveSpecialHolidays(cc, year);
  holidays.push(...specials);

  // Sort by date
  holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  return holidays;
}

/**
 * Checks if a given date is a public holiday in the specified country.
 */
export function isPublicHoliday(
  date: Date,
  countryCode: string
): { isHoliday: boolean; holiday?: HolidayDate } {
  const year = date.getFullYear();
  const holidays = getPublicHolidays(countryCode, year);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const match = holidays.find((h) => {
    const hDate = new Date(h.date.getFullYear(), h.date.getMonth(), h.date.getDate()).getTime();
    return hDate === target;
  });

  return match
    ? { isHoliday: true, holiday: match }
    : { isHoliday: false };
}

/**
 * Returns true if the given date falls on a Sunday.
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Returns true if the given date is either a Sunday or a public holiday.
 */
export function isSundayOrHoliday(date: Date, countryCode: string): boolean {
  return isSunday(date) || isPublicHoliday(date, countryCode).isHoliday;
}

/**
 * Returns Sunday work rules for a given country.
 * Falls back to unrestricted rules if country not found.
 */
export function getSundayRules(countryCode: string): SundayWorkRules {
  const cc = countryCode.toUpperCase();
  return (
    SUNDAY_RULES[cc] ?? {
      restricted: false,
      premiumRequired: false,
      defaultPremium: 1.0,
      requiresJustification: false,
      exceptions: [],
      legalReference: "EU WTD",
    }
  );
}

/**
 * Checks whether a shift that overlaps with Sunday complies with the country's
 * Sunday work restrictions.
 *
 * Returns null if compliant, or a violation object if not.
 */
export function checkSundayWorkCompliance(
  shift: { startTime: Date; endTime: Date },
  countryCode: string,
  sector?: string
): SundayWorkViolation | null {
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  const rules = getSundayRules(countryCode);

  // Check if shift overlaps with Sunday at all
  const shiftTouchesSunday = doesShiftOverlapSunday(start, end);
  if (!shiftTouchesSunday) return null;

  // Check if shift overlaps with a public holiday
  const holidayCheck = checkHolidayOverlap(start, end, countryCode);
  if (holidayCheck) return holidayCheck;

  // If Sunday work is not restricted, no violation
  if (!rules.restricted) return null;

  // If the sector is exempt, no violation
  if (sector && rules.exceptions.includes(sector.toLowerCase())) return null;

  // Sunday work restricted and no exemption
  if (rules.requiresJustification) {
    return {
      type: "SUNDAY_WORK_NO_JUSTIFICATION",
      severity: "ERROR",
      message: `Sunday work requires documented justification (${rules.legalReference}). Sector exemptions: ${rules.exceptions.join(", ") || "none"}.`,
      premiumMultiplier: rules.defaultPremium,
      legalReference: rules.legalReference,
    };
  }

  return {
    type: "SUNDAY_WORK_RESTRICTED",
    severity: "WARN",
    message: `Sunday work is restricted. Premium pay of ${((rules.defaultPremium - 1) * 100).toFixed(0)}% required (${rules.legalReference}).`,
    premiumMultiplier: rules.defaultPremium,
    legalReference: rules.legalReference,
  };
}

/**
 * Returns the premium multiplier for work on a given date.
 *
 * Priority: holiday premium > Sunday premium > 1.0 (normal)
 */
export function getHolidayPremium(date: Date, countryCode: string): number {
  const rules = getSundayRules(countryCode);
  const { isHoliday } = isPublicHoliday(date, countryCode);

  if (isHoliday) {
    // Holiday premium is typically at least the Sunday premium
    return Math.max(rules.defaultPremium, 1.5);
  }

  if (isSunday(date) && rules.premiumRequired) {
    return rules.defaultPremium;
  }

  return 1.0;
}

/**
 * Returns the next N upcoming holidays from a given date.
 */
export function getUpcomingHolidays(
  countryCode: string,
  fromDate: Date,
  count: number
): HolidayDate[] {
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const results: HolidayDate[] = [];
  let year = from.getFullYear();

  // Search up to 2 years ahead to find enough holidays
  while (results.length < count && year <= from.getFullYear() + 2) {
    const holidays = getPublicHolidays(countryCode, year);
    for (const h of holidays) {
      const hDate = new Date(h.date.getFullYear(), h.date.getMonth(), h.date.getDate());
      if (hDate >= from) {
        results.push(h);
        if (results.length >= count) break;
      }
    }
    year++;
  }

  return results.slice(0, count);
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Checks if a shift time range overlaps with any Sunday.
 */
function doesShiftOverlapSunday(start: Date, end: Date): boolean {
  // Walk through each day the shift covers
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= endDay) {
    if (current.getDay() === 0) return true;
    current.setDate(current.getDate() + 1);
  }

  return false;
}

/**
 * Checks if a shift overlaps with a public holiday.
 * Returns a violation if it does and the country restricts holiday work.
 */
function checkHolidayOverlap(
  start: Date,
  end: Date,
  countryCode: string
): SundayWorkViolation | null {
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= endDay) {
    const check = isPublicHoliday(current, countryCode);
    if (check.isHoliday && check.holiday) {
      const rules = getSundayRules(countryCode);
      const premium = Math.max(rules.defaultPremium, 1.5);
      return {
        type: "HOLIDAY_WORK",
        severity: "WARN",
        message: `Shift falls on public holiday: ${check.holiday.name} (${check.holiday.nameLocal}). Premium pay of ${((premium - 1) * 100).toFixed(0)}% applies.`,
        premiumMultiplier: premium,
        legalReference: rules.legalReference,
      };
    }
    current.setDate(current.getDate() + 1);
  }

  return null;
}

// ─── Supported Countries ─────────────────────────────────────────────────────

/** All country codes with holiday data */
export const SUPPORTED_COUNTRIES = Object.keys(HOLIDAYS);
