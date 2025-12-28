<script>
    import { Flame, Home, Clock, Settings, LogIn, LogOut, Search, ListPlus, History, Heart, Ban, Info, Sparkles, Loader2, X } from "lucide-svelte";
    import { appState } from "./store.svelte.js";
    import { api } from "./api.js";
    import Feed from "./Feed.svelte";
    import BlacklistManager from "./BlacklistManager.svelte";
    import SettingsView from "./Settings.svelte";

    let searchInput = $state("");
    let isSmartSearch = $state(false);
    let isThinking = $state(false);
    let suggestions = $state([]);

    async function handleSearch(e) {
        e.preventDefault();
        suggestions = [];
        if (!searchInput.trim()) return;

        if (isSmartSearch) {
            isThinking = true;
            const smartTags = await api.smartSearch(searchInput, appState.settings.geminiApiKey);
            isThinking = false;
            appState.setSearch(smartTags);
        } else {
            appState.setSearch(searchInput);
        }
    }

    async function handleInput(e) {
        searchInput = e.target.value;
        if (!isSmartSearch) {
            const terms = searchInput.split(" ");
            const lastTerm = terms[terms.length - 1];
            if (lastTerm.length >= 3) {
                suggestions = await api.getTags(lastTerm);
            } else {
                suggestions = [];
            }
        }
    }

    function selectSuggestion(tag) {
        const terms = searchInput.split(" ");
        terms[terms.length - 1] = tag;
        searchInput = terms.join(" ") + " ";
        suggestions = [];
        document.getElementById('search-input')?.focus();
    }

    // Derived Query Logic
    let timelineQuery = $derived(appState.subscriptions.length > 0 ? appState.subscriptions.map(s => `~${s}`).join(" ") : "");
    let favoritesQuery = $derived(appState.auth.username ? `fav:${appState.auth.username}` : "");
</script>

