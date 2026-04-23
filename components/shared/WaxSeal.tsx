interface WaxSealProps {
  text?: string;
  subtext?: string;
  className?: string;
}

export default function WaxSeal({ text = "OVĚŘENO", subtext = "ARBIQ 2026", className = "" }: WaxSealProps) {
  return (
    <div className={`wax-seal w-32 h-32 rounded-full bg-rust/90 border-4 border-rust/60 flex flex-col items-center justify-center -rotate-12 ${className}`}>
      <span className="font-mono text-[9px] text-moonlight tracking-widest">PŘÍPAD</span>
      <span className="font-display text-xl text-moonlight leading-none mt-1">{text}</span>
      <div className="w-8 h-px bg-moonlight/40 my-2"></div>
      <span className="font-mono text-[8px] text-moonlight/70">{subtext}</span>
    </div>
  );
}
