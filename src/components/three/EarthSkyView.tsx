// ============================================================================
// Lunar Horizon — 3D Earth Lunar Sky Simulator Component
// Real NASA 4K Earth mosaic, specular ocean reflections, cloud layer & atmosphere
// ============================================================================

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { astronomicalService } from '../../services/astronomicalService';

interface EarthSkyViewProps {
  azimuthDeg: number;
  elevationDeg: number;
  phasePct: number;
  skyRadius?: number;
  apparentDiameterDeg?: number;
  sunAzimuthDeg: number;
  sunElevationDeg: number;
}

export default function EarthSkyView({
  azimuthDeg,
  elevationDeg,
  phasePct,
  skyRadius = 12,
  apparentDiameterDeg = 1.9,
  sunAzimuthDeg,
  sunElevationDeg,
}: EarthSkyViewProps) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudMeshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Compute 3D position in the local sky dome
  const earthPos = useMemo(() => {
    return astronomicalService.skyAnglesToVector3(azimuthDeg, elevationDeg, skyRadius);
  }, [azimuthDeg, elevationDeg, skyRadius]);

  const isAboveHorizon = elevationDeg >= 0;

  // Apparent size: Earth appears ~1.9° in the lunar sky (~3.7x larger than Sun)
  // Scaling for clear visibility and detail inspection
  const visualScale = 0.95;

  // Load high-resolution 4K Earth Day and Specular Map
  const [dayTexture, specularTexture] = useTexture([
    '/assets/space/earth_day_4k.webp',
    '/assets/space/earth_specular_2k.webp',
  ]);

  dayTexture.colorSpace = THREE.SRGBColorSpace;

  // Solar vector relative to Earth to render realistic day/night illumination
  const lightDir = useMemo(() => {
    const sunPos = astronomicalService.skyAnglesToVector3(sunAzimuthDeg, sunElevationDeg, skyRadius);
    const dir = new THREE.Vector3(
      sunPos[0] - earthPos[0],
      sunPos[1] - earthPos[1],
      sunPos[2] - earthPos[2]
    ).normalize();
    return dir;
  }, [sunAzimuthDeg, sunElevationDeg, earthPos, skyRadius]);

  // Diurnal rotation of Earth (24 hours per rotation)
  useFrame((_, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.15;
    }
    if (cloudMeshRef.current) {
      // Clouds drift slightly faster than the planetary crust
      cloudMeshRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group>
      {/* Directional light from Sun position to illuminate Earth's phase terminator */}
      <directionalLight
        position={[
          earthPos[0] + lightDir.x * 5,
          earthPos[1] + lightDir.y * 5,
          earthPos[2] + lightDir.z * 5,
        ]}
        target-position={earthPos}
        intensity={3.2}
        color="#FFF9E6"
      />

      {/* Subtle ambient light for Earth night side (city glow & starlight) */}
      <ambientLight intensity={0.12} />

      {/* Earth 3D Container positioned on Lunar Sky Dome */}
      <group position={earthPos}>
        {/* Main Earth Planetary Sphere */}
        <group ref={earthGroupRef}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[visualScale, 64, 64]} />
            <meshStandardMaterial
              map={dayTexture}
              roughnessMap={specularTexture}
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>

          {/* Cloud Layer Shell */}
          <mesh ref={cloudMeshRef}>
            <sphereGeometry args={[visualScale * 1.018, 48, 48]} />
            <meshStandardMaterial
              color="#FFFFFF"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Atmospheric Blue Rayleigh Scattering Rim */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[visualScale * 1.05, 32, 32]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Position Line dropping vertically to local ground horizon */}
        <line>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -earthPos[1], 0),
              ]);
            }}
          />
          <lineDashedMaterial
            color={isAboveHorizon ? '#2563EB' : '#EF4444'}
            dashSize={0.2}
            gapSize={0.15}
            transparent
            opacity={0.5}
          />
        </line>

        {/* Floating Technical HUD Badge */}
        <Html distanceFactor={14} position={[0, visualScale * 1.7, 0]} center>
          <div
            className={`px-2.5 py-1 rounded-lg border text-center shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap transition-all ${
              isAboveHorizon
                ? 'bg-[#000000]/85 border-[#2563EB] text-white'
                : 'bg-[#450A0A]/90 border-[#EF4444] text-[#FCA5A5]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAboveHorizon ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[10px] font-bold tracking-wider">
                EARTH {isAboveHorizon ? 'DIRECT-TO-EARTH LINK' : 'OCCLUDED BY TERRAIN'}
              </span>
            </div>
            <div className="text-[9px] font-mono mt-0.5 space-x-2">
              <span>Az: {azimuthDeg.toFixed(1)}°</span>
              <span>El: {elevationDeg > 0 ? '+' : ''}{elevationDeg.toFixed(2)}°</span>
              <span>Phase: {phasePct}%</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
