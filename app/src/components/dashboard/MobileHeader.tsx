"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Compass,
  Table2,
  Library,
  Sparkles,
  FileUp,
  Settings,
  HelpCircle,
  BarChart3,
  PenTool,
  Cloud,
  Check,
  Loader2,
} from "lucide-react";

interface MobileHeaderProps {
  syncStatus?: "synced" | "syncing" | "offline";
}

export function MobileHeader({ syncStatus = "synced" }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: PenTool, label: "Creation Studio", href: "/create" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: Table2, label: "Card Browser", href: "/browser" },
  ];

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />;
      case "synced":
        return <Check className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cloud className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case "syncing":
        return "Syncing...";
      case "synced":
        return "Synced";
      default:
        return "Offline";
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#09090b]/95 backdrop-blur-lg border-b border-zinc-800 flex items-center justify-between px-4 z-50 md:hidden">
        {/* Logo - links to landing page */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Sparkles className="w-4 h-4 text-[#09090b]" />
          </div>
          <span className="font-display text-lg font-bold text-zinc-100">
            Studek
          </span>
        </Link>

        {/* Burger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              onClick={closeMenu}
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#09090b] border-l border-zinc-800 z-50 md:hidden flex flex-col"
            >
              {/* Menu Header */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                <span className="font-display text-lg font-bold text-zinc-100">
                  Menu
                </span>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-xl
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-zinc-800 text-cyan-400"
                              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* AI Actions Section */}
                <div className="mt-8">
                  <p className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    AI Actions
                  </p>
                  <Link
                    href="/import"
                    onClick={closeMenu}
                    className="
                      flex items-center gap-3 px-3 py-3 rounded-xl
                      bg-gradient-to-r from-cyan-500/10 to-violet-500/10
                      border border-cyan-500/20
                      text-cyan-400 hover:text-cyan-300
                      hover:border-cyan-500/40 hover:from-cyan-500/20 hover:to-violet-500/20
                      transition-all duration-200
                    "
                  >
                    <FileUp className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Magic Import</span>
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-zinc-800 p-3 space-y-2">
                {/* Secondary Actions */}
                <div className="flex items-center gap-1">
                  <Link
                    href="/settings"
                    onClick={closeMenu}
                    className="
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50
                      transition-colors flex-1
                    "
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <Link
                    href="/help"
                    onClick={closeMenu}
                    className="
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50
                      transition-colors
                    "
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Link>
                </div>

                {/* Sync Status */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50">
                  {getSyncIcon()}
                  <span className="text-xs text-zinc-500">{getSyncText()}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
