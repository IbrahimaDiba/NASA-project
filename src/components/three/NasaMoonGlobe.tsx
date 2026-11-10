// ============================================================================
// Lunar Horizon — NASA Moon Globe & Surface Explorer
// High-Fidelity 8K Lunar Representation with Real LOLA DEM Topographic Relief
// Dual-frequency displacement + bump mapping, realistic space illumination,
// and Apollo-grade regolith photometric response.
// ============================================================================

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LunarSite } from '../../types';
import { SITES, CATEGORIES, formatCoordinates } from '../../data/sites';
import { lunarTerrainService, LocalTerrainData } from '../../services/lunarTerrainService';

// Convert lat/lon into 3D Cartesian coordinates on sphere
export function latLonToSphere(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

// ----------------------------------------------------------------------------
// 1. Orbital Mode: 8K/4K Displaced Sphere with Topographic Bump Relief
// ----------------------------------------------------------------------------
interface OrbitalMoonProps {
  colorTexture: THREE.Texture;
  dispTexture: THREE.Texture;
  displacementScale: number;
  displacementBias: number;
  autoRotate: boolean;
  selectedSite: LunarSite;
  onSelectSite: (s: LunarSite) => void;
}

function OrbitalMoon({
  colorTexture,
  dispTexture,
  displacementScale,
  displacementBias,
  autoRotate,
  selectedSite,
  onSelectSite,
}: OrbitalMoonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
      if (glowRef.current) {
        glowRef.current.rotation.y += delta * 0.02;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* High-Resolution Displaced & Bumped NASA Lunar Sphere (256x256 segments) */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[2, 256, 256]} />
        <meshStandardMaterial
          map={colorTexture}
          displacementMap={dispTexture}
          displacementScale={displacementScale}
          displacementBias={displacementBias}
          bumpMap={dispTexture}
          bumpScale={0.06}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* Subtle Lunar Limb / Horizon Fresnel Silhouette Glow */}
      <mesh scale={[1.008, 1.008, 1.008]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#38BDF8"
          side={THREE.BackSide}
          transparent
          opacity={0.07}
        />
      </mesh>

      {/* 3D Landing Site Pins positioned on true lunar coordinates */}
      {SITES.map((site) => {
        const isSel = site.id === selectedSite.id;
        const color = isSel ? '#000000' : (CATEGORIES[site.category]?.color || '#0F172A');
        const pos = latLonToSphere(site.lat, site.lon, 2.035 + displacementScale * 0.5);

        return (
          <SiteMarker3D
            key={site.id}
            site={site}
            position={pos}
            isSelected={isSel}
            color={color}
            onClick={() => onSelectSite(site)}
          />
        );
      })}
    </group>
  );
}

// Individual 3D pin marker with hover HUD & glowing pulse ring
function SiteMarker3D({
  site,
  position,
  isSelected,
  color,
  onClick,
}: {
  site: LunarSite;
  position: [number, number, number];
  isSelected: boolean;
  color: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Central Marker Pin */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[isSelected ? 0.065 : 0.038, 16, 16]} />
        <meshBasicMaterial color={hovered ? '#FFFFFF' : color} />
      </mesh>

      {/* Selected Target Concentric Rings */}
      {isSelected && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.075, 0.095, 32]} />
            <meshBasicMaterial color="#38BDF8" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.115, 0.125, 32]} />
            <meshBasicMaterial color="#38BDF8" side={THREE.DoubleSide} transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {/* HUD Info Popup on Hover or Selection */}
      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, 0.14, 0]} center>
          <div className="bg-[#000000]/90 border border-white/20 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none whitespace-nowrap text-center text-white">
            <p className="text-[11px] font-extrabold text-white leading-tight">{site.name}</p>
            <p className="text-[9px] font-mono text-[#38BDF8] mt-0.5">
              {formatCoordinates(site.lat, site.lon, 1)} · LOLA {site.elevation > 0 ? '+' : ''}{site.elevation.toFixed(0)}m
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 2. Surface Mode: Ground-Level Local 3D Terrain from NASA LOLA DEM
// ----------------------------------------------------------------------------
interface SurfaceTerrainMeshProps {
  terrainData: LocalTerrainData;
  colorTexture: THREE.Texture;
  selectedSite: LunarSite;
}

function SurfaceTerrainMesh({ terrainData, colorTexture, selectedSite }: SurfaceTerrainMeshProps) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(terrainData.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(terrainData.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(terrainData.indices, 1));
    g.computeVertexNormals();
    return g;
  }, [terrainData]);

  return (
    <group position={[0, 0, 0]}>
      {/* Local Topographic Surface with bump mapping and realistic regolith finish */}
      <mesh geometry={geom} receiveShadow castShadow>
        <meshStandardMaterial
          map={colorTexture}
          bumpMap={colorTexture}
          bumpScale={0.12}
          roughness={0.95}
          metalness={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Lander / Surface Asset Marker at Landing Center */}
      <group position={[0, 0.2, 0]}>
        {/* Lander Base (Gold MLI Thermal Foil) */}
        <mesh castShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.45, 0.65, 0.35, 8]} />
          <meshStandardMaterial color="#EAB308" metalness={0.88} roughness={0.18} />
        </mesh>

        {/* Lander Legs */}
        {[-0.5, 0.5].map((x) =>
          [-0.5, 0.5].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.08, z]} rotation={[x * 0.4, 0, z * 0.4]}>
              <cylinderGeometry args={[0.03, 0.05, 0.3, 8]} />
              <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Antenna Mast */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
          <meshStandardMaterial color="#F1F5F9" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* High-Gain Dish pointing Earthward */}
        <mesh position={[0.2, 0.9, 0]} rotation={[0.4, 0.5, 0]}>
          <coneGeometry args={[0.25, 0.15, 16, 1, true]} />
          <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} roughness={0.3} />
        </mesh>

        {/* HUD Beacon */}
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-[#000000] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>{selectedSite.name} — Surface Touchdown</span>
          </div>
        </Html>
      </group>
    </group>
  );
}

