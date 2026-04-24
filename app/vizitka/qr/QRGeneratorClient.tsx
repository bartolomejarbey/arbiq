'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

const BASE_URL = 'https://arbiq.cz/vizitka';
const FG = '#241B14'; // espresso
const BG = '#EDE2CC'; // parchment

export default function QRGeneratorClient() {
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const hiResRef = useRef<HTMLDivElement>(null);

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (source.trim()) params.set('utm_source', source.trim());
    if (medium.trim()) params.set('utm_medium', medium.trim());
    if (campaign.trim()) params.set('utm_campaign', campaign.trim());
    const qs = params.toString();
    return qs ? `${BASE_URL}?${qs}` : BASE_URL;
  }, [source, medium, campaign]);

  function handleDownload() {
    if (!hiResRef.current) return;
    const canvas = hiResRef.current.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'arbiq-vizitka-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-8">
      {/* Visible QR */}
      <div className="bg-parchment p-8 flex justify-center">
        <QRCodeCanvas
          value={targetUrl}
          size={300}
          level="H"
          fgColor={FG}
          bgColor={BG}
          includeMargin
          imageSettings={{
            src: '/arbiq-logo.png',
            height: 60,
            width: 60,
            excavate: true,
          }}
        />
      </div>

      {/* Target URL */}
      <div className="bg-coffee p-4 break-all font-mono text-xs text-sepia">
        <div className="text-sandstone uppercase tracking-widest text-[9px] mb-1">QR cílí na</div>
        {targetUrl}
      </div>

      {/* UTM form */}
      <section className="space-y-4">
        <h2 className="font-display italic font-black text-moonlight text-xl">UTM parametry (volitelné)</h2>
        <p className="text-sandstone text-sm">Vyplňte když chcete sledovat odkud návštěvníci přicházejí (např. „papir-vizitka" nebo „nfc-karta").</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="utm_source" value={source} setValue={setSource} placeholder="papir-vizitka" />
          <Input label="utm_medium" value={medium} setValue={setMedium} placeholder="qr" />
          <Input label="utm_campaign" value={campaign} setValue={setCampaign} placeholder="q2-2026" />
        </div>
      </section>

      {/* Download */}
      <button
        type="button"
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-3 bg-caramel hover:bg-caramel-light text-espresso font-mono text-sm uppercase tracking-widest font-bold py-4 transition-colors"
      >
        <Download size={18} strokeWidth={2.5} />
        <span>Stáhnout PNG (1024×1024)</span>
      </button>

      <p className="text-sandstone text-xs">
        Doporučení pro tisk: 1024×1024 PNG vychází na vizitce 5×5 cm při 300 DPI ostře.
        Pro menší velikosti (např. 2×2 cm na okraji vizitky) ponechte error correction H — QR pak funguje i s polovinou plochy zakrytou.
      </p>

      {/* Hidden hi-res canvas — only for download */}
      <div ref={hiResRef} aria-hidden="true" style={{ position: 'absolute', left: '-99999px', top: 0 }}>
        <QRCodeCanvas
          value={targetUrl}
          size={1024}
          level="H"
          fgColor={FG}
          bgColor={BG}
          includeMargin
          imageSettings={{
            src: '/arbiq-logo.png',
            height: 200,
            width: 200,
            excavate: true,
          }}
        />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-coffee border border-tobacco focus:border-caramel text-moonlight px-3 py-2 text-sm outline-none transition-colors"
      />
    </label>
  );
}
