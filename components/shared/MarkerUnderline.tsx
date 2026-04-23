interface MarkerUnderlineProps {
  children: React.ReactNode;
}

export default function MarkerUnderline({ children }: MarkerUnderlineProps) {
  return <span className="marker-underline">{children}</span>;
}
