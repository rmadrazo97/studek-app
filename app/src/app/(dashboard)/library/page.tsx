/**
 * Library Demo Page
 * Showcases the DataGrid component with sample flashcard data
 */

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
  useContextMenu,
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
  question: string;
  deck: string;
  status: "new" | "learning" | "review" | "mastered";
  difficulty: "easy" | "medium" | "hard";
  stability: number;
  dueDate: string;
  lastReviewed: string | null;
  reviewCount: number;
  createdAt: string;
  tags: string[];
}

// ============================================
// SAMPLE DATA GENERATOR
// ============================================

function generateSampleData(count: number): Flashcard[] {
  const decks = [
    "JavaScript Fundamentals",
    "React Hooks",
    "TypeScript",
    "Algorithms",
    "System Design",
    "Database Concepts",
    "CSS & Styling",
    "Node.js",
  ];

  const questions = [
    "What is a closure?",
    "Explain the event loop",
    "What is the difference between let and const?",
    "How does useState work?",
    "What is TypeScript?",
    "Explain Big O notation",
    "What is REST?",
    "What is flexbox?",
    "Explain async/await",
    "What is a Promise?",
    "What are React hooks?",
    "Explain CSS specificity",
    "What is SQL injection?",
    "Explain microservices",
    "What is CAP theorem?",
    "How does garbage collection work?",
    "What is memoization?",
    "Explain virtual DOM",
    "What is a higher-order function?",
    "Explain prototype inheritance",
  ];

  const statuses: Flashcard["status"][] = ["new", "learning", "review", "mastered"];
  const difficulties: Flashcard["difficulty"][] = ["easy", "medium", "hard"];
  const tags = ["important", "review-later", "favorite", "exam", "concept", "practice"];

  return Array.from({ length: count }, (_, i) => {
    const createdAt = new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    );
    const dueDate = new Date(
      Date.now() + (Math.random() * 14 - 7) * 24 * 60 * 60 * 1000
    );
    const lastReviewed = Math.random() > 0.3
      ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const randomTags: string[] = [];
    const tagCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      if (!randomTags.includes(tag)) {
        randomTags.push(tag);
      }
    }

    return {
      id: `card_${i + 1}`,
      question: questions[i % questions.length] + ` (${i + 1})`,
      deck: decks[Math.floor(Math.random() * decks.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      stability: Math.round(Math.random() * 100) / 100,
      dueDate: dueDate.toISOString(),
      lastReviewed,
      reviewCount: Math.floor(Math.random() * 50),
      createdAt: createdAt.toISOString(),
      tags: randomTags,
    };
  });
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

const columns: ColumnDef<Flashcard>[] = [
  {
    id: "question",
    header: "Question",
    accessorKey: "question",
    type: "text",
    width: 300,
    minWidth: 200,
    sortable: true,
    filterable: true,
  },
  {
    id: "deck",
    header: "Deck",
    accessorKey: "deck",
    type: "enum",
    width: 180,
    sortable: true,
    filterable: true,
    options: [
      { value: "JavaScript Fundamentals", label: "JavaScript Fundamentals" },
      { value: "React Hooks", label: "React Hooks" },
      { value: "TypeScript", label: "TypeScript" },
      { value: "Algorithms", label: "Algorithms" },
      { value: "System Design", label: "System Design" },
      { value: "Database Concepts", label: "Database Concepts" },
      { value: "CSS & Styling", label: "CSS & Styling" },
      { value: "Node.js", label: "Node.js" },
    ],
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    type: "badge",
    width: 120,
    sortable: true,
    filterable: true,
    options: [
      { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400" },
      { value: "learning", label: "Learning", color: "bg-yellow-500/20 text-yellow-400" },
      { value: "review", label: "Review", color: "bg-purple-500/20 text-purple-400" },
      { value: "mastered", label: "Mastered", color: "bg-green-500/20 text-green-400" },
    ],
  },
  {
    id: "difficulty",
    header: "Difficulty",
    accessorKey: "difficulty",
    type: "badge",
    width: 100,
    sortable: true,
    filterable: true,
    options: [
      { value: "easy", label: "Easy", color: "bg-green-500/20 text-green-400" },
      { value: "medium", label: "Medium", color: "bg-yellow-500/20 text-yellow-400" },
      { value: "hard", label: "Hard", color: "bg-red-500/20 text-red-400" },
    ],
  },
  {
    id: "stability",
    header: "Stability",
    accessorKey: "stability",
    type: "progress",
    width: 140,
    sortable: true,
    align: "center",
  },
  {
    id: "dueDate",
    header: "Due Date",
    accessorKey: "dueDate",
    type: "date",
    width: 130,
    sortable: true,
    filterable: true,
  },
  {
    id: "reviewCount",
    header: "Reviews",
    accessorKey: "reviewCount",
    type: "number",
    width: 90,
    sortable: true,
    align: "right",
  },
  {
    id: "createdAt",
    header: "Created",
    accessorKey: "createdAt",
    type: "date",
    width: 130,
    sortable: true,
  },
];

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LibraryPage() {
  // Sample data
  const [data] = useState(() => generateSampleData(500));
  const gridRef = useRef<DataGridInstance<Flashcard>>(null);

  // Saved views
  const [savedViews, setSavedViews] = useState<ViewState[]>([
    {
      id: "view_due_today",
      name: "Due Today",
      type: "system",
      config: {
        filters: [],
        sorting: [{ columnId: "dueDate", direction: "asc" }],
        grouping: null,
        columnVisibility: {},
        columnOrder: columns.map((c) => c.id),
        columnWidths: {},
        density: "default",
      },
    },
    {
      id: "view_new_cards",
      name: "New Cards",
      type: "system",
      config: {
        filters: [{ columnId: "status", operator: "is", value: "new" }],
        sorting: [{ columnId: "createdAt", direction: "desc" }],
        grouping: null,
        columnVisibility: {},
        columnOrder: columns.map((c) => c.id),
        columnWidths: {},
        density: "default",
      },
    },
  ]);

  // Bulk actions
  const bulkActions: BulkAction<Flashcard>[] = useMemo(
    () => [
      createBulkDeleteAction(async (rows) => {
        console.log("Deleting rows:", rows);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
      createBulkArchiveAction(async (rows) => {
        console.log("Archiving rows:", rows);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
      createBulkTagAction(async (rows) => {
        console.log("Tagging rows:", rows);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
      {
        id: "change-status",
        label: "Change Status",
        icon: <Edit className="w-4 h-4" />,
        action: async (rows) => {
          console.log("Changing status for rows:", rows);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      },
    ],
    []
  );

  // Context menu
  const contextMenuItems = useMemo(
    () =>
      createDefaultContextMenuItems<Flashcard>({
        onEdit: (row) => console.log("Edit:", row),
        onDelete: (row) => console.log("Delete:", row),
        onDuplicate: (row) => console.log("Duplicate:", row),
        onCopyLink: (row) => {
          navigator.clipboard.writeText(`${window.location.origin}/card/${row.id}`);
          console.log("Link copied:", row.id);
        },
      }),
    []
  );

  const handleViewSave = useCallback((view: ViewState) => {
    setSavedViews((prev) => [...prev, view]);
  }, []);

  const handleViewDelete = useCallback((viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
  }, []);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Card Library
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and organize your flashcard collection
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            className="
              flex items-center gap-2 px-4 py-2
              bg-background-secondary
              border border-white/10
              rounded-lg
              text-sm text-gray-400
              hover:text-foreground hover:border-white/20
              transition-colors
            "
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-4 h-4" />
            Import
          </motion.button>

          <motion.button
            type="button"
            className="
              flex items-center gap-2 px-4 py-2
              bg-background-secondary
              border border-white/10
              rounded-lg
              text-sm text-gray-400
              hover:text-foreground hover:border-white/20
              transition-colors
            "
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>

          <motion.button
            type="button"
            className="
              flex items-center gap-2 px-4 py-2
              bg-cyan-500
              rounded-lg
              text-sm text-white font-medium
              hover:bg-cyan-400
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

        {/* Pagination */}
        <DataGridPagination
          showPageSize
          showRowCount
          pageSizeOptions={[25, 50, 100, 250]}
        />
      </div>

      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          fixed bottom-6 left-1/2 -translate-x-1/2
          flex items-center gap-4 px-4 py-3
          bg-background-secondary/95 backdrop-blur-lg
          border border-white/10
          rounded-xl shadow-2xl
          z-40
        "
      >
        <ViewManager
          views={savedViews}
          onSave={handleViewSave}
          onDelete={handleViewDelete}
        />

        <div className="w-px h-6 bg-white/10" />

        <DataGridToolbar
          showSearch
          showFilters
          showDensity
          showColumnToggle
          className="!p-0 !bg-transparent !border-0"
        />
      </motion.div>

      {/* Bulk Action Bar */}
      <BulkActionBar actions={bulkActions} />

      {/* Stats bar */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 px-4 py-2 bg-background-secondary/80 backdrop-blur rounded-lg border border-white/10">
        <div className="text-xs text-gray-500">
          <span className="text-foreground font-medium">{data.length}</span> cards total
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-green-400 font-medium">
            {data.filter((d) => d.status === "mastered").length}
          </span>{" "}
          mastered
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-yellow-400 font-medium">
            {data.filter((d) => new Date(d.dueDate) <= new Date()).length}
          </span>{" "}
          due
        </div>
      </div>
    </div>
  );
}
