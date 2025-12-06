"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  PenTool,
  Library,
  BarChart3,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PenTool, label: "Create", href: "/create", isMain: true },
    { icon: Library, label: "Library", href: "/library" },
    { icon: BarChart3, label: "Stats", href: "/analytics" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-lg border-t border-zinc-800 z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isMain) {
            // Center main action button (Create)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-cyan-400 to-blue-500
                    shadow-[0_0_20px_rgba(34,211,238,0.4)]
                    ${isActive ? "shadow-[0_0_30px_rgba(34,211,238,0.6)]" : ""}
                  `}
                >
                  <Icon className="w-6 h-6 text-[#09090b]" />
                </motion.div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-cyan-400 whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px]"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`
                  relative p-2 rounded-xl transition-colors duration-200
                  ${isActive ? "bg-zinc-800" : ""}
                `}
              >
                <Icon
                  className={`
                    w-5 h-5 transition-colors duration-200
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
              </motion.div>
              <span
                className={`
                  text-[10px] font-medium transition-colors duration-200
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
  );
}
