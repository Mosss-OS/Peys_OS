import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, Share2, UserPlus, UserMinus, 
  Lock, Globe, Eye, EyeOff, MoreHorizontal, Send,
  Loader2, Heart as HeartFilled, Bookmark, BookmarkPlus,
  ChevronDown, Filter, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface FeedItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    walletAddress: string;
  };
  type: "payment" | "request" | "achievement" | "tip";
  action: string;
  amount: number;
  token: string;
  recipient?: string;
  isPublic: boolean;
  timestamp: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  reactions: { emoji: string; count: number }[];
}

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
  };
  text: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  walletAddress: string;
  isFollowing: boolean;
  isBlocked: boolean;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: "1",
    user: { id: "1", name: "Alice", avatar: "A", walletAddress: "0x1234...5678" },
    type: "payment",
    action: "sent a payment",
    amount: 25.00,
    token: "USDC",
    recipient: "0xabcd...efgh",
    isPublic: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    likes: 12,
    liked: false,
    comments: [
      { id: "1", user: { id: "2", name: "Bob" }, text: "Thanks for the coffee!", timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
    ],
    reactions: [{ emoji: "❤️", count: 3 }, { emoji: "☕", count: 2 }],
  },
  {
    id: "2",
    user: { id: "2", name: "Bob", avatar: "B", walletAddress: "0x5678...9012" },
    type: "achievement",
    action: "earned the 'Power User' badge",
    amount: 0,
    token: "USDC",
    isPublic: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 8,
    liked: true,
    comments: [],
    reactions: [{ emoji: "🎉", count: 5 }],
  },
  {
    id: "3",
    user: { id: "3", name: "Charlie", avatar: "C", walletAddress: "0x9012...3456" },
    type: "payment",
    action: "received a payment",
    amount: 100.00,
    token: "USDC",
    isPublic: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    likes: 24,
    liked: false,
    comments: [],
    reactions: [{ emoji: "🔥", count: 10 }],
  },
  {
    id: "4",
    user: { id: "4", name: "Diana", avatar: "D", walletAddress: "0x3456...7890" },
    type: "tip",
    action: "sent a tip",
    amount: 5.00,
    token: "USDC",
    recipient: "0xabcd...efgh",
    isPublic: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likes: 3,
    liked: false,
    comments: [],
    reactions: [{ emoji: "🙏", count: 1 }],
  },
];

const RECOMMENDED_USERS: User[] = [
  { id: "5", name: "Eve", avatar: "E", walletAddress: "0x5678...9012", isFollowing: false, isBlocked: false },
  { id: "6", name: "Frank", avatar: "F", walletAddress: "0x7890...1234", isFollowing: true, isBlocked: false },
  { id: "7", name: "Grace", avatar: "G", walletAddress: "0x9012...3456", isFollowing: false, isBlocked: false },
];

export default function SocialFeedPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(INITIAL_FEED);
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>(RECOMMENDED_USERS);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "friends">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const filteredFeed = useMemo(() => {
    let items = feedItems;

    if (filter === "public") {
      items = items.filter(item => item.isPublic);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.user.name.toLowerCase().includes(query) ||
        item.action.toLowerCase().includes(query)
      );
    }

    return items;
  }, [feedItems, filter, searchQuery]);

  const toggleLike = (itemId: string) => {
    setFeedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          liked: !item.liked,
          likes: item.liked ? item.likes - 1 : item.likes + 1,
        };
      }
      return item;
    }));
  };

  const addComment = (itemId: string) => {
    if (!newComment.trim()) return;

    setFeedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const comment: Comment = {
          id: crypto.randomUUID(),
          user: { id: "current", name: "You" },
          text: newComment,
          timestamp: new Date().toISOString(),
        };
        return {
          ...item,
          comments: [...item.comments, comment],
        };
      }
      return item;
    }));
    setNewComment("");
    toast.success("Comment added!");
  };

  const toggleFollow = (userId: string) => {
    setRecommendedUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newFollow = !user.isFollowing;
        toast.success(newFollow ? "Following user" : "Unfollowed user");
        return { ...user, isFollowing: newFollow };
      }
      return user;
    }));
  };

  const toggleBlock = (userId: string) => {
    setRecommendedUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newBlock = !user.isBlocked;
        toast.success(newBlock ? "User blocked" : "User unblocked");
        return { ...user, isBlocked: newBlock };
      }
      return user;
    }));
  };

  const sharePost = async (item: FeedItem) => {
    const shareText = `${item.user.name} ${item.action} ${item.amount > 0 ? `${item.amount} ${item.token}` : ""}`;
    await navigator.clipboard.writeText(shareText);
    toast.success("Post link copied!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Social Feed</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            See what your friends are doing and share your own payment activities
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to View Feed
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Social Feed</h1>
            <p className="mt-1 text-sm text-muted-foreground">Payment activities from friends</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "public" | "friends")}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="friends">Friends</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Feed Items */}
            <div className="space-y-3">
              {filteredFeed.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {item.user.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{item.user.name}</p>
                          {!item.isPublic && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="mb-3">
                    <p className="text-foreground">
                      {item.type === "achievement" ? (
                        <span>
                          <span className="font-medium">{item.user.name}</span> {item.action} 🏆
                        </span>
                      ) : (
                        <span>
                          <span className="font-medium">{item.user.name}</span> {item.action}
                          {item.amount > 0 && (
                            <span className="ml-1 font-bold text-green-600">
                              {item.amount} {item.token}
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Reactions */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.reactions.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => toggleLike(item.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        item.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      {item.liked ? (
                        <HeartFilled className="h-4 w-4 fill-current" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                      {item.likes}
                    </button>
                    <button
                      onClick={() => setShowComments(showComments === item.id ? null : item.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {item.comments.length}
                    </button>
                    <button
                      onClick={() => sharePost(item)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>

                  {/* Comments */}
                  <AnimatePresence>
                    {showComments === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2">
                          {item.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 text-sm">
                              <span className="font-medium">{comment.user.name}:</span>
                              <span className="text-muted-foreground">{comment.text}</span>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                              onClick={() => addComment(item.id)}
                              className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                            >
                              <Send className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Recommended Users */}
            <div className="rounded-xl border border-border bg-card p-4 mt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Recommended Users</h3>
              <div className="space-y-3">
                {recommendedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.walletAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFollow(user.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          user.isFollowing
                            ? "bg-secondary text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </button>
                      <button
                        onClick={() => toggleBlock(user.id)}
                        className={`rounded-lg px-2 py-1.5 text-xs transition-colors ${
                          user.isBlocked
                            ? "bg-red-500/20 text-red-500"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {user.isBlocked ? (
                          <UserMinus className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
