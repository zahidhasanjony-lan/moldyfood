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
// COLOR PALETTE & DESIGN TOKENS (Bio-HUD / Medical Sci-Fi Style)
// ============================================================================
const COLORS = {
  neonGreen: '#39FF14',
  warningAmber: '#FFB800',
  crimsonAlert: '#FF2A55',
  cyanHud: '#00F0FF',
  pureWhite: '#FFFFFF',
  darkBg: 'rgba(8, 12, 20, 0.82)',
  glassBorder: 'rgba(0, 240, 255, 0.35)',
};

const FONTS = {
  header: '"Montserrat", "Inter", "Bebas Neue", sans-serif',
  mono: '"JetBrains Mono", "Space Mono", monospace',
};

// ============================================================================
// REUSABLE MOTION GRAPHIC PRIMITIVES
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

// 1. Point-Tracked Callout with 45-Degree Leader Line & Pulsing Target Reticle
const TrackedCallout: React.FC<{
  keyframes: KeyframePoint[];
  label: string;
  sublabel?: string;
  color?: string;
  offsetX?: number;
  offsetY?: number;
  reticleSize?: number;
}> = ({
  keyframes,
  label,
  sublabel,
  color = COLORS.cyanHud,
  offsetX = 110,
  offsetY = -75,
  reticleSize = 44,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const outroOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin(frame * 0.25) * 0.12;

  const { x, y, scale } = useTrackedPosition(keyframes, frame);

  const elbowX = offsetX * 0.45;
  const elbowY = offsetY;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: outroOpacity }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Target Reticle */}
        <div
          style={{
            width: reticleSize,
            height: reticleSize,
            borderRadius: '50%',
            border: `2px solid ${color}`,
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

        {/* SVG 45-Degree Leader Line */}
        <svg
          width="400"
          height="300"
          viewBox="-200 -150 400 300"
          style={{ position: 'absolute', left: -200, top: -150, overflow: 'visible' }}
        >
          <polyline
            points={`0,0 ${elbowX * intro},${elbowY * intro} ${offsetX * intro},${offsetY * intro}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray="300"
            strokeDashoffset={interpolate(intro, [0, 1], [300, 0])}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <circle cx={elbowX * intro} cy={elbowY * intro} r="3.5" fill={color} />
        </svg>

        {/* Callout Text Box */}
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
            borderRadius: '4px',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            boxShadow: `0 8px 24px rgba(0,0,0,0.55), 0 0 12px ${color}33`,
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

// 2. Chapter Banner (Top-Left or Bottom-Left to avoid baked-in timers)
const ChapterBanner: React.FC<{
  timeTag: string;
  title: string;
  color?: string;
  position?: 'top-left' | 'bottom-left';
}> = ({ timeTag, title, color = COLORS.cyanHud, position = 'top-left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });
  const xOffset = interpolate(slide, [0, 1], [-420, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: position === 'top-left' ? 52 : undefined,
        bottom: position === 'bottom-left' ? 64 : undefined,
        transform: `translateX(${xOffset}px)`,
        display: 'flex',
        alignItems: 'center',
        background: COLORS.darkBg,
        borderLeft: `6px solid ${color}`,
        padding: '12px 24px',
        borderRadius: '0 8px 8px 0',
        boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 16px ${color}40`,
        border: `1px solid ${color}55`,
        borderLeftWidth: 6,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 15,
            fontWeight: 700,
            color,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {timeTag}
        </div>
        <div
          style={{
            fontFamily: FONTS.header,
            fontSize: 30,
            fontWeight: 900,
            color: COLORS.pureWhite,
            letterSpacing: '0.04em',
            marginTop: 2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN VIDEO COMPOSITION (3:12 / 192 Seconds @ 30 FPS = 5760 Frames)
// ============================================================================

export interface MoldVideoProps {
  videoFileName?: string;
  transparentOverlayOnly?: boolean;
}

export const MoldVideoOverlay: React.FC<MoldVideoProps> = ({
  videoFileName = 'lv_0_20261114233803.mp4',
  transparentOverlayOnly = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: transparentOverlayOnly ? 'transparent' : '#000' }}>
      {/* Base Video Layer (can be toggled off for Alpha-channel overlay export) */}
      {!transparentOverlayOnly && (
        <OffthreadVideo src={staticFile(videoFileName)} style={{ width: '100%', height: '100%' }} />
      )}

      {/* =====================================================================
          00:00 - 00:08 (Frames 0 - 240): Surface Spores Reticle on Moldy Bread
      ===================================================================== */}
      <Sequence from={15} durationInFrames={225}>
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 48, y: 68, scale: 1 },
            { frame: 110, x: 49, y: 66, scale: 1.05 },
            { frame: 225, x: 47, y: 69, scale: 1 },
          ]}
          label="SURFACE SPORES"
          sublabel="VISIBLE TIP OF COLONY"
          color={COLORS.neonGreen}
          offsetX={130}
          offsetY={-85}
        />
      </Sequence>

      {/* =====================================================================
          00:09 - 00:14 (Frames 270 - 420): Knife Cut Line & "BIG MISTAKE" Stamp
      ===================================================================== */}
      <Sequence from={270} durationInFrames={150}>
        <KnifeCutStamp />
      </Sequence>

      {/* =====================================================================
          00:15 - 00:26 (Frames 450 - 780): Lower-Left Chapter HUD (Avoids 59:58 clock)
      ===================================================================== */}
      <Sequence from={450} durationInFrames={330}>
        <ChapterBanner
          timeTag="T-MINUS 60:00 // INGESTION DETECTED"
          title="60-MINUTE BIOLOGICAL WAR"
          color={COLORS.warningAmber}
          position="bottom-left"
        />
      </Sequence>

      {/* =====================================================================
          00:27 - 00:43 (Frames 810 - 1290): Minute 05 - Hyphae & Magnifying HUD
      ===================================================================== */}
      <Sequence from={810} durationInFrames={480}>
        <ChapterBanner
          timeTag="MINUTE 05 // MICROSCOPIC THREADS"
          title="THE INVISIBLE INVASION"
          color={COLORS.cyanHud}
          position="top-left"
        />
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 42, y: 34 },
            { frame: 240, x: 40, y: 36 },
            { frame: 480, x: 38, y: 35 },
          ]}
          label="SURFACE SPORES"
          sublabel="REPRODUCTIVE HEADS"
          color={COLORS.neonGreen}
          offsetX={-140}
          offsetY={-65}
        />
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 55, y: 62 },
            { frame: 240, x: 58, y: 66 },
            { frame: 480, x: 61, y: 68 },
          ]}
          label="HYPHAE NETWORK"
          sublabel="DEEP MICROSCOPIC ROOTS (100% INFECTED)"
          color={COLORS.cyanHud}
          offsetX={140}
          offsetY={60}
        />
      </Sequence>

      {/* =====================================================================
          00:44 - 00:50 (Frames 1320 - 1500): Spores Entering Esophagus
      ===================================================================== */}
      <Sequence from={1320} durationInFrames={180}>
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 52, y: 48 },
            { frame: 90, x: 52, y: 58 },
            { frame: 180, x: 52, y: 72 },
          ]}
          label="MILLIONS OF SPORES"
          sublabel="TRANSIT -> ESOPHAGUS"
          color={COLORS.warningAmber}
          offsetX={150}
          offsetY={-40}
        />
      </Sequence>

      {/* =====================================================================
          00:51 - 01:09 (Frames 1530 - 2070): Minute 15 - Stomach Acid Bath Gauge
      ===================================================================== */}
      <Sequence from={1530} durationInFrames={540}>
        <ChapterBanner
          timeTag="MINUTE 15 // FIRST LINE OF DEFENSE"
          title="THE STOMACH ACID BATH"
          color={COLORS.neonGreen}
          position="top-left"
        />
        <StomachAcidHud />
      </Sequence>

      {/* =====================================================================
          01:10 - 01:20 (Frames 2100 - 2400): Minute 30 - Aspergillus & Mycotoxins
          (Placed Top-Left to avoid baked-in 00:30 in Top-Right)
      ===================================================================== */}
      <Sequence from={2100} durationInFrames={300}>
        <ChapterBanner
          timeTag="MINUTE 30 // SURVIVOR SPECIES"
          title="BREACHING THE GATE"
          color={COLORS.crimsonAlert}
          position="top-left"
        />
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 46, y: 48, scale: 0.9 },
            { frame: 150, x: 44, y: 45, scale: 1.05 },
            { frame: 300, x: 42, y: 43, scale: 1.15 },
          ]}
          label="ASPERGILLUS"
          sublabel="ACID-RESISTANT FUNGAL SPECIES"
          color={COLORS.crimsonAlert}
          offsetX={-150}
          offsetY={-70}
        />
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 56, y: 58, scale: 0.9 },
            { frame: 150, x: 58, y: 56, scale: 1.05 },
            { frame: 300, x: 61, y: 54, scale: 1.15 },
          ]}
          label="MYCOTOXIN PAYLOAD"
          sublabel="INVISIBLE CHEMICAL WEAPON"
          color={COLORS.neonGreen}
          offsetX={140}
          offsetY={50}
        />
      </Sequence>

      {/* =====================================================================
          01:21 - 01:29 (Frames 2430 - 2700): Toaster 500°F Heat Resistance HUD
      ===================================================================== */}
      <Sequence from={2430} durationInFrames={270}>
        <ToasterHeatHud />
      </Sequence>

      {/* =====================================================================
          01:30 - 01:39 (Frames 2700 - 2970): Pyloric Valve Breach & Chasing Orbs
      ===================================================================== */}
      <Sequence from={2700} durationInFrames={270}>
        <TrackedCallout
          keyframes={[
            { frame: 0, x: 50, y: 42 },
            { frame: 135, x: 54, y: 46 },
            { frame: 270, x: 58, y: 50 },
          ]}
          label="INTACT MYCOTOXINS"
          sublabel="STOMACH VALVE BREACHED -> SMALL INTESTINE"
          color={COLORS.neonGreen}
          offsetX={130}
          offsetY={-75}
          reticleSize={64}
        />
      </Sequence>

      {/* =====================================================================
          01:40 - 01:59 (Frames 3000 - 3570): Minute 45 - Emergency Purge & Split HUD
      ===================================================================== */}
      <Sequence from={3000} durationInFrames={570}>
        <ChapterBanner
          timeTag="MINUTE 45 // GUT ALARM TRIGGERED"
          title="THE EMERGENCY PURGE"
          color={COLORS.crimsonAlert}
          position="top-left"
        />
        <Sequence from={110} durationInFrames={190}>
          <TrackedCallout
            keyframes={[
              { frame: 0, x: 50, y: 64 },
              { frame: 190, x: 50, y: 62 },
            ]}
            label="GUT SENSOR CELLS"
            sublabel="PANIC SIGNAL -> VAGUS NERVE"
            color={COLORS.crimsonAlert}
            offsetX={150}
            offsetY={-80}
          />
        </Sequence>
        <Sequence from={360} durationInFrames={210}>
          <SplitScreenVagusHud />
        </Sequence>
      </Sequence>

      {/* =====================================================================
          02:00 - 02:23 (Frames 3600 - 4290): Minute 60 - Liver Siege & Aflatoxin DNA
      ===================================================================== */}
      <Sequence from={3600} durationInFrames={690}>
        <ChapterBanner
          timeTag="MINUTE 60 // BLOODSTREAM ABSORPTION"
          title="LIVER UNDER SIEGE"
          color={COLORS.warningAmber}
          position="top-left"
        />
        <Sequence from={0} durationInFrames={240}>
          <TrackedCallout
            keyframes={[
              { frame: 0, x: 49, y: 38 },
              { frame: 120, x: 51, y: 40 },
              { frame: 240, x: 49, y: 39 },
            ]}
            label="HEPATIC DETOX MODE"
            sublabel="FILTERING PORTAL VEIN BLOOD"
            color={COLORS.warningAmber}
            offsetX={145}
            offsetY={-60}
          />
        </Sequence>
        <Sequence from={240} durationInFrames={180}>
          <TrackedCallout
            keyframes={[
              { frame: 0, x: 45, y: 55 },
              { frame: 180, x: 52, y: 58 },
            ]}
            label="CYP450 ENZYMES"
            sublabel="CHEMICAL NEUTRALIZATION AGENTS"
            color={COLORS.cyanHud}
            offsetX={130}
            offsetY={-55}
          />
        </Sequence>
        <Sequence from={420} durationInFrames={270}>
          <TrackedCallout
            keyframes={[
              { frame: 0, x: 50, y: 48, scale: 1 },
              { frame: 135, x: 52, y: 46, scale: 1.1 },
              { frame: 270, x: 50, y: 48, scale: 1 },
            ]}
            label="AFLATOXIN B1"
            sublabel="CRITICAL: BINDS & MUTATES HUMAN DNA"
            color={COLORS.crimsonAlert}
            offsetX={140}
            offsetY={-70}
            reticleSize={58}
          />
        </Sequence>
      </Sequence>

      {/* =====================================================================
          02:24 - 02:37 (Frames 4320 - 4710): Penicillin Myth Buster & Good Bacteria
      ===================================================================== */}
      <Sequence from={4320} durationInFrames={390}>
        <MythBusterBanner />
        <Sequence from={150} durationInFrames={240}>
          <TrackedCallout
            keyframes={[
              { frame: 0, x: 38, y: 62 },
              { frame: 120, x: 32, y: 65 },
              { frame: 240, x: 28, y: 66 },
            ]}
            label="BENEFICIAL MICROBIOME"
            sublabel="WIPED OUT BY HOUSEHOLD MYCOTOXINS"
            color={COLORS.cyanHud}
            offsetX={140}
            offsetY={-60}
          />
        </Sequence>
      </Sequence>

      {/* =====================================================================
          02:38 - 02:56 (Frames 4740 - 5280): Soft Food Trash Tags & 1-Inch Cheddar Rule
      ===================================================================== */}
      <Sequence from={4740} durationInFrames={270}>
        <TrackedCallout
          keyframes={[{ frame: 0, x: 26, y: 58 }, { frame: 270, x: 26, y: 58 }]}
          label="SOFT BREAD: TRASH"
          sublabel="POROUS -> DEEP HYPHAE"
          color={COLORS.crimsonAlert}
          offsetX={60}
          offsetY={-85}
        />
        <TrackedCallout
          keyframes={[{ frame: 0, x: 52, y: 64 }, { frame: 270, x: 52, y: 64 }]}
          label="BERRIES: TRASH"
          sublabel="HIGH MOISTURE SPREAD"
          color={COLORS.crimsonAlert}
          offsetX={60}
          offsetY={-85}
        />
        <TrackedCallout
          keyframes={[{ frame: 0, x: 76, y: 52 }, { frame: 270, x: 76, y: 52 }]}
          label="JAM / JELLY: TRASH"
          sublabel="MYCOTOXIN DIFFUSION"
          color={COLORS.crimsonAlert}
          offsetX={-80}
          offsetY={-85}
        />
      </Sequence>

      <Sequence from={5130} durationInFrames={165}>
        <OneInchCheddarRuler />
      </Sequence>

      {/* =====================================================================
          02:57 - 03:12 (Frames 5310 - 5758): End-Screen 4-Point Tracked CTA Card
      ===================================================================== */}
      <Sequence from={5460} durationInFrames={298}>
        <EndScreenTrackedCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE-SPECIFIC BESPOKE MOTION GRAPHIC COMPONENTS
