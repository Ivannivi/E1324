// Svelte 5 Global Store
export const appState = $state({
    activeTab: 'hot', // hot, home, timeline, settings, favorites
    searchQuery: '',
    subscriptions: [],
    history: [],
    blacklist: [],
    
    // Auth
    auth: {
        username: '',
        apiKey: ''
    },

    // Settings
    settings: {
        autoplay: true,
        enableHistory: true
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
            this.settings = { ...this.settings, ...data.settings };
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