// Camera transition helper
function CameraRig({ mode }: { mode: 'orbital' | 'surface' }) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'surface') {
      camera.position.set(0, 8, 22);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 0, 4.6);
      camera.lookAt(0, 0, 0);
    }
  }, [mode, camera]);

  return null;
}

// ----------------------------------------------------------------------------
// 3. Main Export Component
// ----------------------------------------------------------------------------
export interface NasaMoonGlobeProps {
  mode: 'orbital' | 'surface';
  selectedSite: LunarSite;
  onSelectSite: (s: LunarSite) => void;
  autoRotate: boolean;
  displacementScale: number;
  onElevationChange?: (elevMeters: number) => void;
}

export default function NasaMoonGlobe({
  mode,
  selectedSite,
  onSelectSite,
  autoRotate,
  displacementScale,
  onElevationChange,
}: NasaMoonGlobeProps) {
  const [colorTexture, setColorTexture] = useState<THREE.Texture | null>(null);
  const [dispTexture, setDispTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [terrainData, setTerrainData] = useState<LocalTerrainData | null>(null);

  // Progressive loading of NASA Textures (2K -> 4K -> 8K ultra-definition)
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let isMounted = true;

    async function loadAssets() {
      setIsLoading(true);
      await lunarTerrainService.init();

      const configureTexture = (tex: THREE.Texture, isSRGB: boolean = false) => {
        if (isSRGB) tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 16;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      };

      // 1. Instant 2K Texture
      loader.load('/assets/moon/lroc_color_2k.webp', (tex2k) => {
        if (!isMounted) return;
        configureTexture(tex2k, true);
        setColorTexture(tex2k);

        // 2. Upgrade to 4K Color
        loader.load('/assets/moon/lroc_color_4k.webp', (tex4k) => {
          if (!isMounted) return;
          configureTexture(tex4k, true);
          setColorTexture(tex4k);

          // 3. Upgrade to true 8K authentic NASA lunar surface
          loader.load('/assets/moon/moon_8k.jpg', (tex8k) => {
            if (!isMounted) return;
            configureTexture(tex8k, true);
            setColorTexture(tex8k);
          });
        });
      });

      // 4. Load LOLA Topographic Displacement Maps
      loader.load('/assets/moon/ldem_displacement_2k.webp', (disp2k) => {
        if (!isMounted) return;
        configureTexture(disp2k, false);
        setDispTexture(disp2k);
        setIsLoading(false);

        loader.load('/assets/moon/ldem_displacement_4k.webp', (disp4k) => {
          if (!isMounted) return;
          configureTexture(disp4k, false);
          setDispTexture(disp4k);
        });
      });
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update elevation and generate local terrain when site changes
  useEffect(() => {
    const elev = lunarTerrainService.getElevation(selectedSite.lat, selectedSite.lon);
    onElevationChange?.(elev);

    // Generate local 3D terrain grid (~40km span, 64x64 grid)
    const local = lunarTerrainService.generateLocalTerrain(selectedSite.lat, selectedSite.lon, 40, 64);
    setTerrainData(local);
  }, [selectedSite, onElevationChange]);

  // Compute displacement bias based on dataset range
  const dispBias = -0.4566 * displacementScale;

  return (
    <>
      <CameraRig mode={mode} />

      {/* Cinematic Deep Space Solar Illumination */}
      <directionalLight
        position={[8, 3.5, 7]}
        intensity={3.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Soft Earthshine fill light illuminating the night side subtly */}
      <directionalLight
        position={[-7, -2.5, -6]}
        intensity={0.16}
        color="#93C5FD"
      />

      {/* Minimal space vacuum ambient light */}
      <ambientLight intensity={0.06} />

      {/* Loading HUD overlay */}
      {isLoading && (
        <Html center>
          <div className="bg-[#FFFFFF]/95 border-2 border-[#000000] px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#000000] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-[#0F172A] font-mono">
              STREAMING NASA 8K LROC & LOLA RELIEF…
            </span>
          </div>
        </Html>
      )}

      {/* Orbital Mode vs Surface Mode */}
      {mode === 'orbital' && colorTexture && dispTexture && (
        <OrbitalMoon
          colorTexture={colorTexture}
          dispTexture={dispTexture}
          displacementScale={displacementScale}
          displacementBias={dispBias}
          autoRotate={autoRotate}
          selectedSite={selectedSite}
          onSelectSite={onSelectSite}
        />
      )}

      {mode === 'surface' && terrainData && colorTexture && (
        <SurfaceTerrainMesh
          terrainData={terrainData}
          colorTexture={colorTexture}
          selectedSite={selectedSite}
        />
      )}

      <OrbitControls
        enablePan={mode === 'surface'}
        minDistance={mode === 'surface' ? 3 : 2.4}
        maxDistance={mode === 'surface' ? 50 : 8}
        rotateSpeed={mode === 'surface' ? 0.6 : 0.55}
        dampingFactor={0.05}
      />
    </>
  );
}
