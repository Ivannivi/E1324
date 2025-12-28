<script>
    import { Ban, Plus, Trash2, CheckCircle2, Circle } from "lucide-svelte";
    import { appState } from "./store.svelte.js";

    let newTag = $state("");

    function add() {
        if (newTag.trim()) {
            appState.addBlacklistTag(newTag);
            newTag = "";
        }
    }
</script>

<div class="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
     <h2 class="text-2xl font-bold text-white flex items-center gap-3">
        <Ban size={28} class="text-red-500" /> Blacklist Manager
    </h2>
    <p class="text-gray-400">Manage tags you want to hide from search results and timelines.</p>

    <div class="flex gap-2">
        <input 
            type="text" 
            bind:value={newTag}
            onkeydown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a tag (e.g. gore, rating:e)"
            class="flex-1 bg-[#161b22] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
        />
        <button onclick={add} class="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg flex items-center gap-2 font-medium">
            <Plus size={20} /> Add
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#if appState.blacklist.length === 0}
            <div class="col-span-2 text-center py-10 text-gray-600 italic">No blacklisted tags.</div>
        {:else}
            {#each appState.blacklist as entry}
                <div class="flex items-center justify-between p-3 rounded-lg border {entry.enabled ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-800/30 border-gray-800'}">
                    <span class="font-mono font-medium {entry.enabled ? 'text-red-300' : 'text-gray-500 line-through'}">
                        {entry.tag}
                    </span>
                    <div class="flex items-center gap-2">
                        <button 
                            onclick={() => appState.toggleBlacklistTag(entry.tag)}
                            class="p-2 rounded hover:bg-gray-700 {entry.enabled ? 'text-green-400' : 'text-gray-500'}"
                            title={entry.enabled ? "Disable Rule" : "Enable Rule"}
                        >
                            {#if entry.enabled}
                                <CheckCircle2 size={18} />
                            {:else}
                                <Circle size={18} />
                            {/if}
                        </button>
                        <button 
                            onclick={() => appState.removeBlacklistTag(entry.tag)}
                            class="p-2 rounded hover:bg-red-900/30 text-red-400"
                            title="Remove Rule"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>