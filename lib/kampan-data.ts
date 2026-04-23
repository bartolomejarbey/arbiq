export type KampanKey =
  | "webove-stranky"
  | "marketing"
  | "rentgen"
  | "edukace"
  | "remeslnici"
  | "financni-poradci"
  | "realitni-makleri"
  | "automatizace"
  | "startup";

type KampanConfig = {
  headline: string;
  description: string;
  step2Obory: string[];
  step3Question: string;
  step3Options: string[];
  showUrl: boolean;
  showPopis: boolean;
  successExtra?: string;
};

export const kampanData: Record<KampanKey, KampanConfig> = {
  "webove-stranky": {
    headline: "Váš web neprodává. Pojďme zjistit proč.",
    description: "Pomůžeme Vám pochopit, proč Váš web neplní svou roli — a navrhneme cestu k nápravě.",
    step2Obory: ["Řemeslník", "Služby (gastro, beauty, fitness...)", "E-commerce", "Poradce/makléř", "IT/Startup", "Jiné"],
    step3Question: "Co od webu očekáváte?",
    step3Options: ["Víc zákazníků", "Profesionální vzhled", "E-shop", "Rezervační systém", "Všechno"],
    showUrl: true,
    showPopis: false,
    successExtra: "Připravíme Vám nezávazný návrh webu do 48 hodin.",
  },
  marketing: {
    headline: "Vaše reklamy utrácejí bez výsledků. Pojďme to změnit.",
    description: "Podíváme se na Váš marketing a řekneme Vám, kde ztrácíte peníze.",
    step2Obory: ["Řemeslník", "Služby (gastro, beauty, fitness...)", "E-commerce", "Poradce/makléř", "IT/Startup", "Jiné"],
    step3Question: "Jaký je Váš měsíční rozpočet na reklamu?",
    step3Options: ["Do 5 000 Kč", "5–15 000 Kč", "15–50 000 Kč", "Nad 50 000 Kč", "Nevím, poraďte"],
    showUrl: true,
    showPopis: false,
  },
  rentgen: {
    headline: "Něco ve Vašem podnikání nefunguje. Pojďme to najít.",
    description: "Hodinová konzultace, která Vám ušetří měsíce tápání.",
    step2Obory: ["Řemeslník", "Služby (gastro, beauty, fitness...)", "E-commerce", "Poradce/makléř", "IT/Startup", "Jiné"],
    step3Question: "Co Vás trápí nejvíc?",
    step3Options: ["Web nevypadá dobře", "Nemám zákazníky z internetu", "Konkurence mě předbíhá", "Nevím co je špatně"],
    showUrl: true,
    showPopis: false,
  },
  edukace: {
    headline: "Viděli jste naše video. Teď pojďme řešit Váš případ.",
    description: "Přešli jste od sledování k akci. Dobré rozhodnutí.",
    step2Obory: ["Řemeslník", "Služby (gastro, beauty, fitness...)", "E-commerce", "Poradce/makléř", "IT/Startup", "Jiné"],
    step3Question: "Co Vás trápí nejvíc?",
    step3Options: ["Web nevypadá dobře", "Nemám zákazníky z internetu", "Konkurence mě předbíhá", "Nevím co je špatně"],
    showUrl: true,
    showPopis: false,
  },
  remeslnici: {
    headline: "Máte plné ruce práce ale prázdný kalendář? Pojďme to otočit.",
    description: "Specializujeme se na řemeslníky. Víme, co potřebujete.",
    step2Obory: ["Instalatér/Topenář", "Elektrikář", "Zedník/Stavař", "Malíř/Natěrač", "Zahradník", "Jiný řemeslník"],
    step3Question: "Co od webu očekáváte?",
    step3Options: ["Víc zákazníků", "Profesionální vzhled", "E-shop", "Rezervační systém", "Všechno"],
    showUrl: true,
    showPopis: false,
  },
  "financni-poradci": {
    headline: "90 % Vašich klientů neví, co má pojištěné. Pojďme to změnit.",
    description: "Pomůžeme Vám digitalizovat komunikaci s klienty.",
    step2Obory: ["Nezávislý poradce", "Pojišťovací makléř", "Hypoteční specialista", "Finanční plánovač"],
    step3Question: "Co Vás trápí nejvíc?",
    step3Options: ["Web nevypadá dobře", "Nemám zákazníky z internetu", "Konkurence mě předbíhá", "Nevím co je špatně"],
    showUrl: true,
    showPopis: false,
  },
  "realitni-makleri": {
    headline: "Vaše nabídky se ztrácejí v davu. Pojďme Vás z něj vytáhnout.",
    description: "Odlišíme Vás od konkurence. Digitálně.",
    step2Obory: ["Nezávislý makléř", "Malá RK (do 10 lidí)", "Větší RK", "Developer"],
    step3Question: "Co Vás trápí nejvíc?",
    step3Options: ["Web nevypadá dobře", "Nemám zákazníky z internetu", "Konkurence mě předbíhá", "Nevím co je špatně"],
    showUrl: true,
    showPopis: false,
  },
  automatizace: {
    headline: "Kolik hodin týdně ztrácíte opakovanou prací? Pojďme to spočítat.",
    description: "Automatizace na míru Vašemu provozu. Ne šablona.",
    step2Obory: ["Správa nemovitostí", "Řemeslnická firma", "E-commerce", "Služby", "Výroba", "Jiné"],
    step3Question: "Kolik hodin týdně trávíte opakovanou prací?",
    step3Options: ["Do 5 hodin", "5–15 hodin", "15–30 hodin", "Nad 30 hodin"],
    showUrl: false,
    showPopis: false,
    successExtra: "Připravíme Vám analýzu, kolik hodin a peněz Vám ušetříme.",
  },
  startup: {
    headline: "Rozjíždíte podnikání? Pojďme to udělat správně od začátku.",
    description: "Od nápadu k prvním zákazníkům. S námi to bude rychlejší.",
    step2Obory: ["Mám nápad, nemám web", "Mám web, nemám zákazníky", "Mám zákazníky, potřebuji škálovat"],
    step3Question: "Co potřebujete jako první?",
    step3Options: ["Web a branding", "Marketing a zákazníky", "Aplikaci/systém", "Strategii"],
    showUrl: false,
    showPopis: true,
    successExtra: undefined,
  },
};

