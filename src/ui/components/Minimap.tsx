import React, { useMemo } from "react";
import type { TrackSpline } from "../../game/sim/track";
import type { CarSimState } from "../../game/sim/types";

export interface MinimapProps {
  track: TrackSpline;
  cars: CarSimState[];
  size?: number;
}

export const Minimap: React.FC<MinimapProps> = ({ track, cars, size = 120 }) => {
  // Compute track bounding box to normalize coordinates into SVG space
  const { pathData, transformX, transformZ } = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const sample of track.samples) {
      if (sample.position.x < minX) minX = sample.position.x;
      if (sample.position.x > maxX) maxX = sample.position.x;
      if (sample.position.z < minZ) minZ = sample.position.z;
      if (sample.position.z > maxZ) maxZ = sample.position.z;
    }

    const padding = 20;
    minX -= padding;
    maxX += padding;
    minZ -= padding;
    maxZ += padding;

    const spanX = maxX - minX || 1;
    const spanZ = maxZ - minZ || 1;
    const maxSpan = Math.max(spanX, spanZ);

    const toSvgX = (x: number) => ((x - minX) / maxSpan) * (size - 16) + 8;
    const toSvgZ = (z: number) => ((z - minZ) / maxSpan) * (size - 16) + 8;

    let path = "";
    for (let i = 0; i < track.samples.length; i += 2) {
      const p = track.samples[i].position;
      const sx = toSvgX(p.x);
      const sz = toSvgZ(p.z);
      path += (i === 0 ? `M ${sx} ${sz}` : ` L ${sx} ${sz}`);
    }
    path += " Z";

    return {
      pathData: path,
      transformX: toSvgX,
      transformZ: toSvgZ,
    };
  }, [track, size]);

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--surface-glass)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        backdropFilter: "blur(8px)",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      <svg width={size - 8} height={size - 8} viewBox={`0 0 ${size} ${size}`}>
        {/* Track outline */}
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathData}
          fill="none"
          stroke="rgba(79, 216, 255, 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start / Finish hash mark */}
        {track.samples[0] && (
          <circle
            cx={transformX(track.samples[0].position.x)}
            cy={transformZ(track.samples[0].position.z)}
            r="3"
            fill="#FFFFFF"
          />
        )}

        {/* Rival cars */}
        {cars
          .filter((c) => !c.isPlayer)
          .map((car) => (
            <circle
              key={car.id}
              cx={transformX(car.position.x)}
              cy={transformZ(car.position.z)}
              r="2.5"
              fill="#FF4D2E"
            />
          ))}

        {/* Player car (Volt Lime, larger blip) */}
        {cars
          .filter((c) => c.isPlayer)
          .map((player) => (
            <circle
              key={player.id}
              cx={transformX(player.position.x)}
              cy={transformZ(player.position.z)}
              r="4.5"
              fill="var(--accent-primary)"
              stroke="#0B0D12"
              strokeWidth="1.5"
            />
          ))}
      </svg>
    </div>
  );
};
