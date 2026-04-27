<script>
    import { createPanelController } from '../panel/controller.svelte.js';
    import Panel from '../panel/Panel.svelte';

    const panel = createPanelController();
</script>

<Panel {panel} />
