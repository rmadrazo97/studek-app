"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Table2,
  Library,
  Sparkles,
  FileUp,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Check,
  Loader2,
  Settings,
  HelpCircle,
  BarChart3,
  PenTool,
  Compass,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [syncStatus] = useState<"synced" | "syncing" | "offline">("synced");

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
        return "Synced 2m ago";
      default:
        return "Offline";
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen bg-[#09090b] border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-40"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Sparkles className="w-5 h-5 text-[#09090b]" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display text-lg font-bold text-zinc-100"
              >
                Studek
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-zinc-800 text-cyan-400"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    }
                    ${isCollapsed ? "justify-center" : ""}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            );
          })}
        </div>

        {/* AI Actions Section */}
        <div className="mt-8">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
              >
                AI Actions
              </motion.p>
            )}
          </AnimatePresence>
          <Link
            href="/import"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              bg-gradient-to-r from-cyan-500/10 to-violet-500/10
              border border-cyan-500/20
              text-cyan-400 hover:text-cyan-300
              hover:border-cyan-500/40 hover:from-cyan-500/20 hover:to-violet-500/20
              transition-all duration-200
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Magic Import" : undefined}
          >
            <FileUp className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  Magic Import
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        {/* Secondary Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50
              transition-colors flex-1
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </Link>
          <Link
            href="/help"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50
              transition-colors
              ${isCollapsed ? "flex-1 justify-center" : ""}
            `}
            title={isCollapsed ? "Help" : undefined}
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>

        {/* Sync Status */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          {getSyncIcon()}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-zinc-500"
              >
                {getSyncText()}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
