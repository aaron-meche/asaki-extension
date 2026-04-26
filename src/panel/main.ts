/// <reference types="vite/client" />
import '../lib/app.css';
import './panel.css';
import { mount } from 'svelte';
import Panel from './Panel.svelte';

mount(Panel, { target: document.getElementById('app')! });
