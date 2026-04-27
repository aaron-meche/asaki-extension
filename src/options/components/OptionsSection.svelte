<script>
    const {
        title,
        description,
        children,
    } = $props();
</script>

<section class="section">
    <div class="section__intro">
        <h2>{title}</h2>
        <p>{description}</p>
    </div>

    {@render children()}
</section>
