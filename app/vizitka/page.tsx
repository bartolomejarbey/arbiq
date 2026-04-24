import type { Metadata } from "next";
import Image from "next/image";
import { Phone, MessageSquare, Mail, Download, Globe, ArrowRight } from "lucide-react";
import DetectiveTag from "@/components/shared/DetectiveTag";
import CopyContactButton from "@/components/vizitka/CopyContactButton";

export const metadata: Metadata = {
  title: "Bartoloměj Rota — ARBIQ",
  description: "Digitální vizitka Bartoloměje Roty, zakladatele ARBIQ. Uložte si kontakt jedním klikem.",
  alternates: { canonical: "/vizitka" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Bartoloměj Rota — ARBIQ",
    description: "Digitální vizitka. Uložte si kontakt jedním klikem.",
    url: "/vizitka",
    siteName: "ARBIQ",
    locale: "cs_CZ",
    type: "profile",
    images: [{ url: "/arbiq-logo.png", width: 1024, height: 1024, alt: "ARBIQ" }],
  },
};

const PHONE_PRIMARY = "+420725932729";
const PHONE_PRIMARY_DISPLAY = "+420 725 932 729";
const PHONE_WHATSAPP = "+420725893968";
const PHONE_WHATSAPP_DIGITS = "420725893968";
const PHONE_WHATSAPP_DISPLAY = "+420 725 893 968";
const EMAIL = "bartolomej@arbiq.cz";

const CONTACT_TEXT = [
  "Bartoloměj Rota",
  "ARBIQ — Zakladatel",
  `Tel: ${PHONE_PRIMARY_DISPLAY}`,
  `WhatsApp: ${PHONE_WHATSAPP_DISPLAY}`,
  `E-mail: ${EMAIL}`,
  "Web: https://arbiq.cz",
].join("\n");

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Bartoloměj Rota",
  jobTitle: "Zakladatel",
  telephone: PHONE_PRIMARY,
  email: EMAIL,
  url: "https://arbiq.cz",
  image: "https://arbiq.cz/tym/bartolomej.jpg",
  worksFor: {
    "@type": "Organization",
    name: "ARBIQ",
    legalName: "Harotas s.r.o.",
    taxID: "21402027",
    url: "https://arbiq.cz",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Školská 689/20",
      addressLocality: "Praha 1",
      postalCode: "110 00",
      addressCountry: "CZ",
    },
  },
};

export default function VizitkaPage() {
  return (
    <main className="min-h-screen bg-espresso text-sepia px-5 py-10 md:py-14 flex justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="w-full max-w-md space-y-8">

        {/* HERO */}
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-caramel/40 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <Image
              src="/tym/bartolomej.jpg"
              alt="Bartoloměj Rota"
              fill
              className="object-cover"
              sizes="128px"
              priority
            />
          </div>
          <DetectiveTag>PŘÍPAD #001 — DIGITÁLNÍ VIZITKA</DetectiveTag>
          <h1 className="font-display italic font-black text-moonlight text-3xl md:text-5xl leading-tight">
            Bartoloměj Rota
          </h1>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-caramel">
            Zakladatel · ARBIQ
          </div>
        </header>

        {/* PRIMARY CTA */}
        <a
          href="/vizitka/bartolomej.vcf"
          download
          className="w-full flex items-center justify-center gap-3 bg-caramel hover:bg-caramel-light text-espresso font-mono text-sm uppercase tracking-widest font-bold py-5 transition-colors shadow-[0_8px_24px_rgba(201,152,106,0.25)]"
        >
          <Download size={20} strokeWidth={2.5} />
          <span>Uložit do kontaktů</span>
        </a>

        {/* QUICK ACTIONS GRID */}
        <section className="grid grid-cols-2 gap-3">
          <ActionCard
            href={`tel:${PHONE_PRIMARY}`}
            icon={<Phone size={22} />}
            label="Zavolat"
            sublabel={PHONE_PRIMARY_DISPLAY}
          />
          <ActionCard
            href={`sms:${PHONE_PRIMARY}`}
            icon={<MessageSquare size={22} />}
            label="SMS"
            sublabel={PHONE_PRIMARY_DISPLAY}
          />
          <ActionCard
            href={`mailto:${EMAIL}`}
            icon={<Mail size={22} />}
            label="E-mail"
            sublabel={EMAIL}
          />
          <ActionCard
            href={`https://wa.me/${PHONE_WHATSAPP_DIGITS}`}
            icon={<WhatsAppIcon />}
            label="WhatsApp"
            sublabel={PHONE_WHATSAPP_DISPLAY}
            external
          />
        </section>

        {/* WEB CARD */}
        <a
          href="https://arbiq.cz"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-coffee border border-tobacco hover:border-caramel transition-colors p-5 group"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 bg-tobacco/40 flex items-center justify-center text-caramel">
              <Globe size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Web</div>
              <div className="text-moonlight font-medium">arbiq.cz</div>
              <div className="text-sandstone text-xs truncate">Detektivní agentura pro digitální business</div>
            </div>
            <ArrowRight size={16} className="text-sandstone group-hover:text-caramel transition-colors" />
          </div>
        </a>

        {/* COPY CONTACT */}
        <CopyContactButton text={CONTACT_TEXT} />

        {/* MINI FOOTER */}
        <footer className="pt-8 border-t border-tobacco/40 text-center space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
            Harotas s.r.o. · IČO 21402027
          </div>
          <div className="font-mono text-[10px] tracking-widest text-sandstone/60">
            Školská 689/20, 110 00 Praha 1
          </div>
          <div className="font-mono text-[9px] tracking-widest text-sandstone/40 pt-2">
            © 2026 ARBIQ
          </div>
        </footer>

      </div>
    </main>
  );
}

function ActionCard({
  href,
  icon,
  label,
  sublabel,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  external?: boolean;
}) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a
      href={href}
      {...props}
      className="bg-coffee border border-tobacco hover:border-caramel active:bg-tobacco/40 p-5 flex flex-col items-center gap-2 text-center transition-colors"
    >
      <span className="text-caramel">{icon}</span>
      <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-moonlight">{label}</span>
      <span className="text-sandstone text-[10px] truncate w-full">{sublabel}</span>
    </a>
  );
}

function WhatsAppIcon() {
  // Minimal WhatsApp glyph (avoids extra dep). Renders inline currentColor for caramel theming.
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
