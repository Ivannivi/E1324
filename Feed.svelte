<script>
    import { onMount } from "svelte";
    import { Loader2, Play } from "lucide-svelte";
    import { api } from "./api.js";
    import { appState } from "./store.svelte.js";
    import PostModal from "./PostModal.svelte";

    // Props: Query to fetch data
    let { query, title } = $props();

    let posts = $state([]);
    let page = $state(1);
    let loading = $state(false);
    let selectedPost = $state(null);
    let endOfResults = $state(false);
    let loadTrigger;

    async function loadPosts(reset = false) {
        if (loading || (endOfResults && !reset)) return;
        
        loading = true;
        if (reset) {
            posts = [];
            page = 1;
            endOfResults = false;
        }

        const newPosts = await api.getPosts(query, page, appState.auth);
        
        if (newPosts.length === 0) {
            endOfResults = true;
        } else {
            posts = [...posts, ...newPosts];
            page++;
        }
        loading = false;
    }

    // React to query changes (using $effect for prop changes)
    $effect(() => {
        // When query changes, reset and reload
        loadPosts(true);
    });

    // Infinite Scroll
    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadPosts();
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loadTrigger) observer.observe(loadTrigger);
        return () => observer.disconnect();
    });

    function openPost(post) {
        selectedPost = post;
        appState.addToHistory(post);
    }
</script>

<div class="h-full flex flex-col">
    <div class="p-4 border-b border-gray-800 bg-[#0d1117]/95 backdrop-blur z-20 sticky top-0">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
            {title}
            {#if query}
                <span class="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">query: {query}</span>
            {/if}
        </h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4" id="scroll-container">
        {#if posts.length === 0 && !loading}
            <div class="h-64 flex flex-col items-center justify-center text-gray-500">
                <p>No posts found.</p>
            </div>
        {:else}
            <!-- Masonry Grid CSS -->
            <div class="masonry-grid">
                {#each posts as post (post.id)}
                    {#if post.file.url || post.preview.url}
                        <div 
                            class="break-inside-avoid mb-4 bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-lg group relative"
                            onclick={() => openPost(post)}
                            role="button"
                            tabindex="0"
                            onkeypress={(e) => e.key === 'Enter' && openPost(post)}
                        >
                            <img 
                                src={post.preview.url || post.file.url} 
                                alt="Thumb {post.id}"
                                loading="lazy"
                                class="w-full h-auto object-cover min-h-[100px]"
                            />
                            {#if ["webm", "mp4"].includes(post.file.ext)}
                                <div class="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                                    <Play size={12} class="text-white" />
                                </div>
                            {/if}
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <div class="flex justify-between items-end">
                                  <span class="text-white text-xs font-mono font-bold">#{post.id}</span>
                                  <span class="text-xs px-1.5 py-0.5 rounded text-white bg-gray-700">
                                    {post.rating.toUpperCase()}
                                  </span>
                               </div>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        <div bind:this={loadTrigger} class="py-8 flex justify-center w-full min-h-[50px]">
            {#if loading}
                <Loader2 class="animate-spin text-blue-500" size={32} />
            {/if}
        </div>
    </div>
</div>

{#if selectedPost}
    <PostModal post={selectedPost} onClose={() => selectedPost = null} />
{/if}

<style>
    .masonry-grid {
        column-count: 2;
        column-gap: 1rem;
    }
    @media (min-width: 640px) { .masonry-grid { column-count: 3; } }
    @media (min-width: 1024px) { .masonry-grid { column-count: 4; } }
    @media (min-width: 1280px) { .masonry-grid { column-count: 5; } }
    .break-inside-avoid { break-inside: avoid; }
</style>