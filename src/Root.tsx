import React from 'react';
import { Composition } from 'remotion';
import { MoldVideoOverlay } from './MoldVideoOverlay';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full Composite: Original Video + Motion Graphics HUD */}
      <Composition
        id="MoldVideoWithHUD"
        component={MoldVideoOverlay}
        durationInFrames={5758} // 191.95s @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoFileName: 'lv_0_20261114233803.mp4',
          transparentOverlayOnly: false,
        }}
      />

      {/* Alpha-Channel Overlay Only (for Premiere / DaVinci / After Effects import) */}
      <Composition
        id="MoldHUDAlphaOverlay"
        component={MoldVideoOverlay}
        durationInFrames={5758}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoFileName: 'lv_0_20261114233803.mp4',
          transparentOverlayOnly: true,
        }}
      />
    </>
  );
};
