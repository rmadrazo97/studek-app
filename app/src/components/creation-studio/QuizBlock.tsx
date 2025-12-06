"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Check,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Link2,
  HelpCircle,
} from "lucide-react";
import { Block, useCreationStudio, QuizOption } from "@/stores/creationStudioStore";

interface QuizBlockProps {
  block: Block;
  isEditable?: boolean;
  onDelete?: () => void;
}

export function QuizBlock({ block, isEditable = true, onDelete }: QuizBlockProps) {
  const { updateBlock } = useCreationStudio();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const quiz = block.quizData;
  if (!quiz) return null;

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Update question
  const handleQuestionChange = useCallback(
    (value: string) => {
      updateBlock({
        ...block,
        quizData: {
          ...quiz,
          question: value,
        },
      });
    },
    [block, quiz, updateBlock]
  );

  // Update option text
  const handleOptionChange = useCallback(
    (optionId: string, value: string) => {
      updateBlock({
        ...block,
        quizData: {
          ...quiz,
          options: quiz.options.map((opt) =>
            opt.id === optionId ? { ...opt, text: value } : opt
          ),
        },
      });
    },
    [block, quiz, updateBlock]
  );

  // Toggle correct answer
  const handleToggleCorrect = useCallback(
    (optionId: string) => {
      updateBlock({
        ...block,
        quizData: {
          ...quiz,
          options: quiz.options.map((opt) => ({
            ...opt,
            isCorrect: opt.id === optionId,
          })),
        },
      });
    },
    [block, quiz, updateBlock]
  );

  // Add new option
  const handleAddOption = useCallback(() => {
    if (quiz.options.length >= 6) return;
    updateBlock({
      ...block,
      quizData: {
        ...quiz,
        options: [
          ...quiz.options,
          { id: generateId(), text: "", isCorrect: false },
        ],
      },
    });
  }, [block, quiz, updateBlock]);

  // Remove option
  const handleRemoveOption = useCallback(
    (optionId: string) => {
      if (quiz.options.length <= 2) return;
      updateBlock({
        ...block,
        quizData: {
          ...quiz,
          options: quiz.options.filter((opt) => opt.id !== optionId),
        },
      });
    },
    [block, quiz, updateBlock]
  );

  // Test mode handlers
  const handleSelectAnswer = (optionId: string) => {
    if (showResult) return;
    setSelectedAnswer(optionId);
  };

  const handleCheckAnswer = () => {
    setShowResult(true);
  };

  const handleResetTest = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const correctOption = quiz.options.find((opt) => opt.isCorrect);
  const isCorrectAnswer = selectedAnswer === correctOption?.id;

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        group relative rounded-2xl overflow-hidden
        bg-gradient-to-br from-violet-500/10 to-purple-500/10
        border ${isFocused ? "border-violet-400/50" : "border-[rgba(148,163,184,0.15)]"}
        transition-all duration-200
      `}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-500" />
          </div>

          {/* Type badge */}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            Quiz
          </span>

          {/* Source link indicator */}
          {block.sourceLink && (
            <button
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors"
              title="Go to source"
            >
              <Link2 className="w-3 h-3" />
              <span>p.{block.sourceLink.page || 1}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle test mode */}
          <button
            onClick={() => {
              setTestMode(!testMode);
              handleResetTest();
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              testMode
                ? "bg-violet-500/20 text-violet-300"
                : "text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)]"
            }`}
          >
            {testMode ? "Edit" : "Test"}
          </button>

          {/* AI Generate button */}
          <button
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-400/10 transition-all"
            title="Generate with AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-all"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete quiz"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quiz content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Question */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                  <label className="text-xs font-medium text-violet-400 uppercase tracking-wider">
                    Question
                  </label>
                </div>
                {isEditable && !testMode ? (
                  <textarea
                    value={quiz.question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    placeholder="Enter your question..."
                    className="w-full bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all min-h-[60px]"
                    rows={2}
                  />
                ) : (
                  <div className="bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 min-h-[60px]">
                    {quiz.question || "No question"}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Options {!testMode && "(click to mark correct)"}
                </label>
                <div className="space-y-2">
                  {quiz.options.map((option, index) => (
                    <motion.div
                      key={option.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl transition-all
                        ${testMode
                          ? selectedAnswer === option.id
                            ? showResult
                              ? option.isCorrect
                                ? "bg-emerald-500/20 border border-emerald-500/50"
                                : "bg-red-500/20 border border-red-500/50"
                              : "bg-violet-500/20 border border-violet-500/50"
                            : showResult && option.isCorrect
                              ? "bg-emerald-500/20 border border-emerald-500/50"
                              : "bg-[rgba(0,0,0,0.2)] border border-transparent hover:border-violet-400/30"
                          : option.isCorrect
                            ? "bg-emerald-500/20 border border-emerald-500/30"
                            : "bg-[rgba(0,0,0,0.2)] border border-transparent"
                        }
                        ${testMode && !showResult ? "cursor-pointer" : ""}
                      `}
                      onClick={() => testMode && handleSelectAnswer(option.id)}
                    >
                      {/* Option letter/indicator */}
                      <div
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm shrink-0
                          ${testMode
                            ? selectedAnswer === option.id
                              ? showResult
                                ? option.isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-red-500 text-white"
                                : "bg-violet-500 text-white"
                              : showResult && option.isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-[rgba(148,163,184,0.1)] text-slate-400"
                            : option.isCorrect
                              ? "bg-emerald-500 text-white"
                              : "bg-[rgba(148,163,184,0.1)] text-slate-400"
                          }
                        `}
                        onClick={(e) => {
                          if (!testMode && isEditable) {
                            e.stopPropagation();
                            handleToggleCorrect(option.id);
                          }
                        }}
                      >
                        {showResult && (option.isCorrect || selectedAnswer === option.id) ? (
                          option.isCorrect ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )
                        ) : (
                          optionLabels[index]
                        )}
                      </div>

                      {/* Option text */}
                      <div className="flex-1">
                        {isEditable && !testMode ? (
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              handleOptionChange(option.id, e.target.value)
                            }
                            placeholder={`Option ${optionLabels[index]}...`}
                            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-200">
                            {option.text || `Option ${optionLabels[index]}`}
                          </span>
                        )}
                      </div>

                      {/* Remove option button (edit mode only) */}
                      {isEditable && !testMode && quiz.options.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOption(option.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add option button */}
                {isEditable && !testMode && quiz.options.length < 6 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleAddOption}
                    className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.2)] text-slate-500 hover:text-violet-400 hover:border-violet-400/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add option</span>
                  </motion.button>
                )}
              </div>

              {/* Test mode actions */}
              {testMode && (
                <div className="flex items-center gap-3 pt-2">
                  {!showResult ? (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={!selectedAnswer}
                      className={`
                        flex-1 py-2.5 rounded-xl font-medium text-sm transition-all
                        ${selectedAnswer
                          ? "bg-violet-500 text-white hover:bg-violet-600"
                          : "bg-[rgba(148,163,184,0.1)] text-slate-500 cursor-not-allowed"
                        }
                      `}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <>
                      <div
                        className={`
                          flex-1 py-2.5 rounded-xl font-medium text-sm text-center
                          ${isCorrectAnswer
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                          }
                        `}
                      >
                        {isCorrectAnswer ? "Correct!" : "Incorrect"}
                      </div>
                      <button
                        onClick={handleResetTest}
                        className="px-4 py-2.5 rounded-xl bg-[rgba(148,163,184,0.1)] text-slate-300 hover:bg-[rgba(148,163,184,0.2)] font-medium text-sm transition-all"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {!testMode && (
              <div className="px-4 py-2 bg-[rgba(0,0,0,0.2)] text-xs text-slate-500 flex items-center justify-between">
                <span>Click the letter to mark the correct answer</span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Auto-saved
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuizBlock;
