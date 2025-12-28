<script>
    import { X, Heart, Bookmark, Download, Info, MessageSquare, Play } from "lucide-svelte";
    import { api } from "./api.js";
    import { appState } from "./store.svelte.js";

    let { post, onClose } = $props();
    let comments = $state([]);
    let loadingComments = $state(true);

    const isVideo = ["webm", "mp4"].includes(post.file.ext);

    $effect(() => {
        if (post) {
            loadingComments = true;
            api.getComments(post.id).then(c => {
                comments = c;
                loadingComments = false;
            });
        }
    });

    function handleTagClick(tag) {
        appState.setSearch(tag);
        onClose();
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-[#161b22] w-full max-w-7xl max-h-[95vh] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-gray-800">
        
        <!-- Mobile Close -->
        <button onclick={onClose} class="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white md:hidden z-10">
            <X size={20} />
        </button>

        <!-- Media Viewer -->
        <div class="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
           {#if isVideo}
             <video 
               src={post.file.url} 
               controls 
               loop 
               autoplay={appState.settings.autoplay}
               class="max-w-full max-h-[50vh] md:max-h-[95vh] object-contain" 
             ></video>
           {:else}
             <img 
               src={post.file.url} 
               alt="Post {post.id}" 
               class="max-w-full max-h-[50vh] md:max-h-[95vh] object-contain"
             />
           {/if}
        </div>

        <!-- Sidebar Info -->
        <div class="w-full md:w-96 flex flex-col border-l border-gray-800 bg-[#0d1117] h-[50vh] md:h-auto">
            <div class="p-4 border-b border-gray-800 flex justify-between items-start">
                <div>
                   <h2 class="text-lg font-bold text-white font-mono">#{post.id}</h2>
                   <div class="text-xs text-gray-500 mt-1">{post.file.width}x{post.file.height} • {post.file.ext.toUpperCase()}</div>
                </div>
                <button onclick={onClose} class="hidden md:block text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <!-- Action Bar -->
            <div class="grid grid-cols-4 gap-2 p-4 border-b border-gray-800">
                 <button class="flex flex-col items-center p-2 hover:bg-gray-800 rounded text-gray-400">
                    <Heart size={20} /> <span class="text-xs mt-1">Fav</span>
                 </button>
                 <button class="flex flex-col items-center p-2 hover:bg-gray-800 rounded text-gray-400">
                    <Bookmark size={20} /> <span class="text-xs mt-1">Save</span>
                 </button>
                 <button onclick={() => window.open(post.file.url, '_blank')} class="flex flex-col items-center p-2 hover:bg-gray-800 rounded text-gray-400">
                    <Download size={20} /> <span class="text-xs mt-1">DL</span>
                 </button>
                 <button class="flex flex-col items-center p-2 hover:bg-gray-800 rounded text-gray-400">
                    <Info size={20} /> <span class="text-xs mt-1">Info</span>
                 </button>
            </div>

            <!-- Tags & Desc -->
            <div class="flex-1 overflow-y-auto p-4 space-y-6">
                <div class="space-y-4">
                  {#each ['artist', 'character', 'copyright', 'species', 'general', 'meta'] as type}
                    {#if post.tags[type] && post.tags[type].length > 0}
                      <div>
                        <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">{type}s</h3>
                        <div class="flex flex-wrap gap-1">
                          {#each post.tags[type] as tag}
                            <button 
                                onclick={() => handleTagClick(tag)}
                                class="px-2 py-0.5 text-xs border rounded hover:opacity-80
                                {type === 'artist' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 
                                 type === 'character' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                                 type === 'copyright' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' :
                                 'text-blue-400 border-blue-400/30 bg-blue-400/10'}"
                            >
                                {tag}
                            </button>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
                
                <!-- Comments -->
                <div>
                   <div class="flex items-center gap-2 mb-4 text-gray-400 pb-2 border-b border-gray-800">
                        <MessageSquare size={16} />
                        <span class="text-sm font-bold uppercase">Comments</span>
                   </div>
                   {#if loadingComments}
                        <div class="text-center text-gray-600 text-xs">Loading...</div>
                   {:else if comments.length === 0}
                        <div class="text-center text-gray-600 text-xs italic">No comments.</div>
                   {:else}
                        <div class="space-y-4">
                            {#each comments as c}
                                <div class="bg-gray-800/30 p-3 rounded-lg">
                                    <div class="flex justify-between mb-1">
                                        <span class="text-xs font-bold text-blue-400">{c.creator_name}</span>
                                        <span class="text-[10px] text-gray-600">{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div class="text-sm text-gray-300 whitespace-pre-wrap">{c.body}</div>
                                </div>
                            {/each}
                        </div>
                   {/if}
                </div>
            </div>
        </div>
    </div>
</div>