type Props = {
  initial: string;
  name: string;
  size?: number;
  className?: string;
};

/**
 * Generic team-member avatar — large initial on a tonal gradient.
 * Matches the dimensions of the Image-based portraits on /tym so the grid
 * stays consistent when a real photo is missing.
 */
export default function TeamAvatar({ initial, name, size = 96, className = "" }: Props) {
  const dim = `${size}px`;
  return (
    <div
      role="img"
      aria-label={`${name} (zatím bez fotografie)`}
      className={`flex items-center justify-center bg-gradient-to-br from-tobacco to-coffee border border-caramel/20 ${className}`}
      style={{ width: dim, height: dim }}
    >
      <span className="font-display italic font-black text-caramel text-3xl select-none">
        {initial}
      </span>
    </div>
  );
}
