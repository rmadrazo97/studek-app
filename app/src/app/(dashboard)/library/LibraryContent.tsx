"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Archive,
  Tag,
  Edit,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  DataGrid,
  DataGridToolbar,
  DataGridPagination,
  BulkActionBar,
  ViewManager,
  createDefaultContextMenuItems,
  createBulkDeleteAction,
  createBulkArchiveAction,
  createBulkTagAction,
} from "@/components/data-grid";
import type {
  ColumnDef,
  DataGridInstance,
  BulkAction,
  ViewState,
} from "@/components/data-grid";

// ============================================
// SAMPLE DATA TYPES
// ============================================

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  tags: string[];
  dueDate: Date;
  interval: number;
  easeFactor: number;
  reviewCount: number;
  status: "new" | "learning" | "review" | "relearning";
  createdAt: Date;
  lastReviewedAt: Date | null;
}

// ============================================
// SAMPLE DATA GENERATION
// ============================================

const DECKS = [
  "Medical Biochemistry",
  "Anatomy",
  "Pharmacology",
  "Pathology",
  "Physiology",
];

const TAGS = [
  "high-yield",
  "FA",
  "Sketchy",
  "B&B",
  "Pathoma",
  "exam",
  "step1",
  "memorize",
];

const SAMPLE_FRONTS = [
  "What is the rate-limiting enzyme of glycolysis?",
  "Name the layers of the epidermis from deep to superficial",
  "What are the side effects of ACE inhibitors?",
  "Describe the mechanism of action of metformin",
  "What is the most common cause of community-acquired pneumonia?",
  "List the branches of the external carotid artery",
  "What is the function of the Na+/K+ ATPase pump?",
  "Describe the pathophysiology of diabetic ketoacidosis",
  "What are the risk factors for DVT?",
  "Name the cranial nerves in order",
];

const SAMPLE_BACKS = [
  "Phosphofructokinase-1 (PFK-1)",
  "Stratum basale → spinosum → granulosum → lucidum → corneum",
  "Dry cough, angioedema, hyperkalemia, teratogenic",
  "Inhibits hepatic gluconeogenesis and activates AMPK",
  "Streptococcus pneumoniae",
  "Superior thyroid, ascending pharyngeal, lingual, facial, occipital, posterior auricular, maxillary, superficial temporal",
  "Maintains resting membrane potential by pumping 3 Na+ out and 2 K+ in",
  "Insulin deficiency → increased lipolysis → ketone body production → metabolic acidosis",
  "Virchow's triad: stasis, endothelial injury, hypercoagulability",
  "Olfactory, Optic, Oculomotor, Trochlear, Trigeminal, Abducens, Facial, Vestibulocochlear, Glossopharyngeal, Vagus, Accessory, Hypoglossal",
];