<div class="flex h-screen bg-[#0d1117] text-gray-300 pt-6"> <!-- pt-6 for drag region -->
    
    <!-- Sidebar -->
    <aside class="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col">
        <div class="p-6">
            <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <span class="text-white font-bold text-xl">e</span>
                </div>
                <div>
                    <h1 class="text-white font-bold text-lg leading-none">e1547</h1>
                    <span class="text-xs text-gray-500">Tauri v2</span>
                </div>
            </div>

            <nav class="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar pr-2">
                <button 
                    onclick={() => appState.setTab('hot')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'hot' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Flame size={20} /> <span class="font-medium">Hot</span>
                </button>
                <button 
                    onclick={() => appState.setTab('home')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'home' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Home size={20} /> <span class="font-medium">Search</span>
                </button>
                <button 
                    onclick={() => appState.setTab('timeline')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'timeline' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Clock size={20} /> <span class="font-medium">Timeline</span>
                </button>
                
                <div class="my-2 border-t border-gray-800"></div>

                {#if appState.auth.username}
                     <button 
                        onclick={() => appState.setTab('favorites')}
                        class="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'favorites' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                    >
                        <div class="flex items-center gap-3">
                            <Heart size={20} /> <span class="font-medium">Favorites</span>
                        </div>
                        {#if appState.userStats.favorite_count > 0}
                             <span class="bg-black/30 px-2 py-0.5 rounded-full text-xs">{appState.userStats.favorite_count}</span>
                        {/if}
                    </button>
                {/if}

                <button 
                    onclick={() => appState.setTab('history')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <History size={20} /> <span class="font-medium">History</span>
                </button>
                <button 
                    onclick={() => appState.setTab('blacklist')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'blacklist' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Ban size={20} /> <span class="font-medium">Blacklist</span>
                </button>

                <div class="my-2 border-t border-gray-800"></div>
                
                <button 
                    onclick={() => appState.setTab('settings')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Settings size={20} /> <span class="font-medium">Settings</span>
                </button>
                 <button 
                    onclick={() => appState.setTab('about')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'about' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Info size={20} /> <span class="font-medium">About</span>
                </button>
            </nav>
        </div>

        <div class="mt-auto p-4 border-t border-gray-800 bg-[#12171e]">
            {#if appState.auth.username}
                <div class="flex items-center justify-between">
                    <span class="text-sm font-bold text-white truncate max-w-[100px]">{appState.auth.username}</span>
                    <button onclick={() => appState.logout()} class="text-gray-500 hover:text-white"><LogOut size={18}/></button>
                </div>
            {:else}
                <button onclick={() => appState.setTab('settings')} class="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm">
                    <LogIn size={16} /> Login
                </button>
            {/if}
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        <!-- Search Bar Overlay -->
        <div class="absolute top-4 right-4 z-30 w-96">
            <form onsubmit={handleSearch} class="relative group">
                <div class="absolute left-3 top-2.5 {isSmartSearch ? 'text-purple-400' : 'text-gray-400'}">
                     {#if isThinking}
                        <Loader2 class="animate-spin" size={18} />
                     {:else if isSmartSearch}
                        <Sparkles size={18} />
                     {:else}
                        <Search size={18} />
                     {/if}
                </div>
                <input 
                    id="search-input"
                    type="text" 
                    value={searchInput}
                    oninput={handleInput}
                    placeholder={isSmartSearch ? "Describe what you want to see..." : "Search tags..."}
                    class="w-full bg-[#161b22] border rounded-full py-2 pl-10 pr-20 text-sm text-white focus:outline-none focus:ring-2 transition-all shadow-xl
                    {isSmartSearch ? 'border-purple-500/50 focus:border-purple-500 focus:ring-purple-500/20' : 'border-gray-700 focus:border-blue-500'}"
                    autocomplete="off"
                />
                
                <div class="absolute right-2 top-1.5 flex items-center space-x-1">
                    {#if appState.activeTab === 'home' && appState.searchQuery && !isSmartSearch}
                        <button 
                            type="button"
                            onclick={() => appState.toggleSubscription(appState.searchQuery)}
                            class="p-1 rounded-full {appState.subscriptions.includes(appState.searchQuery) ? 'text-blue-400' : 'text-gray-500 hover:text-white'}"
                            title="Subscribe"
                        >
                            <ListPlus size={16} />
                        </button>
                    {/if}
                    <button 
                        type="button"
                        onclick={() => { isSmartSearch = !isSmartSearch; suggestions = []; }}
                        class="p-1 rounded-full transition-all {isSmartSearch ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}"
                        title="Toggle Smart Search"
                    >
                        <Sparkles size={16} />
                    </button>
                </div>

                <!-- Autocomplete Dropdown -->
                {#if suggestions.length > 0}
                    <div class="absolute top-full left-0 right-0 mt-2 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        {#each suggestions as s}
                             <button 
                                type="button"
                                onclick={() => selectSuggestion(s.name)}
                                class="w-full text-left px-4 py-2 hover:bg-blue-600/20 hover:text-blue-400 flex justify-between items-center group"
                             >
                                <span class="font-medium text-sm text-gray-300 group-hover:text-white">{s.name}</span>
                                <span class="text-xs text-gray-600 group-hover:text-blue-300 bg-gray-800 px-1.5 rounded">{s.post_count}</span>
                             </button>
                        {/each}
                    </div>
                {/if}
            </form>
        </div>

        <!-- Views -->
        {#if appState.activeTab === 'hot'}
            <Feed query="order:rank" title="Hot Posts" />
        {:else if appState.activeTab === 'home'}
            <Feed query={appState.searchQuery} title={appState.searchQuery ? 'Search Results' : 'Search'} showWiki={true} />
        {:else if appState.activeTab === 'timeline'}
            {#if timelineQuery}
                <Feed query={timelineQuery} title="Timeline" />
            {:else}
                <div class="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Clock size={48} class="mb-4 opacity-50" />
                    <p>No subscriptions found.</p>
                </div>
            {/if}
        {:else if appState.activeTab === 'favorites'}
            {#if favoritesQuery}
                 <Feed query={favoritesQuery} title="My Favorites" />
            {:else}
                 <div class="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <p>Please log in to view favorites.</p>
                 </div>
            {/if}
        {:else if appState.activeTab === 'blacklist'}
             <BlacklistManager />
        {:else if appState.activeTab === 'settings'}
             <SettingsView />
        {:else if appState.activeTab === 'history'}
             <div class="p-8 overflow-y-auto">
                <h2 class="text-xl font-bold text-white mb-4">View History</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {#each appState.history as post}
                         <img src={post.preview.url} alt="History" class="rounded-lg hover:opacity-80 cursor-pointer" />
                    {/each}
                </div>
             </div>
        {:else if appState.activeTab === 'about'}
            <div class="p-8 max-w-2xl mx-auto flex flex-col items-center text-center animate-in fade-in duration-300">
                <div class="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
                    <span class="text-white font-bold text-5xl">e</span>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2">e1547</h1>
                <p class="text-gray-400 mb-8">A sophisticated interface for e621</p>
                <div class="bg-[#161b22] p-6 rounded-xl border border-gray-800 w-full text-left">
                    <h3 class="font-bold text-white mb-2">Version 1.4.0 (Tauri + Svelte 5)</h3>
                    <ul class="text-sm text-gray-400 space-y-1 list-disc pl-4 mb-4">
                        <li>Svelte 5 Runes Architecture</li>
                        <li>Google Gemini Smart Search</li>
                        <li>Native Tauri Networking</li>
                    </ul>
                </div>
            </div>
        {/if}
    </main>
</div>