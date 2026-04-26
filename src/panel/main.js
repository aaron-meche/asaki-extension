import '../lib/app.css';
import './panel.css';
import { mount } from 'svelte';
import Page from '../routes/+page.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Panel app mount target not found.');
}

mount(Page, { target });
