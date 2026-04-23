interface DossierCardProps {
  label: string;
  title: string;
  children?: React.ReactNode;
  rotation?: string;
  className?: string;
}

export default function DossierCard({ label, title, children, rotation = "-rotate-3", className = "" }: DossierCardProps) {
  return (
    <div className={`relative bg-parchment text-espresso-text p-6 shadow-2xl ${rotation} ${className}`}>
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-tobacco shadow-md"></div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-brown-muted block mb-2 pb-2 border-b border-brown-muted/20">
        {label}
      </span>
      <p className="font-display text-base leading-tight">{title}</p>
      {children}
    </div>
  );
}
