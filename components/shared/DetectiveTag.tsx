interface DetectiveTagProps {
  children: React.ReactNode;
  variant?: "dark" | "light";
  className?: string;
}

export default function DetectiveTag({ children, variant = "dark", className = "" }: DetectiveTagProps) {
  const colors = variant === "dark"
    ? "text-caramel border-caramel/30 bg-caramel/5"
    : "text-brown-muted border-brown-muted/30 bg-brown-muted/5";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 border ${colors} font-mono text-[10px] uppercase tracking-[0.25em] ${className}`}>
      {children}
    </span>
  );
}
