// ============================================================================
// Lunar Horizon — Immersive 360° Lunar Surface & Sky Observatory
// Photorealistic local environment with real 3D Sun, Earth, lunar lander & terrain
// ============================================================================

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { LunarSite } from '../../types';
import { CelestialBodySkyState, astronomicalService } from '../../services/astronomicalService';
import { formatCoordinates } from '../../data/sites';

interface ImmersiveLunarSkyProps {
  site: LunarSite;
  sun: CelestialBodySkyState;
  earth: CelestialBodySkyState;
  viewMode: 'ground' | 'orbital';
  showHud: boolean;
  onTargetClick?: (target: 'sun' | 'earth') => void;
}

export default function ImmersiveLunarSky({
  site,
  sun,
  earth,
  viewMode,
  showHud,
  onTargetClick,
}: ImmersiveLunarSkyProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const skyRadius = 24;

  // Compute 3D Cartesian coordinates on the sky dome
  const sunPos = useMemo(() => {
    return astronomicalService.skyAnglesToVector3(sun.azimuthDeg, sun.elevationDeg, skyRadius);
  }, [sun.azimuthDeg, sun.elevationDeg]);

  const earthPos = useMemo(() => {
    return astronomicalService.skyAnglesToVector3(earth.azimuthDeg, earth.elevationDeg, skyRadius);
  }, [earth.azimuthDeg, earth.elevationDeg]);

  // Adjust camera position depending on viewMode (Ground 1st-person vs Orbit Overview)
  React.useEffect(() => {
    if (controlsRef.current) {
      if (viewMode === 'ground') {
        // Place camera at astronaut eye-level on the crater rim looking directly toward the Sun / Solar Vector
        camera.position.set(2.8, 1.6, 3.2);
        const lookDir = sun.elevationDeg > -10 ? sunPos : earthPos;
        controlsRef.current.target.set(lookDir[0], Math.max(0.5, lookDir[1]), lookDir[2]);
        controlsRef.current.minDistance = 0.1;
        controlsRef.current.maxDistance = 80;
      } else {
        // Orbital overview looking down at the lunar outpost and sky horizon
        camera.position.set(0, 16, 32);
        controlsRef.current.target.set(0, 2, 0);
        controlsRef.current.minDistance = 6;
        controlsRef.current.maxDistance = 75;
      }
      controlsRef.current.update();
    }
  }, [viewMode]);

  return (
    <group>
      {/* Deep Space Vacuum Starfield */}
      <Stars radius={90} depth={50} count={4000} factor={4} saturation={0} fade speed={0.2} />

      {/* Directional Sunlight shining from the exact Sun sky vector */}
      <directionalLight
        position={sunPos}
        intensity={sun.isVisible ? 3.5 : 0.05}
        color="#FFF9EB"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Earthshine (Earth illuminates lunar surface with soft blue-white light) */}
      {earth.isVisible && (
        <directionalLight
          position={earthPos}
          intensity={0.4}
          color="#93C5FD"
        />
      )}

      {/* Ambient Starlight in the black void */}
      <ambientLight intensity={0.06} />

      {/* 1. Realistic 3D Cratered Polar Terrain */}
      <CrateredLunarTerrain radius={skyRadius} site={site} />

      {/* 2. Lunar Surface Outpost / Lander Assets */}
      <LunarSurfaceOutpost
        sunPos={sunPos}
        earthPos={earthPos}
        sunVisible={sun.isVisible}
        earthVisible={earth.isVisible}
      />

      {/* 3. Local Horizon & Coordinate Rings */}
      <SkyCoordinatesRing radius={skyRadius} />

      {/* 4. Photorealistic 3D Sun Entity with Anamorphic Glare */}
      <ImmersiveSunEntity
        position={sunPos}
        azimuth={sun.azimuthDeg}
        elevation={sun.elevationDeg}
        isVisible={sun.isVisible}
        showHud={showHud}
        onClick={() => onTargetClick?.('sun')}
      />

      {/* 5. Photorealistic 3D Earth Entity with Atmosphere & Clouds */}
      <ImmersiveEarthEntity
        position={earthPos}
        sunPosition={sunPos}
        azimuth={earth.azimuthDeg}
        elevation={earth.elevationDeg}
        phasePct={earth.phasePct}
        isVisible={earth.isVisible}
        showHud={showHud}
        onClick={() => onTargetClick?.('earth')}
      />

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={viewMode === 'orbital'}
        maxPolarAngle={viewMode === 'ground' ? Math.PI / 2 + 0.08 : Math.PI / 2 + 0.3}
        minPolarAngle={viewMode === 'ground' ? 0.05 : 0.1}
        dampingFactor={0.05}
      />
    </group>
  );
}

