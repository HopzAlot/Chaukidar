'use client';

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
      <div
        className="gradient-drift absolute"
        style={{
          inset: '-12%',
          background:
            'radial-gradient(circle at 72% 28%, rgba(236,95,163,0.72), transparent 34%), radial-gradient(circle at 46% 70%, rgba(244,201,138,0.7), transparent 38%), linear-gradient(125deg, #5a6bd8 0%, #e9e9f6 58%, #f8f7f2 100%)',
        }}
      />

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
