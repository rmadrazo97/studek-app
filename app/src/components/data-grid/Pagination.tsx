/**
 * DataGrid Pagination
 * Pagination controls for the data grid
 */

"use client";

import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { DataGridInstance } from "./types";
import { useDataGridContext } from "./DataGridContext";

// ============================================
// TYPES
// ============================================

interface DataGridPaginationProps<TData> {
  instance?: DataGridInstance<TData>;
  showPageSize?: boolean;
  showRowCount?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DataGridPagination<TData>({
  instance: externalInstance,
  showPageSize = true,
  showRowCount = true,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}: DataGridPaginationProps<TData>) {
  const contextInstance = useDataGridContext<TData>();
  const instance = externalInstance ?? contextInstance;

  const { pageIndex, pageSize, totalRows } = instance.paginationState;

  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (pageIndex > 2) {
        pages.push("ellipsis");
      }

      // Pages around current
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(totalPages - 2, pageIndex + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (pageIndex < totalPages - 3) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  }, [pageIndex, totalPages]);

  return (
    <div
      className={`
        flex items-center justify-between gap-4 px-4 py-3
        bg-background-secondary/50
        border-t border-white/5
        ${className}
      `}
    >
      {/* Row count info */}
      {showRowCount && (
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="text-foreground font-medium">{startRow}</span>
          {" - "}
          <span className="text-foreground font-medium">{endRow}</span>
          {" of "}
          <span className="text-foreground font-medium">{totalRows}</span>
          {" rows"}
        </div>
      )}

      {/* Spacer if no row count */}
      {!showRowCount && <div />}

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => instance.setPageSize(Number(e.target.value))}
              className="
                px-2 py-1
                bg-background-secondary
                border border-white/10
                rounded-md
                text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-cyan-500/30
              "
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First page */}
        <motion.button
          type="button"
          onClick={() => instance.setPageIndex(0)}
          disabled={pageIndex === 0}
          className="
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors
          "
          whileTap={{ scale: 0.95 }}
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </motion.button>

        {/* Previous page */}
        <motion.button
          type="button"
          onClick={instance.previousPage}
          disabled={!instance.canPreviousPage}
          className="
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors
          "
          whileTap={{ scale: 0.95 }}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = page === pageIndex;

            return (
              <motion.button
                key={page}
                type="button"
                onClick={() => instance.setPageIndex(page)}
                className={`
                  min-w-[32px] h-8 px-2
                  rounded-md
                  text-sm font-medium
                  transition-colors
                  ${isActive
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-400 hover:text-foreground hover:bg-white/5"
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                {page + 1}
              </motion.button>
            );
          })}
        </div>

        {/* Next page */}
        <motion.button
          type="button"
          onClick={instance.nextPage}
          disabled={!instance.canNextPage}
          className="
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors
          "
          whileTap={{ scale: 0.95 }}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>

        {/* Last page */}
        <motion.button
          type="button"
          onClick={() => instance.setPageIndex(totalPages - 1)}
          disabled={pageIndex === totalPages - 1}
          className="
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors
          "
          whileTap={{ scale: 0.95 }}
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

// ============================================
// SIMPLE PAGINATION
// ============================================

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: SimplePaginationProps) {
  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="
          p-2 rounded-md
          text-gray-400 hover:text-foreground
          hover:bg-white/5
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      <span className="text-sm text-gray-400">
        Page{" "}
        <span className="text-foreground font-medium">{currentPage + 1}</span>
        {" of "}
        <span className="text-foreground font-medium">{totalPages}</span>
      </span>

      <motion.button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="
          p-2 rounded-md
          text-gray-400 hover:text-foreground
          hover:bg-white/5
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ============================================
// INFINITE SCROLL
// ============================================

interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
}: InfiniteScrollProps) {
  const handleScroll = useCallback(
    (scrollElement: HTMLElement) => {
      if (!hasMore || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < threshold) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore, threshold]
  );

  return { handleScroll };
}
