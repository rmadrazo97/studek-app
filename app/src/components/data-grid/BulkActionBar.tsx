/**
 * Bulk Action Bar
 * Floating action bar that appears when multiple rows are selected
 */

"use client";

import { ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Archive,
  Edit,
  Tag,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { BulkAction, DataGridInstance } from "./types";
import { useDataGridContext } from "./DataGridContext";

// ============================================
// TYPES
// ============================================

interface BulkActionBarProps<TData> {
  instance?: DataGridInstance<TData>;
  actions?: BulkAction<TData>[];
  className?: string;
  position?: "bottom" | "top";
}

interface ActionButtonProps<TData> {
  action: BulkAction<TData>;
  selectedRows: TData[];
  isLoading: boolean;
  onAction: () => void;
}

// ============================================
// ACTION BUTTON
// ============================================

function ActionButton<TData>({
  action,
  selectedRows,
  isLoading,
  onAction,
}: ActionButtonProps<TData>) {
  const disabled = isLoading || action.disabled?.(selectedRows);

  const variantClasses = {
    default: "bg-white/5 hover:bg-white/10 text-foreground",
    primary: "bg-cyan-500 hover:bg-cyan-400 text-white",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400",
  };

  return (
    <motion.button
      type="button"
      onClick={onAction}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-1.5
        rounded-lg
        text-sm font-medium
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[action.variant ?? "default"]}
      `}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        action.icon
      )}
      <span>{action.label}</span>
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BulkActionBar<TData>({
  instance: externalInstance,
  actions = [],
  className = "",
  position = "bottom",
}: BulkActionBarProps<TData>) {
  const contextInstance = useDataGridContext<TData>();
  const instance = externalInstance ?? contextInstance;

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedCount = instance.selectedRowCount;
  const selectedRows = instance.getSelectedRows();
  const isVisible = selectedCount > 0;

  const handleAction = useCallback(
    async (action: BulkAction<TData>) => {
      if (loadingActionId) return;

      setLoadingActionId(action.id);
      setNotification(null);

      try {
        await action.action(selectedRows);
        setNotification({
          type: "success",
          message: `Successfully performed "${action.label}" on ${selectedCount} items`,
        });

        // Auto-clear notification
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        setNotification({
          type: "error",
          message: error instanceof Error ? error.message : "Action failed",
        });
      } finally {
        setLoadingActionId(null);
      }
    },
    [loadingActionId, selectedRows, selectedCount]
  );

  // Separate visible and overflow actions
  const visibleActions = actions.slice(0, 4);
  const overflowActions = actions.slice(4);

  const positionClasses = {
    bottom: "bottom-6 left-1/2 -translate-x-1/2",
    top: "top-6 left-1/2 -translate-x-1/2",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === "bottom" ? 20 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "bottom" ? 20 : -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`
            fixed ${positionClasses[position]}
            z-50
            ${className}
          `}
        >
          <div
            className="
              flex items-center gap-3 px-4 py-3
              bg-background-secondary/95 backdrop-blur-lg
              border border-white/10
              rounded-xl shadow-2xl
            "
          >
            {/* Selection Count */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <span className="text-sm font-medium text-foreground">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={instance.clearSelection}
                className="
                  p-1 rounded-md
                  text-gray-400 hover:text-foreground
                  hover:bg-white/10
                  transition-colors
                "
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {visibleActions.map((action) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  selectedRows={selectedRows}
                  isLoading={loadingActionId === action.id}
                  onAction={() => handleAction(action)}
                />
              ))}

              {/* Overflow Menu */}
              {overflowActions.length > 0 && (
                <OverflowMenu
                  actions={overflowActions}
                  selectedRows={selectedRows}
                  loadingActionId={loadingActionId}
                  onAction={handleAction}
                />
              )}
            </div>

            {/* Notification */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    flex items-center gap-2 pl-3 border-l border-white/10
                    text-sm
                    ${notification.type === "success" ? "text-green-400" : "text-red-400"}
                  `}
                >
                  {notification.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{notification.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// OVERFLOW MENU
// ============================================

interface OverflowMenuProps<TData> {
  actions: BulkAction<TData>[];
  selectedRows: TData[];
  loadingActionId: string | null;
  onAction: (action: BulkAction<TData>) => void;
}

function OverflowMenu<TData>({
  actions,
  selectedRows,
  loadingActionId,
  onAction,
}: OverflowMenuProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-2 rounded-lg
          bg-white/5 hover:bg-white/10
          text-gray-400 hover:text-foreground
          transition-colors
        "
        whileTap={{ scale: 0.95 }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="
                absolute bottom-full right-0 mb-2
                min-w-[160px] p-1
                bg-background-secondary
                border border-white/10
                rounded-lg shadow-xl
                z-50
              "
            >
              {actions.map((action) => {
                const disabled =
                  loadingActionId === action.id || action.disabled?.(selectedRows);

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      onAction(action);
                      setIsOpen(false);
                    }}
                    disabled={disabled}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2
                      text-sm rounded-md
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        action.variant === "danger"
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-foreground hover:bg-white/5"
                      }
                    `}
                  >
                    {loadingActionId === action.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      action.icon
                    )}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// PRESET ACTIONS
// ============================================

export function createBulkDeleteAction<TData>(
  onDelete: (rows: TData[]) => Promise<void>
): BulkAction<TData> {
  return {
    id: "delete",
    label: "Delete",
    icon: <Trash2 className="w-4 h-4" />,
    variant: "danger",
    action: onDelete,
  };
}

export function createBulkArchiveAction<TData>(
  onArchive: (rows: TData[]) => Promise<void>
): BulkAction<TData> {
  return {
    id: "archive",
    label: "Archive",
    icon: <Archive className="w-4 h-4" />,
    variant: "default",
    action: onArchive,
  };
}

export function createBulkEditAction<TData>(
  onEdit: (rows: TData[]) => Promise<void>
): BulkAction<TData> {
  return {
    id: "edit",
    label: "Edit",
    icon: <Edit className="w-4 h-4" />,
    variant: "default",
    action: onEdit,
  };
}

export function createBulkTagAction<TData>(
  onTag: (rows: TData[]) => Promise<void>
): BulkAction<TData> {
  return {
    id: "tag",
    label: "Add Tag",
    icon: <Tag className="w-4 h-4" />,
    variant: "default",
    action: onTag,
  };
}
