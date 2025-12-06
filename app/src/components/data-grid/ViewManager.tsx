/**
 * View Manager
 * Save, load, and manage grid views with URL state synchronization
 */

"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Plus,
  Trash2,
  Check,
  Lock,
  Globe,
  MoreVertical,
} from "lucide-react";
import type { DataGridInstance, ViewState } from "./types";
import { useDataGridContext } from "./DataGridContext";

// ============================================
// TYPES
// ============================================

interface ViewManagerProps<TData> {
  instance?: DataGridInstance<TData>;
  views?: ViewState[];
  onSave?: (view: ViewState) => void;
  onDelete?: (viewId: string) => void;
  className?: string;
}

interface SaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: ViewState["type"]) => void;
  defaultName?: string;
}

// ============================================
// URL STATE SYNC HOOK
// ============================================

interface UseUrlStateOptions {
  paramName?: string;
  enabled?: boolean;
}

export function useUrlStateSync<TData>(
  instance: DataGridInstance<TData>,
  options: UseUrlStateOptions = {}
) {
  const { paramName = "view", enabled = true } = options;

  // Serialize state to URL
  const serializeState = useCallback(() => {
    const state = {
      f: instance.filterState,
      s: instance.sortState,
      g: instance.groupState.groupByColumnId,
      cv: instance.columnVisibility,
      co: instance.columnOrder,
      cw: instance.columnWidths,
      d: instance.density,
    };

    return btoa(JSON.stringify(state));
  }, [instance]);

  // Deserialize state from URL
  const deserializeState = useCallback(
    (encoded: string) => {
      try {
        const state = JSON.parse(atob(encoded));

        if (state.f) instance.setFilterState(state.f);
        if (state.s) instance.setSortState(state.s);
        if (state.g !== undefined) instance.setGroupBy(state.g);
        if (state.cv) instance.setColumnVisibility(state.cv);
        if (state.co) instance.setColumnOrder(state.co);
        if (state.cw) {
          Object.entries(state.cw).forEach(([id, width]) => {
            instance.setColumnWidth(id, width as number);
          });
        }
        if (state.d) instance.setDensity(state.d);
      } catch (error) {
        console.error("Failed to deserialize URL state:", error);
      }
    },
    [instance]
  );

  // Update URL when state changes
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const serialized = serializeState();
    const url = new URL(window.location.href);
    url.searchParams.set(paramName, serialized);

    window.history.replaceState({}, "", url.toString());
  }, [
    enabled,
    paramName,
    serializeState,
    instance.filterState,
    instance.sortState,
    instance.groupState.groupByColumnId,
    instance.columnVisibility,
    instance.columnOrder,
    instance.columnWidths,
    instance.density,
  ]);

  // Load state from URL on mount
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const encoded = url.searchParams.get(paramName);

    if (encoded) {
      deserializeState(encoded);
    }
  }, [enabled, paramName, deserializeState]);

  return {
    serializeState,
    deserializeState,
    getShareableUrl: () => {
      if (typeof window === "undefined") return "";
      const url = new URL(window.location.href);
      url.searchParams.set(paramName, serializeState());
      return url.toString();
    },
  };
}

// ============================================
// SAVE VIEW MODAL
// ============================================

function SaveViewModal({
  isOpen,
  onClose,
  onSave,
  defaultName = "",
}: SaveViewModalProps) {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState<ViewState["type"]>("personal");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onSave(name.trim(), type);
        setName("");
        onClose();
      }
    },
    [name, type, onSave, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-md p-6
          bg-background-secondary
          border border-white/10
          rounded-xl shadow-2xl
          z-50
        "
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Save View
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              View Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom View"
              className="
                w-full px-3 py-2
                bg-background
                border border-white/10
                rounded-lg
                text-sm text-foreground
                placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-cyan-500/30
              "
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("personal")}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2
                  rounded-lg text-sm
                  transition-colors
                  ${type === "personal"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-background border border-white/10 text-gray-400 hover:text-foreground"
                  }
                `}
              >
                <Lock className="w-4 h-4" />
                Personal
              </button>
              <button
                type="button"
                onClick={() => setType("shared")}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2
                  rounded-lg text-sm
                  transition-colors
                  ${type === "shared"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-background border border-white/10 text-gray-400 hover:text-foreground"
                  }
                `}
              >
                <Globe className="w-4 h-4" />
                Shared
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-4 py-2
                bg-background
                border border-white/10
                rounded-lg
                text-sm text-gray-400
                hover:text-foreground
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="
                flex-1 px-4 py-2
                bg-cyan-500
                rounded-lg
                text-sm text-white font-medium
                hover:bg-cyan-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Save View
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

// ============================================
// VIEW LIST ITEM
// ============================================

