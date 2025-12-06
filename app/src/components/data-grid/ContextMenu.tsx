/**
 * Context Menu
 * Right-click context menu for data grid rows
 */

"use client";

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
  MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Link2,
  ChevronRight,
} from "lucide-react";
import type { ContextMenuItem, ContextMenuContext } from "./types";

// ============================================
// TYPES
// ============================================

interface ContextMenuProps {
  items: ContextMenuItem[];
  context: ContextMenuContext;
  position: { x: number; y: number };
  onClose: () => void;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  context: ContextMenuContext | null;
}

// ============================================
// MENU ITEM
// ============================================

interface MenuItemProps {
  item: ContextMenuItem;
  context: ContextMenuContext;
  onClose: () => void;
}

function MenuItem({ item, context, onClose }: MenuItemProps) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = useCallback(() => {
    if (item.disabled || hasChildren) return;
    item.action?.(context);
    onClose();
  }, [item, context, hasChildren, onClose]);

  if (item.separator) {
    return <div className="my-1 border-t border-white/10" />;
  }

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => hasChildren && setIsSubmenuOpen(true)}
      onMouseLeave={() => hasChildren && setIsSubmenuOpen(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={item.disabled}
        className={`
          w-full flex items-center gap-3 px-3 py-2
          text-sm rounded-md
          transition-colors
          ${item.disabled
            ? "opacity-50 cursor-not-allowed"
            : item.danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-foreground hover:bg-white/5"
          }
        `}
      >
        {item.icon && <span className="w-4 h-4">{item.icon}</span>}
        <span className="flex-1 text-left">{item.label}</span>
        {item.shortcut && (
          <span className="text-xs text-gray-500">{item.shortcut}</span>
        )}
        {hasChildren && <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>

      {/* Submenu */}
      <AnimatePresence>
        {hasChildren && isSubmenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="
              absolute left-full top-0 ml-1
              min-w-[160px] p-1
              bg-background-secondary
              border border-white/10
              rounded-lg shadow-xl
              z-60
            "
          >
            {item.children!.map((child, index) => (
              <MenuItem
                key={child.id || index}
                item={child}
                context={context}
                onClose={onClose}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN CONTEXT MENU
// ============================================

export function ContextMenu({
  items,
  context,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to stay within viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Use layoutEffect for synchronous DOM measurement before paint
  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 16;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 16;
    }

    const newX = Math.max(16, x);
    const newY = Math.max(16, y);

    // Only update if position changed to avoid unnecessary re-renders
    if (newX !== adjustedPosition.x || newY !== adjustedPosition.y) {
      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position, adjustedPosition.x, adjustedPosition.y]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="
        fixed z-50
        min-w-[180px] p-1
        bg-background-secondary/95 backdrop-blur-lg
        border border-white/10
        rounded-lg shadow-2xl
      "
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.id || index}
          item={item}
          context={context}
          onClose={onClose}
        />
      ))}
    </motion.div>,
    document.body
  );
}

// ============================================
// CONTEXT MENU HOOK
// ============================================

export function useContextMenu(
  items:
    | ContextMenuItem[]
    | ((context: ContextMenuContext) => ContextMenuItem[])
) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    context: null,
  });

  const open = useCallback(
    (e: MouseEvent, context: ContextMenuContext) => {
      // Check for Ctrl/Cmd key to allow native menu
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();

      setState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        context,
      });
    },
    []
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const resolvedItems =
    typeof items === "function" && state.context
      ? items(state.context)
      : (items as ContextMenuItem[]);

  const render = useCallback(() => {
    if (!state.isOpen || !state.context) return null;

    return (
      <AnimatePresence>
        <ContextMenu
          items={resolvedItems}
          context={state.context}
          position={state.position}
          onClose={close}
        />
      </AnimatePresence>
    );
  }, [state, resolvedItems, close]);

  return { open, close, render, isOpen: state.isOpen };
}

// ============================================
// PRESET MENU ITEMS
// ============================================

export function createDefaultContextMenuItems<TData>(options?: {
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onDuplicate?: (row: TData) => void;
  onCopyLink?: (row: TData) => void;
  onOpenInNewTab?: (row: TData) => void;
}): (context: ContextMenuContext) => ContextMenuItem[] {
  return (context) => {
    const items: ContextMenuItem[] = [];

    if (options?.onEdit) {
      items.push({
        id: "edit",
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        shortcut: "Enter",
        action: () => options.onEdit?.(context.row as TData),
      });
    }

    if (options?.onDuplicate) {
      items.push({
        id: "duplicate",
        label: "Duplicate",
        icon: <Copy className="w-4 h-4" />,
        shortcut: "⌘D",
        action: () => options.onDuplicate?.(context.row as TData),
      });
    }

    if (options?.onCopyLink || options?.onOpenInNewTab) {
      items.push({ id: "separator-1", label: "", separator: true });
    }

    if (options?.onCopyLink) {
      items.push({
        id: "copy-link",
        label: "Copy Link",
        icon: <Link2 className="w-4 h-4" />,
        shortcut: "⌘⇧C",
        action: () => options.onCopyLink?.(context.row as TData),
      });
    }

    if (options?.onOpenInNewTab) {
      items.push({
        id: "open-new-tab",
        label: "Open in New Tab",
        icon: <ExternalLink className="w-4 h-4" />,
        shortcut: "⌘⏎",
        action: () => options.onOpenInNewTab?.(context.row as TData),
      });
    }

    if (options?.onDelete) {
      items.push({ id: "separator-2", label: "", separator: true });
      items.push({
        id: "delete",
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        shortcut: "⌫",
        danger: true,
        action: () => options.onDelete?.(context.row as TData),
      });
    }

    return items;
  };
}
