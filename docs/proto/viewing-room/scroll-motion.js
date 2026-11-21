// Art-directed rates, not measurements of the reference site.
// A rate of 1 is native page travel; the wall uses 0.24.
export const layers = [
  {speed:1.18, settle:90,  textSpeed:0.94, pitch:5.0},
  {speed:1.48, settle:145, textSpeed:1.04, pitch:6.5},
  {speed:1.30, settle:115, textSpeed:0.97, pitch:5.5},
  {speed:1.56, settle:160, textSpeed:1.06, pitch:6.0},
  {speed:1.22, settle:100, textSpeed:0.93, pitch:4.5},
  {speed:1.40, settle:135, textSpeed:1.02, pitch:5.5}
];

export function scrollPose(layer, scroll, center, viewport, height) {
  // Anchor each piece locally: no accumulated drift down the whole document.
  // The clamp is beyond the visible crossing, never in the visible motion.
  const range = viewport + height;
  const distance = Math.max(-range, Math.min(range, scroll + viewport * .52 - center));
  const phase = Math.max(-1, Math.min(1, distance / (viewport * .85)));
  return {
    travel: -distance * (layer.speed - 1),
    textTravel: -distance * (layer.textSpeed - 1),
    pitch: -phase * layer.pitch,
    phase
  };
}

export const follow = (from, to, dt, settle) => from + (to - from) * (1 - Math.exp(-dt / settle));
