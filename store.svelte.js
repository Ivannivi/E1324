// Svelte 5 Global Store
export const appState = $state({
    activeTab: 'hot', // hot, home, timeline, settings, favorites, history, blacklist, about
    searchQuery: '',
    subscriptions: [],
    history: [],
    blacklist: [], // Array of { tag: string, enabled: boolean }
    
    // Auth
    auth: {
        username: '',
        apiKey: ''
    },
    userStats: {
        favorite_count: 0
    },

    // Settings
    settings: {
        autoplay: true,
        enableHistory: true,
        geminiApiKey: '',
        proxy: {
            type: 'http',
            host: '',
            port: ''
        }
    },

    // Actions
    setTab(tab) {
        this.activeTab = tab;
    },
    
    setSearch(query) {
        this.searchQuery = query;
        this.activeTab = 'home';
    },

    addToHistory(post) {
        if (!this.settings.enableHistory) return;
        this.history = [post, ...this.history.filter(p => p.id !== post.id)].slice(0, 100);
        this.persist();
    },

    toggleSubscription(tag) {
        if (this.subscriptions.includes(tag)) {
            this.subscriptions = this.subscriptions.filter(t => t !== tag);
        } else {
            this.subscriptions.push(tag);
        }
        this.persist();
    },

    // Blacklist Actions
    addBlacklistTag(tag) {
        if (!tag) return;
        const normalized = tag.trim().toLowerCase();
        if (!this.blacklist.some(b => b.tag === normalized)) {
            this.blacklist.push({ tag: normalized, enabled: true });
            this.persist();
        }
    },
    
    removeBlacklistTag(tag) {
        this.blacklist = this.blacklist.filter(b => b.tag !== tag);
        this.persist();
    },

    toggleBlacklistTag(tag) {
        const item = this.blacklist.find(b => b.tag === tag);
        if (item) {
            item.enabled = !item.enabled;
            this.persist();
        }
    },

    login(username, apiKey) {
        this.auth = { username, apiKey };
        this.persist();
    },

    logout() {
        this.auth = { username: '', apiKey: '' };
        this.persist();
    },

    // Persistence
    load() {
        const saved = localStorage.getItem('e1547_store');
        if (saved) {
            const data = JSON.parse(saved);
            this.subscriptions = data.subscriptions || [];
            this.history = data.history || [];
            this.auth = data.auth || { username: '', apiKey: '' };
            this.blacklist = data.blacklist || [];
            
            // Deep merge settings
            this.settings = { 
                ...this.settings, 
                ...data.settings,
                proxy: { ...this.settings.proxy, ...(data.settings?.proxy || {}) }
            };
        }
    },

    persist() {
        localStorage.setItem('e1547_store', JSON.stringify({
            subscriptions: this.subscriptions,
            history: this.history,
            auth: this.auth,
            blacklist: this.blacklist,
            settings: this.settings
        }));
    }
});

// Initialize on load
appState.load();