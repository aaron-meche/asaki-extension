<script>
    import { createOptionsController } from '../../options/controller.svelte.js';
    import Options from '../../options/Options.svelte';

    const options = createOptionsController();
</script>

<Options {options} />
