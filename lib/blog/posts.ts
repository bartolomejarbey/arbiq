export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
};

/** Centrální registr blogových článků (zdroj pro /blog index + sitemap). */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'proc-hledat-budoucnost-v-chatgpt',
    title: 'Proč hledá Vaše budoucnost v ChatGPT, ne v Googlu',
    excerpt: 'Edukační průvodce pro úplné laiky. Co se mění v chování zákazníků, proč klasické Google vyhledávání ztrácí a co s tím.',
    tag: 'GEO / AI',
  },
  {
    slug: 'princeton-studie-male-firmy-v-ai-vyhledavani',
    title: 'Princeton dokázal, že malé firmy předhánějí korporáty. Tady jsou data.',
    excerpt: 'Polo-technický rozbor peer-reviewed studie: jak se malé firmy v AI vyhledávání dostávají před velké značky.',
    tag: 'GEO / AI',
  },
  {
    slug: 'jak-zjistit-zda-vas-chatgpt-doporucuje',
    title: 'Jak za 90 dní zjistíte, zda Vás ChatGPT doporučuje',
    excerpt: 'Praktický DIY návod krok za krokem. 30 dotazů, 5 platforem, šablona pro report.',
    tag: 'Návod',
  },
];
