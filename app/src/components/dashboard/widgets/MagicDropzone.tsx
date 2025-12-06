"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Video, Image, Sparkles, X, Loader2 } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
}

export function MagicDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return FileText;
    if (type.includes("video")) return Video;
    if (type.includes("image")) return Image;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = droppedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      status: "uploading" as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, progress: 100, status: "processing" as const }
                : f
            )
          );
          // Simulate processing
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === file.id ? { ...f, status: "done" as const } : f
              )
            );
          }, 2000);
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
          );
        }
      }, 200);
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-zinc-100">Magic Import</h3>
      </div>

      {/* Dropzone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? "#22d3ee" : "#27272a",
          backgroundColor: isDragging ? "rgba(34, 211, 238, 0.05)" : "transparent",
        }}
        className={`
          flex-1 border-2 border-dashed rounded-xl
          flex flex-col items-center justify-center
          cursor-pointer transition-colors
          hover:border-zinc-600 hover:bg-zinc-900/30
          min-h-[120px]
        `}
      >
        <input
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.mp4,.webm,.mov,.png,.jpg,.jpeg"
          id="file-upload"
          onChange={(e) => {
            if (e.target.files) {
              const inputFiles = Array.from(e.target.files);
              const newFiles: UploadedFile[] = inputFiles.map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: file.size,
                status: "uploading" as const,
                progress: 0,
              }));
              setFiles((prev) => [...prev, ...newFiles]);
            }
          }}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center mb-3"
          >
            <Upload className="w-5 h-5 text-cyan-400" />
          </motion.div>
          <p className="text-sm text-zinc-400 text-center">
            {isDragging ? (
              <span className="text-cyan-400">Drop files here</span>
            ) : (
              <>
                <span className="text-cyan-400">Drop PDFs or videos</span>
                <br />
                <span className="text-xs text-zinc-500">to generate flashcards with AI</span>
              </>
            )}
          </p>
        </label>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {files.slice(-3).map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FileIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        {formatFileSize(file.size)}
                      </span>
                      {file.status === "uploading" && (
                        <span className="text-xs text-cyan-400">
                          {Math.round(file.progress)}%
                        </span>
                      )}
                      {file.status === "processing" && (
                        <span className="text-xs text-violet-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing
                        </span>
                      )}
                      {file.status === "done" && (
                        <span className="text-xs text-emerald-400">
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported formats */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-600">
        <span>PDF</span>
        <span>•</span>
        <span>MP4</span>
        <span>•</span>
        <span>Images</span>
      </div>
    </div>
  );
}
