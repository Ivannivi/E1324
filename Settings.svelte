<script>
    import { Settings, Shield, Sparkles, User } from "lucide-svelte";
    import { appState } from "./store.svelte.js";
    import { api } from "./api.js";

    let loadingUser = $state(false);

    async function handleLogin() {
        loadingUser = true;
        const user = await api.getUserDetails(appState.auth.username, appState.auth);
        if (user) {
            appState.userStats.favorite_count = user.favorite_count;
            appState.persist();
            alert(`Logged in as ${user.name}`);
        } else {
            alert("Failed to fetch user details. Check credentials.");
        }
        loadingUser = false;
    }
</script>

<div class="p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
    <h2 class="text-2xl font-bold text-white flex items-center gap-3">
        <Settings size={28} /> Settings
    </h2>
    
    <div class="bg-[#161b22] rounded-xl border border-gray-800 p-6 space-y-6">
        
        <!-- Auth Section -->
        <div>
            <h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2"><User size={18}/> Account</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Username</label>
                    <input type="text" bind:value={appState.auth.username} class="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">API Key</label>
                    <input type="password" bind:value={appState.auth.apiKey} class="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="From e621 > Manage API Access" />
                </div>
                <button onclick={handleLogin} disabled={loadingUser} class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold w-full">
                    {loadingUser ? "Verifying..." : "Verify & Save Login"}
                </button>
            </div>
        </div>

        <!-- Media & Privacy -->
        <div class="border-t border-gray-800 pt-6">
            <h3 class="text-lg font-medium text-white mb-4">Media & Privacy</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-gray-300">Autoplay Videos</div>
                        <div class="text-xs text-gray-500">Automatically play videos in detail view</div>
                    </div>
                    <input type="checkbox" bind:checked={appState.settings.autoplay} class="accent-blue-600 w-5 h-5" />
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-gray-300">Enable History</div>
                        <div class="text-xs text-gray-500">Keep track of viewed posts locally</div>
                    </div>
                    <input type="checkbox" bind:checked={appState.settings.enableHistory} class="accent-blue-600 w-5 h-5" />
                </div>
            </div>
        </div>

        <!-- AI Settings -->
        <div class="border-t border-gray-800 pt-6">
            <h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                 <Sparkles size={18} /> AI Settings
            </h3>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Gemini API Key</label>
                <input 
                    type="password" 
                    bind:value={appState.settings.geminiApiKey}
                    onchange={() => appState.persist()}
                    placeholder="AI Studio API Key"
                    class="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                />
                <p class="text-xs text-gray-600 mt-2">Required for smart search features.</p>
            </div>
        </div>

        <!-- Proxy Settings -->
        <div class="border-t border-gray-800 pt-6">
            <h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                 <Shield size={18} /> Proxy Settings
            </h3>
            <div class="space-y-4">
                <p className="text-xs text-yellow-600/80 mb-2">
                    Note: Tauri HTTP plugin proxy support depends on system configuration. These settings are stored but may not apply automatically without Rust backend configuration.
                </p>
                <div class="grid grid-cols-4 gap-4">
                    <div class="col-span-1">
                        <label class="block text-sm text-gray-400 mb-1">Type</label>
                        <select bind:value={appState.settings.proxy.type} onchange={() => appState.persist()} class="w-full bg-black/30 border border-gray-700 rounded-lg px-2 py-2 text-white">
                            <option value="http">HTTP</option>
                            <option value="socks">SOCKS5</option>
                        </select>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm text-gray-400 mb-1">Host</label>
                        <input type="text" bind:value={appState.settings.proxy.host} onchange={() => appState.persist()} placeholder="127.0.0.1" class="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div class="col-span-1">
                        <label class="block text-sm text-gray-400 mb-1">Port</label>
                        <input type="text" bind:value={appState.settings.proxy.port} onchange={() => appState.persist()} placeholder="8080" class="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>