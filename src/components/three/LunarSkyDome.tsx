// ============================================================================
// Lunar Horizon — Local Lunar Sky Dome & Horizon Coordinate Grid
// Renders the local topographical horizon, cardinal directions, and elevation rings
// ============================================================================

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface LunarSkyDomeProps {
  radius?: number;
  highlightAzimuth?: number;
  highlightElevation?: number;
  targetName?: string;
  isAboveHorizon?: boolean;
}

export default function LunarSkyDome({
  radius = 12,
  highlightAzimuth,
  highlightElevation,
  targetName,
  isAboveHorizon = true,
}: LunarSkyDomeProps) {
  // Elevation rings: 0° (Horizon), 30°, 60°
  const elevationCircles = useMemo(() => {
    return [0, 30, 60].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const r = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);

      const points: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(r * Math.sin(theta), y, -r * Math.cos(theta)));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      return { deg, y, r, geom };
    });
  }, [radius]);

  // Azimuth radial spokes (every 45°)
  const azimuthSpokes = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    for (let az = 0; az < 360; az += 45) {
      const rad = (az * Math.PI) / 180;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(radius * Math.sin(rad), 0, -radius * Math.cos(rad)),
      ];
      lines.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return lines;
  }, [radius]);

  // Cardinal direction vectors on the horizon ring (0° = N, 90° = E, 180° = S, 270° = W)
  const cardinals = [
    { label: 'N', sub: '000°', pos: [0, 0.2, -radius] as [number, number, number] },
    { label: 'E', sub: '090°', pos: [radius, 0.2, 0] as [number, number, number] },
    { label: 'S', sub: '180°', pos: [0, 0.2, radius] as [number, number, number] },
    { label: 'W', sub: '270°', pos: [-radius, 0.2, 0] as [number, number, number] },
  ];

  return (
    <group>
      {/* 1. Ground Surface Plane (Local Lunar Regolith Base) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[radius * 1.05, 64]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.95}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* 2. Below Horizon Subterranean Dome (Darkened to show occlusion) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[radius * 0.99, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshBasicMaterial
          color="#04060A"
          transparent
          opacity={0.7}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Local Horizon Ring (0° Elevation - Brightest boundary) */}
      <lineLoop geometry={elevationCircles[0].geom}>
        <lineBasicMaterial color="#38BDF8" linewidth={2} />
      </lineLoop>

      {/* Horizon Label Pill */}
      <Html position={[radius * 0.72, 0.15, -radius * 0.72]} center>
        <div className="bg-[#000000]/80 border border-[#38BDF8]/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#38BDF8] whitespace-nowrap shadow-md pointer-events-none">
          LOCAL HORIZON 0°
        </div>
      </Html>

      {/* 4. Altitude Rings (30°, 60°) */}
      {elevationCircles.slice(1).map((c) => (
        <group key={c.deg}>
          <lineLoop geometry={c.geom}>
            <lineDashedMaterial color="#475569" dashSize={0.4} gapSize={0.3} />
          </lineLoop>
          <Html position={[0, c.y, -c.r]} center>
            <div className="text-[8px] font-mono text-[#94A3B8] bg-[#0A0E17]/80 px-1 rounded pointer-events-none">
              +{c.deg}°
            </div>
          </Html>
        </group>
      ))}

      {/* 5. Zenith Marker (90° Apex) */}
      <mesh position={[0, radius, 0]}>
        <octahedronGeometry args={[0.15]} />
        <meshBasicMaterial color="#38BDF8" wireframe />
      </mesh>
      <Html position={[0, radius + 0.4, 0]} center>
        <div className="text-[9px] font-mono font-bold text-[#94A3B8] bg-[#000000]/80 px-1.5 py-0.5 rounded border border-[#334155] pointer-events-none">
          ZENITH (+90°)
        </div>
      </Html>

      {/* 6. Azimuth Radial Grid Spokes */}
      {azimuthSpokes.map((geom, idx) => (
        <lineSegments key={idx} geometry={geom}>
          <lineBasicMaterial color="#1E293B" transparent opacity={0.6} />
        </lineSegments>
      ))}

      {/* 7. Cardinal Direction Labels */}
      {cardinals.map((c) => (
        <Html key={c.label} position={c.pos} center>
          <div className="flex flex-col items-center pointer-events-none">
            <div className="w-5 h-5 rounded-full bg-[#000000] border border-[#38BDF8] flex items-center justify-center text-[10px] font-black text-[#FFFFFF] shadow-lg">
              {c.label}
            </div>
            <span className="text-[8px] font-mono text-[#94A3B8] mt-0.5">{c.sub}</span>
          </div>
        </Html>
      ))}

      {/* 8. Observer Standpoint at Origin */}
      <group position={[0, 0, 0]}>
        {/* Standpoint Platform */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.04, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Coordinate Cross */}
        <mesh position={[0, 0.05, 0]}>
          <ringGeometry args={[0.2, 0.35, 16]} />
          <meshBasicMaterial color="#38BDF8" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 9. Target Azimuth Projection Ray (if defined) */}
      {highlightAzimuth !== undefined && highlightElevation !== undefined && (
        <group>
          {/* Ground Footprint on Horizon Ring */}
          {(() => {
            const azRad = (highlightAzimuth * Math.PI) / 180;
            const hx = radius * Math.sin(azRad);
            const hz = -radius * Math.cos(azRad);
            return (
              <>
                {/* Radial line along ground to azimuth */}
                <line>
                  <bufferGeometry
                    attach="geometry"
                    onUpdate={(self) => {
                      self.setFromPoints([
                        new THREE.Vector3(0, 0.02, 0),
                        new THREE.Vector3(hx, 0.02, hz),
                      ]);
                    }}
                  />
                  <lineBasicMaterial
                    color={isAboveHorizon ? '#E8A838' : '#EF4444'}
                    transparent
                    opacity={0.6}
                  />
                </line>

                {/* Ground Azimuth Marker Pin */}
                <mesh position={[hx, 0.05, hz]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
                  <meshBasicMaterial color={isAboveHorizon ? '#E8A838' : '#EF4444'} />
                </mesh>
              </>
            );
          })()}
        </group>
      )}
    </group>
  );
}
