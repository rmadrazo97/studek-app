"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Link2,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Globe,
  Eye,
  Edit,
  Shield,
} from "lucide-react";
import { useDeckSharing, type ShareLink, type UserShare } from "@/hooks/useDecks";

// ============================================
// ShareLinkItem Component
// ============================================

interface ShareLinkItemProps {
  link: ShareLink;
  onRevoke: (linkId: string) => void;
}

function ShareLinkItem({ link, onRevoke }: ShareLinkItemProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${baseUrl}/shared/${link.code}`;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  if (!link.is_active) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-white/5">
      <div className="p-2 bg-cyan-500/10 rounded-lg">
        <Link2 className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 truncate">{shareUrl}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded ${
              link.permission === "clone"
                ? "bg-green-500/10 text-green-400"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            {link.permission}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {link.access_count} views
          {link.max_uses && ` / ${link.max_uses} max`}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={copyToClipboard}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={() => onRevoke(link.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Revoke link"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// UserShareItem Component
// ============================================

interface UserShareItemProps {
  share: UserShare;
  onRemove: (shareId: string) => void;
}

function UserShareItem({ share, onRemove }: UserShareItemProps) {
  const permissionIcon =
    share.permission === "admin" ? (
      <Shield className="w-3 h-3" />
    ) : share.permission === "write" ? (
      <Edit className="w-3 h-3" />
    ) : (
      <Eye className="w-3 h-3" />
    );

  const permissionColor =
    share.permission === "admin"
      ? "bg-purple-500/10 text-purple-400"
      : share.permission === "write"
      ? "bg-blue-500/10 text-blue-400"
      : "bg-gray-500/10 text-gray-400";

  return (
    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-white/5">
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
        {share.name?.[0]?.toUpperCase() || share.email[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {share.name || share.email}
        </p>
        {share.name && (
          <p className="text-xs text-gray-500 truncate">{share.email}</p>
        )}
      </div>
      <span
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${permissionColor}`}
      >
        {permissionIcon}
        {share.permission}
      </span>
      <button
        onClick={() => onRemove(share.id)}
        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
        title="Remove access"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
      </button>
    </div>
  );
}

// ============================================
// Main ShareDeckModal Component
// ============================================

interface ShareDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckName: string;
}

export default function ShareDeckModal({
  isOpen,
  onClose,
  deckId,
  deckName,
}: ShareDeckModalProps) {
  const {
    shareLinks,
    userShares,
    isLoading,
    createShareLink,
    shareWithUser,
    removeShareLink,
    removeUserShare,
  } = useDeckSharing(deckId);

  const [activeTab, setActiveTab] = useState<"link" | "user">("link");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read" | "write" | "admin">("read");
  const [linkPermission, setLinkPermission] = useState<"read" | "clone">("read");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateLink = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    try {
      await createShareLink({ permission: linkPermission });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  }, [createShareLink, linkPermission]);

  const handleShareWithUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await shareWithUser(email.trim(), permission);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setIsCreating(false);
    }
  }, [email, permission, shareWithUser]);

  const handleRevokeLink = useCallback(async (linkId: string) => {
    try {
      await removeShareLink(linkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke link");
    }
  }, [removeShareLink]);

  const handleRemoveUser = useCallback(async (shareId: string) => {
    try {
      await removeUserShare(shareId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove access");
    }
  }, [removeUserShare]);

  const activeLinks = shareLinks.filter((l) => l.is_active);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-background-secondary rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <Share2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Share Deck
                  </h2>
                  <p className="text-sm text-gray-500">{deckName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab("link")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "link"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-foreground"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Share Link
              </button>
              <button
                onClick={() => setActiveTab("user")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "user"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-foreground"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                </div>
              ) : activeTab === "link" ? (
                <div className="space-y-4">
                  {/* Create Link */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-gray-400">Permission:</span>
                      <select
                        value={linkPermission}
                        onChange={(e) =>
                          setLinkPermission(e.target.value as "read" | "clone")
                        }
                        className="px-3 py-1.5 text-sm bg-background text-foreground border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        <option value="read">View only</option>
                        <option value="clone">Can clone</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateLink}
                      disabled={isCreating}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      <Link2 className="w-4 h-4" />
                      Create Link
                    </button>
                  </div>

                  {/* Active Links */}
                  {activeLinks.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <h3 className="text-sm font-medium text-gray-300">
                        Active Links
                      </h3>
                      {activeLinks.map((link) => (
                        <ShareLinkItem
                          key={link.id}
                          link={link}
                          onRevoke={handleRevokeLink}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active share links</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Invite Form */}
                  <form onSubmit={handleShareWithUser} className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1.5">
                          Permission
                        </label>
                        <select
                          value={permission}
                          onChange={(e) =>
                            setPermission(e.target.value as "read" | "write" | "admin")
                          }
                          className="w-full px-3 py-2 bg-background text-foreground border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        >
                          <option value="read">Can view</option>
                          <option value="write">Can edit</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isCreating || !email.trim()}
                        className="mt-6 flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </button>
                    </div>
                  </form>

                  {/* Shared Users */}
                  {userShares.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <h3 className="text-sm font-medium text-gray-300">
                        Shared with
                      </h3>
                      {userShares.map((share) => (
                        <UserShareItem
                          key={share.id}
                          share={share}
                          onRemove={handleRemoveUser}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Not shared with anyone yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
