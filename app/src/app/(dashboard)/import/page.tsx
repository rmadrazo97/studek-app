"use client";

import { useState } from "react";
import { Upload, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";
import { ImportAPKGModal } from "@/components/decks/ImportAPKGModal";

export default function ImportPage() {
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Import Decks</h1>
        <p className="text-zinc-400 mt-1">
          Import flashcard decks from various sources
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => setShowImportModal(true)}
          className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-500/50 hover:bg-zinc-900 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
              <FileArchive className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-100 group-hover:text-violet-400 transition-colors">
                Import Anki Deck
              </h3>
              <p className="text-sm text-zinc-500">.apkg files</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Import decks from Anki. Supports basic cards, images, and media.
          </p>
        </button>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-zinc-800">
              <Upload className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-400">CSV Import</h3>
              <p className="text-sm text-zinc-500">Coming soon</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            Import cards from spreadsheets and CSV files.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="font-medium text-zinc-100 mb-4">Import Tips</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-200">Anki .apkg files are fully supported</p>
              <p className="text-sm text-zinc-500">
                Cards, decks, and embedded media will be imported
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-200">Basic and reversed cards are converted</p>
              <p className="text-sm text-zinc-500">
                Complex note types may be simplified during import
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-200">Large decks may take a moment</p>
              <p className="text-sm text-zinc-500">
                Decks with thousands of cards are processed in the background
              </p>
            </div>
          </li>
        </ul>
      </div>

      <ImportAPKGModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