// ----------------------------------------------------------------------------
// A. 3D Cratered Lunar Surface Terrain (Crater rims, boulders, regolith)
// ----------------------------------------------------------------------------
function CrateredLunarTerrain({ radius, site }: { radius: number; site: LunarSite }) {
  const [terrainTexture, setTerrainTexture] = useState<THREE.Texture | null>(null);

  // Load NASA 4K regolith surface texture for realistic ground detail
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/moon/lroc_color_4k.webp', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(12, 12);
      tex.anisotropy = 16;
      setTerrainTexture(tex);
    });
  }, []);

  // Generate procedural polar crater rim geometry
  const terrainGeometry = useMemo(() => {
    const segments = 128;
    const geom = new THREE.PlaneGeometry(radius * 2.2, radius * 2.2, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Create crater rims around the perimeter and rolling undulating highlands
      let height = 0;

      // Central landing plateau (flat for safe touchdown)
      if (distFromCenter < 4) {
        height = -0.05 + Math.sin(x * 2) * 0.02 + Math.cos(z * 2) * 0.02;
      } else {
        // Outer crater rims (e.g. Shackleton / Malapert elevation massif)
        const angle = Math.atan2(z, x);
        const rimWave = Math.sin(angle * 3) * 0.6 + Math.cos(angle * 5) * 0.4;
        const radialProfile = Math.sin(((distFromCenter - 4) / (radius - 4)) * Math.PI);
        height = Math.max(0, radialProfile * (1.8 + rimWave));

        // High mountain peak in the distance
        if (angle > 1.2 && angle < 2.0) {
          height += Math.sin((angle - 1.2) * 3.8) * 1.5;
        }

        // Micro crater perturbations
        height += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.15;
      }

      pos.setY(i, height);
    }

    geom.computeVertexNormals();
    return geom;
  }, [radius]);

  return (
    <group>
      {/* Textured Lunar Regolith Surface Mesh */}
      <mesh geometry={terrainGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          map={terrainTexture || undefined}
          bumpMap={terrainTexture || undefined}
          bumpScale={0.12}
          color={terrainTexture ? '#B0B4BC' : '#2B323F'}
          roughness={0.96}
          metalness={0.03}
          flatShading={false}
        />
      </mesh>

      {/* Surface Regolith Rocks & Boulders */}
      {[
        [-2.5, 0.05, 1.8, 0.22],
        [-3.8, 0.12, -2.1, 0.35],
        [3.2, 0.08, 2.4, 0.28],
        [1.9, 0.04, -3.5, 0.18],
        [-1.2, 0.02, -2.8, 0.15],
        [4.5, 0.25, -1.2, 0.42],
        [-5.1, 0.35, 3.8, 0.55],
      ].map(([x, y, z, s], idx) => (
        <mesh key={idx} position={[x, y, z]} scale={[s, s * 0.7, s * 0.9]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            map={terrainTexture || undefined}
            bumpMap={terrainTexture || undefined}
            bumpScale={0.18}
            color="#8A909D"
            roughness={0.98}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// B. Lunar Surface Outpost (CLPS Lander, Solar Array, Earth Tracking Antenna)
// ----------------------------------------------------------------------------
function LunarSurfaceOutpost({
  sunPos,
  earthPos,
  sunVisible,
  earthVisible,
}: {
  sunPos: [number, number, number];
  earthPos: [number, number, number];
  sunVisible: boolean;
  earthVisible: boolean;
}) {
  const solarPanelRef = useRef<THREE.Group>(null);
  const commDishRef = useRef<THREE.Group>(null);

  // Orient vertical solar panel toward Sun azimuth
  useFrame(() => {
    if (solarPanelRef.current) {
      const targetAngle = Math.atan2(sunPos[0], sunPos[2]);
      solarPanelRef.current.rotation.y = THREE.MathUtils.lerp(
        solarPanelRef.current.rotation.y,
        targetAngle,
        0.05
      );
    }
    // Orient high-gain dish toward Earth
    if (commDishRef.current) {
      const earthDir = new THREE.Vector3(...earthPos).normalize();
      commDishRef.current.lookAt(
        commDishRef.current.position.x + earthDir.x,
        commDishRef.current.position.y + earthDir.y,
        commDishRef.current.position.z + earthDir.z
      );
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. CLPS Commercial Lunar Lander (Nova-C / Griffin style) */}
      <group position={[0, 0, 0]}>
        {/* Lander Descent Engine Stage (Octagonal Cylinder with Gold Foil) */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.9, 0.9, 8]} />
          <meshStandardMaterial
            color="#D97706"
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>

        {/* Lander Avionics Upper Deck (White Thermal Blankets) */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.65, 0.7, 8]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* 4 Carbon-Composite Landing Legs with Footpads */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const legX = Math.cos(angle) * 1.35;
          const legZ = Math.sin(angle) * 1.35;
          return (
            <group key={i}>
              {/* Leg Strut */}
              <line>
                <bufferGeometry
                  attach="geometry"
                  onUpdate={(self) => {
                    self.setFromPoints([
                      new THREE.Vector3(Math.cos(angle) * 0.6, 0.6, Math.sin(angle) * 0.6),
                      new THREE.Vector3(legX, 0.05, legZ),
                    ]);
                  }}
                />
                <lineBasicMaterial color="#94A3B8" linewidth={3} />
              </line>
              {/* Gold Footpad */}
              <mesh position={[legX, 0.04, legZ]}>
                <cylinderGeometry args={[0.22, 0.22, 0.06, 12]} />
                <meshStandardMaterial color="#B45309" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          );
        })}

        {/* Status Beacon on Lander Mast */}
        <mesh position={[0, 2.0, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={sunVisible ? '#22C55E' : '#EAB308'} />
        </mesh>
      </group>

      {/* 2. Automated Polar Solar Array (Tracks Sun Azimuth) */}
      <group position={[1.8, 0, -0.6]} ref={solarPanelRef}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Vertical Solar Wing (Optimized for low-angle polar sun) */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.85, 1.2, 0.04]} />
          <meshStandardMaterial
            color="#1E1B4B"
            metalness={0.92}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* 3. High-Gain Direct-to-Earth Comm Dish (Tracks Earth Position) */}
      <group position={[-1.6, 0, 0.8]}>
        {/* Tripod Stand */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.7} />
        </mesh>
        {/* Steerable Dish */}
        <group position={[0, 1.05, 0]} ref={commDishRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.05, 0.15, 16, 1, true]} />
            <meshStandardMaterial
              color="#F8FAFC"
              metalness={0.4}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Feed Horn */}
          <mesh position={[0, 0, 0.22]}>
            <coneGeometry args={[0.04, 0.14, 8]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// C. Horizon Coordinate Rings & Cardinal Markers
// ----------------------------------------------------------------------------
function SkyCoordinatesRing({ radius }: { radius: number }) {
  const horizonPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 120;
    for (let i = 0; i <= count; i++) {
      const a = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.sin(a), 0.1, -radius * Math.cos(a)));
    }
    return pts;
  }, [radius]);

  const cardinals = [
    { label: 'NORTH', az: '000°', pos: [0, 0.2, -radius] as [number, number, number] },
    { label: 'EAST', az: '090°', pos: [radius, 0.2, 0] as [number, number, number] },
    { label: 'SOUTH', az: '180°', pos: [0, 0.2, radius] as [number, number, number] },
    { label: 'WEST', az: '270°', pos: [-radius, 0.2, 0] as [number, number, number] },
  ];

  return (
    <group>
      {/* Luminous Horizon Boundary Line (0° Elevation) */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(self) => self.setFromPoints(horizonPoints)}
        />
        <lineBasicMaterial color="#38BDF8" transparent opacity={0.65} linewidth={2} />
      </line>

      {/* Cardinal Labels pinned on the horizon */}
      {cardinals.map((c) => (
        <Html key={c.label} position={c.pos} center>
          <div className="bg-[#000000]/80 border border-[#38BDF8]/60 px-2 py-0.5 rounded text-center backdrop-blur-sm pointer-events-none shadow-md">
            <span className="text-[10px] font-extrabold text-[#FFFFFF] tracking-wider block leading-none">
              {c.label}
            </span>
            <span className="text-[8px] font-mono text-[#38BDF8]">{c.az}</span>
          </div>
        </Html>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// D. Photorealistic 3D Sun Entity with Apollo-Style Lens Flare
// ----------------------------------------------------------------------------
function ImmersiveSunEntity({
  position,
  azimuth,
  elevation,
  isVisible,
  showHud,
  onClick,
}: {
  position: [number, number, number];
  azimuth: number;
  elevation: number;
  isVisible: boolean;
  showHud: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Load original NASA 4K Sun surface texture
  const sunTexture = useTexture('/assets/space/texture du soleil.jpg');
  sunTexture.colorSpace = THREE.SRGBColorSpace;
  sunTexture.anisotropy = 16;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
    }
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.01;
    }
  });

  const sunScale = 1.4;

  return (
    <group position={position} onClick={onClick}>
      {/* 1. True 3D Solar Photosphere with Pure Authentic NASA Texture */}
      <group ref={meshRef} scale={[sunScale, sunScale, sunScale]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial map={sunTexture} color={0xffffff} />
        </mesh>
      </group>

      {/* 2. Outer Solar Corona Halo (Strictly outside disc, never obscuring surface details) */}
      <mesh ref={haloRef} scale={[sunScale, sunScale, sunScale]}>
        <ringGeometry args={[1.02, 1.45, 64]} />
        <meshBasicMaterial
          color="#FFA726"
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Vertical Altitude Drop to Horizon */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(self) => {
            self.setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, -position[1], 0),
            ]);
          }}
        />
        <lineBasicMaterial
          color={isVisible ? '#E8A838' : '#EF4444'}
          transparent
          opacity={0.45}
        />
      </line>

      {/* Interactive HUD Reticle */}
      {showHud && (
        <Html distanceFactor={16} position={[0, sunScale * 2.1, 0]} center>
          <div
            className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all cursor-pointer select-none ${
              isVisible
                ? 'bg-[#000000]/90 border-[#E8A838] text-white hover:border-[#FCD34D]'
                : 'bg-[#450A0A]/90 border-[#EF4444] text-[#FCA5A5]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-[#E8A838] animate-pulse' : 'bg-[#EF4444]'}`} />
              <span>SUN ({isVisible ? `+${elevation.toFixed(1)}°` : `${elevation.toFixed(1)}°`})</span>
            </div>
            <div className="text-[9.5px] font-mono text-[#CBD5E1] mt-0.5">
              <span>Azimuth: {azimuth.toFixed(1)}°</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------------
// E. Photorealistic 3D Earth Entity with Atmosphere & Solar Terminator
// ----------------------------------------------------------------------------
function ImmersiveEarthEntity({
  position,
  sunPosition,
  azimuth,
  elevation,
  phasePct,
  isVisible,
  showHud,
  onClick,
}: {
  position: [number, number, number];
  sunPosition: [number, number, number];
  azimuth: number;
  elevation: number;
  phasePct: number;
  isVisible: boolean;
  showHud: boolean;
  onClick?: () => void;
}) {
  const earthRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const [dayTexture, specularTexture] = useTexture([
    '/assets/space/earth_day_4k.webp',
    '/assets/space/earth_specular_2k.webp',
  ]);

  dayTexture.colorSpace = THREE.SRGBColorSpace;

  // Real physical size in the lunar sky (~1.9° apparent diameter, ~3.8x Sun)
  const earthScale = 2.85;

  // Direction of Sun relative to Earth to compute phase terminator
  const sunRelLight = useMemo(() => {
    return new THREE.Vector3(
      sunPosition[0] - position[0],
      sunPosition[1] - position[1],
      sunPosition[2] - position[2]
    ).normalize();
  }, [sunPosition, position]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Dedicated sunlight shining onto Earth to render realistic phase */}
      <directionalLight
        position={[sunRelLight.x * 6, sunRelLight.y * 6, sunRelLight.z * 6]}
        intensity={3.8}
        color="#FFFBF0"
      />

      <group ref={earthRef}>
        {/* Earth Crust Mesh with Specular Oceans */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[earthScale, 64, 64]} />
          <meshStandardMaterial
            map={dayTexture}
            roughnessMap={specularTexture}
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>

        {/* Dynamic Cloud Shell */}
        <mesh ref={cloudRef}>
          <sphereGeometry args={[earthScale * 1.018, 48, 48]} />
          <meshStandardMaterial
            color="#FFFFFF"
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Rayleigh Scattering Atmospheric Blue Rim */}
      <mesh>
        <sphereGeometry args={[earthScale * 1.055, 32, 32]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Altitude Drop to Horizon */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(self) => {
            self.setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, -position[1], 0),
            ]);
          }}
        />
        <lineBasicMaterial
          color={isVisible ? '#3B82F6' : '#EF4444'}
          transparent
          opacity={0.45}
        />
      </line>

      {/* Interactive HUD Reticle */}
      {showHud && (
        <Html distanceFactor={18} position={[0, earthScale * 1.7, 0]} center>
          <div
            className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all cursor-pointer select-none ${
              isVisible
                ? 'bg-[#000000]/90 border-[#3B82F6] text-white hover:border-[#60A5FA]'
                : 'bg-[#450A0A]/90 border-[#EF4444] text-[#FCA5A5]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-[#3B82F6] animate-pulse' : 'bg-[#EF4444]'}`} />
              <span>EARTH ({isVisible ? `+${elevation.toFixed(1)}°` : `${elevation.toFixed(1)}°`})</span>
            </div>
            <div className="text-[9.5px] font-mono text-[#CBD5E1] mt-0.5 space-x-2">
              <span>Az: {azimuth.toFixed(1)}°</span>
              <span>Phase: {phasePct}%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
