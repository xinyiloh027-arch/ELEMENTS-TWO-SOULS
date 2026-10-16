import { GameLevel } from '../types';

export const LEVEL_03: GameLevel = {
  id: 3,
  title: '03 Moving Platform',
  subtitle: '机关协作 · James长按踏板渡河，Xinyi对岸架桥',
  width: 1280,
  height: 720,
  theme: 'industrial',
  spawnP1: { x: 70, y: 500 },
  spawnP2: { x: 120, y: 500 },
  clouds: [
    { x: 100, y: 70, width: 150, speed: 0.2, opacity: 0.5 },
    { x: 500, y: 100, width: 180, speed: 0.25, opacity: 0.6 },
    { x: 900, y: 60, width: 140, speed: 0.18, opacity: 0.55 },
  ],
  platforms: [
    // Left Starting Ground (x: 0..260, y: 560)
    {
      id: 'ground-left',
      x: 0,
      y: 560,
      width: 260,
      height: 160,
      type: 'ground',
      color: '#334155',
      topColor: '#10b981',
    },

    // Right Destination Ground (x: 840..1280, y: 560)
    // Distance across chasm is 580px - completely impossible to jump across!
    {
      id: 'ground-right',
      x: 840,
      y: 560,
      width: 440,
      height: 160,
      type: 'ground',
      color: '#334155',
      topColor: '#10b981',
    },

    // Gate Lintel on Right Ground
    {
      id: 'gate-roof-03',
      x: 1172,
      y: 390,
      width: 30,
      height: 24,
      type: 'platform',
      color: '#0f172a',
      topColor: '#94a3b8',
    },
  ],
  hazards: [
    // Lethal Spike Chasm across the entire 580px gap (x: 260..840)
    {
      id: 'hazard-spikes-03',
      x: 260,
      y: 685,
      width: 580,
      height: 35,
      type: 'spikes',
      label: 'DEADLY CHASM',
    },
  ],
  movingPlatforms: [
    // Xinyi's Ferry Platform across the chasm
    // Only moves while James holds down btn-james-ferry (stayActive: false)
    // When James lets go, platform immediately stops!
    {
      id: 'mov-plat-xinyi',
      x: 265,
      y: 560,
      width: 88,
      height: 22,
      startX: 265,
      startY: 560,
      endX: 752,
      endY: 560,
      speed: 2.2,
      progress: 0,
      direction: 1,
      requiresSwitchId: 'btn-james-ferry',
      stayActive: false, // Critical: stops moving as soon as James steps off!
      isUnlocked: false,
      color: '#0284c7',
      topColor: '#38bdf8',
    },
  ],
  bridges: [
    // Bridge for James: deployed when Xinyi arrives on the other side and presses btn-xinyi-bridge
    {
      id: 'bridge-james-chasm',
      x: 260,
      y: 560,
      width: 0,
      targetWidth: 580,
      height: 22,
      openProgress: 0,
      state: 'CLOSED',
      requiredSwitchIds: ['btn-xinyi-bridge'],
      stayOpen: true,
      color: '#78350f',
      topColor: '#f59e0b',
    },
  ],
  gems: [
    {
      id: 'gem-03-1',
      x: 540,
      y: 480,
      width: 22,
      height: 22,
      type: 'blue',
      color: '#38bdf8',
      isCollected: false,
    },
  ],
  checkpoints: [
    {
      id: 'cp-03',
      x: 965,
      y: 490,
      width: 32,
      height: 70,
      isActive: false,
      respawnP1: { x: 915, y: 500 },
      respawnP2: { x: 965, y: 500 },
      label: 'SUMMIT CHECKPOINT',
    },
  ],
  buttons: [
    // Button 1 on Left Ground: James holds this down to move Xinyi's platform
    {
      id: 'btn-james-ferry',
      playerTarget: 'james',
      label: 'JAMES HOLD',
      x: 170,
      y: 548,
      width: 54,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#ea580c',
      glowColor: '#fb923c',
      triggerTarget: 'platform',
      targetId: 'mov-plat-xinyi',
    },

    // Button 2 on Right Ground: Xinyi presses this to summon the bridge for James
    {
      id: 'btn-xinyi-bridge',
      playerTarget: 'xinyi',
      label: 'XINYI BRIDGE',
      x: 885,
      y: 548,
      width: 54,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#0284c7',
      glowColor: '#38bdf8',
      triggerTarget: 'bridge',
      targetId: 'bridge-james-chasm',
    },

    // Final Twin Gate Buttons on Right Ground
    {
      id: 'btn-blue-03',
      playerTarget: 'xinyi',
      label: 'XINYI',
      x: 1060,
      y: 548,
      width: 44,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#0284c7',
      glowColor: '#38bdf8',
      triggerTarget: 'gate',
    },
    {
      id: 'btn-orange-03',
      playerTarget: 'james',
      label: 'JAMES',
      x: 1115,
      y: 548,
      width: 44,
      height: 12,
      isPressed: false,
      pressProgress: 0,
      color: '#ea580c',
      glowColor: '#fb923c',
      triggerTarget: 'gate',
    },
  ],
  gate: {
    id: 'coop-gate-03',
    x: 1175,
    y: 414,
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
    x: 1210,
    y: 450,
    width: 58,
    height: 110,
    label: 'EXIT',
  },
};
