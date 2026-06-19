'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

interface RubiksCubeProps {
  baseColor?: string;
  textureIntensity?: number;
  cornerRadius?: number;
  baseSpacing?: number;
  hoverSpacing?: number;
  layerSpeed?: number;
  cubeSpeed?: number;
  enableLayerRotation?: boolean;
  enableCubeRotation?: boolean;
  className?: string;
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({
  baseColor = '#0a0a0a',
  textureIntensity = 0.003,
  cornerRadius = 0.05,
  baseSpacing = 1.02,
  hoverSpacing = 1.40,
  layerSpeed = 0.05,
  cubeSpeed = 0.010,
  enableLayerRotation = true,
  enableCubeRotation = false,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
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
    function createTexturePattern(color: THREE.Color, intensity: number): THREE.Texture {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = `#${color.getHexString()}`;
      ctx.fillRect(0, 0, size, size);

      // Add noise
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 255;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);

      // Add subtle grid lines
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

    function getRandomMaterial(color: THREE.Color, intensity: number): THREE.MeshStandardMaterial {
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

    const cubies: THREE.Mesh[] = [];
    const cubeColor = new THREE.Color(baseColor);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geometry = new RoundedBoxGeometry(0.95, 0.95, 0.95, 4, cornerRadius);
          const material = getRandomMaterial(cubeColor, textureIntensity);
          const mesh = new THREE.Mesh(geometry, material);

          mesh.position.set(x * baseSpacing, y * baseSpacing, z * baseSpacing);
          mesh.userData = { originalPos: new THREE.Vector3(x * baseSpacing, y * baseSpacing, z * baseSpacing), gridPos: { x, y, z } };

          cubeGroup.add(mesh);
          cubies.push(mesh);
        }
      }
    }

    // Raycaster for hover effect
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredLayer: THREE.Mesh[] = [];

    function onMouseMove(event: MouseEvent) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    container.addEventListener('mousemove', onMouseMove);

    // Layer rotation state
    let layerAngle = 0;
    let activeAxis: 'x' | 'y' | 'z' = 'y';
    let activeLayerIndex = 0;
    const layerRotationGroup = new THREE.Group();
    scene.add(layerRotationGroup);

    function getLayerCubies(axis: 'x' | 'y' | 'z', index: number): THREE.Mesh[] {
      return cubies.filter((c) => c.userData.gridPos[axis] === index);
    }

    function startLayerRotation() {
      const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
      activeAxis = axes[Math.floor(Math.random() * 3)];
      activeLayerIndex = Math.floor(Math.random() * 3) - 1;

      const layer = getLayerCubies(activeAxis, activeLayerIndex);
      layer.forEach((cubie) => {
        cubeGroup.remove(cubie);
        layerRotationGroup.add(cubie);
      });
    }

    function endLayerRotation() {
      const children = [...layerRotationGroup.children] as THREE.Mesh[];
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

        // Snap grid position
        cubie.userData.gridPos = {
          x: Math.round(cubie.position.x / baseSpacing),
          y: Math.round(cubie.position.y / baseSpacing),
          z: Math.round(cubie.position.z / baseSpacing),
        };
        cubie.userData.originalPos = new THREE.Vector3(
          cubie.userData.gridPos.x * baseSpacing,
          cubie.userData.gridPos.y * baseSpacing,
          cubie.userData.gridPos.z * baseSpacing
        );
      });
      layerRotationGroup.rotation.set(0, 0, 0);
    }

    let layerRotationActive = false;
    let layerRotationProgress = 0;
    const LAYER_TARGET = Math.PI / 2;

    if (enableLayerRotation) {
      startLayerRotation();
      layerRotationActive = true;
    }

    // Animation loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Hover effect - spread cubies
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cubies);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const hitLayer = hit.userData.gridPos.y;
        hoveredLayer = cubies.filter((c) => c.userData.gridPos.y === hitLayer);
      } else {
        hoveredLayer = [];
      }

      cubies.forEach((cubie) => {
        const isHovered = hoveredLayer.includes(cubie);
        const targetSpacing = isHovered ? hoverSpacing : baseSpacing;
        const targetPos = new THREE.Vector3(
          cubie.userData.gridPos.x * targetSpacing,
          cubie.userData.gridPos.y * targetSpacing,
          cubie.userData.gridPos.z * targetSpacing
        );
        cubie.position.lerp(targetPos, 0.08);
      });

      // Layer rotation animation
      if (enableLayerRotation && layerRotationActive) {
        layerRotationProgress += layerSpeed * delta * 60;
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

      // Whole cube slow rotation
      if (enableCubeRotation) {
        cubeGroup.rotation.y += cubeSpeed;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cubies.forEach((cubie) => {
        cubie.geometry.dispose();
        (cubie.material as THREE.MeshStandardMaterial).dispose();
      });
    };
  }, [baseColor, textureIntensity, cornerRadius, baseSpacing, hoverSpacing, layerSpeed, cubeSpeed, enableLayerRotation, enableCubeRotation]);

  return <div ref={mountRef} className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`} />;
};

export default RubiksCube;
