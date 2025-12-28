<script>
    import { Flame, Home, Clock, Settings, LogIn, LogOut, Search, ListPlus, History } from "lucide-svelte";
    import { appState } from "./store.svelte.js";
    import Feed from "./Feed.svelte";

    let searchInput = $state("");

    function handleSearch(e) {
        e.preventDefault();
        if (searchInput.trim()) {
            appState.setSearch(searchInput);
        }
    }

    // Derived Query Logic for Timeline
    let timelineQuery = $derived(appState.subscriptions.length > 0 ? appState.subscriptions.map(s => `~${s}`).join(" ") : "");
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

            <nav class="space-y-1">
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

                <button 
                    onclick={() => appState.setTab('history')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'history' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <History size={20} /> <span class="font-medium">History</span>
                </button>
                <button 
                    onclick={() => appState.setTab('settings')}
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {appState.activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}"
                >
                    <Settings size={20} /> <span class="font-medium">Settings</span>
                </button>
            </nav>
        </div>

        <div class="mt-auto p-4 border-t border-gray-800 bg-[#12171e]">
            {#if appState.auth.username}
                <div class="flex items-center justify-between">
                    <span class="text-sm font-bold text-white">{appState.auth.username}</span>
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
            <form onsubmit={handleSearch} class="relative">
                <Search class="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    bind:value={searchInput}
                    placeholder="Search e621..."
                    class="w-full bg-[#161b22] border border-gray-700 rounded-full py-2 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 shadow-xl"
                />
                {#if appState.activeTab === 'home' && appState.searchQuery}
                    <button 
                        type="button"
                        onclick={() => appState.toggleSubscription(appState.searchQuery)}
                        class="absolute right-3 top-2.5 {appState.subscriptions.includes(appState.searchQuery) ? 'text-blue-400' : 'text-gray-500 hover:text-white'}"
                        title="Subscribe"
                    >
                        <ListPlus size={18} />
                    </button>
                {/if}
            </form>
        </div>

        <!-- Views -->
        {#if appState.activeTab === 'hot'}
            <Feed query="order:rank" title="Hot Posts" />
        {:else if appState.activeTab === 'home'}
            <Feed query={appState.searchQuery} title={appState.searchQuery ? 'Search Results' : 'Search'} />
        {:else if appState.activeTab === 'timeline'}
            {#if timelineQuery}
                <Feed query={timelineQuery} title="Timeline" />
            {:else}
                <div class="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Clock size={48} class="mb-4 opacity-50" />
                    <p>No subscriptions found.</p>
                    <p class="text-sm mt-2">Search for tags and click the (+) button to subscribe.</p>
                </div>
            {/if}
        {:else if appState.activeTab === 'settings'}
             <div class="p-8 text-white max-w-2xl mx-auto">
                <h2 class="text-2xl font-bold mb-6">Settings</h2>
                <div class="bg-[#161b22] p-6 rounded-xl border border-gray-800 space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Username</label>
                        <input type="text" bind:value={appState.auth.username} class="w-full bg-black/30 border border-gray-700 rounded px-3 py-2" />
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">API Key</label>
                        <input type="password" bind:value={appState.auth.apiKey} class="w-full bg-black/30 border border-gray-700 rounded px-3 py-2" />
                    </div>
                    <button onclick={() => appState.persist()} class="bg-blue-600 px-4 py-2 rounded font-bold">Save Auth</button>
                    
                    <div class="border-t border-gray-800 pt-4 mt-4">
                         <div class="flex items-center justify-between">
                            <span>Enable History</span>
                            <input type="checkbox" bind:checked={appState.settings.enableHistory} />
                         </div>
                    </div>
                </div>
             </div>
        {:else if appState.activeTab === 'history'}
             <div class="p-8">
                <h2 class="text-xl font-bold text-white mb-4">View History</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {#each appState.history as post}
                         <img src={post.preview.url} class="rounded-lg hover:opacity-80 cursor-pointer" />
                    {/each}
                </div>
             </div>
        {/if}
    </main>
</div>