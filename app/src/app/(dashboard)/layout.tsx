"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Full-height pages that don't need padding (Creation Studio)
  const isFullHeightPage = pathname === "/create";

  // Focus mode pages - no navigation, completely immersive
  const isFocusMode = pathname === "/study";

  // Focus mode: render children directly without any navigation
  if (isFocusMode) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b]">
        {/* Mobile Header - only visible on mobile */}
        <MobileHeader />

        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Main Content - Mobile - account for header + iOS safe area */}
        <main
          className={`
            md:hidden
            ${isFullHeightPage ? "h-screen" : "min-h-screen"}
            pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(5rem+env(safe-area-inset-bottom,0px))]
          `}
        >
          {isFullHeightPage ? (
            children
          ) : (
            <div className="p-4">{children}</div>
          )}
        </main>

        {/* Main Content - Desktop (with sidebar animation) */}
        <motion.main
          initial={false}
          animate={{ marginLeft: isSidebarCollapsed ? 72 : 280 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`
            hidden md:block
            ${isFullHeightPage ? "h-screen" : "min-h-screen"}
          `}
        >
          {isFullHeightPage ? (
            children
          ) : (
            <div className="p-6 lg:p-8">{children}</div>
          )}
        </motion.main>

        {/* Mobile Bottom Navigation - only visible on mobile */}
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}