function generateSampleData(count: number): Flashcard[] {
  const data: Flashcard[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(
      now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000
    );
    const status = ["new", "learning", "review", "relearning"][
      Math.floor(Math.random() * 4)
    ] as Flashcard["status"];

    const dueOffset = Math.random() * 30 - 15;
    const dueDate = new Date(now.getTime() + dueOffset * 24 * 60 * 60 * 1000);

    data.push({
      id: `card-${i + 1}`,
      front:
        SAMPLE_FRONTS[Math.floor(Math.random() * SAMPLE_FRONTS.length)] +
        ` (#${i + 1})`,
      back: SAMPLE_BACKS[Math.floor(Math.random() * SAMPLE_BACKS.length)],
      deck: DECKS[Math.floor(Math.random() * DECKS.length)],
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => TAGS[Math.floor(Math.random() * TAGS.length)]
      ).filter((v, i, a) => a.indexOf(v) === i),
      dueDate,
      interval: Math.floor(Math.random() * 365),
      easeFactor: 2.0 + Math.random() * 1.0,
      reviewCount: Math.floor(Math.random() * 50),
      status,
      createdAt,
      lastReviewedAt:
        status === "new" ? null : new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return data;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

const columns: ColumnDef<Flashcard>[] = [
  {
    id: "front",
    header: "Front",
    accessorKey: "front",
    type: "text",
    width: 300,
    minWidth: 200,
    resizable: true,
    sortable: true,
    filterable: true,
  },
  {
    id: "back",
    header: "Back",
    accessorKey: "back",
    type: "text",
    width: 300,
    minWidth: 200,
    resizable: true,
    filterable: true,
  },
  {
    id: "deck",
    header: "Deck",
    accessorKey: "deck",
    type: "enum",
    width: 180,
    resizable: true,
    sortable: true,
    filterable: true,
    enumOptions: DECKS.map((d) => ({ value: d, label: d })),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    type: "enum",
    width: 120,
    sortable: true,
    filterable: true,
    enumOptions: [
      { value: "new", label: "New", color: "#3b82f6" },
      { value: "learning", label: "Learning", color: "#f59e0b" },
      { value: "review", label: "Review", color: "#22c55e" },
      { value: "relearning", label: "Relearning", color: "#ef4444" },
    ],
  },
  {
    id: "dueDate",
    header: "Due Date",
    accessorKey: "dueDate",
    type: "date",
    width: 120,
    sortable: true,
    filterable: true,
  },
  {
    id: "interval",
    header: "Interval",
    accessorKey: "interval",
    type: "number",
    width: 100,
    sortable: true,
    cell: ({ value }) => `${value}d`,
  },
  {
    id: "easeFactor",
    header: "Ease",
    accessorKey: "easeFactor",
    type: "number",
    width: 80,
    sortable: true,
    cell: ({ value }) => (value as number).toFixed(2),
  },
  {
    id: "reviewCount",
    header: "Reviews",
    accessorKey: "reviewCount",
    type: "number",
    width: 90,
    sortable: true,
  },
  {
    id: "tags",
    header: "Tags",
    accessorKey: "tags",
    type: "text",
    width: 200,
    cell: ({ value }) => (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded"
          >
            {tag}
          </span>
        ))}
        {(value as string[]).length > 3 && (
          <span className="px-1.5 py-0.5 text-[10px] bg-gray-500/10 text-gray-400 rounded">
            +{(value as string[]).length - 3}
          </span>
        )}
      </div>
    ),
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function LibraryContent() {
  // Generate sample data
  const [data] = useState(() => generateSampleData(500));
  const [savedViews, setSavedViews] = useState<ViewState[]>([]);
  const gridRef = useRef<DataGridInstance<Flashcard>>(null);

  // Context menu items
  const contextMenuItems = useMemo(
    () => [
      ...createDefaultContextMenuItems<Flashcard>(),
      { type: "separator" as const },
      {
        id: "study",
        label: "Study Now",
        icon: <Sparkles className="w-4 h-4" />,
        onClick: (row: Flashcard) => console.log("Study:", row),
      },
      {
        id: "preview",
        label: "Preview Card",
        icon: <ExternalLink className="w-4 h-4" />,
        onClick: (row: Flashcard) => console.log("Preview:", row),
      },
    ],
    []
  );

  // Bulk actions
  const bulkActions: BulkAction<Flashcard>[] = useMemo(
    () => [
      createBulkDeleteAction<Flashcard>({
        onDelete: async (rows) => {
          console.log("Deleting rows:", rows.length);
          await new Promise((r) => setTimeout(r, 1000));
        },
      }),
      createBulkArchiveAction<Flashcard>({
        onArchive: async (rows) => {
          console.log("Archiving rows:", rows.length);
          await new Promise((r) => setTimeout(r, 500));
        },
      }),
      createBulkTagAction<Flashcard>({
        availableTags: TAGS,
        onAddTags: async (rows, tags) => {
          console.log("Adding tags:", tags, "to", rows.length, "rows");
          await new Promise((r) => setTimeout(r, 500));
        },
        onRemoveTags: async (rows, tags) => {
          console.log("Removing tags:", tags, "from", rows.length, "rows");
          await new Promise((r) => setTimeout(r, 500));
        },
      }),
    ],
    []
  );

  // View management
  const handleViewSave = useCallback((view: ViewState) => {
    setSavedViews((prev) => {
      const existing = prev.findIndex((v) => v.id === view.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = view;
        return updated;
      }
      return [...prev, view];
    });
  }, []);

  const handleViewDelete = useCallback((viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Card Library</h1>
          <p className="text-sm text-gray-500">
            Manage and organize your flashcard collection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            className="
              flex items-center gap-2 px-4 py-2
              text-sm text-gray-300
              bg-background-secondary/50
              border border-white/10 rounded-lg
              hover:bg-background-secondary hover:border-white/20
              transition-colors
            "
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-4 h-4" />
            Import
          </motion.button>
          <motion.button
            className="
              flex items-center gap-2 px-4 py-2
              text-sm text-gray-300
              bg-background-secondary/50
              border border-white/10 rounded-lg
              hover:bg-background-secondary hover:border-white/20
              transition-colors
            "
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            className="
              flex items-center gap-2 px-4 py-2
              text-sm text-white font-medium
              bg-gradient-to-r from-cyan-500 to-blue-600
              rounded-lg
              hover:opacity-90
              transition-colors
            "
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            New Card
          </motion.button>
        </div>
      </div>

      {/* Data Grid Container */}
      <div className="bg-background-secondary/30 rounded-xl border border-white/5 overflow-hidden">
        {/* Grid with all features */}
        <DataGrid
          ref={gridRef}
          data={data}
          columns={columns}
          getRowId={(row) => row.id}
          enableSorting
          enableSelection
          selectionMode="multiple"
          enableVirtualization
          enableColumnResize
          enableKeyboardNavigation
          striped
          stickyHeader
          maxHeight="calc(100vh - 280px)"
          defaultSort={[{ columnId: "dueDate", direction: "asc" }]}
          contextMenuItems={contextMenuItems}
          onRowClick={(row) => console.log("Row clicked:", row)}
          onRowDoubleClick={(row) => console.log("Row double clicked:", row)}
          onSelectionChange={(ids, rows) =>
            console.log("Selection changed:", ids.length, "rows")
          }
        />

        {/* Pagination - rendered inside the grid */}
      </div>

      {/* Stats bar */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 px-4 py-2 bg-background-secondary/80 backdrop-blur rounded-lg border border-white/10">
        <div className="text-xs text-gray-500">
          <span className="text-foreground font-medium">{data.length}</span>{" "}
          cards total
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="text-xs text-gray-500">
          <span className="text-cyan-400 font-medium">
            {data.filter((c) => c.dueDate <= new Date()).length}
          </span>{" "}
          due today
        </div>
      </div>
    </div>
  );
}
