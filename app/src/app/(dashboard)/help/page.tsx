"use client";

import { HelpCircle, BookOpen, MessageCircle, ExternalLink } from "lucide-react";

export default function HelpPage() {
  const helpItems = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of creating decks and studying with spaced repetition.",
    },
    {
      icon: HelpCircle,
      title: "Study Tips",
      description: "Best practices for effective learning and retention.",
    },
    {
      icon: MessageCircle,
      title: "Contact Support",
      description: "Get help from our team for any questions or issues.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Help & Support</h1>
        <p className="text-zinc-400 mt-1">
          Find answers and get help with Studek
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {helpItems.map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-800">
                <item.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-medium text-zinc-100">{item.title}</h3>
            </div>
            <p className="text-sm text-zinc-400">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <h2 className="font-medium text-zinc-100 mb-3">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>Study consistently every day for best retention</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>Rate cards honestly - it helps the algorithm optimize your learning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>Keep cards simple with one concept per card</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>Use the analytics page to track your progress</span>
          </li>
        </ul>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div>
          <p className="text-zinc-100 font-medium">Need more help?</p>
          <p className="text-sm text-zinc-400">Visit our documentation for detailed guides</p>
        </div>
        <a
          href="https://github.com/rmadrazo97/studek-app/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          Report Issue
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
