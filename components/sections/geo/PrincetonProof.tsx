import DetectiveTag from '@/components/shared/DetectiveTag';
import { Quote } from 'lucide-react';

export default function PrincetonProof() {
  return (
    <section className="py-24 md:py-32 bg-parchment paper-texture text-espresso-text">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <DetectiveTag variant="light" className="mb-4">AKADEMICKÝ DŮKAZ</DetectiveTag>
        <h2 className="font-display font-black text-espresso-text text-4xl md:text-5xl mb-8">
          Princeton, Georgia Tech a Allen Institute to změřili
        </h2>

        <div className="text-brown-muted text-lg leading-relaxed space-y-6 mb-12 font-serif-alt">
          <p>
            V roce 2024 publikovali výzkumníci z{' '}
            <strong className="text-espresso-text">Princetonu, Georgia Tech a Allen Institute of AI</strong>{' '}
            první peer-reviewed studii o GEO. Testovali 10 000 dotazů napříč různými obory a dokázali, že konkrétní úpravy obsahu zvyšují citace v AI odpovědích o{' '}
            <strong className="text-espresso-text">30–40 %</strong>.
          </p>
          <p>
            A co je pro Vás nejdůležitější — efekt byl{' '}
            <strong className="text-espresso-text">největší u menších, nedominantních webů</strong>. Velké značky z první pozice Google už víc získat nemohly. Malé firmy z 8.–10. pozice naopak skokově vyletěly.
          </p>
        </div>

        {/* Quote box */}
        <blockquote className="bg-parchment-aged/60 border-l-4 border-espresso-text/30 p-8 md:p-10 mb-8 relative">
          <Quote
            size={28}
            className="absolute top-4 right-6 text-espresso-text/20"
            strokeWidth={1}
          />
          <p className="font-display italic text-xl md:text-2xl text-espresso-text leading-relaxed mb-6">
            „Lower-ranked pages benefit most from GEO optimization, seeing 115% visibility improvement, while position-1 pages saw little change.&ldquo;
          </p>
          <footer className="font-mono text-xs uppercase tracking-widest text-brown-muted">
            Aggarwal et al., ACM KDD 2024
          </footer>
        </blockquote>

        <a
          href="https://arxiv.org/abs/2311.09735"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs uppercase tracking-widest text-espresso-text/70 hover:text-espresso-text underline-offset-4 hover:underline transition-colors"
        >
          Číst původní studii na arxiv.org →
        </a>
      </div>
    </section>
  );
}
