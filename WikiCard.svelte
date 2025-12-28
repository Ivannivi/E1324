<script>
    import { BookOpen } from "lucide-svelte";
    let { wiki } = $props();
    
    // Computed property for snippet
    let snippet = $derived(wiki ? wiki.body.split('\r\n')[0].substring(0, 300) : "");
</script>

{#if wiki}
    <div class="mx-4 mt-4 bg-[#161b22] border border-gray-700 rounded-xl p-4 flex items-start space-x-4 animate-in fade-in slide-in-from-top-4">
       <div class="bg-gray-800 p-3 rounded-lg">
          <BookOpen size={24} class="text-gray-400" />
       </div>
       <div class="flex-1">
          <h3 class="text-white font-bold text-lg mb-1 capitalize">{wiki.title.replaceAll('_', ' ')}</h3>
          <p class="text-gray-400 text-sm leading-relaxed line-clamp-3 font-mono">
             {snippet}...
          </p>
       </div>
    </div>
{/if}