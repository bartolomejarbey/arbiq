import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="bg-coffee p-12 text-center">
      <div className="font-display italic text-moonlight text-2xl mb-3">{title}</div>
      {description && (
        <p className="text-sandstone max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
