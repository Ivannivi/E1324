import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { 
  Menu, Search, Star, Home, Settings, Info, 
  Download, ExternalLink, X, ChevronLeft, ChevronRight,
  Bot, Loader2, Play, Heart, Share2, Sparkles,
  MessageSquare, User, Save, Globe, Shield,
  Flame, Bookmark, History, Clock, ListPlus, LogIn, LogOut, BookOpen,
  Ban, Plus, Trash2, CheckCircle2, Circle, Key, Laptop
} from "lucide-react";

// --- Types ---

interface Post {
  id: number;
  file: {
    url: string;
    ext: string;
    width: number;
    height: number;
  };
  preview: {
    url: string;
  };
  score: {
    total: number;
  };
  tags: {
    general: string[];
    artist: string[];
    character: string[];
    copyright: string[];
    meta: string[];
    species: string[];
    invalid: string[];
    lore: string[];
  };
  rating: string;
  description: string;
}

interface Comment {
  id: number;
  body: string;
  creator_name: string;
  created_at: string;
}

interface WikiPage {
  id: number;
  title: string;
  body: string;
}

interface UserProfile {
  id: number;
  name: string;
  blacklisted_tags: string;
  favorite_count: number;
}

interface AppSettings {
  autoplay: boolean;
  proxyType: 'http' | 'socks';
  proxyHost: string;
  proxyPort: string;
  enableHistory: boolean;
  geminiApiKey: string;
}

interface AuthCreds {
  username: string;
  apiKey: string;
}

interface BlacklistEntry {
  tag: string;
  enabled: boolean;
}

// --- API Service ---

const USER_AGENT = "e1547-Web/1.1 (by clragon on e621)";

const getAuthHeaders = (creds: AuthCreds | null) => {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json"
  };
  if (creds?.username && creds?.apiKey) {
    headers["Authorization"] = "Basic " + btoa(`${creds.username}:${creds.apiKey}`);
  }
  return headers;
};

