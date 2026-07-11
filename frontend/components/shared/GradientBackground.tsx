'use client';

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';

/**
 * A moving indigo → hot-pink → warm-gold gradient behind the hero.
 * The canvas is deliberately oversized (inset -6%) and wrapped in a slow
 * multi-axis drift animation, so the motion reads as organic rather than
 * a single pan to the right. A radial vignette keeps the text column
 * legible without flattening the rest of the gradient to gray.
 */
export default function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="gradient-drift absolute" style={{ inset: '-6%' }}>
        <ShaderGradientCanvas
          style={{ position: 'absolute', inset: 0 }}
          pixelDensity={1}
          fov={45}
        >
          <ShaderGradient
            control="props"
            type="waterPlane"
            animate="on"
            uSpeed={0.15}
            uStrength={2.6}
            uDensity={1.5}
            uFrequency={5.5}
            uAmplitude={1.5}
            color1="#5A6BD8"
            color2="#EC5FA3"
            color3="#F4C98A"
            reflection={0.15}
            cAzimuthAngle={180}
            cPolarAngle={82}
            cDistance={3.3}
            cameraZoom={1}
            lightType="env"
            envPreset="city"
            brightness={1.3}
            grain="off"
          />
        </ShaderGradientCanvas>
      </div>

      {/* Vignette: fades to paper behind the text column (left), leaves the
          right side of the gradient visibly saturated. Strong enough that
          copy stays legible even as the hot pink drifts through. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 88% at 18% 42%, var(--color-paper) 42%, transparent 78%)',
        }}
      />
      {/* Soft bottom fade so the hero blends into the next section. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 58%, var(--color-paper) 100%)',
        }}
      />
    </div>
  );
}
