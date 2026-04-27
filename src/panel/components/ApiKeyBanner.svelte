<script>
    const { onOpenSettings } = $props();
</script>

<div class="banner">
    <div>
        <strong>Add an API key to start using Asaki.</strong>
        <p>No enabled provider is ready yet. Open Preferences and add at least one provider key.</p>
    </div>
    <button class="btn btn-secondary btn-sm" onclick={onOpenSettings}>Open Preferences</button>
</div>