// ============================================================================

const KnifeCutStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cutProgress = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: 'clamp' });
  const stampScale = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 10, stiffness: 220 },
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Animated Dotted Cut Line following the Knife Blade */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <line
          x1="980"
          y1="260"
          x2={interpolate(cutProgress, [0, 1], [980, 940])}
          y2={interpolate(cutProgress, [0, 1], [260, 820])}
          stroke={COLORS.crimsonAlert}
          strokeWidth="6"
          strokeDasharray="18 12"
          style={{ filter: `drop-shadow(0 0 12px ${COLORS.crimsonAlert})` }}
        />
      </svg>

      {/* Slam-In Warning Stamp */}
      {frame >= 35 && (
        <div
          style={{
            position: 'absolute',
            right: 160,
            top: 220,
            transform: `scale(${stampScale}) rotate(-6deg)`,
            border: `6px solid ${COLORS.crimsonAlert}`,
            background: 'rgba(255, 42, 85, 0.18)',
            padding: '14px 32px',
            borderRadius: '10px',
            boxShadow: `0 0 30px ${COLORS.crimsonAlert}88`,
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.header,
              fontSize: 54,
              fontWeight: 900,
              color: COLORS.pureWhite,
              letterSpacing: '0.08em',
              textShadow: `0 0 16px ${COLORS.crimsonAlert}`,
            }}
          >
            ❌ BIG MISTAKE
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.warningAmber,
              textAlign: 'center',
              letterSpacing: '0.1em',
            }}
          >
            ROOTS REMAIN INSIDE BREAD
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const StomachAcidHud: React.FC = () => {
  const frame = useCurrentFrame();
  const meltedPercent = Math.round(
    interpolate(frame, [30, 320], [0, 90], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
  );

  return (
    <div
      style={{
        position: 'absolute',
        right: 64,
        bottom: 72,
        width: 440,
        background: COLORS.darkBg,
        border: `2px solid ${COLORS.neonGreen}`,
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: `0 12px 32px rgba(0,0,0,0.65), 0 0 20px ${COLORS.neonGreen}33`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.neonGreen,
          }}
        >
          HYDROCHLORIC ACID (HCl)
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 26,
            fontWeight: 900,
            color: COLORS.pureWhite,
          }}
        >
          pH 1.5
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 16,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 8,
          marginTop: 14,
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
          fontSize: 16,
          color: COLORS.pureWhite,
          fontWeight: 700,
        }}
      >
        <span>HARMLESS SPORES MELTED:</span>
        <span style={{ color: COLORS.neonGreen, fontSize: 20 }}>{meltedPercent}%</span>
      </div>
    </div>
  );
};

