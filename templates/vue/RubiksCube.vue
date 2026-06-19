<template>
  <div ref="mountRef" :class="`w-full h-full cursor-grab active:cursor-grabbing ${className}`" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const props = defineProps({
  baseColor: { type: String, default: '#0a0a0a' },
  textureIntensity: { type: Number, default: 0.003 },
  cornerRadius: { type: Number, default: 0.05 },
  baseSpacing: { type: Number, default: 1.02 },
  hoverSpacing: { type: Number, default: 1.40 },
  layerSpeed: { type: Number, default: 0.05 },
  cubeSpeed: { type: Number, default: 0.010 },
  enableLayerRotation: { type: Boolean, default: true },
  enableCubeRotation: { type: Boolean, default: false },
  className: { type: String, default: '' },
});

const mountRef = ref(null);
let cleanup = null;

function initScene() {
  if (!mountRef.value) return;
  const container = mountRef.value;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(11.46, 3.11, 1.02);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;

  // Lighting
  const keyLight = new THREE.DirectionalLight(0xfec320, 5.7);
  keyLight.position.set(-8.8, 5.9, 6.2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x4488ff, 2.8);
  fillLight.position.set(6.0, -2.0, -4.0);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xff6633, 3.2);
  rimLight.position.set(0.0, 8.0, -6.0);
  scene.add(rimLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Procedural texture
  function createTexturePattern(color, intensity) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fillRect(0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity * 255;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 2})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  function getRandomMaterial(color, intensity) {
    const texture = createTexturePattern(color, intensity);
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: color,
      roughness: 0.35,
      metalness: 0.65,
      envMapIntensity: 1.0,
    });
  }

  // Build cube
  const cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  const cubies = [];
  const cubeColor = new THREE.Color(props.baseColor);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const geometry = new RoundedBoxGeometry(0.95, 0.95, 0.95, 4, props.cornerRadius);
        const material = getRandomMaterial(cubeColor, props.textureIntensity);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x * props.baseSpacing, y * props.baseSpacing, z * props.baseSpacing);
        mesh.userData = {
          originalPos: new THREE.Vector3(x * props.baseSpacing, y * props.baseSpacing, z * props.baseSpacing),
          gridPos: { x, y, z },
        };

        cubeGroup.add(mesh);
        cubies.push(mesh);
      }
    }
  }

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredLayer = [];

  function onMouseMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  container.addEventListener('mousemove', onMouseMove);

  // Layer rotation
  let activeAxis = 'y';
  let activeLayerIndex = 0;
  const layerRotationGroup = new THREE.Group();
  scene.add(layerRotationGroup);

  function getLayerCubies(axis, index) {
    return cubies.filter((c) => c.userData.gridPos[axis] === index);
  }

  function startLayerRotation() {
    const axes = ['x', 'y', 'z'];
    activeAxis = axes[Math.floor(Math.random() * 3)];
    activeLayerIndex = Math.floor(Math.random() * 3) - 1;

    const layer = getLayerCubies(activeAxis, activeLayerIndex);
    layer.forEach((cubie) => {
      cubeGroup.remove(cubie);
      layerRotationGroup.add(cubie);
    });
  }

  function endLayerRotation() {
    const children = [...layerRotationGroup.children];
    children.forEach((cubie) => {
      cubie.updateWorldMatrix(true, false);
      const worldPos = new THREE.Vector3();
      cubie.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      cubie.getWorldQuaternion(worldQuat);

      layerRotationGroup.remove(cubie);
      cubeGroup.add(cubie);
      cubie.position.copy(worldPos);
      cubie.quaternion.copy(worldQuat);

      cubie.userData.gridPos = {
        x: Math.round(cubie.position.x / props.baseSpacing),
        y: Math.round(cubie.position.y / props.baseSpacing),
        z: Math.round(cubie.position.z / props.baseSpacing),
      };
      cubie.userData.originalPos = new THREE.Vector3(
        cubie.userData.gridPos.x * props.baseSpacing,
        cubie.userData.gridPos.y * props.baseSpacing,
        cubie.userData.gridPos.z * props.baseSpacing
      );
    });
    layerRotationGroup.rotation.set(0, 0, 0);
  }

  let layerRotationActive = false;
  let layerRotationProgress = 0;
  const LAYER_TARGET = Math.PI / 2;

  if (props.enableLayerRotation) {
    startLayerRotation();
    layerRotationActive = true;
  }

  // Animation
  let animationFrameId;
  const clock = new THREE.Clock();

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubies);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const hitLayer = hit.userData.gridPos.y;
      hoveredLayer = cubies.filter((c) => c.userData.gridPos.y === hitLayer);
    } else {
      hoveredLayer = [];
    }

    cubies.forEach((cubie) => {
      const isHovered = hoveredLayer.includes(cubie);
      const targetSpacing = isHovered ? props.hoverSpacing : props.baseSpacing;
      const targetPos = new THREE.Vector3(
        cubie.userData.gridPos.x * targetSpacing,
        cubie.userData.gridPos.y * targetSpacing,
        cubie.userData.gridPos.z * targetSpacing
      );
      cubie.position.lerp(targetPos, 0.08);
    });

    if (props.enableLayerRotation && layerRotationActive) {
      layerRotationProgress += props.layerSpeed * delta * 60;
      if (layerRotationProgress >= LAYER_TARGET) {
        layerRotationProgress = LAYER_TARGET;
        if (activeAxis === 'x') layerRotationGroup.rotation.x = LAYER_TARGET;
        if (activeAxis === 'y') layerRotationGroup.rotation.y = LAYER_TARGET;
        if (activeAxis === 'z') layerRotationGroup.rotation.z = LAYER_TARGET;

        endLayerRotation();
        layerRotationProgress = 0;
        startLayerRotation();
      } else {
        if (activeAxis === 'x') layerRotationGroup.rotation.x = layerRotationProgress;
        if (activeAxis === 'y') layerRotationGroup.rotation.y = layerRotationProgress;
        if (activeAxis === 'z') layerRotationGroup.rotation.z = layerRotationProgress;
      }
    }

    if (props.enableCubeRotation) {
      cubeGroup.rotation.y += props.cubeSpeed;
    }

    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const handleResize = () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  cleanup = () => {
    window.removeEventListener('resize', handleResize);
    container.removeEventListener('mousemove', onMouseMove);
    cancelAnimationFrame(animationFrameId);
    if (container && renderer.domElement) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
    cubies.forEach((cubie) => {
      cubie.geometry.dispose();
      cubie.material.dispose();
    });
  };
}

onMounted(() => {
  initScene();
});

onBeforeUnmount(() => {
  if (cleanup) cleanup();
});
</script>