interface ViewListItemProps {
  view: ViewState;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ViewListItem({
  view,
  isActive,
  onSelect,
  onDelete,
}: ViewListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const typeIcons = {
    system: <Lock className="w-3 h-3" />,
    personal: <Lock className="w-3 h-3" />,
    shared: <Globe className="w-3 h-3" />,
  };

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2
        rounded-md
        cursor-pointer
        transition-colors
        ${isActive ? "bg-cyan-500/20" : "hover:bg-white/5"}
      `}
      onClick={onSelect}
    >
      <span
        className={`
          text-sm
          ${isActive ? "text-cyan-400 font-medium" : "text-foreground"}
        `}
      >
        {view.name}
      </span>

      <span className="text-gray-500 ml-1">{typeIcons[view.type]}</span>

      {isActive && <Check className="w-4 h-4 text-cyan-400 ml-auto" />}

      {view.type !== "system" && (
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="
              opacity-0 group-hover:opacity-100
              p-1 rounded
              text-gray-500 hover:text-foreground
              transition-all
            "
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="
                    absolute right-0 top-full mt-1
                    min-w-[120px] p-1
                    bg-background-secondary
                    border border-white/10
                    rounded-lg shadow-xl
                    z-50
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onDelete();
                      setIsMenuOpen(false);
                    }}
                    className="
                      w-full flex items-center gap-2 px-3 py-2
                      text-sm text-red-400
                      rounded-md
                      hover:bg-red-500/10
                      transition-colors
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN VIEW MANAGER
// ============================================

export function ViewManager<TData>({
  instance: externalInstance,
  views = [],
  onSave,
  onDelete,
  className = "",
}: ViewManagerProps<TData>) {
  const contextInstance = useDataGridContext<TData>();
  const instance = externalInstance ?? contextInstance;

  const [isOpen, setIsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const currentViewId = instance.currentView?.id;

  const groupedViews = useMemo(() => {
    const system = views.filter((v) => v.type === "system");
    const personal = views.filter((v) => v.type === "personal");
    const shared = views.filter((v) => v.type === "shared");
    return { system, personal, shared };
  }, [views]);

  const handleSave = useCallback(
    (name: string, type: ViewState["type"]) => {
      const view = instance.saveView(name, type);
      onSave?.(view);
    },
    [instance, onSave]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2
          bg-background-secondary
          border border-white/10
          rounded-lg
          text-sm text-gray-400 hover:text-foreground
          transition-colors
        "
      >
        <FolderOpen className="w-4 h-4" />
        <span>{instance.currentView?.name ?? "Default View"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="
                absolute top-full left-0 mt-2
                w-64 p-2
                bg-background-secondary
                border border-white/10
                rounded-lg shadow-xl
                z-50
              "
            >
              {/* Save Current View */}
              <button
                type="button"
                onClick={() => {
                  setIsSaveModalOpen(true);
                  setIsOpen(false);
                }}
                className="
                  w-full flex items-center gap-2 px-3 py-2 mb-2
                  bg-cyan-500/10
                  border border-cyan-500/20
                  rounded-md
                  text-sm text-cyan-400
                  hover:bg-cyan-500/20
                  transition-colors
                "
              >
                <Plus className="w-4 h-4" />
                Save Current View
              </button>

              {/* System Views */}
              {groupedViews.system.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
                    System Views
                  </div>
                  {groupedViews.system.map((view) => (
                    <ViewListItem
                      key={view.id}
                      view={view}
                      isActive={currentViewId === view.id}
                      onSelect={() => {
                        instance.loadView(view);
                        setIsOpen(false);
                      }}
                      onDelete={() => onDelete?.(view.id)}
                    />
                  ))}
                </div>
              )}

              {/* Personal Views */}
              {groupedViews.personal.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
                    My Views
                  </div>
                  {groupedViews.personal.map((view) => (
                    <ViewListItem
                      key={view.id}
                      view={view}
                      isActive={currentViewId === view.id}
                      onSelect={() => {
                        instance.loadView(view);
                        setIsOpen(false);
                      }}
                      onDelete={() => onDelete?.(view.id)}
                    />
                  ))}
                </div>
              )}

              {/* Shared Views */}
              {groupedViews.shared.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
                    Shared Views
                  </div>
                  {groupedViews.shared.map((view) => (
                    <ViewListItem
                      key={view.id}
                      view={view}
                      isActive={currentViewId === view.id}
                      onSelect={() => {
                        instance.loadView(view);
                        setIsOpen(false);
                      }}
                      onDelete={() => onDelete?.(view.id)}
                    />
                  ))}
                </div>
              )}

              {views.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No saved views yet
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSaveModalOpen && (
          <SaveViewModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
