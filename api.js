import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { GoogleGenAI } from "@google/genai";

// Detection for Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
const USER_AGENT = "e1547-Tauri/1.4 (by clragon on e621)";

/**
 * Universal Fetch Wrapper
 */
export const http = {
    fetch: async (url, options = {}) => {
        const headers = options.headers || {};
        headers['User-Agent'] = USER_AGENT;
        
        const finalOptions = { ...options, headers };

        if (isTauri) {
            return await tauriFetch(url, finalOptions);
        } else {
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
            console.error("Fetch Error:", e);
            return [];
        }
    },
    
    getComments: async (postId) => {
        try {
            const res = await http.fetch(`https://e621.net/comments.json?search[post_id]=${postId}`);
            const data = await res.json();
            return data.comments || [];
        } catch (e) { return []; }
    },

    getWiki: async (tag) => {
        try {
            const res = await http.fetch(`https://e621.net/wiki_pages.json?search[title]=${encodeURIComponent(tag)}`);
            const data = await res.json();
            return data.length > 0 ? data[0] : null;
        } catch (e) { return null; }
    },

    getTags: async (term) => {
        if (term.length < 3) return [];
        try {
            const res = await http.fetch(`https://e621.net/tags/autocomplete.json?search[name_matches]=${encodeURIComponent(term)}`);
            return await res.json();
        } catch (e) { return []; }
    },
    
    getUserDetails: async (username, auth) => {
        try {
             const headers = {};
             if (auth?.username && auth?.apiKey) {
                 headers["Authorization"] = "Basic " + btoa(`${auth.username}:${auth.apiKey}`);
             }
             const res = await http.fetch(`https://e621.net/users.json?search[name_matches]=${username}`, { headers });
             const data = await res.json();
             return data.length > 0 ? data[0] : null;
        } catch (e) { return null; }
    },

    // Gemini Integration
    smartSearch: async (prompt, apiKey) => {
        if (!apiKey) return prompt;
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: `You are an expert at searching the e621 image board. 
              Convert the following natural language description into a standard, space-separated e621 tag search string.
              Only return the tag string. Do not include markdown formatting. Description: "${prompt}"`,
            });
            return response.text?.trim() || prompt;
        } catch (e) {
            console.error("Gemini Error:", e);
            return prompt;
        }
    }
};