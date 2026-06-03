export default function Loading() {
  return (
    <div className="px-4 md:px-8 py-10">
      <div className="h-7 w-56 bg-coffee animate-pulse mb-2" />
      <div className="h-4 w-80 bg-coffee/60 animate-pulse mb-8" />
      <div className="space-y-3">
        <div className="h-20 bg-coffee animate-pulse" />
        <div className="h-20 bg-coffee/70 animate-pulse" />
        <div className="h-20 bg-coffee/50 animate-pulse" />
      </div>
    </div>
  );
}
