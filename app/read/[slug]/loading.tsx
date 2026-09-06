export default function Loading() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
        <div className="skeleton h-8 w-40 rounded-full" />
        <div className="skeleton h-8 w-24 rounded-full" />
      </div>
      <div className="skeleton w-full flex-1" />
    </div>
  );
}
