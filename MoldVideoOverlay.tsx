import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// ============================================================================
// COLOR PALETTE & DESIGN TOKENS (Bio-HUD / Medical Sci-Fi Style - Plan v3)
// ============================================================================
const COLORS = {
  neonGreen: '#39FF14',
  warningAmber: '#FFB800',
  crimsonAlert: '#FF2A55',
  cyanHud: '#00F0FF',
  pureWhite: '#FFFFFF',
  darkBg: 'rgba(8, 12, 20, 0.86)',
  glassBorder: 'rgba(0, 240, 255, 0.4)',
};

const FONTS = {
  header: '"Montserrat", "Inter", "Bebas Neue", sans-serif',
  mono: '"JetBrains Mono", "Space Mono", monospace',
};

// ============================================================================
// REUSABLE MOTION GRAPHIC PRIMITIVES (With Smooth Intro & Exit Fade)
// ============================================================================

interface KeyframePoint {
  frame: number;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  scale?: number;
}

const useTrackedPosition = (keyframes: KeyframePoint[], currentFrame: number) => {
  if (keyframes.length === 1) {
    return { x: keyframes[0].x, y: keyframes[0].y, scale: keyframes[0].scale ?? 1 };
  }
  const frames = keyframes.map((k) => k.frame);
  const xs = keyframes.map((k) => k.x);
  const ys = keyframes.map((k) => k.y);
  const scales = keyframes.map((k) => k.scale ?? 1);

  return {
    x: interpolate(currentFrame, frames, xs, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(currentFrame, frames, ys, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    scale: interpolate(currentFrame, frames, scales, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  };
};

const TrackedCallout: React.FC<{
  keyframes: KeyframePoint[];
  durationInFrames: number;
  label: string;
  sublabel?: string;
  color?: string;
  offsetX?: number;
  offsetY?: number;
  reticleSize?: number;
}> = ({
  keyframes,
  durationInFrames,
  label,
  sublabel,
  color = COLORS.cyanHud,
  offsetX = 110,
  offsetY = -75,
  reticleSize = 44,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const exitOpacity = interpolate(
    frame,
    [0, 6, Math.max(7, durationInFrames - 8), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const pulse = 1 + Math.sin(frame * 0.28) * 0.1;

  const { x, y, scale } = useTrackedPosition(keyframes, frame);

  const elbowX = offsetX * 0.45;
  const elbowY = offsetY;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: exitOpacity }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Pulsing Target Reticle */}
        <div
          style={{
            width: reticleSize,
            height: reticleSize,
            borderRadius: '50%',
            border: `2.5px solid ${color}`,
            boxShadow: `0 0 14px ${color}`,
            transform: `translate(-50%, -50%) scale(${intro * pulse})`,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color,
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* 45-Degree SVG Leader Line */}
        <svg
          width="440"
          height="340"
          viewBox="-220 -170 440 340"
          style={{ position: 'absolute', left: -220, top: -170, overflow: 'visible' }}
        >
          <polyline
            points={`0,0 ${elbowX * intro},${elbowY * intro} ${offsetX * intro},${offsetY * intro}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray="320"
            strokeDashoffset={interpolate(intro, [0, 1], [320, 0])}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <circle cx={elbowX * intro} cy={elbowY * intro} r="3.5" fill={color} />
        </svg>

        {/* Frosted HUD Callout Badge */}
        <div
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            transform: `translate(${offsetX >= 0 ? '8px' : '-100%'}, -50%) scale(${intro})`,
            background: COLORS.darkBg,
            borderLeft: `4px solid ${color}`,
            borderTop: `1px solid ${COLORS.glassBorder}`,
            borderRight: `1px solid ${COLORS.glassBorder}`,
            borderBottom: `1px solid ${COLORS.glassBorder}`,
            padding: '8px 14px',
            borderRadius: '5px',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            boxShadow: `0 8px 24px rgba(0,0,0,0.65), 0 0 12px ${color}33`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              fontWeight: 800,
              color: COLORS.pureWhite,
              letterSpacing: '0.06em',
              textShadow: `0 0 8px ${color}`,
            }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 13,
                fontWeight: 600,
                color,
                marginTop: 2,
                letterSpacing: '0.08em',
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MASTER EDITOR'S CUT COMPOSITION (Plan v3 - 18 Shot-Locked Sequences)
// ============================================================================

export interface MoldVideoProps {
  videoFileName?: string;
  transparentOverlayOnly?: boolean;
}

export const MoldVideoOverlay: React.FC<MoldVideoProps> = ({
  videoFileName = 'lv_0_20261114233803.mp4',
  transparentOverlayOnly = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: transparentOverlayOnly ? 'transparent' : '#000' }}>
      {!transparentOverlayOnly && (
        <OffthreadVideo src={staticFile(videoFileName)} style={{ width: '100%', height: '100%' }} />
      )}

      {/* =====================================================================
          SHOT 1: 00:02.2 - 00:07.2 (Frames 66 - 216)
          Sandwich resting flat on the plate (avoids 00:00-00:01.8 hand drop)
      ===================================================================== */}
      <Sequence from={66} durationInFrames={150}>
        <TrackedCallout
          durationInFrames={150}
          keyframes={[
            { frame: 0, x: 49, y: 88, scale: 1 },
            { frame: 150, x: 49, y: 88, scale: 1 },
          ]}
          label="SURFACE SPORES"
          sublabel="VISIBLE TIP OF COLONY"
          color={COLORS.neonGreen}
          offsetX={115}
          offsetY={-70}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 2: 00:10.2 - 00:13.4 (Frames 306 - 402)
          Knife slicing moldy right corner -> Target pointer + Upper-Right Stamp
      ===================================================================== */}
      <Sequence from={306} durationInFrames={96}>
        <KnifeCutStampV2 durationInFrames={96} />
      </Sequence>

      {/* =====================================================================
          SHOT 3: 00:33.8 - 00:38.2 (Frames 1014 - 1146)
          Boy inspecting bread crust with magnifying glass (after MINUTE 5 card)
      ===================================================================== */}
      <Sequence from={1014} durationInFrames={132}>
        <TrackedCallout
          durationInFrames={132}
          keyframes={[
            { frame: 0, x: 52, y: 49 },
            { frame: 66, x: 45, y: 40 },
            { frame: 132, x: 39, y: 33 },
          ]}
          label="SURFACE SPORES"
          sublabel="REPRODUCTIVE HEADS"
          color={COLORS.neonGreen}
          offsetX={-130}
          offsetY={-50}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 4: 00:39.5 - 00:44.5 (Frames 1185 - 1335)
          Deep zoom into glowing blue hyphae root network inside bread pores
      ===================================================================== */}
      <Sequence from={1185} durationInFrames={150}>
        <TrackedCallout
          durationInFrames={150}
          keyframes={[
            { frame: 0, x: 48, y: 58 },
            { frame: 75, x: 48, y: 56 },
            { frame: 150, x: 47, y: 54 },
          ]}
          label="HYPHAE NETWORK"
          sublabel="DEEP MICROSCOPIC ROOT WEB"
          color={COLORS.cyanHud}
          offsetX={130}
          offsetY={55}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 5: 00:53.5 - 01:03.5 (Frames 1605 - 1905)
          Boiling green stomach acid pool (starts after 00:15 timer fades,
          exits before voiceover pivots to Minute 30 at 01:04)
      ===================================================================== */}
      <Sequence from={1605} durationInFrames={300}>
        <StomachAcidHudV2 durationInFrames={300} />
      </Sequence>

      {/* =====================================================================
          SHOT 6: 01:12.2 - 01:19.5 (Frames 2166 - 2385)
          Aspergillus spiky creatures & glowing green mycotoxin orbs in tunnel
      ===================================================================== */}
      <Sequence from={2166} durationInFrames={219}>
        <TrackedCallout
          durationInFrames={219}
          keyframes={[
            { frame: 0, x: 36, y: 70, scale: 0.95 },
            { frame: 110, x: 36, y: 72, scale: 1.0 },
            { frame: 219, x: 36, y: 74, scale: 1.05 },
          ]}
          label="ASPERGILLUS"
          sublabel="ACID-RESISTANT FUNGUS"
          color={COLORS.crimsonAlert}
          offsetX={-125}
          offsetY={-55}
        />
        <TrackedCallout
          durationInFrames={219}
          keyframes={[
            { frame: 0, x: 57, y: 55, scale: 0.95 },
            { frame: 110, x: 57, y: 52, scale: 1.0 },
            { frame: 219, x: 57, y: 50, scale: 1.05 },
          ]}
          label="MYCOTOXIN"
          sublabel="INVISIBLE CHEMICAL WEAPON"
          color={COLORS.neonGreen}
          offsetX={120}
          offsetY={-45}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 7: 01:21.5 - 01:28.8 (Frames 2445 - 2664)
          Toaster oven 500°F heat resistance test
      ===================================================================== */}
      <Sequence from={2445} durationInFrames={219}>
        <ToasterHeatHudV2 durationInFrames={219} />
      </Sequence>

      {/* =====================================================================
          SHOT 8: 01:35.8 - 01:39.2 (Frames 2874 - 2976)
          Small intestine chase: Giant green orb moving RIGHT-TO-LEFT
      ===================================================================== */}
      <Sequence from={2874} durationInFrames={102}>
        <TrackedCallout
          durationInFrames={102}
          keyframes={[
            { frame: 0, x: 60, y: 65, scale: 1 },
            { frame: 51, x: 52, y: 61, scale: 1.05 },
            { frame: 102, x: 44, y: 58, scale: 1.08 },
          ]}
          label="INTACT MYCOTOXIN"
          sublabel="BYPASSED STOMACH VALVE"
          color={COLORS.neonGreen}
          offsetX={120}
          offsetY={-65}
          reticleSize={56}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 9: 01:43.5 - 01:46.8 (Frames 3105 - 3204)
          Boy inside glass dome hitting red panic button on gut lining
      ===================================================================== */}
      <Sequence from={3105} durationInFrames={99}>
        <TrackedCallout
          durationInFrames={99}
          keyframes={[
            { frame: 0, x: 50, y: 66 },
            { frame: 99, x: 50, y: 66 },
          ]}
          label="GUT SENSOR CELLS"
          sublabel="PANIC ALARM TRIGGERED"
          color={COLORS.crimsonAlert}
          offsetX={140}
          offsetY={-60}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 10A & 10B: Split-Screen Vagus Nerve & Physical Purge
          Active ONLY during the two split-screen windows (01:47.6-01:50.5
          and 01:55.8-01:59.2), hidden during the 01:51-01:55 face close-up!
      ===================================================================== */}
      <Sequence from={3228} durationInFrames={87}>
        <SplitScreenVagusHudV2 durationInFrames={87} />
      </Sequence>
      <Sequence from={3474} durationInFrames={102}>
        <SplitScreenVagusHudV2 durationInFrames={102} />
      </Sequence>

      {/* =====================================================================
          SHOT 11: 02:01.8 - 02:08.5 (Frames 3654 - 3855)
          Liver character in yellow hard hat turning detox wheel (right side)
      ===================================================================== */}
      <Sequence from={3654} durationInFrames={201}>
        <TrackedCallout
          durationInFrames={201}
          keyframes={[
            { frame: 0, x: 65, y: 38 },
            { frame: 100, x: 60, y: 34 },
            { frame: 201, x: 56, y: 31 },
          ]}
          label="EMERGENCY DETOX MODE"
          sublabel="HEPATIC BLOOD FILTRATION"
          color={COLORS.warningAmber}
          offsetX={-140}
          offsetY={-55}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 12: 02:10.2 - 02:13.2 (Frames 3906 - 3996)
          Workers pouring glowing blue enzyme buckets
      ===================================================================== */}
      <Sequence from={3906} durationInFrames={90}>
        <TrackedCallout
          durationInFrames={90}
          keyframes={[
            { frame: 0, x: 50, y: 56 },
            { frame: 90, x: 50, y: 58 },
          ]}
          label="ENZYME NEUTRALIZATION"
          sublabel="BREAKING DOWN TOXINS"
          color={COLORS.cyanHud}
          offsetX={130}
          offsetY={-45}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 13: 02:14.5 - 02:19.2 (Frames 4035 - 4176)
          Glowing DNA strand fracturing (exits before 02:20 tissue zoom-out)
      ===================================================================== */}
      <Sequence from={4035} durationInFrames={141}>
        <TrackedCallout
          durationInFrames={141}
          keyframes={[
            { frame: 0, x: 53, y: 46, scale: 1 },
            { frame: 70, x: 52, y: 47, scale: 1.08 },
            { frame: 141, x: 52, y: 48, scale: 1 },
          ]}
          label="AFLATOXIN B1"
          sublabel="BINDS & MUTATES HUMAN DNA"
          color={COLORS.crimsonAlert}
          offsetX={135}
          offsetY={-60}
          reticleSize={54}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 14: 02:24.2 - 02:29.5 (Frames 4326 - 4485)
          Antibiotic pill capsule in petri dish -> Top Myth-Buster Banner
      ===================================================================== */}
      <Sequence from={4326} durationInFrames={159}>
        <MythBusterBannerV2 durationInFrames={159} />
      </Sequence>

      {/* =====================================================================
          SHOT 15: 02:31.5 - 02:34.8 (Frames 4545 - 4644)
          Cute pastel gut bacteria fleeing (exits before turning to ash at 02:35)
      ===================================================================== */}
      <Sequence from={4545} durationInFrames={99}>
        <TrackedCallout
          durationInFrames={99}
          keyframes={[
            { frame: 0, x: 30, y: 65 },
            { frame: 50, x: 28, y: 66 },
            { frame: 99, x: 26, y: 68 },
          ]}
          label="GOOD GUT BACTERIA"
          sublabel="WIPED OUT BY MYCOTOXINS"
          color={COLORS.cyanHud}
          offsetX={135}
          offsetY={-55}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 16: 02:40.0 - 02:46.5 (Frames 4800 - 4995)
          Panning kitchen counter -> Sequential Checklist HUD Bar (Zero Drift)
      ===================================================================== */}
      <Sequence from={4800} durationInFrames={195}>
        <SoftFoodsChecklistBanner durationInFrames={195} />
      </Sequence>

      {/* =====================================================================
          SHOT 17: 02:51.8 - 02:55.5 (Frames 5154 - 5265)
          1-Inch Safe Margin tracked directly to cheddar cheese cut gap
      ===================================================================== */}
      <Sequence from={5154} durationInFrames={111}>
        <TrackedCallout
          durationInFrames={111}
          keyframes={[
            { frame: 0, x: 59, y: 76 },
            { frame: 55, x: 59, y: 76 },
            { frame: 111, x: 58, y: 77 },
          ]}
          label="◄— 1 INCH SAFE MARGIN —►"
          sublabel="DENSE CHEDDAR BLOCKS ROOTS"
          color={COLORS.neonGreen}
          offsetX={85}
          offsetY={-110}
          reticleSize={48}
        />
      </Sequence>

      {/* =====================================================================
          SHOT 18: 03:06.2 - 03:11.8 (Frames 5586 - 5754)
          End-Screen Header positioned ABOVE the right-hand neon frame (x: 72%)
          so YouTube Studio's clickable End Screen card fits cleanly inside!
      ===================================================================== */}
      <Sequence from={5586} durationInFrames={168}>
        <EndScreenHeaderCTA durationInFrames={168} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// BESPOKE SHOT-LOCKED COMPONENTS (Plan v3)
// ============================================================================

const KnifeCutStampV2: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const stampScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 11, stiffness: 220 },
  });
  const exitOpacity = interpolate(
    frame,
    [0, 5, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Target is the moldy right edge of the bread on the cutting board (x: 67%, y: 76%)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: exitOpacity }}>
      {/* Target Reticle on the Moldy Bread Corner */}
      <div
        style={{
          position: 'absolute',
          left: '67%',
          top: '76%',
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: `3px solid ${COLORS.crimsonAlert}`,
          boxShadow: `0 0 16px ${COLORS.crimsonAlert}`,
          transform: `translate(-50%, -50%) scale(${intro})`,
        }}
      />

      {/* Slam-In Warning Stamp in Upper-Right Open Space */}
      {frame >= 20 && (
        <div
          style={{
            position: 'absolute',
            right: 90,
            top: 140,
            transform: `scale(${stampScale}) rotate(-4deg)`,
            border: `5px solid ${COLORS.crimsonAlert}`,
            background: COLORS.darkBg,
            padding: '12px 28px',
            borderRadius: '10px',
            boxShadow: `0 12px 30px rgba(0,0,0,0.7), 0 0 26px ${COLORS.crimsonAlert}77`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.header,
              fontSize: 46,
              fontWeight: 900,
              color: COLORS.pureWhite,
              letterSpacing: '0.06em',
              textShadow: `0 0 14px ${COLORS.crimsonAlert}`,
            }}
          >
            ❌ BIG MISTAKE
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.warningAmber,
              textAlign: 'center',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}
          >
            INVISIBLE ROOTS REMAIN INSIDE
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const StomachAcidHudV2: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  const exitOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const meltedPercent = Math.round(
    interpolate(frame, [20, 210], [0, 90], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
  );

  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        bottom: 56,
        width: 430,
        opacity: exitOpacity,
        transform: `translateY(${interpolate(intro, [0, 1], [40, 0])}px)`,
        background: COLORS.darkBg,
        border: `2px solid ${COLORS.neonGreen}`,
        borderRadius: 12,
        padding: '18px 22px',
        boxShadow: `0 12px 32px rgba(0,0,0,0.7), 0 0 20px ${COLORS.neonGreen}33`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.neonGreen,
          }}
        >
          STOMACH ACID (HCl)
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 25,
            fontWeight: 900,
            color: COLORS.pureWhite,
          }}
        >
          pH 1.5
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: 14,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 7,
          marginTop: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${meltedPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${COLORS.neonGreen}, ${COLORS.cyanHud})`,
            boxShadow: `0 0 12px ${COLORS.neonGreen}`,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
          fontFamily: FONTS.mono,
          fontSize: 15,
          color: COLORS.pureWhite,
          fontWeight: 700,
        }}
      >
        <span>HARMLESS SPORES MELTED:</span>
        <span style={{ color: COLORS.neonGreen, fontSize: 19 }}>{meltedPercent}%</span>
      </div>
    </div>
  );
};

const ToasterHeatHudV2: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const exitOpacity = interpolate(
    frame,
    [0, 8, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const tempF = Math.round(
    interpolate(frame, [0, 100], [72, 500], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const fillPct = interpolate(tempF, [72, 500], [10, 100]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: exitOpacity }}>
      <div
        style={{
          position: 'absolute',
          right: 56,
          top: 150,
          background: COLORS.darkBg,
          border: `2px solid ${COLORS.crimsonAlert}`,
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: `0 10px 28px rgba(0,0,0,0.65), 0 0 22px ${COLORS.crimsonAlert}44`,
        }}
      >
        <div
          style={{
            width: 22,
            height: 200,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 11,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: `${fillPct}%`,
              background: `linear-gradient(180deg, ${COLORS.crimsonAlert}, ${COLORS.warningAmber})`,
              boxShadow: `0 0 14px ${COLORS.crimsonAlert}`,
            }}
          />
        </div>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.warningAmber }}>
            THERMAL RESISTANCE
          </div>
          <div
            style={{
              fontFamily: FONTS.header,
              fontSize: 48,
              fontWeight: 900,
              color: COLORS.pureWhite,
            }}
          >
            {tempF}°F
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 15,
              color: COLORS.neonGreen,
              marginTop: 6,
            }}
          >
            ✓ LIVING MOLD: DEAD
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 15,
              color: COLORS.crimsonAlert,
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            ⚠️ MYCOTOXINS: SURVIVE
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SplitScreenVagusHudV2: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const exitOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: exitOpacity }}>
      {/* Left Split-Screen Badge: Vagus Nerve */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          bottom: 56,
          transform: `scale(${pop})`,
          background: COLORS.darkBg,
          borderLeft: `5px solid ${COLORS.cyanHud}`,
          padding: '10px 18px',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.cyanHud }}>
          ELECTRICAL ALARM
        </div>
        <div
          style={{
            fontFamily: FONTS.header,
            fontSize: 24,
            color: COLORS.pureWhite,
            fontWeight: 800,
          }}
        >
          VAGUS NERVE → BRAIN
        </div>
      </div>

      {/* Right Split-Screen Badge: Physical Purge */}
      <div
        style={{
          position: 'absolute',
          right: 56,
          bottom: 56,
          transform: `scale(${pop})`,
          background: COLORS.darkBg,
          borderLeft: `5px solid ${COLORS.crimsonAlert}`,
          padding: '10px 18px',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.crimsonAlert }}>
          PHYSICAL RESPONSE
        </div>
        <div
          style={{
            fontFamily: FONTS.header,
            fontSize: 24,
            color: COLORS.pureWhite,
            fontWeight: 800,
          }}
        >
          COLD SWEAT + STOMACH PURGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MythBusterBannerV2: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 13 } });
  const exitOpacity = interpolate(
    frame,
    [0, 8, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        left: '50%',
        opacity: exitOpacity,
        transform: `translateX(-50%) scale(${scale})`,
        background: COLORS.darkBg,
        border: `2px solid ${COLORS.crimsonAlert}`,
        padding: '12px 32px',
        borderRadius: 50,
        boxShadow: `0 10px 30px rgba(0,0,0,0.65), 0 0 20px ${COLORS.crimsonAlert}55`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 21,
          fontWeight: 800,
          color: COLORS.pureWhite,
        }}
      >
        MYTH: &ldquo;MOLDY BREAD = FREE PENICILLIN&rdquo;
      </span>
      <span
        style={{
          background: COLORS.crimsonAlert,
          color: COLORS.pureWhite,
          fontFamily: FONTS.header,
          fontWeight: 900,
          fontSize: 19,
          padding: '4px 14px',
          borderRadius: 20,
        }}
      >
        ❌ FALSE
      </span>
    </div>
  );
};

