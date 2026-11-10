// ============================================================================
// Lunar Horizon — 3D Sun Lunar Sky Simulator Component
// Loads official NASA Sun GLB model with realistic emissive shader & corona glow
// ============================================================================

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { astronomicalService } from '../../services/astronomicalService';

interface SunSkyViewProps {
  azimuthDeg: number;
  elevationDeg: number;
  skyRadius?: number;
  apparentDiameterDeg?: number;
}

export default function SunSkyView({
  azimuthDeg,
  elevationDeg,
  skyRadius = 12,
  apparentDiameterDeg = 0.53,
}: SunSkyViewProps) {
  const sunGroupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);

  // Compute 3D Cartesian coordinate on the local lunar sky dome
  const sunPos = useMemo(() => {
    return astronomicalService.skyAnglesToVector3(azimuthDeg, elevationDeg, skyRadius);
  }, [azimuthDeg, elevationDeg, skyRadius]);

  const isAboveHorizon = elevationDeg >= 0;

  // Load original NASA 4K Sun surface texture
  const sunTexture = useTexture('/assets/space/texture du soleil.jpg');
  sunTexture.colorSpace = THREE.SRGBColorSpace;
  sunTexture.anisotropy = 16;

  // Visual size scaled for realistic proportion on sky dome
  const visualScale = 0.55;

  // Slow differential rotation of the Sun
  useFrame((_, delta) => {
    if (sunGroupRef.current) {
      sunGroupRef.current.rotation.y += delta * 0.05;
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.rotation.z += delta * 0.01;
    }
  });

  return (
    <group>
      {/* Directional sunlight shining from the Sun's exact sky position */}
      {isAboveHorizon && (
        <directionalLight
          position={sunPos}
          intensity={2.8}
          color="#FFF8E7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      )}

      {/* Sun 3D Entity Container */}
      <group position={sunPos}>
        {/* Rotating Sun Photosphere Mesh with Pure Authentic NASA Texture */}
        <group ref={sunGroupRef} scale={[visualScale, visualScale, visualScale]}>
          <mesh>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial map={sunTexture} color={0xffffff} />
          </mesh>
        </group>

        {/* Outer Solar Corona Halo (Strictly outside disc, never obscuring the surface) */}
        <mesh ref={glowMeshRef} scale={[visualScale, visualScale, visualScale]}>
          <ringGeometry args={[1.02, 1.45, 64]} />
          <meshBasicMaterial
            color="#FFA726"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
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
                new THREE.Vector3(0, -sunPos[1], 0),
              ]);
            }}
          />
          <lineDashedMaterial
            color={isAboveHorizon ? '#E8A838' : '#EF4444'}
            dashSize={0.2}
            gapSize={0.15}
            transparent
            opacity={0.5}
          />
        </line>

        {/* Floating Technical HUD Badge */}
        <Html distanceFactor={14} position={[0, visualScale * 1.8, 0]} center>
          <div
            className={`px-2.5 py-1 rounded-lg border text-center shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap transition-all ${
              isAboveHorizon
                ? 'bg-[#000000]/85 border-[#E8A838] text-white'
                : 'bg-[#450A0A]/90 border-[#EF4444] text-[#FCA5A5]'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAboveHorizon ? 'bg-[#E8A838] animate-pulse' : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[10px] font-bold tracking-wider">
                SUN {isAboveHorizon ? 'VISIBLE' : 'BELOW HORIZON'}
              </span>
            </div>
            <div className="text-[9px] font-mono mt-0.5 space-x-2">
              <span>Az: {azimuthDeg.toFixed(1)}°</span>
              <span>El: {elevationDeg > 0 ? '+' : ''}{elevationDeg.toFixed(2)}°</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

useTexture.preload('/assets/space/texture du soleil.jpg');
