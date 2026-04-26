<script lang="ts">
  import OptionsSection from './OptionsSection.svelte';

  const {
    maxTokens,
    temperature,
    onMaxTokensChange,
    onTemperatureChange,
  }: {
    maxTokens: number;
    temperature: number;
    onMaxTokensChange: (value: number) => void;
    onTemperatureChange: (value: number) => void;
  } = $props();
</script>

<OptionsSection
  title="Response shaping"
  description="These controls are passed directly into RueterModel.prompt()."
>
  <div class="grid grid--two">
    <div class="card card--stack">
      <label class="field__label" for="max-tokens">Max tokens per response: <strong>{maxTokens}</strong></label>
      <input
        id="max-tokens"
        class="range"
        type="range"
        min="256"
        max="4096"
        step="128"
        value={maxTokens}
        oninput={(event) => onMaxTokensChange(Number((event.currentTarget as HTMLInputElement).value))}
      />
      <div class="range-hints"><span>256</span><span>4096</span></div>
    </div>

    <div class="card card--stack">
      <label class="field__label" for="temperature">Temperature: <strong>{temperature}</strong></label>
      <input
        id="temperature"
        class="range"
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={temperature}
        oninput={(event) => onTemperatureChange(Number((event.currentTarget as HTMLInputElement).value))}
      />
      <div class="range-hints"><span>Focused</span><span>Creative</span></div>
    </div>
  </div>
</OptionsSection>
