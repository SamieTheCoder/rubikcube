# @samiethecoder/add-cube

A premium 3D Rubik's Cube component you can drop into any project. Shadcn/ui-style — the component code lives in **your** repo.

Supports **React / Next.js (TSX & JSX)** and **Vue 3**.

## Install

```bash
npx @samiethecoder/add-cube
```

The CLI will ask:
1. Which framework (React TSX, React JSX, or Vue)
2. Where to place the component (defaults to `components/ui`)

Then install the peer dependency:

```bash
npm install three
# For TypeScript projects:
npm install -D @types/three
```

## Usage

### React / Next.js

```tsx
import { RubiksCube } from '@/components/ui/RubiksCube';

export default function Hero() {
  return (
    <div className="w-[500px] h-[500px]">
      <RubiksCube
        baseColor="#0a0a0a"
        textureIntensity={0.003}
        cornerRadius={0.05}
        baseSpacing={1.02}
        hoverSpacing={1.40}
        layerSpeed={0.05}
        cubeSpeed={0.010}
        enableLayerRotation={true}
        enableCubeRotation={false}
      />
    </div>
  );
}
```

### Vue

```vue
<script setup>
import RubiksCube from '@/components/ui/RubiksCube.vue';
</script>

<template>
  <RubiksCube
    base-color="#0a0a0a"
    :texture-intensity="0.003"
    :corner-radius="0.05"
    :base-spacing="1.02"
    :hover-spacing="1.40"
    :layer-speed="0.05"
    :cube-speed="0.010"
    :enable-layer-rotation="true"
    :enable-cube-rotation="false"
    class="w-[500px] h-[500px]"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `baseColor` | string | `#0a0a0a` | Hex color of the cube faces |
| `textureIntensity` | number | `0.003` | Procedural noise texture strength |
| `cornerRadius` | number | `0.05` | Rounded corner radius of each cubie |
| `baseSpacing` | number | `1.02` | Default gap between cubies |
| `hoverSpacing` | number | `1.40` | Gap when a layer is hovered |
| `layerSpeed` | number | `0.05` | Speed of layer rotation animation |
| `cubeSpeed` | number | `0.010` | Speed of whole-cube rotation |
| `enableLayerRotation` | boolean | `true` | Auto-rotate random layers |
| `enableCubeRotation` | boolean | `false` | Slowly spin the entire cube |
| `className` | string | `''` | Additional CSS classes |

## License

MIT
