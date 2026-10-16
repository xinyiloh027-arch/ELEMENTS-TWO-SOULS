import { GameLevel } from '../types';

export const LEVEL_02: GameLevel = {
  id: 2,
  title: '02 Twin Switch',
  subtitle: '双路分离 · Xinyi走上路，James走下路',
  width: 1280,
  height: 720,
  theme: 'temple',
  spawnP1: { x: 80, y: 570 },
  spawnP2: { x: 140, y: 570 },
  clouds: [
    { x: 120, y: 90, width: 140, speed: 0.18, opacity: 0.6 },
    { x: 600, y: 120, width: 170, speed: 0.22, opacity: 0.5 },
    { x: 950, y: 80, width: 130, speed: 0.15, opacity: 0.65 },
  ],
  platforms: [
    // Starting Ground (Left side)
    {
      id: 'ground-start',
      x: 0,
      y: 640,
      width: 300,
      height: 80,
      type: 'ground',
      color: '#334155',
      topColor: '#10b981',
    },
    // Exit Ground (Right side)
    {
      id: 'ground-end',
      x: 980,
      y: 640,
      width: 300,
      height: 80,
      type: 'ground',
      color: '#334155',
      topColor: '#10b981',
    },

    // Upper Path (Blue Route for Xinyi / Lumi)
    // Step 1: Accessible from ground-start (y: 640 -> 545, delta 95px, smooth single jump)
    {
      id: 'plat-blue-stair-1',
      x: 230,
      y: 545,
      width: 130,
      height: 24,
      type: 'platform',
      color: '#1e3a8a',
      topColor: '#60a5fa',
    },
    // Step 2: Natural mid step (y: 545 -> 455, delta 90px)
    {
      id: 'plat-blue-stair-2',
      x: 380,
      y: 455,
      width: 140,
      height: 24,
      type: 'platform',
      color: '#1e3a8a',
      topColor: '#60a5fa',
    },
    // Step 3: Blue Switch Platform (Lowered to y: 370, delta 85px from stair-2, well within normal jump)
    {
      id: 'plat-blue-switch-room',
      x: 540,
      y: 370,
      width: 200,
      height: 24,
      type: 'platform',
      color: '#1e3a8a',
      topColor: '#60a5fa',
    },
    // Step 4: Descent bridge after switch (y: 370 -> 450)
    {
      id: 'plat-blue-bridge-out',
      x: 760,
      y: 450,
      width: 140,
      height: 24,
      type: 'platform',
      color: '#1e3a8a',
      topColor: '#60a5fa',
    },
    // Step 5: Rejoining step down to ground-end (y: 450 -> 535 -> 640)
    {
      id: 'plat-blue-rejoin',
      x: 920,
      y: 535,
      width: 130,
      height: 24,
      type: 'platform',
      color: '#334155',
      topColor: '#10b981',
    },

    // Lower Path (Red Route for James / Flare)
    // Step 1: Gentle initial step (smooth connection from ground-start)
    {
      id: 'plat-red-1',
      x: 290,
      y: 620,
      width: 180,
      height: 24,
      type: 'platform',
      color: '#7c2d12',
      topColor: '#f97316',
    },
    // Step 2: Red Switch Platform (y: 535, delta 85px, smooth single jump, 141px headroom below blue platform)
    {
      id: 'plat-red-2',
      x: 490,
      y: 535,
      width: 200,
      height: 24,
      type: 'platform',
      color: '#7c2d12',
      topColor: '#f97316',
    },
    // Step 3: Descent platform (y: 535 -> 605)
    {
      id: 'plat-red-3',
      x: 710,
      y: 605,
      width: 150,
      height: 24,
      type: 'platform',
      color: '#7c2d12',
      topColor: '#f97316',
    },
    // Step 4: Connection step to ground-end (y: 605 -> 625 -> 640)
    {
      id: 'plat-red-4',
      x: 880,
      y: 625,
      width: 120,
      height: 24,
      type: 'platform',
      color: '#7c2d12',
      topColor: '#f97316',
    },

    // Gate arch structure
    {
      id: 'gate-arch',
      x: 1080,
      y: 470,
      width: 70,
      height: 24,
      type: 'platform',
      color: '#0f172a',
      topColor: '#94a3b8',
    },
  ],
  buttons: [
    // Blue Button on upper route (lowered to y: 358 on top of plat-blue-switch-room at y: 370)
    {
      id: 'btn-blue-02',
      playerTarget: 'xinyi',
      label: 'XINYI',
      x: 610,
      y: 358,
      width: 54,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#0284c7',
      glowColor: '#38bdf8',
      triggerTarget: 'gate',
    },
    // Red Button on lower route (positioned at y: 523 on top of plat-red-2 at y: 535)
    {
      id: 'btn-red-02',
      playerTarget: 'james',
      label: 'JAMES',
      x: 560,
      y: 523,
      width: 54,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#ea580c',
      glowColor: '#fb923c',
      triggerTarget: 'gate',
    },
  ],
  gate: {
    id: 'coop-gate-02',
    x: 1100,
    y: 494,
    width: 24,
    height: 146,
    openProgress: 0,
    isOpen: false,
    state: 'CLOSED',
    minOpenTimer: 0,
    releaseDelayTimer: 0,
    color: '#334155',
    accentColor: '#10b981',
  },
  exit: {
    x: 1150,
    y: 530,
    width: 85,
    height: 110,
    label: 'EXIT',
  },
};
