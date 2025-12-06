"use client";

import dynamic from "next/dynamic";

// Dynamically import the library content with SSR disabled
const LibraryContent = dynamic(() => import("./LibraryContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  ),
});

export default function LibraryPage() {
  return <LibraryContent />;
}
