import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DetectiveTag from "@/components/shared/DetectiveTag";
import QRGeneratorClient from "./QRGeneratorClient";

export const metadata: Metadata = {
  title: "QR kód pro vizitku",
  description: "Generátor QR kódu cílícího na arbiq.cz/vizitka. Pro tisk na papírové vizitky a NFC karty.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/vizitka/qr" },
};

export default function QRPage() {
  return (
    <main className="min-h-screen bg-espresso text-sepia px-5 py-10 md:py-14 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">

        <Link
          href="/vizitka"
          className="inline-flex items-center gap-2 text-sandstone hover:text-caramel font-mono text-[10px] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={12} /> Zpět na vizitku
        </Link>

        <header className="space-y-3">
          <DetectiveTag>QR · K TISKU</DetectiveTag>
          <h1 className="font-display italic font-black text-moonlight text-3xl md:text-5xl leading-tight">
            QR kód pro vizitku
          </h1>
          <p className="text-sandstone">
            Naskenováním QR kódu se na mobilu otevře <code className="text-caramel font-mono text-sm">arbiq.cz/vizitka</code> — digitální vizitka s rychlými akcemi.
          </p>
        </header>

        <QRGeneratorClient />

      </div>
    </main>
  );
}
