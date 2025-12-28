import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

// Detection for Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

/**
 * Universal Fetch Wrapper
 * Uses Tauri's native HTTP plugin if available to bypass CORS.
 * Falls back to browser fetch for development.
 */
export const http = {
    fetch: async (url, options = {}) => {
        const headers = options.headers || {};
        // Add default User-Agent for e621
        headers['User-Agent'] = "e1547-Tauri/1.0 (by clragon on e621)";
        
        const finalOptions = { ...options, headers };

        if (isTauri) {
            console.log(`[Tauri Network] Fetching: ${url}`);
            return await tauriFetch(url, finalOptions);
        } else {
            console.log(`[Browser Network] Fetching: ${url}`);
            return await window.fetch(url, finalOptions);
        }
    }
};

export const api = {
    getPosts: async (tags, page, auth) => {
        try {
            const params = new URLSearchParams({
                tags: tags || "",
                page: page.toString(),
                limit: "20"
            });
            
            const headers = {};
            if (auth?.username && auth?.apiKey) {
                headers["Authorization"] = "Basic " + btoa(`${auth.username}:${auth.apiKey}`);
            }

            const res = await http.fetch(`https://e621.net/posts.json?${params.toString()}`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.posts || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    
    getComments: async (postId) => {
        try {
            const res = await http.fetch(`https://e621.net/comments.json?search[post_id]=${postId}`);
            const data = await res.json();
            return data.comments || [];
        } catch (e) { return []; }
    }
};