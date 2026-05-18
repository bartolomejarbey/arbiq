import 'server-only';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { ContractDoc, ContractCustomer } from '@/lib/pdf/contract';
import type { Dodavatel } from '@/lib/config/dodavatel';

function fmtMoney(value: number, currency = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function p(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType] } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: 120 },
    children: [
      new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, font: 'Calibri' }),
    ],
  });
}

function h(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2, opts: { size?: number; color?: string } = {}): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 140 },
    children: [
      new TextRun({ text, bold: true, size: opts.size ?? 28, color: opts.color ?? '241B14', font: 'Calibri' }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: 'Calibri' })],
  });
}

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D8C9B0', space: 4 } },
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text: '' })],
  });
}

export async function renderContractDocx(opts: {
  doc: ContractDoc;
  customer: ContractCustomer;
  dodavatel: Dodavatel;
}): Promise<Buffer> {
  const { doc, customer, dodavatel } = opts;
  const deposit = Math.round(doc.totalPrice * doc.depositPercent / 100);
  const remainder = doc.totalPrice - deposit;
  const latePctText = `${(doc.lateFeePerDay * 100).toFixed(2)} %`;
  const objednatelLabel = customer.company ?? customer.full_name;

  const children: Paragraph[] = [];

  // Title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: dodavatel.brand.toUpperCase(), bold: true, color: 'C9986A', size: 18, font: 'Calibri' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: 'SMLOUVA O DÍLO', bold: true, size: 44, font: 'Calibri' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: doc.title, bold: true, color: 'C9986A', size: 26, font: 'Calibri' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'uzavřená dle § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, v platném znění', italics: true, size: 18, color: '8B7B65', font: 'Calibri' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [new TextRun({ text: `č. ${doc.contractNumber}`, size: 18, color: '8B7B65', font: 'Calibri' })],
  }));

  // I. Smluvní strany
  children.push(h('I. Smluvní strany'));
  children.push(p('1. Zhotovitel:', { bold: true }));
  children.push(p(dodavatel.name, { bold: true }));
  children.push(p(`Sídlo: ${dodavatel.street}, ${dodavatel.city}`));
  children.push(p(`IČO: ${dodavatel.ico}`));
  children.push(p(dodavatel.vat_payer && dodavatel.dic ? `DIČ: ${dodavatel.dic}` : 'Neplátce DPH'));
  children.push(p(dodavatel.legal_form));
  children.push(p(`Provozující značku: ${dodavatel.brand}`));
  children.push(p(`E-mail: ${dodavatel.email}`));
  children.push(p(`Telefon: ${dodavatel.phone}`));
  children.push(p(`Bankovní spojení: ${dodavatel.bank_account} (${dodavatel.bank_name})`));
  children.push(p('(dále jen „Zhotovitel")', { italics: true }));

  children.push(p('2. Objednatel:', { bold: true }));
  children.push(p(objednatelLabel, { bold: true }));
  if (customer.street) children.push(p(`Sídlo: ${customer.street}${customer.city ? ', ' + customer.city : ''}`));
  if (customer.ico) children.push(p(`IČO: ${customer.ico}`));
  if (customer.dic) children.push(p(`DIČ: ${customer.dic}`));
  if (customer.representative) children.push(p(`Zastoupená: ${customer.representative}`));
  if (customer.email) children.push(p(`E-mail: ${customer.email}`));
  if (customer.phone) children.push(p(`Telefon: ${customer.phone}`));
  children.push(p('(dále jen „Objednatel")', { italics: true }));
  children.push(p('(Zhotovitel a Objednatel společně dále jen „Smluvní strany")', { italics: true }));

  // II. Předmět díla
  children.push(h('II. Předmět díla'));
  children.push(p(`1. Zhotovitel se zavazuje na svůj náklad a nebezpečí provést pro Objednatele dílo spočívající v: ${doc.subject} (dále jen „Dílo") a Objednatel se zavazuje Dílo převzít a zaplatit za něj sjednanou cenu.`));
  if (doc.scopeBullets.length > 0) {
    children.push(p('2. Specifikace Díla:'));
    for (const b of doc.scopeBullets) children.push(bullet(b));
  }

  // III. Doba plnění
  children.push(h('III. Doba plnění'));
  children.push(p('1. Zhotovitel zahájí práce do 3 pracovních dnů ode dne (a) připsání zálohy dle čl. IV na účet Zhotovitele a (b) dodání nezbytné součinnosti Objednatele.'));
  children.push(p(`2. Zhotovitel se zavazuje Dílo dokončit a předat ve lhůtě do ${doc.deadlineDays} kalendářních dnů ode dne zahájení prací dle odst. 1 tohoto článku.`));
  children.push(p('3. Pokud bude Objednatel v prodlení s poskytnutím součinnosti, prodlužuje se lhůta automaticky o dobu tohoto prodlení.'));

  // IV. Cena
  children.push(h('IV. Cena díla a platební podmínky'));
  children.push(p(`1. Celková cena Díla činí ${fmtMoney(doc.totalPrice, doc.currency)}. ${dodavatel.vat_payer ? '' : 'Zhotovitel není plátcem DPH.'}`, { bold: true }));
  children.push(p(`2. Objednatel uhradí zálohu ${doc.depositPercent} % = ${fmtMoney(deposit, doc.currency)} na základě zálohové faktury vystavené do 5 kalendářních dnů od podpisu. Zhotovitel není povinen zahájit práce před připsáním zálohy.`));
  children.push(p(`3. Doplatek ${100 - doc.depositPercent} % = ${fmtMoney(remainder, doc.currency)} uhradí Objednatel na základě konečné faktury vystavené po předání. Splatnost 14 kalendářních dnů od doručení e-mailem.`));
  children.push(p(`4. V případě prodlení s úhradou je Zhotovitel oprávněn účtovat úrok z prodlení ${latePctText} z dlužné částky za každý den prodlení.`));
  children.push(p('5. Vlastnické právo k Dílu a licence dle čl. VII přechází na Objednatele až okamžikem úplného uhrazení.'));
  children.push(p(`6. Platby na účet Zhotovitele: ${dodavatel.bank_account} (${dodavatel.bank_name}), IBAN ${dodavatel.iban}.`));

  if (doc.monthlyFee && doc.monthlyFee > 0) {
    children.push(h('IV.A Měsíční paušál (provozní servis)'));
    children.push(p(`Po předání Díla Objednatel platí měsíční paušál ${fmtMoney(doc.monthlyFee, doc.currency)} (hosting, monitoring, aktualizace, 3 hodiny podpory). Hodiny nad rámec ${fmtMoney(doc.hourlyRate, doc.currency)} / hodinu.`));
  }

  // V. Součinnost
  children.push(h('V. Součinnost Objednatele'));
  children.push(p('1. Objednatel poskytne Zhotoviteli veškerou nezbytnou součinnost: texty, podklady, přístupové údaje, zpětnou vazbu do 2 pracovních dnů.'));
  children.push(p('2. Kvalita a včasnost dodaných podkladů má přímý vliv na kvalitu a termín dodání Díla.'));

  // VI. Vícepráce
  children.push(h('VI. Vícepráce'));
  children.push(p(`1. Požadavky nad rámec specifikace Díla se účtují samostatně dle hodinové sazby ${fmtMoney(doc.hourlyRate, doc.currency)} / hodina.`));
  children.push(p('2. Před zahájením víceprací Zhotovitel sdělí odhad rozsahu a ceny; vícepráce se zahájí po písemném e-mailovém odsouhlasení.'));
  children.push(p('3. Součástí ceny Díla jsou maximálně 2 kola revizí. Další revize budou účtovány jako vícepráce.'));

  // VII. Předání a licence
  children.push(h('VII. Předání Díla a licence'));
  children.push(p('1. Zhotovitel předá Dílo e-mailem nebo na sjednané URL. O předání bude e-mailové oznámení.'));
  children.push(p('2. Objednatel Dílo zkontroluje a do 5 pracovních dnů jej e-mailem akceptuje nebo sdělí konkrétní písemné výhrady. Bez výhrad = převzato.'));
  children.push(p('3. Okamžikem úplného uhrazení ceny poskytuje Zhotovitel Objednateli nevýhradní, územně a časově neomezenou licenci pro vlastní podnikatelské účely.'));
  children.push(p('4. Zhotovitel je oprávněn uvádět Dílo ve svém referenčním portfoliu.'));

  // VIII. Záruka
  children.push(h('VIII. Záruka a podpora'));
  children.push(p(`1. Záruka v délce ${doc.warrantyMonths} měsíců ode dne předání. V rámci záruky Zhotovitel bezplatně odstraní prokazatelné vady způsobené Zhotovitelem.`));
  children.push(p('2. Záruka se nevztahuje na vady způsobené zásahem třetí osoby, aktualizacemi knihoven, výpadky hostingu/domény, změnami obsahu Objednatelem.'));

  // NDA
  if (doc.hasNda) {
    children.push(h('IX. Ochrana důvěrných informací (NDA)'));
    children.push(p('1. Smluvní strany se zavazují zachovávat mlčenlivost o všech důvěrných informacích získaných v souvislosti s plněním smlouvy.'));
    children.push(p('2. Důvěrnými informacemi se rozumí zejména technická architektura, zdrojový kód, obchodní know-how, ceník, klientská základna, přístupy a osobní údaje.'));
    children.push(p('3. Závazek mlčenlivosti trvá po celou dobu platnosti smlouvy a 3 roky od jejího ukončení.'));
    children.push(p(`4. V případě prokazatelného porušení vzniká smluvní pokuta ${fmtMoney(doc.ndaPenalty, doc.currency)} za každé jednotlivé porušení.`));
  }

  if (doc.hasExclusivity && doc.exclusivityClause) {
    children.push(h(`${doc.hasNda ? 'X' : 'IX'}. Závazek exkluzivity`));
    children.push(p(doc.exclusivityClause));
  }

  // Závěrečná ustanovení
  children.push(h('Závěrečná ustanovení'));
  children.push(p('1. Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník.'));
  children.push(p('2. Veškeré změny a doplňky jsou účinné pouze v písemné formě podepsané oběma stranami (za písemnou formu se považuje i e-mailová výměna s jednoznačným potvrzením).'));
  children.push(p('3. Spory budou Smluvní strany řešit přednostně smírnou cestou; jinak jsou příslušné obecné soudy ČR podle sídla Zhotovitele.'));
  children.push(p(`4. Smlouva může být platně uzavřena též elektronickou cestou — odpovědí Objednatele z adresy ${customer.email ?? '[e-mail Objednatele]'} ve znění „Závazně objednávám sjednané služby a potvrzuji obsah Smlouvy o dílo". Okamžikem doručení je smlouva uzavřena se všemi právními účinky.`));
  children.push(p('5. Smluvní strany prohlašují, že si smlouvu přečetly, jejímu obsahu porozuměly a na důkaz své svobodné a vážné vůle připojují své podpisy.'));

  // Podpisy
  children.push(divider());
  children.push(new Paragraph({
    spacing: { before: 240, after: 60 },
    children: [
      new TextRun({ text: `V ${doc.placeOfSigning}, dne ............................`, font: 'Calibri', size: 22 }),
      new TextRun({ text: '\t\t\t\t', font: 'Calibri', size: 22 }),
      new TextRun({ text: `V ${customer.city ?? '..................'}, dne ............................`, font: 'Calibri', size: 22 }),
    ],
  }));
  children.push(new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: '' })] }));
  children.push(new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '_____________________________', font: 'Calibri', size: 22 }),
      new TextRun({ text: '\t\t\t\t', font: 'Calibri', size: 22 }),
      new TextRun({ text: '_____________________________', font: 'Calibri', size: 22 }),
    ],
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: dodavatel.name, bold: true, font: 'Calibri', size: 22 }),
      new TextRun({ text: '\t\t\t\t\t', font: 'Calibri', size: 22 }),
      new TextRun({ text: customer.representative ?? objednatelLabel, bold: true, font: 'Calibri', size: 22 }),
    ],
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'Zhotovitel', color: '8B7B65', font: 'Calibri', size: 18 }),
      new TextRun({ text: '\t\t\t\t\t\t\t', font: 'Calibri', size: 22 }),
      new TextRun({ text: customer.company ? `${customer.company} — Objednatel` : 'Objednatel', color: '8B7B65', font: 'Calibri', size: 18 }),
    ],
  }));

  const docxDoc = new Document({
    creator: 'ARBIQ portal',
    title: `Smlouva ${doc.contractNumber}`,
    description: doc.title,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
        },
      },
      children,
    }],
  });

  return await Packer.toBuffer(docxDoc);
}
