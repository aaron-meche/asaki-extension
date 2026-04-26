<script lang="ts">
  const {
    estimatedCost,
    saving,
    saved,
    onSave,
  }: {
    estimatedCost: string;
    saving: boolean;
    saved: boolean;
    onSave: () => void;
  } = $props();
</script>

<header class="hero">
  <div>
    <p class="hero__eyebrow">Asaki Preferences</p>
    <h1>Configure the models, defaults, and arbitration rules that power your extension.</h1>
    <p class="hero__copy">Asaki uses your own provider keys locally and routes prompts through <code>rueter-ai</code> for single-model or orchestrated runs.</p>
  </div>

  <div class="hero__actions">
    <div class="hero__cost">
      <span>Estimated cost per query</span>
      <strong>{estimatedCost}</strong>
    </div>
    <button class="btn btn-primary" onclick={onSave} disabled={saving}>
      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
    </button>
  </div>
</header>