const SoftFoodsChecklistBanner: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideUp = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const exitOpacity = interpolate(
    frame,
    [0, 8, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const items = [
    { label: '🗑️ SOFT BREAD', triggerFrame: 0 },
    { label: '🗑️ BERRIES & FRUIT', triggerFrame: 48 },
    { label: '🗑️ JAM & SOFT CHEESE', triggerFrame: 96 },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 54,
        left: '50%',
        opacity: exitOpacity,
        transform: `translateX(-50%) translateY(${interpolate(slideUp, [0, 1], [60, 0])}px)`,
        background: COLORS.darkBg,
        border: `2px solid ${COLORS.crimsonAlert}`,
        borderRadius: 14,
        padding: '16px 28px',
        boxShadow: `0 14px 36px rgba(0,0,0,0.75), 0 0 24px ${COLORS.crimsonAlert}44`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONTS.header,
          fontSize: 24,
          fontWeight: 900,
          color: COLORS.pureWhite,
          letterSpacing: '0.05em',
          marginBottom: 12,
        }}
      >
        RULE #1: HIGH-MOISTURE &amp; POROUS FOODS → STRAIGHT TO TRASH
      </div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        {items.map((item) => {
          const active = frame >= item.triggerFrame;
          return (
            <div
              key={item.label}
              style={{
                fontFamily: FONTS.mono,
                fontSize: 16,
                fontWeight: 800,
                padding: '8px 16px',
                borderRadius: 8,
                background: active ? COLORS.crimsonAlert : 'rgba(255,255,255,0.08)',
                color: active ? COLORS.pureWhite : 'rgba(255,255,255,0.45)',
                border: `1.5px solid ${active ? COLORS.pureWhite : 'rgba(255,255,255,0.15)'}`,
                boxShadow: active ? `0 0 14px ${COLORS.crimsonAlert}` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EndScreenHeaderCTA: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const exitOpacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bounceY = Math.sin(frame * 0.25) * 5;

  // Positioned at x: 72%, y: 20% (Directly ABOVE the right-hand glowing neon frame)
  return (
    <div
      style={{
        position: 'absolute',
        left: '72%',
        top: '20%',
        opacity: exitOpacity,
        transform: `translate(-50%, calc(-50% + ${bounceY}px)) scale(${pop})`,
        background: COLORS.darkBg,
        border: `2.5px solid ${COLORS.cyanHud}`,
        borderRadius: 12,
        padding: '12px 24px',
        boxShadow: `0 10px 28px rgba(0,0,0,0.75), 0 0 24px ${COLORS.cyanHud}66`,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 14,
          fontWeight: 800,
          color: COLORS.warningAmber,
          letterSpacing: '0.12em',
        }}
      >
        UP NEXT // CLICK BELOW TO WATCH
      </div>
      <div
        style={{
          fontFamily: FONTS.header,
          fontSize: 24,
          fontWeight: 900,
          color: COLORS.pureWhite,
          marginTop: 4,
        }}
      >
        ▼ EXPIRED MEDICINE: 1 HOUR LATER ▼
      </div>
    </div>
  );
};
