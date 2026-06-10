/**
 * @file Manages bookmarks, categories, and quick-access items persisted to localStorage.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, BookmarkPlus, BookmarkCheck, X, Folder, 
  FolderOpen, FolderPlus, Star, MoreHorizontal, 
  Search, Clock, ChevronRight, Trash2, Edit2
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { toast } from "sonner";

/** A single saved bookmark with optional category and favorite status. */
interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  categoryId?: string;
  createdAt: string;
  isFavorite: boolean;
}

/** A named category used to group bookmarks together. */
interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
}

/** A shortcut item shown in the quick-access bar. */
interface QuickAccessItem {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const DEFAULT_CATEGORIES: BookmarkCategory[] = [
  { id: "general", name: "General", color: "#6B7280" },
  { id: "finance", name: "Finance", color: "#10B981" },
  { id: "tools", name: "Tools", color: "#3B82F6" },
];

const QUICK_ACCESS_DEFAULT = [
  { id: "1", title: "Send Payment", url: "/send", icon: "📤" },
  { id: "2", title: "Transaction History", url: "/history", icon: "📜" },
  { id: "3", title: "Contacts", url: "/contacts", icon: "👥" },
];

/**
 * Hook for managing bookmarks, categories, and quick-access items.
 * All data is persisted to localStorage.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessItem[]>([]);

  // Hydrate state from localStorage on mount (or use defaults)
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("peys_bookmarks");
    const savedCategories = localStorage.getItem("peys_categories");
    const savedQuickAccess = localStorage.getItem("peys_quick_access");

    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    else setBookmarks([]);

    if (savedCategories) setCategories(JSON.parse(savedCategories));
    else setCategories(DEFAULT_CATEGORIES);

    if (savedQuickAccess) setQuickAccess(JSON.parse(savedQuickAccess));
    else setQuickAccess(QUICK_ACCESS_DEFAULT);
  }, []);

  useEffect(() => {
    localStorage.setItem("peys_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("peys_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("peys_quick_access", JSON.stringify(quickAccess));
  }, [quickAccess]);

  /** Add a new bookmark with an auto-generated ID and timestamp. */
  const addBookmark = (bookmark: Omit<BookmarkItem, "id" | "createdAt" | "isFavorite">) => {
    const newBookmark: BookmarkItem = {
      ...bookmark,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    setBookmarks(prev => [...prev, newBookmark]);
    toast.success("Bookmark added!");
    return newBookmark;
  };

  /** Remove a bookmark by its ID. */
  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success("Bookmark removed");
  };

  /** Toggle a bookmark's favorite status. */
  const toggleFavorite = (id: string) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
    ));
  };

  /** Create a new bookmark category. */
  const addCategory = (name: string, color: string) => {
    const newCategory: BookmarkCategory = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  /** Delete a category; bookmarks in it are reassigned to "general". */
  const removeCategory = (id: string) => {
    if (id === "general") {
      toast.error("Cannot remove default category");
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    // Move bookmarks from deleted category to general
    setBookmarks(prev => prev.map(b =>
      b.categoryId === id ? { ...b, categoryId: "general" } : b
    ));
  };

  /** Move a bookmark to a different category. */
  const updateBookmarkCategory = (bookmarkId: string, categoryId: string) => {
    setBookmarks(prev => prev.map(b =>
      b.id === bookmarkId ? { ...b, categoryId } : b
    ));
  };

  return {
    bookmarks,
    categories,
    quickAccess,
    addBookmark,
    removeBookmark,
    toggleFavorite,
    addCategory,
    removeCategory,
    updateBookmarkCategory,
  };
}

/**
 * A floating bottom bar displaying quick-access shortcuts.
 * Navigates to the selected URL when a button is pressed.
 */
export function QuickAccessBar({ onSelect }: { onSelect: (url: string) => void }) {
  const { quickAccess } = useBookmarks();

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-1 rounded-full bg-card border border-border px-3 py-2 shadow-lg">
      {quickAccess.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.url)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title={item.title}
        >
          <span className="text-lg">{item.icon}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * A modal overlay that lists all bookmarks with search and management controls.
 * Only renders when `show` is true.
 */
export function BookmarksList({ show }: { show: boolean }) {
  const { bookmarks, categories, removeBookmark, toggleFavorite } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState("");

  if (!show) return null;

  // Filter bookmarks by the current search query (case-insensitive)
  const filteredBookmarks = bookmarks.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-card p-6 max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-lg font-display mb-4">Bookmarks</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-4"
        />
        <div className="space-y-2">
          {filteredBookmarks.map((bookmark) => {
            const category = categories.find(c => c.id === bookmark.categoryId);
            return (
              <div key={bookmark.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <span>{bookmark.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{bookmark.title}</p>
                    {category && (
                      <span className="text-xs text-muted-foreground" style={{ color: category.color }}>
                        {category.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorite(bookmark.id)}
                    className="p-1 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    <Star className={`h-4 w-4 ${bookmark.isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    className="p-1 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredBookmarks.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No bookmarks yet</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