const fetchPosts = async (tags: string = "", page: number = 1, creds: AuthCreds | null): Promise<Post[]> => {
  try {
    const url = `https://e621.net/posts.json?tags=${encodeURIComponent(tags)}&page=${page}&limit=20`;
    const response = await fetch(url, { headers: getAuthHeaders(creds) });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

const fetchComments = async (postId: number, creds: AuthCreds | null): Promise<Comment[]> => {
  try {
    const response = await fetch(`https://e621.net/comments.json?search[post_id]=${postId}`, {
      headers: getAuthHeaders(creds)
    });
    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    return [];
  }
};

const fetchWiki = async (tag: string): Promise<WikiPage | null> => {
  try {
    const response = await fetch(`https://e621.net/wiki_pages.json?search[title]=${encodeURIComponent(tag)}`, {
       headers: { "User-Agent": USER_AGENT }
    });
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    return null;
  }
};

const fetchUserDetails = async (username: string, creds: AuthCreds): Promise<UserProfile | null> => {
    try {
        const response = await fetch(`https://e621.net/users.json?search[name_matches]=${username}`, {
            headers: getAuthHeaders(creds)
        });
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (e) {
        return null;
    }
};

const fetchTagSuggestions = async (term: string): Promise<any[]> => {
  if (term.length < 3) return [];
  try {
    const response = await fetch(`https://e621.net/tags/autocomplete.json?search[name_matches]=${encodeURIComponent(term)}`, {
       headers: { "User-Agent": USER_AGENT }
    });
    return await response.json();
  } catch (error) {
    return [];
  }
}

// --- Gemini Service ---

const generateSmartTags = async (query: string, apiKey?: string): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) return query;
  
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert at searching the e621 image board. 
      Convert the following natural language description into a standard, space-separated e621 tag search string.
      Only return the tag string. Description: "${query}"`,
    });
    return response.text?.trim() || query;
  } catch (e) {
    console.error("Gemini Error:", e);
    return query;
  }
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
      active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </div>
    {badge && <span className="bg-blue-900 text-blue-200 text-[10px] px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const TagBadge = ({ type, tag, onClick }: { type: string, tag: string, onClick: (t: string) => void }) => {
  const colors: Record<string, string> = {
    artist: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    character: "text-green-400 border-green-400/30 bg-green-400/10",
    copyright: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    general: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    meta: "text-gray-400 border-gray-400/30 bg-gray-400/10",
    species: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    lore: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  };
  
  const style = colors[type] || colors.general;

  return (
    <span 
      onClick={(e) => { e.stopPropagation(); onClick(tag); }}
      className={`cursor-pointer px-2 py-0.5 text-xs border rounded mr-1 mb-1 inline-block hover:opacity-80 ${style}`}
    >
      {tag}
    </span>
  );
};

const WikiCard = ({ wiki }: { wiki: WikiPage }) => {
  const snippet = wiki.body.split('\r\n')[0].substring(0, 300); // Simple snippet
  return (
    <div className="mx-4 mt-4 bg-[#161b22] border border-gray-700 rounded-xl p-4 flex items-start space-x-4 animate-in fade-in slide-in-from-top-4">
       <div className="bg-gray-800 p-3 rounded-lg">
          <BookOpen size={24} className="text-gray-400" />
       </div>
       <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1 capitalize">{wiki.title.replace(/_/g, ' ')}</h3>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 font-mono text-xs">
             {snippet}...
          </p>
       </div>
    </div>
  );
};

const PostModal = ({ post, onClose, onTagClick, isFavorite, toggleFavorite, isBookmarked, toggleBookmark, autoplay, creds }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (post) {
      setLoadingComments(true);
      fetchComments(post.id, creds).then(setComments).finally(() => setLoadingComments(false));
    }
  }, [post, creds]);

  if (!post) return null;

  const isVideo = ["webm", "mp4"].includes(post.file.ext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161b22] w-full max-w-7xl max-h-[95vh] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-gray-800">
        
        <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white md:hidden z-10">
          <X size={20} />
        </button>

        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative group">
           {isVideo ? (
             <video 
               src={post.file.url} 
               controls 
               loop 
               autoPlay={autoplay}
               className="max-w-full max-h-[50vh] md:max-h-[95vh] object-contain" 
             />
           ) : (
             <img 
               src={post.file.url} 
               alt={`Post ${post.id}`} 
               className="max-w-full max-h-[50vh] md:max-h-[95vh] object-contain"
             />
           )}
        </div>

        <div className="w-full md:w-96 flex flex-col border-l border-gray-800 bg-[#0d1117] h-[50vh] md:h-auto">
          <div className="p-4 border-b border-gray-800 flex justify-between items-start">
            <div>
               <h2 className="text-lg font-bold text-white font-mono">#{post.id}</h2>
               <div className="text-xs text-gray-500 mt-1">{post.file.width}x{post.file.height} • {post.file.ext.toUpperCase()}</div>
            </div>
            <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-800">
             <button 
                onClick={() => toggleFavorite(post)}
                className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 ${isFavorite ? 'text-pink-500' : 'text-gray-400'}`}
              >
               <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
               <span className="text-xs mt-1">Fav</span>
             </button>
             <button 
                onClick={() => toggleBookmark(post)}
                className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 ${isBookmarked ? 'text-blue-500' : 'text-gray-400'}`}
              >
               <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
               <span className="text-xs mt-1">Save</span>
             </button>
             <button 
                onClick={() => window.open(post.file.url, '_blank')}
                className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 text-gray-400"
              >
               <Download size={20} />
               <span className="text-xs mt-1">DL</span>
             </button>
             <button className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 text-gray-400">
               <Info size={20} />
               <span className="text-xs mt-1">Info</span>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
            <div className="space-y-4">
              {['artist', 'character', 'copyright', 'species', 'general', 'meta', 'lore'].map(type => (
                (post.tags[type as keyof typeof post.tags] || []).length > 0 && (
                  <div key={type}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{type}s</h3>
                    <div className="flex flex-wrap">
                      {(post.tags[type as keyof typeof post.tags] || []).map((t: string) => <TagBadge key={t} type={type} tag={t} onClick={onTagClick} />)}
                    </div>
                  </div>
                )
              ))}
            </div>

            {post.description && (
               <div className="bg-gray-800/50 p-3 rounded-lg text-sm text-gray-300 whitespace-pre-wrap font-mono text-xs">
                 {post.description}
               </div>
            )}

            <div>
              <div className="flex items-center space-x-2 mb-4 text-gray-400 pb-2 border-b border-gray-800">
                <MessageSquare size={16} />
                <span className="text-sm font-bold uppercase">Comments</span>
              </div>
              
              {loadingComments ? (
                <div className="flex justify-center p-4">
                   <Loader2 className="animate-spin text-gray-500" size={20} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No comments.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <div key={c.id} className="bg-gray-800/30 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-blue-400">{c.creator_name}</span>
                        <span className="text-[10px] text-gray-600">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
            Score: {post.score.total} • Rating: {post.rating.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

const MasonryGrid = ({ posts, onPostClick }: { posts: Post[], onPostClick: (p: Post) => void }) => {
  return (
    <div className="masonry-grid p-4">
      {posts.map((post) => {
        const isVideo = ["webm", "mp4"].includes(post.file.ext);
        const hasPreview = !!post.preview.url;
        
        if (!hasPreview && !post.file.url) return null;

        return (
          <div 
            key={post.id} 
            onClick={() => onPostClick(post)}
            className="break-inside-avoid mb-4 bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-lg group relative"
          >
            <img 
              src={post.preview.url || post.file.url} 
              alt={`Thumbnail ${post.id}`}
              className="w-full h-auto object-cover min-h-[100px]"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex justify-between items-end">
                  <span className="text-white text-xs font-mono font-bold">#{post.id}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                      post.rating === 'e' ? 'bg-red-900/80 text-red-200' : 
                      post.rating === 'q' ? 'bg-yellow-900/80 text-yellow-200' : 
                      'bg-green-900/80 text-green-200'
                  }`}>
                    {post.rating.toUpperCase()}
                  </span>
               </div>
            </div>
            {isVideo && (
               <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                 <Play size={12} className="text-white" fill="white" />
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const LoginModal = ({ onClose, onLogin }: { onClose: () => void, onLogin: (u: string, k: string) => void }) => {
    const [user, setUser] = useState("");
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        // Simple verification fetch
        const creds = { username: user, apiKey: key };
        const profile = await fetchUserDetails(user, creds);
        
        setLoading(false);
        if (profile) {
            onLogin(user, key);
        } else {
            setError("Invalid username or API key.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#161b22] w-full max-w-md p-6 rounded-xl border border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Login to e621</h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">API Key</label>
                        <input 
                            type="password" 
                            className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Get this from e621 > Manage API Access"
                            required
                        />
                    </div>
                    
                    {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const BlacklistManager = ({ blacklist, setBlacklist }: { blacklist: BlacklistEntry[], setBlacklist: (b: BlacklistEntry[]) => void }) => {
    const [newTag, setNewTag] = useState("");

    const addTag = () => {
        if (!newTag.trim()) return;
        if (blacklist.some(b => b.tag === newTag.trim())) return;
        const newEntry = { tag: newTag.trim(), enabled: true };
        const updated = [newEntry, ...blacklist];
        setBlacklist(updated);
        localStorage.setItem("e1547_blacklist", JSON.stringify(updated));
        setNewTag("");
    };

    const toggleTag = (tag: string) => {
        const updated = blacklist.map(b => b.tag === tag ? { ...b, enabled: !b.enabled } : b);
        setBlacklist(updated);
        localStorage.setItem("e1547_blacklist", JSON.stringify(updated));
    };

    const removeTag = (tag: string) => {
        const updated = blacklist.filter(b => b.tag !== tag);
        setBlacklist(updated);
        localStorage.setItem("e1547_blacklist", JSON.stringify(updated));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Ban size={28} className="text-red-500" /> Blacklist Manager
            </h2>
            <p className="text-gray-400">Manage tags you want to hide from search results and timelines.</p>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag (e.g. gore, rating:e)"
                    className="flex-1 bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
                <button onClick={addTag} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg flex items-center gap-2 font-medium">
                    <Plus size={20} /> Add
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blacklist.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-gray-600 italic">No blacklisted tags.</div>
                ) : (
                    blacklist.map((entry) => (
                        <div key={entry.tag} className={`flex items-center justify-between p-3 rounded-lg border ${entry.enabled ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-800/30 border-gray-800'}`}>
                            <span className={`font-mono font-medium ${entry.enabled ? 'text-red-300' : 'text-gray-500 line-through'}`}>
                                {entry.tag}
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => toggleTag(entry.tag)}
                                    className={`p-2 rounded hover:bg-gray-700 ${entry.enabled ? 'text-green-400' : 'text-gray-500'}`}
                                    title={entry.enabled ? "Disable Rule" : "Enable Rule"}
                                >
                                    {entry.enabled ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </button>
                                <button 
                                    onClick={() => removeTag(entry.tag)}
                                    className="p-2 rounded hover:bg-red-900/30 text-red-400"
                                    title="Remove Rule"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const SettingsView = ({ settings, setSettings }: { settings: AppSettings, setSettings: (s: AppSettings) => void }) => {
    const update = (key: keyof AppSettings, val: any) => {
        const newSettings = { ...settings, [key]: val };
        setSettings(newSettings);
        localStorage.setItem("e1547_settings", JSON.stringify(newSettings));
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Settings size={28} /> Settings
            </h2>
            
            <div className="bg-[#161b22] rounded-xl border border-gray-800 p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">Media</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-gray-300">Autoplay Videos</div>
                            <div className="text-xs text-gray-500">Automatically play videos in detail view</div>
                        </div>
                        <button 
                            onClick={() => update('autoplay', !settings.autoplay)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoplay ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoplay ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4">Privacy</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-gray-300">Enable History</div>
                            <div className="text-xs text-gray-500">Keep track of viewed posts locally</div>
                        </div>
                        <button 
                            onClick={() => update('enableHistory', !settings.enableHistory)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableHistory ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableHistory ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                         <Sparkles size={18} /> AI Settings
                    </h3>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={settings.geminiApiKey || ''}
                            onChange={(e) => update('geminiApiKey', e.target.value)}
                            placeholder="AI Studio API Key"
                            className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-600 mt-2">Required for smart search features. Key is stored locally.</p>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                         <Shield size={18} /> Proxy Settings
                    </h3>
                    <div className="space-y-4">
                        <p className="text-xs text-yellow-600/80">
                            Note: Browser environments limit direct proxy configurations. These settings are visual only for this web demo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AboutView = () => (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center text-center animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
             <span className="text-white font-bold text-5xl">e</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">e1547 Web</h1>
        <p className="text-gray-400 mb-8">A sophisticated web interface for e621</p>
        <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 w-full text-left">
             <h3 className="font-bold text-white mb-2">Version 1.3.1</h3>
             <ul className="text-sm text-gray-400 space-y-1 list-disc pl-4 mb-4">
                 <li>Added Native PWA Installation Support</li>
                 <li>Added Gemini API Key Setting</li>
                 <li>Fixed Favorites Loading</li>
                 <li>Added Blacklist Manager</li>
                 <li>Added User Login & Blacklist Sync</li>
             </ul>
        </div>
        
        <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 w-full text-left mt-4">
             <h3 className="font-bold text-white mb-2">Installation Guide</h3>
             <div className="space-y-4 text-sm text-gray-400">
                 <div>
                     <strong className="text-white">Arch Linux (via Chromium/Chrome)</strong>
                     <p>1. Open this app in Chromium or Google Chrome.</p>
                     <p>2. Click the "Install App" button in the sidebar (if available) or the "Install" icon in the URL bar.</p>
                     <p>3. This creates a .desktop file, adding "e1547" to your application launcher (Rofi, Dmenu, Gnome, etc.) as a standalone app.</p>
                 </div>
                 <div>
                     <strong className="text-white">Android</strong>
                     <p>1. Open in Chrome.</p>
                     <p>2. Tap the menu (⋮) &rarr; "Install app" or "Add to Home screen".</p>
                 </div>
                 <div>
                     <strong className="text-white">Windows</strong>
                     <p>1. Open in Edge or Chrome.</p>
                     <p>2. Click "Install e1547" in the address bar.</p>
                 </div>
             </div>
        </div>
    </div>
);

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState("hot");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Data State
  const [bookmarks, setBookmarks] = useState<Post[]>([]); // Local bookmarks
  const [history, setHistory] = useState<Post[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [page, setPage] = useState(1);
  const [wiki, setWiki] = useState<WikiPage | null>(null);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSmartSearch, setIsSmartSearch] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null); // State for PWA prompt
  
  // Auth & Settings
  const [creds, setCreds] = useState<AuthCreds | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
      autoplay: true,
      proxyType: 'http',
      proxyHost: '',
      proxyPort: '',
      enableHistory: true,
      geminiApiKey: ''
  });

  const loadMoreRef = useRef(null);

  // Initialize
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("e1547_bookmarks");
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedSubs = localStorage.getItem("e1547_subs");
    if (savedSubs) setSubscriptions(JSON.parse(savedSubs));

    const savedHistory = localStorage.getItem("e1547_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedBlacklist = localStorage.getItem("e1547_blacklist");
    if (savedBlacklist) setBlacklist(JSON.parse(savedBlacklist));

    const savedCreds = localStorage.getItem("e1547_creds");
    if (savedCreds) {
        const c = JSON.parse(savedCreds);
        setCreds(c);
        fetchUserDetails(c.username, c).then(p => {
            setUserProfile(p);
            // Sync blacklist from profile if available
            if (p && p.blacklisted_tags) {
                const serverTags = p.blacklisted_tags.split(/\r?\n/).filter(t => t.trim().length > 0);
                // Merge logic: Add server tags if not present. Keep existing enabled states.
                // Simple merge: Just add new ones as enabled.
                let currentBL = savedBlacklist ? JSON.parse(savedBlacklist) : [];
                const currentTagSet = new Set(currentBL.map((b: any) => b.tag));
                let changed = false;
                
                serverTags.forEach(tag => {
                    if (!currentTagSet.has(tag)) {
                        currentBL.push({ tag, enabled: true });
                        changed = true;
                    }
                });
                
                if (changed) {
                    setBlacklist(currentBL);
                    localStorage.setItem("e1547_blacklist", JSON.stringify(currentBL));
                }
            }
        });
    }

    const savedSettings = localStorage.getItem("e1547_settings");
    if (savedSettings) setSettings({ ...settings, ...JSON.parse(savedSettings) });

    // Capture Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && !loading && posts.length > 0 && ['home', 'hot', 'timeline'].includes(activeTab)) {
                setPage(prev => prev + 1);
            }
        },
        { threshold: 0.1, rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, posts.length, activeTab]);

  // Data Fetching Logic
  useEffect(() => {
    // Static lists
    if (activeTab === "bookmarks") { setPosts(bookmarks); return; }
    if (activeTab === "history") { setPosts(history); return; }
    if (activeTab === "favorites") { 
        if (!creds) { setPosts([]); return; }
        // Correct query for user favorites is fav:<username>
        const favTag = `fav:${creds.username}`;
        setLoading(true);
        fetchPosts(favTag, page, creds).then(data => {
            if (page === 1) setPosts(data);
            else setPosts(prev => [...prev, ...data]);
            setLoading(false);
        });
        return;
    }
    
    if (['settings', 'about', 'subscriptions_list', 'blacklist_manager'].includes(activeTab)) return;

    const loadPosts = async () => {
      setLoading(true);
      let query = searchQuery;
      
      // Hot logic
      if (activeTab === "hot") {
          query = "order:rank"; // or order:score
      } 
      // Timeline logic (Union of subscriptions)
      else if (activeTab === "timeline") {
          if (subscriptions.length === 0) {
              setPosts([]); setLoading(false); return;
          }
          // Construct query: ~tag1 ~tag2 ~tag3
          query = subscriptions.map(s => `~${s}`).join(" ");
      }

      // Wiki check (only on standard search)
      if (activeTab === "home" && page === 1 && query && !query.includes(" ")) {
          fetchWiki(query).then(setWiki);
      } else {
          setWiki(null);
      }

      const rawPosts = await fetchPosts(query, page, creds);

      // Blacklist Filtering
      // We filter using the 'blacklist' state which contains enabled items.
      const activeBlacklist = blacklist.filter(b => b.enabled).map(b => b.tag.toLowerCase());
      
      let filteredPosts = rawPosts;
      if (activeBlacklist.length > 0) {
          filteredPosts = rawPosts.filter(post => {
              const flatTags = Object.values(post.tags).flat().map(t => t.toLowerCase());
              // Add pseudo-tags like rating:x
              flatTags.push(`rating:${post.rating}`);
              
              // Check if any active blacklist tag is present in post tags
              // Note: e621 blacklist can be complex, this handles simple tags and ratings
              return !activeBlacklist.some(bl => flatTags.includes(bl));
          });
      }

      if (page === 1) {
        setPosts(filteredPosts);
      } else {
        setPosts(prev => [...prev, ...filteredPosts]);
      }
      setLoading(false);
    };

    loadPosts();
  }, [searchQuery, page, activeTab, creds, blacklist]);

  // Actions
  const handleLogin = (u: string, k: string) => {
      const c = { username: u, apiKey: k };
      setCreds(c);
      localStorage.setItem("e1547_creds", JSON.stringify(c));
      fetchUserDetails(u, c).then(p => {
          setUserProfile(p);
          // Trigger a reload to sync blacklist if needed
          window.location.reload(); 
      });
      setShowLogin(false);
  };

  const handleLogout = () => {
      setCreds(null);
      setUserProfile(null);
      localStorage.removeItem("e1547_creds");
  };

  const handleInstallClick = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
          setInstallPrompt(null);
      }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSuggestions([]);
    setPosts([]); setPage(1); setActiveTab("home");
    
    if (isSmartSearch) {
        setIsThinking(true);
        const translatedTags = await generateSmartTags(searchInput, settings.geminiApiKey);
        setIsThinking(false);
        setSearchQuery(translatedTags);
    } else {
        setSearchQuery(searchInput);
    }
  };

  const toggleBookmark = (post: Post) => {
    const exists = bookmarks.some(p => p.id === post.id);
    const newBook = exists ? bookmarks.filter(p => p.id !== post.id) : [post, ...bookmarks];
    setBookmarks(newBook);
    localStorage.setItem("e1547_bookmarks", JSON.stringify(newBook));
  };
  
  const toggleFavorite = (post: Post) => {
      // In a real app, send POST /favorites.json
      alert("Remote favoriting requires write access implementation. This is a read-only demo.");
  };

  const toggleSubscription = () => {
      // Subscribe to current search query
      if (!searchQuery) return;
      const exists = subscriptions.includes(searchQuery);
      const newSubs = exists ? subscriptions.filter(s => s !== searchQuery) : [...subscriptions, searchQuery];
      setSubscriptions(newSubs);
      localStorage.setItem("e1547_subs", JSON.stringify(newSubs));
  };

  const addToHistory = (post: Post) => {
      if (!settings.enableHistory) return;
      // Avoid duplicates at top
      const newHist = [post, ...history.filter(p => p.id !== post.id)].slice(0, 100);
      setHistory(newHist);
      localStorage.setItem("e1547_history", JSON.stringify(newHist));
  };

  const handlePostClick = (post: Post) => {
      addToHistory(post);
      setSelectedPost(post);
  };

  // Views
  const renderContent = () => {
      if (activeTab === 'settings') return <SettingsView settings={settings} setSettings={setSettings} />;
      if (activeTab === 'about') return <AboutView />;
      if (activeTab === 'blacklist_manager') return <BlacklistManager blacklist={blacklist} setBlacklist={setBlacklist} />;
      
      if (activeTab === 'subscriptions_list') {
          return (
              <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Subscriptions</h2>
                  {subscriptions.length === 0 ? <p className="text-gray-500">No subscriptions yet.</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subscriptions.map(sub => (
                              <div key={sub} className="bg-[#161b22] p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                  <span className="text-blue-400 font-mono font-bold">{sub}</span>
                                  <div className="flex space-x-2">
                                      <button onClick={() => { setSearchInput(sub); setSearchQuery(sub); setActiveTab("home"); }} className="p-2 hover:bg-gray-700 rounded"><Search size={16}/></button>
                                      <button onClick={() => {
                                          const ns = subscriptions.filter(s => s !== sub);
                                          setSubscriptions(ns);
                                          localStorage.setItem("e1547_subs", JSON.stringify(ns));
                                      }} className="p-2 hover:bg-red-900/50 text-red-400 rounded"><X size={16}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          );
      }

      if (posts.length === 0 && !loading) {
         return (
             <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Search size={48} className="mb-4 opacity-50" />
                <p>No posts found.</p>
                {activeTab === 'favorites' && !creds && <p className="text-sm mt-2">Login to view favorites.</p>}
                {activeTab === 'timeline' && subscriptions.length === 0 && <p className="text-sm mt-2">Add subscriptions to populate your timeline.</p>}
             </div>
         );
      }

      return (
        <>
            {wiki && activeTab === 'home' && <WikiCard wiki={wiki} />}
            <MasonryGrid posts={posts} onPostClick={handlePostClick} />
            <div ref={loadMoreRef} className="py-8 flex justify-center w-full min-h-[50px]">
                {loading && <Loader2 className="animate-spin text-blue-500" size={32} />}
            </div>
        </>
      );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 flex font-sans">
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#161b22] border-r border-gray-800 
        transform transition-transform duration-300 z-50 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-bold text-xl">e</span>
            </div>
            <div>
               <h1 className="text-white font-bold text-lg leading-none">e1547</h1>
               <span className="text-xs text-gray-500">Web Client</span>
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar pr-2">
            <SidebarItem 
              icon={Flame} 
              label="Hot" 
              active={activeTab === "hot"} 
              onClick={() => { setActiveTab("hot"); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={Home} 
              label="Search" 
              active={activeTab === "home"} 
              onClick={() => { setActiveTab("home"); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={Clock} 
              label="Timeline" 
              active={activeTab === "timeline"} 
              onClick={() => { setActiveTab("timeline"); setIsSidebarOpen(false); }} 
            />
            
            <div className="my-2 border-t border-gray-800/50"></div>
            
            <SidebarItem 
              icon={ListPlus} 
              label="Subscriptions" 
              active={activeTab === "subscriptions_list"} 
              onClick={() => { setActiveTab("subscriptions_list"); setIsSidebarOpen(false); }}
              badge={subscriptions.length || null}
            />
            <SidebarItem 
              icon={Bookmark} 
              label="Bookmarks" 
              active={activeTab === "bookmarks"} 
              onClick={() => { setActiveTab("bookmarks"); setIsSidebarOpen(false); }}
              badge={bookmarks.length || null}
            />
            
            {creds && (
                <SidebarItem 
                    icon={Heart} 
                    label="Favorites" 
                    active={activeTab === "favorites"} 
                    onClick={() => { setActiveTab("favorites"); setIsSidebarOpen(false); }} 
                    badge={userProfile?.favorite_count || null}
                />
            )}

            {settings.enableHistory && (
                <SidebarItem 
                    icon={History} 
                    label="History" 
                    active={activeTab === "history"} 
                    onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }} 
                />
            )}
            
            <SidebarItem 
              icon={Ban} 
              label="Blacklist" 
              active={activeTab === "blacklist_manager"} 
              onClick={() => { setActiveTab("blacklist_manager"); setIsSidebarOpen(false); }} 
            />

            <div className="my-2 border-t border-gray-800/50"></div>
            <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Info} label="About" active={activeTab === "about"} onClick={() => { setActiveTab("about"); setIsSidebarOpen(false); }} />
            
            {installPrompt && (
                <div className="mt-2 bg-blue-900/20 p-2 rounded border border-blue-900/50">
                    <SidebarItem 
                        icon={Download} 
                        label="Install App" 
                        active={false} 
                        onClick={handleInstallClick}
                    />
                </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-800 bg-[#12171e]">
            {creds ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-200">
                            {creds.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-white truncate w-24">
                            {creds.username}
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-white"><LogOut size={18}/></button>
                </div>
            ) : (
                <button 
                    onClick={() => setShowLogin(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                >
                    <LogIn size={16} />
                    <span>Login</span>
                </button>
            )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-[#0d1117]/80 backdrop-blur border-b border-gray-800 p-4 z-30">
          <div className="max-w-7xl mx-auto flex items-center space-x-4">
            <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(true)}><Menu /></button>

            <form onSubmit={handleSearch} className="flex-1 relative group z-40">
              <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors ${isSmartSearch ? 'text-purple-400' : 'text-gray-400'}`}>
                {isThinking ? <Loader2 className="animate-spin" size={18} /> : (isSmartSearch ? <Sparkles size={18} /> : <Search size={18} />)}
              </div>
              <input 
                id="search-input"
                type="text" 
                autoComplete="off"
                placeholder={isSmartSearch ? "Describe what you want to see..." : "Search tags (e.g. dragon female)"}
                className={`w-full bg-[#010409] border text-sm rounded-full py-2.5 pl-10 pr-24 focus:outline-none focus:ring-2 transition-all ${
                    isSmartSearch 
                    ? 'border-purple-500/50 focus:border-purple-500 focus:ring-purple-500/20 placeholder-purple-300/30' 
                    : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 text-white'
                }`}
                value={searchInput}
                onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!isSmartSearch) {
                        const terms = e.target.value.split(" ");
                        const lastTerm = terms[terms.length - 1];
                        if (lastTerm.length >= 3) fetchTagSuggestions(lastTerm).then(setSuggestions);
                        else setSuggestions([]);
                    }
                }}
              />
              
              {/* Right side buttons inside search */}
              <div className="absolute right-2 top-1.5 flex items-center space-x-1">
                 {/* Subscribe Button (Visible if active search) */}
                 {searchQuery && !isSmartSearch && (
                     <button 
                        type="button"
                        onClick={toggleSubscription}
                        className={`p-1 rounded-full transition-all ${subscriptions.includes(searchQuery) ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
                        title="Subscribe to this search"
                     >
                        <ListPlus size={16} />
                     </button>
                 )}
                 <button 
                    type="button"
                    onClick={() => { setIsSmartSearch(!isSmartSearch); setSuggestions([]); }}
                    className={`p-1 rounded-full transition-all ${isSmartSearch ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Toggle Gemini Smart Search"
                 >
                    <Bot size={16} />
                 </button>
              </div>

              {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                      {suggestions.map((s, i) => (
                          <div 
                            key={s.id || i}
                            onClick={() => {
                                const terms = searchInput.split(" ");
                                terms[terms.length - 1] = s.name;
                                setSearchInput(terms.join(" ") + " ");
                                setSuggestions([]);
                                document.getElementById('search-input')?.focus();
                            }}
                            className="px-4 py-2 hover:bg-blue-600/20 hover:text-blue-400 cursor-pointer flex justify-between items-center group"
                          >
                              <span className="font-medium text-sm text-gray-300 group-hover:text-white">{s.name}</span>
                              <span className="text-xs text-gray-600 group-hover:text-blue-300 bg-gray-800 px-1.5 rounded">{s.post_count}</span>
                          </div>
                      ))}
                  </div>
              )}
            </form>
          </div>
          
          {(searchQuery && activeTab === "home") && (
              <div className="max-w-7xl mx-auto mt-2 px-1 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Results for: <span className="font-mono text-blue-400">{searchQuery}</span>
                  </span>
              </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto bg-[#0d1117]">
            {renderContent()}
        </div>
      </main>

      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)}
          onTagClick={(tag: string) => { setSearchInput(tag); setSearchQuery(tag); setActiveTab("home"); setPage(1); setPosts([]); setSelectedPost(null); }}
          isFavorite={false} // Remote fav check hard to sync instantly without full state logic
          toggleFavorite={toggleFavorite}
          isBookmarked={bookmarks.some(p => p.id === selectedPost.id)}
          toggleBookmark={toggleBookmark}
          autoplay={settings.autoplay}
          creds={creds}
        />
      )}

    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);