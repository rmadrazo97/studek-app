"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  PenTool,
  Library,
  User,
} from "lucide-react";
import { AddDeckSheet } from "@/components/AddDeckSheet";
import AIGenerateModal from "@/components/decks/AIGenerateModal";
import { useCapacitor } from "@/hooks/useCapacitor";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { hapticLight, hapticMedium, hapticSelection } = useCapacitor();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PenTool, label: "Create", href: "/create", isMain: true },
    { icon: Library, label: "Library", href: "/library" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  const handleOpenSheet = useCallback(() => {
    hapticMedium();
    setIsSheetOpen(true);
  }, [hapticMedium]);

  const handleCreateWithAI = useCallback(() => {
    hapticLight();
    setIsAIModalOpen(true);
  }, [hapticLight]);

  const handleCreateManual = useCallback(() => {
    hapticLight();
    router.push("/library");
  }, [hapticLight, router]);

  const handleImportAnki = useCallback(() => {
    hapticLight();
    router.push("/library");
  }, [hapticLight, router]);

  const handleAISuccess = useCallback(() => {
    // Optionally navigate to library after successful creation
    router.push("/library");
  }, [router]);

  const handleNavClick = useCallback(() => {
    hapticSelection();
  }, [hapticSelection]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-lg border-t border-zinc-800 z-50 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isMain) {
              // Center main action button (Create) - opens sheet
              return (
                <button
                  key={item.href}
                  onClick={handleOpenSheet}
                  className="relative -mt-6 active:scale-95 transition-transform"
                >
                  <div
                    className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br from-cyan-400 to-blue-500
                      shadow-[0_0_20px_rgba(34,211,238,0.4)]
                      ${isActive ? "shadow-[0_0_30px_rgba(34,211,238,0.6)]" : ""}
                    `}
                  >
                    <Icon className="w-6 h-6 text-[#09090b]" />
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-cyan-400 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] active:scale-95 transition-transform"
              >
                <div
                  className={`
                    relative p-2 rounded-xl transition-colors duration-150
                    ${isActive ? "bg-zinc-800" : ""}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 transition-colors duration-150
                      ${isActive ? "text-cyan-400" : "text-zinc-500"}
                    `}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 rounded-xl bg-cyan-400/10"
                      transition={{ type: "spring", duration: 0.3 }}
                    />
                  )}
                </div>
                <span
                  className={`
                    text-[10px] font-medium transition-colors duration-150
                    ${isActive ? "text-cyan-400" : "text-zinc-500"}
                  `}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add Deck Sheet */}
      <AddDeckSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onCreateWithAI={handleCreateWithAI}
        onCreateManual={handleCreateManual}
        onImportAnki={handleImportAnki}
      />

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </>
  );
}