export const velikostOptions = ["Sám/sama", "2–5 lidí", "6–20 lidí", "20+"];

export const validKampane = Object.keys(kampanData) as KampanKey[];

/**
 * 16 variant „Co všechno chcete?" — sdílené napříč všemi kampaněmi.
 * Multi-select checklist v 3. kroku onboardingu.
 */
export const WANTS_OPTIONS = [
  { id: "web-novy",       label: "Profi web (nový)",            category: "web" },
  { id: "web-redesign",   label: "Redesign existujícího webu",  category: "web" },
  { id: "eshop",          label: "E-shop",                      category: "web" },
  { id: "rezervace",      label: "Rezervační systém",           category: "system" },
  { id: "clenska-sekce",  label: "Členská / klientská sekce",   category: "system" },
  { id: "crm",            label: "CRM systém",                  category: "system" },
  { id: "fakturace",      label: "Automatická fakturace",       category: "system" },
  { id: "booking-msg",    label: "Booking přes Messenger / WhatsApp", category: "system" },
  { id: "marketing",      label: "Marketingové reklamy (PPC, Meta)", category: "marketing" },
  { id: "seo",            label: "SEO (organická návštěvnost)", category: "marketing" },
  { id: "social",         label: "Sociální sítě & content",     category: "marketing" },
  { id: "brand",          label: "Brand identita",              category: "design" },
  { id: "logo",           label: "Logo & vizuál",               category: "design" },
  { id: "video",          label: "Video produkce",              category: "design" },
  { id: "automatizace",   label: "Automatizace procesů",        category: "system" },
  { id: "aplikace",       label: "Aplikace na míru",            category: "system" },
] as const;

export type WantsOption = typeof WANTS_OPTIONS[number];

export const BUDGET_OPTIONS = [
  { id: "5-15",      label: "5 — 15 000 Kč",       hint: "Drobnost / starter" },
  { id: "15-50",     label: "15 — 50 000 Kč",      hint: "Standardní web nebo eshop" },
  { id: "50-150",    label: "50 — 150 000 Kč",     hint: "Komplexní řešení" },
  { id: "150-plus",  label: "150 000 Kč +",        hint: "Plný stack / aplikace na míru" },
  { id: "doporucte", label: "Nechci říct, doporučte", hint: "Zjistíme, co dává smysl" },
] as const;

export type BudgetOption = typeof BUDGET_OPTIONS[number];
