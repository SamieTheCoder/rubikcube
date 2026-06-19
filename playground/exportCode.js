// Export Code Button Logic
// Add this to your playground HTML. Requires a button with id="exportCodeBtn"
// and a `config` object with the live cube settings.

document.getElementById('exportCodeBtn').addEventListener('click', () => {
  const currentHex = config.baseColor.getHexString();

  const codeSnippet = `<RubiksCube
  baseColor="#${currentHex}"
  textureIntensity={${config.textureIntensity.toFixed(3)}}
  cornerRadius={${config.cornerRadius.toFixed(2)}}
  baseSpacing={${config.baseSpacing.toFixed(2)}}
  hoverSpacing={${config.hoverSpacing.toFixed(2)}}
  layerSpeed={${config.layerSpeed}}
  cubeSpeed={${config.cubeSpeed}}
  enableLayerRotation={${config.layerRotationEnabled}}
  enableCubeRotation={${config.cubeRotationEnabled}}
  className="w-[500px] h-[500px]"
/>`;

  navigator.clipboard.writeText(codeSnippet).then(() => {
    const btn = document.getElementById('exportCodeBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Copied!`;

    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  });
});
