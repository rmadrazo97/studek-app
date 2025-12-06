"use client";

export function VersionFooter() {
  const version = process.env.APP_VERSION || "dev";

  return (
    <div className="fixed bottom-0 right-0 z-50 px-3 py-1.5 text-xs text-zinc-500 bg-zinc-900/80 backdrop-blur-sm border-t border-l border-zinc-800 rounded-tl-lg">
      v{version}
    </div>
  );
}
