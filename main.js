import { mount } from 'svelte';
import App from './App.svelte';

// Mount Svelte 5 App
const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;