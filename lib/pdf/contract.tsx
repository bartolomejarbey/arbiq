import 'server-only';
import { Document, Page, View, Text, Image, renderToBuffer } from '@react-pdf/renderer';
import { Buffer } from 'node:buffer';
import { COLORS, styles, registerArbiqFonts, loadLogoDataUrl } from './styles';
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
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export async function renderContractPdf(opts: {
  doc: ContractDoc;
  customer: ContractCustomer;
  dodavatel: Dodavatel;
}): Promise<Buffer> {
  registerArbiqFonts();
  const { doc, customer, dodavatel } = opts;
  const logo = loadLogoDataUrl();

  const deposit = Math.round(doc.totalPrice * doc.depositPercent / 100);
  const remainder = doc.totalPrice - deposit;
  const latePctText = `${(doc.lateFeePerDay * 100).toFixed(2)} %`;

  const objednatelLabel = customer.company ?? customer.full_name;

  const sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }> = [
    {
      title: 'I. Smluvní strany',
      paragraphs: [
        '1. Zhotovitel:',
        `${dodavatel.name}\nSe sídlem: ${dodavatel.street}, ${dodavatel.city}\nIČO: ${dodavatel.ico}\n${dodavatel.legal_form}\nProvozující značku: ${dodavatel.brand}\nE-mail: ${dodavatel.email}\nTelefon: ${dodavatel.phone}\nBankovní spojení: ${dodavatel.bank_account} (${dodavatel.bank_name})`,
        '(dále jen „Zhotovitel")',
        '2. Objednatel:',
        `${objednatelLabel}${customer.company ? '' : ''}\n${customer.street ? `Se sídlem: ${customer.street}, ${customer.city ?? ''}\n` : ''}${customer.ico ? `IČO: ${customer.ico}\n` : ''}${customer.dic ? `DIČ: ${customer.dic}\n` : ''}${customer.representative ? `Zastoupená: ${customer.representative}\n` : ''}${customer.email ? `E-mail: ${customer.email}\n` : ''}${customer.phone ? `Telefon: ${customer.phone}` : ''}`.trim(),
        '(dále jen „Objednatel")',
        '(Zhotovitel a Objednatel společně dále jen „Smluvní strany")',
      ],
    },
    {
      title: 'II. Předmět díla',
      paragraphs: [
        `1. Zhotovitel se zavazuje na svůj náklad a nebezpečí provést pro Objednatele dílo spočívající v: ${doc.subject} (dále jen „Dílo") a Objednatel se zavazuje Dílo převzít a zaplatit za něj sjednanou cenu.`,
        '2. Specifikace Díla:',
      ],
      bullets: doc.scopeBullets.length > 0 ? doc.scopeBullets : ['Rozsah dle e-mailové dohody Smluvních stran.'],
    },
    {
      title: 'III. Doba plnění',
      paragraphs: [
        '1. Zhotovitel zahájí práce do 3 pracovních dnů ode dne (a) připsání zálohy dle čl. IV na účet Zhotovitele a (b) dodání nezbytné součinnosti Objednatele.',
        `2. Zhotovitel se zavazuje Dílo dokončit a předat ve lhůtě do ${doc.deadlineDays} kalendářních dnů ode dne zahájení prací dle odst. 1 tohoto článku.`,
        '3. Pokud bude Objednatel v prodlení s poskytnutím součinnosti (texty, podklady, přístupy, zpětná vazba), prodlužuje se lhůta automaticky o dobu tohoto prodlení.',
      ],
    },
    {
      title: 'IV. Cena díla a platební podmínky',
      paragraphs: [
        `1. Smluvní strany se dohodly na celkové ceně za provedení Díla ve výši ${fmtMoney(doc.totalPrice, doc.currency)}. ${dodavatel.vat_payer ? '' : 'Zhotovitel není plátcem DPH.'}`,
        `2. Objednatel uhradí Zhotoviteli zálohu ve výši ${doc.depositPercent} % celkové ceny Díla, tj. ${fmtMoney(deposit, doc.currency)}, na základě zálohové faktury vystavené Zhotovitelem do 5 kalendářních dnů od podpisu smlouvy. Zhotovitel není povinen zahájit práce před připsáním zálohy.`,
        `3. Doplatek ve výši ${100 - doc.depositPercent} % (${fmtMoney(remainder, doc.currency)}) uhradí Objednatel na základě konečné faktury vystavené Zhotovitelem po předání Díla. Splatnost konečné faktury činí 14 kalendářních dnů od jejího doručení Objednateli e-mailem.`,
        `4. V případě prodlení Objednatele s úhradou jakékoli faktury je Zhotovitel oprávněn účtovat úrok z prodlení ve výši ${latePctText} z dlužné částky za každý den prodlení a pozastavit veškeré práce, popř. provoz Díla či zadržet přístupové údaje, a to bez odpovědnosti za vzniklé škody.`,
        '5. Vlastnické právo k Dílu a licence dle čl. VII přechází na Objednatele až okamžikem úplného uhrazení celkové ceny Díla.',
        `6. Veškeré platby budou prováděny bezhotovostně na bankovní účet Zhotovitele ${dodavatel.bank_account} (${dodavatel.bank_name}), IBAN ${dodavatel.iban}.`,
      ],
    },
    ...(doc.monthlyFee && doc.monthlyFee > 0 ? [{
      title: 'IV.A Měsíční paušál (provozní servis)',
      paragraphs: [
        `Po předání Díla začíná plynout období placeného provozního servisu, za které Objednatel platí Zhotoviteli měsíční paušál ve výši ${fmtMoney(doc.monthlyFee, doc.currency)}. Paušál zahrnuje hosting, monitoring, bezpečnostní aktualizace, zálohování a 3 hodiny technické podpory měsíčně. Hodiny nad rámec paušálu jsou účtovány sazbou ${fmtMoney(doc.hourlyRate, doc.currency)} / hodinu.`,
      ],
    }] : []),
    {
      title: 'V. Součinnost Objednatele',
      paragraphs: [
        '1. Objednatel je povinen poskytnout Zhotoviteli veškerou nezbytnou součinnost potřebnou k řádnému provedení Díla, zejména: dodat texty, obrázky, loga, podklady; dodat přístupové údaje k doméně/hostingu; poskytovat zpětnou vazbu do 2 pracovních dnů od jejího vyžádání.',
        '2. Objednatel bere na vědomí, že kvalita a včasnost dodaných podkladů má přímý vliv na kvalitu a termín dodání Díla.',
      ],
    },
    {
      title: 'VI. Vícepráce',
      paragraphs: [
        `1. Veškeré požadavky Objednatele nad rámec specifikace Díla se považují za vícepráce a budou účtovány samostatně dle hodinové sazby Zhotovitele ve výši ${fmtMoney(doc.hourlyRate, doc.currency)} / hodina, není-li dohodnuto jinak.`,
        '2. Před zahájením víceprací sdělí Zhotovitel Objednateli odhad rozsahu a ceny. Vícepráce budou zahájeny až po písemném e-mailovém odsouhlasení Objednatelem.',
        '3. Součástí ceny Díla jsou maximálně 2 kola revizí. Další revize budou účtovány jako vícepráce.',
      ],
    },
    {
      title: 'VII. Předání Díla a licence',
      paragraphs: [
        '1. Zhotovitel předá Dílo Objednateli e-mailem nebo zpřístupněním na sjednané URL adrese. O předání bude vyhotoveno e-mailové oznámení.',
        '2. Objednatel je povinen Dílo zkontrolovat a do 5 pracovních dnů od předání jej písemně (e-mailem) akceptovat nebo sdělit konkrétní písemné výhrady. Pokud výhrady nesdělí, má se za to, že Dílo bylo bez výhrad převzato.',
        '3. Okamžikem úplného uhrazení celkové ceny Díla poskytuje Zhotovitel Objednateli nevýhradní, územně a časově neomezenou licenci k užití autorských prvků Díla pro vlastní podnikatelské účely Objednatele.',
        '4. Zhotovitel je oprávněn uvádět Dílo (název Objednatele, náhled, URL) ve svém referenčním portfoliu, nedohodnou-li se Smluvní strany písemně jinak.',
      ],
    },
    {
      title: 'VIII. Záruka a podpora',
      paragraphs: [
        `1. Zhotovitel poskytuje na Dílo záruku v délce ${doc.warrantyMonths} měsíců ode dne předání. V rámci záruky Zhotovitel bezplatně odstraní prokazatelné vady Díla způsobené Zhotovitelem.`,
        '2. Záruka se nevztahuje na vady způsobené zásahem třetí osoby, aktualizacemi knihoven třetích stran, výpadky hostingu/domény, změnami obsahu provedenými Objednatelem ani škody způsobené napadením webu třetí osobou.',
      ],
    },
    ...(doc.hasNda ? [{
      title: 'IX. Ochrana důvěrných informací (NDA)',
      paragraphs: [
        '1. Smluvní strany se zavazují zachovávat mlčenlivost o všech důvěrných informacích, které se dozvěděly v souvislosti s plněním této smlouvy.',
        '2. Důvěrnými informacemi se rozumí zejména technická architektura Díla, zdrojový kód, obchodní know-how, ceník, klientská základna, přístupové údaje a osobní údaje.',
        '3. Závazek mlčenlivosti trvá po celou dobu platnosti smlouvy a 3 roky od jejího ukončení.',
        `4. V případě prokazatelného porušení vzniká poškozené straně nárok na smluvní pokutu ve výši ${fmtMoney(doc.ndaPenalty, doc.currency)} za každé jednotlivé porušení.`,
      ],
    }] : []),
    ...(doc.hasExclusivity && doc.exclusivityClause ? [{
      title: 'X. Závazek exkluzivity',
      paragraphs: [
        doc.exclusivityClause,
      ],
    }] : []),
    {
      title: doc.hasNda ? (doc.hasExclusivity ? 'XI. Uzavření smlouvy elektronickou cestou' : 'X. Uzavření smlouvy elektronickou cestou') : 'IX. Uzavření smlouvy elektronickou cestou',
      paragraphs: [
        `Tato smlouva může být platně uzavřena též elektronickou cestou — odpovědí Objednatele na e-mail Zhotovitele ve znění: „Závazně objednávám sjednané služby a potvrzuji obsah Smlouvy o dílo." Okamžikem doručení takového e-mailu z adresy uvedené v záhlaví této smlouvy (${dodavatel.email} na straně Zhotovitele, ${customer.email ?? '[e-mail Objednatele]'} na straně Objednatele) je smlouva uzavřena se všemi právními účinky, jako by byla podepsána vlastnoručně.`,
      ],
    },
    {
      title: 'Závěrečná ustanovení',
      paragraphs: [
        '1. Tato smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník.',
        '2. Veškeré změny a doplňky této smlouvy jsou účinné pouze v písemné formě podepsané oběma stranami (za písemnou formu se považuje i e-mailová výměna s jednoznačným potvrzením).',
        '3. Případné spory budou Smluvní strany řešit přednostně smírnou cestou; jinak jsou příslušné obecné soudy ČR podle sídla Zhotovitele.',
        '4. Smluvní strany prohlašují, že si smlouvu přečetly, jejímu obsahu porozuměly a na důkaz své svobodné a vážné vůle připojují své podpisy.',
      ],
    },
  ];

  const pdfDoc = (
    <Document
      title={`Smlouva ${doc.contractNumber}`}
      author={dodavatel.brand}
      creator="ARBIQ portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.pageSerif} wrap>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          {logo ? <Image src={logo} style={{ width: 56, height: 56, marginBottom: 12 }} /> : <Text> </Text>}
          <Text style={{ fontFamily: 'Inter', fontSize: 7.5, color: COLORS.caramel, textTransform: 'uppercase', letterSpacing: 2 }}>
            {dodavatel.brand} — Smlouva o dílo
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
          <Text style={[styles.h1, { textAlign: 'center', fontSize: 32 }]}>SMLOUVA O DÍLO</Text>
          <Text style={{ fontFamily: 'Newsreader', fontSize: 14, color: COLORS.caramel, marginTop: 6, textAlign: 'center' }}>
            {doc.title}
          </Text>
          <Text style={{ fontFamily: 'Newsreader', fontSize: 9.5, color: COLORS.sandstone, marginTop: 10, fontStyle: 'italic', textAlign: 'center' }}>
            uzavřená dle § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, v platném znění
          </Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: COLORS.sandstone, marginTop: 8 }}>
            č. {doc.contractNumber}
          </Text>
        </View>

        {sections.map((sec, sidx) => (
          <View key={sidx} wrap style={{ marginBottom: 14 }}>
            <Text style={[styles.h2, { fontSize: 15, marginTop: 6 }]}>{sec.title}</Text>
            {sec.paragraphs.map((p, i) => (
              <Text key={i} style={[styles.body, { marginBottom: 6, color: COLORS.ink }]}>{p}</Text>
            ))}
            {sec.bullets && sec.bullets.length > 0 && (
              <View style={{ marginLeft: 14, marginTop: 4 }}>
                {sec.bullets.map((b, i) => (
                  <Text key={i} style={[styles.body, { marginBottom: 3, color: COLORS.ink }]}>•  {b}</Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ marginTop: 24, padding: 14, backgroundColor: COLORS.parchment, borderLeftWidth: 3, borderLeftColor: COLORS.caramel }}>
          <Text style={{ fontFamily: 'Inter', fontSize: 7.5, color: COLORS.caramel, textTransform: 'uppercase', letterSpacing: 1.4 }}>
            Celková cena
          </Text>
          <Text style={{ fontFamily: 'Newsreader', fontSize: 26, fontWeight: 700, color: COLORS.caramel, marginTop: 4 }}>
            {fmtMoney(doc.totalPrice, doc.currency)}
          </Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 9, color: COLORS.inkSoft, marginTop: 6 }}>
            Záloha {doc.depositPercent} % = {fmtMoney(deposit, doc.currency)} · Doplatek {100 - doc.depositPercent} % = {fmtMoney(remainder, doc.currency)}
            {dodavatel.vat_payer ? '' : ' · Zhotovitel není plátcem DPH'}
          </Text>
        </View>

        <View style={{ marginTop: 36, flexDirection: 'row', gap: 24 }} wrap={false}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Newsreader', fontSize: 10, color: COLORS.inkSoft }}>
              V {doc.placeOfSigning}, dne ........................
            </Text>
            <View style={{ marginTop: 36, borderTopWidth: 0.75, borderTopColor: COLORS.ink, paddingTop: 4 }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10 }}>{dodavatel.name}</Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: COLORS.sandstone }}>Zhotovitel</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Newsreader', fontSize: 10, color: COLORS.inkSoft }}>
              V {customer.city ?? '..................'}, dne ........................
            </Text>
            <View style={{ marginTop: 36, borderTopWidth: 0.75, borderTopColor: COLORS.ink, paddingTop: 4 }}>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10 }}>{customer.representative ?? objednatelLabel}</Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: COLORS.sandstone }}>
                {customer.company ? `${customer.company} — Objednatel` : 'Objednatel'}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages} · Smlouva ${doc.contractNumber}`}
          fixed
        />
      </Page>
    </Document>
  );

  return await renderToBuffer(pdfDoc);
}
