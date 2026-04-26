import '../lib/app.css';
import './options.css';
import { mount } from 'svelte';
import Page from '../routes/options/+page.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Options app mount target not found.');
}

mount(Page, { target });
