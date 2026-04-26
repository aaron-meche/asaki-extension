<script>
  const {
    estimatedCost,
    saving,
    saved,
    onSave,
  } = $props();
</script>

<header class="hero">
  <div>
    <p class="hero__eyebrow">Asaki Preferences</p>
    <h1>Keep the extension lean: providers, defaults, and history.</h1>
    <p class="hero__copy">Everything stays local. Add keys, choose defaults, and save only the controls you actually need.</p>
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