const ToasterHeatHud: React.FC = () => {
  const frame = useCurrentFrame();
  const tempF = Math.round(
    interpolate(frame, [0, 120], [72, 500], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const fillPct = interpolate(tempF, [72, 500], [10, 100]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Right-Side Vertical Thermometer HUD */}
      <div
        style={{
          position: 'absolute',
          right: 64,
          top: 160,
          background: COLORS.darkBg,
          border: `2px solid ${COLORS.crimsonAlert}`,
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          boxShadow: `0 0 24px ${COLORS.crimsonAlert}55`,
        }}
      >
        <div
          style={{
            width: 24,
            height: 220,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 12,
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
              boxShadow: `0 0 16px ${COLORS.crimsonAlert}`,
            }}
          />
        </div>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 15, color: COLORS.warningAmber }}>
            THERMAL RESISTANCE TEST
          </div>
          <div
            style={{
              fontFamily: FONTS.header,
              fontSize: 52,
              fontWeight: 900,
              color: COLORS.pureWhite,
            }}
          >
            {tempF}°F
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: COLORS.neonGreen,
              marginTop: 8,
            }}
          >
            ✓ LIVING MOLD: DEAD
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: COLORS.crimsonAlert,
              fontWeight: 800,
              marginTop: 4,
            }}
          >
            ⚠️ MYCOTOXINS: INTACT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SplitScreenVagusHud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Left Label: Vagus Nerve */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          bottom: 64,
          transform: `scale(${pop})`,
          background: COLORS.darkBg,
          borderLeft: `5px solid ${COLORS.cyanHud}`,
          padding: '12px 20px',
          borderRadius: 6,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.cyanHud }}>
          NEURAL PATHWAY
        </div>
        <div style={{ fontFamily: FONTS.header, fontSize: 26, color: COLORS.pureWhite, fontWeight: 800 }}>
          VAGUS NERVE → VOMITING CENTER
        </div>
      </div>

      {/* Right Label: Physical Purge Response */}
      <div
        style={{
          position: 'absolute',
          right: 64,
          bottom: 64,
          transform: `scale(${pop})`,
          background: COLORS.darkBg,
          borderLeft: `5px solid ${COLORS.crimsonAlert}`,
          padding: '12px 20px',
          borderRadius: 6,
        }}
      >
        <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.crimsonAlert }}>
          DEFENSE PROTOCOL
        </div>
        <div style={{ fontFamily: FONTS.header, fontSize: 26, color: COLORS.pureWhite, fontWeight: 800 }}>
          SALIVA SHIELD + COLD SWEAT + PURGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MythBusterBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 13 } });

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        background: COLORS.darkBg,
        border: `2px solid ${COLORS.crimsonAlert}`,
        padding: '14px 36px',
        borderRadius: 50,
        boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${COLORS.crimsonAlert}55`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 22,
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
          fontSize: 20,
          padding: '4px 14px',
          borderRadius: 20,
        }}
      >
        ❌ FALSE
      </span>
    </div>
  );
};

const OneInchCheddarRuler: React.FC = () => {
  const frame = useCurrentFrame();
  const widthPct = interpolate(frame, [0, 35], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: '44%',
        top: '56%',
        transform: 'translate(-50%, -50%)',
        width: 220,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 22,
          fontWeight: 900,
          color: COLORS.neonGreen,
          background: COLORS.darkBg,
          padding: '6px 12px',
          borderRadius: 6,
          border: `2px solid ${COLORS.neonGreen}`,
          marginBottom: 8,
          boxShadow: `0 0 14px ${COLORS.neonGreen}55`,
        }}
      >
        ◄— 1 INCH SAFE MARGIN —►
      </div>
      <div
        style={{
          width: `${widthPct}%`,
          height: 6,
          background: COLORS.neonGreen,
          boxShadow: `0 0 12px ${COLORS.neonGreen}`,
          position: 'relative',
        }}
      />
    </div>
  );
};

const EndScreenTrackedCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const pulse = 1 + Math.sin(frame * 0.2) * 0.03;

  return (
    <div
      style={{
        position: 'absolute',
        left: '34%',
        top: '48%',
        width: 560,
        transform: `translate(-50%, -50%) scale(${pop * pulse})`,
        background: 'rgba(8, 16, 28, 0.78)',
        border: `3px solid ${COLORS.cyanHud}`,
        borderRadius: 18,
        padding: '28px 32px',
        boxShadow: `0 0 35px ${COLORS.cyanHud}66`,
        backdropFilter: 'blur(8px)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.warningAmber,
          letterSpacing: '0.14em',
        }}
      >
        UP NEXT // BIOLOGICAL COUNTDOWN
      </div>
      <div
        style={{
          fontFamily: FONTS.header,
          fontSize: 34,
          fontWeight: 900,
          color: COLORS.pureWhite,
          lineHeight: 1.2,
          marginTop: 10,
        }}
      >
        WHAT HAPPENS 1 HOUR AFTER TAKING EXPIRED MEDICINE?
      </div>
      <div
        style={{
          display: 'inline-block',
          marginTop: 18,
          background: COLORS.crimsonAlert,
          color: COLORS.pureWhite,
          fontFamily: FONTS.mono,
          fontSize: 18,
          fontWeight: 800,
          padding: '8px 22px',
          borderRadius: 30,
          boxShadow: `0 0 16px ${COLORS.crimsonAlert}`,
        }}
      >
        ▶ CLICK HERE TO WATCH NOW
      </div>
    </div>
  );
};
