"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b]">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <motion.main
          initial={false}
          animate={{ marginLeft: isSidebarCollapsed ? 72 : 280 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={isFullHeightPage ? "h-screen" : "min-h-screen"}
        >
          {isFullHeightPage ? (
            children
          ) : (
            <div className="p-6 lg:p-8">{children}</div>
          )}
        </motion.main>
      </div>
    </ProtectedRoute>
  );
}
