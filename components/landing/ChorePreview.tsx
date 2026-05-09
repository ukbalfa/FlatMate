'use client';

export function ChorePreview() {
  return (
    <div className="w-full mt-8 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/5 flex items-center px-4 gap-3">
          <div className="w-4 h-4 rounded-full border border-white/20" />
          <div className="h-2 w-16 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  );
}