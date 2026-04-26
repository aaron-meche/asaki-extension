<script lang="ts">
  import type { Snippet } from 'svelte';

  const {
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: Snippet;
  } = $props();
</script>

<section class="section">
  <div class="section__intro">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>

  {@render children()}
</section>
