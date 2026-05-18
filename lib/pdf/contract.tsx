import 'server-only';
import { Document, Page, View, Text, Image, renderToBuffer } from '@react-pdf/renderer';
import { Buffer } from 'node:buffer';
import {
  COLORS,
  styles,
  registerArbiqFonts,
  loadLogoDataUrl,
  loadLynxMarkDataUrl,
  loadSupplierSignatureDataUrl,
  formatCzechDate,
} from './styles';
import type { Dodavatel } from '@/lib/config/dodavatel';

export type ContractCustomer = {
  full_name: string;
  company?: string | null;
  representative?: string | null;
  ico?: string | null;
  dic?: string | null;
  street?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ContractDoc = {
  contractNumber: string;
  title: string;
  subject: string;
  scopeBullets: string[];
  totalPrice: number;
  currency: string;
  depositPercent: number;
  hourlyRate: number;
  monthlyFee: number | null;
  deadlineDays: number;
  warrantyMonths: number;
  lateFeePerDay: number;
  penaltyMax: number | null;
  placeOfSigning: string;
  hasNda: boolean;
  ndaPenalty: number;
  hasExclusivity: boolean;
  exclusivityClause: string | null;
};

function fmtMoney(value: number, currency = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export async function renderContractPdf(opts: {
  doc: ContractDoc;
  customer: ContractCustomer;
  dodavatel: Dodavatel;
}): Promise<Buffer> {
  registerArbiqFonts();
  const { doc, customer, dodavatel } = opts;
  const logo = loadLogoDataUrl();
  const lynx = loadLynxMarkDataUrl();
  const signature = loadSupplierSignatureDataUrl();
  const today = formatCzechDate();

  const deposit = Math.round((doc.totalPrice * doc.depositPercent) / 100);
  const remainder = doc.totalPrice - deposit;
  const latePctText = `${(doc.lateFeePerDay * 100).toFixed(2)} %`;

  const objednatelLabel = customer.company ?? customer.full_name;

  // ============== BODY SECTIONS ==============
  const sections: Array<{
    chapter: string;
    title: string;
    paragraphs: Array<string | { text: string; bold?: boolean }>;
    bullets?: string[];
  }> = [
    {
      chapter: 'II.',
      title: 'Předmět díla',
      paragraphs: [
        `1. Zhotovitel se zavazuje na svůj náklad a nebezpečí provést pro Objednatele dílo spočívající v: ${doc.subject} (dále jen „Dílo") a Objednatel se zavazuje Dílo převzít a zaplatit za něj sjednanou cenu.`,
        '2. Specifikace Díla:',
      ],
      bullets: doc.scopeBullets.length > 0 ? doc.scopeBullets : ['Rozsah dle e-mailové dohody Smluvních stran.'],
    },
    {
      chapter: 'III.',
      title: 'Doba plnění',
      paragraphs: [
        '1. Zhotovitel zahájí práce do 3 pracovních dnů ode dne (a) připsání zálohy dle čl. IV na účet Zhotovitele a (b) dodání nezbytné součinnosti Objednatele.',
        `2. Zhotovitel se zavazuje Dílo dokončit a předat ve lhůtě do ${doc.deadlineDays} kalendářních dnů ode dne zahájení prací dle odst. 1 tohoto článku.`,
        '3. Pokud bude Objednatel v prodlení s poskytnutím součinnosti (texty, podklady, přístupy, zpětná vazba), prodlužuje se lhůta automaticky o dobu tohoto prodlení.',
      ],
    },
    {
      chapter: 'IV.',
      title: 'Cena díla a platební podmínky',
      paragraphs: [
        `1. Smluvní strany se dohodly na celkové ceně za provedení Díla ve výši ${fmtMoney(doc.totalPrice, doc.currency)}. ${dodavatel.vat_payer ? '' : 'Zhotovitel není plátcem DPH.'}`,
        `2. Objednatel uhradí Zhotoviteli zálohu ve výši ${doc.depositPercent} % celkové ceny Díla, tj. ${fmtMoney(deposit, doc.currency)}, na základě zálohové faktury vystavené Zhotovitelem do 5 kalendářních dnů od podpisu smlouvy. Zhotovitel není povinen zahájit práce před připsáním zálohy.`,
        `3. Doplatek ve výši ${100 - doc.depositPercent} % (${fmtMoney(remainder, doc.currency)}) uhradí Objednatel na základě konečné faktury vystavené Zhotovitelem po předání Díla. Splatnost konečné faktury činí 14 kalendářních dnů od jejího doručení Objednateli e-mailem.`,
        `4. V případě prodlení Objednatele s úhradou je Zhotovitel oprávněn účtovat úrok z prodlení ve výši ${latePctText} z dlužné částky za každý den prodlení a pozastavit veškeré práce, popř. provoz Díla či zadržet přístupové údaje, a to bez odpovědnosti za vzniklé škody.`,
        '5. Vlastnické právo k Dílu a licence dle čl. VII přechází na Objednatele až okamžikem úplného uhrazení celkové ceny Díla.',
        `6. Veškeré platby budou prováděny bezhotovostně na bankovní účet Zhotovitele ${dodavatel.bank_account} (${dodavatel.bank_name}), IBAN ${dodavatel.iban}.`,
      ],
    },
    ...(doc.monthlyFee && doc.monthlyFee > 0
      ? [
          {
            chapter: 'IV.A',
            title: 'Měsíční paušál (provozní servis)',
            paragraphs: [
              `Po předání Díla začíná plynout období placeného provozního servisu, za které Objednatel platí Zhotoviteli měsíční paušál ve výši ${fmtMoney(doc.monthlyFee, doc.currency)}. Paušál zahrnuje hosting, monitoring, bezpečnostní aktualizace, zálohování a 3 hodiny technické podpory měsíčně. Hodiny nad rámec paušálu jsou účtovány sazbou ${fmtMoney(doc.hourlyRate, doc.currency)} / hodinu.`,
            ],
          },
        ]
      : []),
    {
      chapter: 'V.',
      title: 'Součinnost Objednatele',
      paragraphs: [
        '1. Objednatel je povinen poskytnout Zhotoviteli veškerou nezbytnou součinnost potřebnou k řádnému provedení Díla, zejména: dodat texty, obrázky, loga, podklady; dodat přístupové údaje k doméně/hostingu; poskytovat zpětnou vazbu do 2 pracovních dnů od jejího vyžádání.',
        '2. Objednatel bere na vědomí, že kvalita a včasnost dodaných podkladů má přímý vliv na kvalitu a termín dodání Díla.',
      ],
    },
    {
      chapter: 'VI.',
      title: 'Vícepráce',
      paragraphs: [
        `1. Veškeré požadavky Objednatele nad rámec specifikace Díla se považují za vícepráce a budou účtovány samostatně dle hodinové sazby Zhotovitele ve výši ${fmtMoney(doc.hourlyRate, doc.currency)} / hodina, není-li dohodnuto jinak.`,
        '2. Před zahájením víceprací sdělí Zhotovitel Objednateli odhad rozsahu a ceny. Vícepráce budou zahájeny až po písemném e-mailovém odsouhlasení Objednatelem.',
        '3. Součástí ceny Díla jsou maximálně 2 kola revizí. Další revize budou účtovány jako vícepráce.',
      ],
    },
    {
      chapter: 'VII.',
      title: 'Předání Díla a licence',
      paragraphs: [
        '1. Zhotovitel předá Dílo Objednateli e-mailem nebo zpřístupněním na sjednané URL adrese. O předání bude vyhotoveno e-mailové oznámení.',
        '2. Objednatel je povinen Dílo zkontrolovat a do 5 pracovních dnů od předání jej písemně (e-mailem) akceptovat nebo sdělit konkrétní písemné výhrady. Pokud výhrady nesdělí, má se za to, že Dílo bylo bez výhrad převzato.',
        '3. Okamžikem úplného uhrazení celkové ceny Díla poskytuje Zhotovitel Objednateli nevýhradní, územně a časově neomezenou licenci k užití autorských prvků Díla pro vlastní podnikatelské účely Objednatele.',
        '4. Zhotovitel je oprávněn uvádět Dílo (název Objednatele, náhled, URL) ve svém referenčním portfoliu, nedohodnou-li se Smluvní strany písemně jinak.',
      ],
    },
    {
      chapter: 'VIII.',
      title: 'Záruka a podpora',
      paragraphs: [
        `1. Zhotovitel poskytuje na Dílo záruku v délce ${doc.warrantyMonths} měsíců ode dne předání. V rámci záruky Zhotovitel bezplatně odstraní prokazatelné vady Díla způsobené Zhotovitelem.`,
        '2. Záruka se nevztahuje na vady způsobené zásahem třetí osoby, aktualizacemi knihoven třetích stran, výpadky hostingu/domény, změnami obsahu provedenými Objednatelem ani škody způsobené napadením webu třetí osobou.',
      ],
    },
  ];

  // Roman numerals after fixed VIII for optional NDA, exclusivity, etc.
  let nextChapter = 9;
  const toRoman = (n: number): string => {
    const map: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let result = '';
    for (const [v, s] of map) {
      while (n >= v) {
        result += s;
        n -= v;
      }
    }
    return result;
  };

  if (doc.hasNda) {
    sections.push({
      chapter: `${toRoman(nextChapter++)}.`,
      title: 'Ochrana důvěrných informací (NDA)',
      paragraphs: [
        '1. Smluvní strany se zavazují zachovávat mlčenlivost o všech důvěrných informacích, které se dozvěděly v souvislosti s plněním této smlouvy.',
        '2. Důvěrnými informacemi se rozumí zejména technická architektura Díla, zdrojový kód, obchodní know-how, ceník, klientská základna, přístupové údaje a osobní údaje.',
        '3. Závazek mlčenlivosti trvá po celou dobu platnosti smlouvy a 3 roky od jejího ukončení.',
        `4. V případě prokazatelného porušení vzniká poškozené straně nárok na smluvní pokutu ve výši ${fmtMoney(doc.ndaPenalty, doc.currency)} za každé jednotlivé porušení.`,
      ],
    });
  }

  if (doc.hasExclusivity && doc.exclusivityClause) {
    sections.push({
      chapter: `${toRoman(nextChapter++)}.`,
      title: 'Závazek exkluzivity',
      paragraphs: [doc.exclusivityClause],
    });
  }

  sections.push({
    chapter: `${toRoman(nextChapter++)}.`,
    title: 'Uzavření smlouvy elektronickou cestou',
    paragraphs: [
      `Tato smlouva může být platně uzavřena též elektronickou cestou — odpovědí Objednatele na e-mail Zhotovitele ve znění: „Závazně objednávám sjednané služby a potvrzuji obsah Smlouvy o dílo." Okamžikem doručení takového e-mailu z adresy uvedené v záhlaví této smlouvy (${dodavatel.email} na straně Zhotovitele, ${customer.email ?? '[e-mail Objednatele]'} na straně Objednatele) je smlouva uzavřena se všemi právními účinky, jako by byla podepsána vlastnoručně.`,
    ],
  });

  sections.push({
    chapter: `${toRoman(nextChapter++)}.`,
    title: 'Závěrečná ustanovení',
    paragraphs: [
      '1. Tato smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník.',
      '2. Veškeré změny a doplňky této smlouvy jsou účinné pouze v písemné formě podepsané oběma stranami (za písemnou formu se považuje i e-mailová výměna s jednoznačným potvrzením).',
      '3. Případné spory budou Smluvní strany řešit přednostně smírnou cestou; jinak jsou příslušné obecné soudy ČR podle sídla Zhotovitele.',
      '4. Smluvní strany prohlašují, že si smlouvu přečetly, jejímu obsahu porozuměly a na důkaz své svobodné a vážné vůle připojují své podpisy.',
    ],
  });

  // ============== DOCUMENT ==============
  const pdfDoc = (
    <Document
      title={`Smlouva ${doc.contractNumber}`}
      author={dodavatel.brand}
      creator="ARBIQ portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.pageSerif} wrap>
        {/* ============ FIXED CORNER MARKS (every page) ============ */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 24,
            right: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            opacity: 0.9,
          }}
        >
          {lynx ? <Image src={lynx} style={{ width: 22, height: 22 }} /> : <Text> </Text>}
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 7.5,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 1.6,
              fontWeight: 600,
            }}
          >
            {dodavatel.brand} · {doc.contractNumber}
          </Text>
        </View>

        <Text
          fixed
          style={{
            position: 'absolute',
            bottom: 22,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'Inter',
            fontSize: 7.5,
            color: COLORS.sandstone,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
          render={({ pageNumber, totalPages }) =>
            `Strana ${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}  ·  ${dodavatel.website}`
          }
        />

        {/* ============ HERO (page 1 only — first section) ============ */}
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          {logo ? (
            <Image
              src={logo}
              style={{ width: 96, height: 96, marginBottom: 18 }}
            />
          ) : (
            <Text> </Text>
          )}

          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 9,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginBottom: 12,
            }}
          >
            Smlouva o dílo
          </Text>

          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.ink,
              textAlign: 'center',
              letterSpacing: -0.4,
              lineHeight: 1.15,
              maxWidth: 460,
              marginBottom: 14,
            }}
          >
            {doc.title}
          </Text>

          <View
            style={{
              width: 60,
              height: 1.5,
              backgroundColor: COLORS.caramel,
              marginBottom: 14,
            }}
          />

          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 11,
              fontStyle: 'italic',
              color: COLORS.sandstone,
              textAlign: 'center',
              maxWidth: 400,
              marginBottom: 12,
            }}
          >
            uzavřená dle § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, v platném znění
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 16,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                color: COLORS.sandstone,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              Smlouva č.
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.caramel,
                letterSpacing: 0.5,
              }}
            >
              {doc.contractNumber}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                color: COLORS.sandstone,
              }}
            >
              ·
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 9,
                color: COLORS.sandstone,
              }}
            >
              Vystaveno {today}
            </Text>
          </View>
        </View>

        {/* ============ SMLUVNÍ STRANY ============ */}
        <View style={{ marginTop: 42 }}>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 8,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            I. Smluvní strany
          </Text>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            {/* Zhotovitel */}
            <View
              style={{
                flex: 1,
                padding: 18,
                backgroundColor: COLORS.parchment,
                borderLeftWidth: 3,
                borderLeftColor: COLORS.caramel,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 7.5,
                  fontWeight: 600,
                  color: COLORS.caramel,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                Zhotovitel
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader',
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.ink,
                  marginBottom: 8,
                }}
              >
                {dodavatel.name}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                {dodavatel.street}, {dodavatel.city}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                IČO: {dodavatel.ico}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.sandstone, fontSize: 9 }}>
                {dodavatel.vat_payer && dodavatel.dic ? `DIČ: ${dodavatel.dic}` : 'Neplátce DPH'}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.sandstone, fontSize: 9, fontStyle: 'italic', marginTop: 4 }}>
                {dodavatel.legal_form}
              </Text>
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 10 }} />
              <Text style={{ ...styles.body, color: COLORS.caramel, fontSize: 9.5, fontWeight: 600 }}>
                {dodavatel.email}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                {dodavatel.phone}
              </Text>
              <Text style={{ ...styles.body, color: COLORS.caramel, fontSize: 9.5 }}>
                {dodavatel.website}
              </Text>
            </View>

            {/* Objednatel */}
            <View
              style={{
                flex: 1,
                padding: 18,
                backgroundColor: '#FFFFFF',
                borderLeftWidth: 3,
                borderLeftColor: COLORS.sandstone,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 7.5,
                  fontWeight: 600,
                  color: COLORS.sandstone,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                Objednatel
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader',
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.ink,
                  marginBottom: 8,
                }}
              >
                {objednatelLabel}
              </Text>
              {customer.company && (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5, fontStyle: 'italic' }}>
                  {customer.full_name}
                </Text>
              )}
              {customer.street && (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                  {customer.street}{customer.city ? `, ${customer.city}` : ''}
                </Text>
              )}
              {customer.ico && (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                  IČO: {customer.ico}
                </Text>
              )}
              {customer.dic && (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9 }}>
                  DIČ: {customer.dic}
                </Text>
              )}
              {customer.representative && (
                <Text style={{ ...styles.body, color: COLORS.sandstone, fontSize: 9, fontStyle: 'italic', marginTop: 4 }}>
                  Zastoupená: {customer.representative}
                </Text>
              )}
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 10 }} />
              {customer.email ? (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                  {customer.email}
                </Text>
              ) : <Text> </Text>}
              {customer.phone ? (
                <Text style={{ ...styles.body, color: COLORS.inkSoft, fontSize: 9.5 }}>
                  {customer.phone}
                </Text>
              ) : <Text> </Text>}
            </View>
          </View>
        </View>

        {/* ============ BODY CHAPTERS ============ */}
        {sections.map((sec, sidx) => (
          <View key={sidx} wrap style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <Text
                style={{
                  fontFamily: 'Newsreader',
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.caramel,
                  letterSpacing: -0.3,
                }}
              >
                {sec.chapter}
              </Text>
              <Text
                style={{
                  fontFamily: 'Newsreader',
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                {sec.title}
              </Text>
            </View>

            {sec.paragraphs.map((p, i) => {
              const text = typeof p === 'string' ? p : p.text;
              const bold = typeof p === 'string' ? false : !!p.bold;
              return (
                <Text
                  key={i}
                  style={{
                    fontFamily: 'Newsreader',
                    fontSize: 10.5,
                    color: COLORS.ink,
                    lineHeight: 1.55,
                    marginBottom: 6,
                    fontWeight: bold ? 700 : 400,
                  }}
                >
                  {text}
                </Text>
              );
            })}

            {sec.bullets && sec.bullets.length > 0 && (
              <View style={{ marginLeft: 12, marginTop: 4 }}>
                {sec.bullets.map((b, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: COLORS.caramel, fontSize: 10, fontWeight: 700 }}>—</Text>
                    <Text
                      style={{
                        fontFamily: 'Newsreader',
                        fontSize: 10.5,
                        color: COLORS.ink,
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* ============ CELKOVÁ CENA — HERO PRICE BAND ============ */}
        <View
          wrap={false}
          style={{
            marginTop: 32,
            backgroundColor: COLORS.coffee,
            paddingVertical: 24,
            paddingHorizontal: 28,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                fontWeight: 600,
                color: COLORS.parchmentGold,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              Celková cena díla
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 9.5,
                color: COLORS.sepia,
                marginTop: 4,
              }}
            >
              Záloha {doc.depositPercent} %  ·  {fmtMoney(deposit, doc.currency)}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 9.5,
                color: COLORS.sepia,
              }}
            >
              Doplatek {100 - doc.depositPercent} %  ·  {fmtMoney(remainder, doc.currency)}
            </Text>
            {!dodavatel.vat_payer && (
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 8.5,
                  color: COLORS.sandstone,
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                Zhotovitel není plátcem DPH
              </Text>
            )}
          </View>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.parchmentGold,
              letterSpacing: -1.5,
            }}
          >
            {fmtMoney(doc.totalPrice, doc.currency)}
          </Text>
        </View>

        {/* ============ PODPISY ============ */}
        <View wrap={false} style={{ marginTop: 44 }}>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 8,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Podpisy smluvních stran
          </Text>

          <View style={{ flexDirection: 'row', gap: 36 }}>
            {/* Zhotovitel — auto-filled date + signature image */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 9.5,
                  color: COLORS.inkSoft,
                  marginBottom: 8,
                }}
              >
                V {doc.placeOfSigning}, dne {today}
              </Text>
              <View
                style={{
                  height: 56,
                  width: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                {signature ? (
                  <Image
                    src={signature}
                    style={{ width: 170, height: 50, objectFit: 'contain' }}
                  />
                ) : <Text> </Text>}
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.ink,
                  width: '85%',
                  marginTop: 2,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                {dodavatel.name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 8.5,
                  color: COLORS.sandstone,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginTop: 2,
                }}
              >
                Zhotovitel
              </Text>
            </View>

            {/* Objednatel — placeholder city/date, prázdné místo na podpis */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 9.5,
                  color: COLORS.inkSoft,
                  marginBottom: 8,
                }}
              >
                V {customer.city ?? '..................'}, dne ............................
              </Text>
              <View style={{ height: 56 }} />
              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.ink,
                  width: '85%',
                  marginTop: 2,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: COLORS.ink,
                }}
              >
                {customer.representative ?? objednatelLabel}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 8.5,
                  color: COLORS.sandstone,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginTop: 2,
                }}
              >
                {customer.company ? `${customer.company} · Objednatel` : 'Objednatel'}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ DĚKUJEME ============ */}
        <View wrap={false} style={{ marginTop: 40, alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 1.5,
              backgroundColor: COLORS.caramel,
              marginBottom: 18,
            }}
          />
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 16,
              fontStyle: 'italic',
              color: COLORS.ink,
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 420,
            }}
          >
            Děkujeme za spolupráci.
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 13,
              fontStyle: 'italic',
              color: COLORS.sandstone,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Věříme, že bude úspěšná.
          </Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(pdfDoc);
}
