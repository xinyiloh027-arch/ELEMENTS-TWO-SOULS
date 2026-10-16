import { GameLevel, LevelMeta } from '../types';
import { LEVEL_01 } from './level01';
import { LEVEL_02 } from './level02';
import { LEVEL_03 } from './level03';
import { LEVEL_04 } from './level04';
import { LEVEL_05 } from './level05';
import { LEVEL_06 } from './level06';
import { LEVEL_07 } from './level07';
import { LEVEL_08 } from './level08';
import { LEVEL_09 } from './level09';
import { LEVEL_10 } from './level10';
import { LEVEL_11 } from './level11';
import { LEVEL_12 } from './level12';
import { LEVEL_13 } from './level13';
import { LEVEL_14 } from './level14';
import { LEVEL_15 } from './level15';
import { LEVEL_16 } from './level16';
import { LEVEL_17 } from './level17';
import { LEVEL_18 } from './level18';
import { LEVEL_19 } from './level19';
import { LEVEL_20 } from './level20';

export const ALL_LEVELS: GameLevel[] = [
  LEVEL_01,
  LEVEL_02,
  LEVEL_03,
  LEVEL_04,
  LEVEL_05,
  LEVEL_06,
  LEVEL_07,
  LEVEL_08,
  LEVEL_09,
  LEVEL_10,
  LEVEL_11,
  LEVEL_12,
  LEVEL_13,
  LEVEL_14,
  LEVEL_15,
  LEVEL_16,
  LEVEL_17,
  LEVEL_18,
  LEVEL_19,
  LEVEL_20,
];

export const LEVEL_METADATA_LIST: LevelMeta[] = [
  {
    id: 1,
    title: '01 First Step',
    name: '初见启程',
    desc: '基础合作教学 · 双踏板开启大门',
    difficulty: '入门 ⭐',
    unlocked: true,
  },
  {
    id: 2,
    title: '02 Twin Switch',
    name: '双路机关',
    desc: '高低分流 · Xinyi走上路，James走下路',
    difficulty: '基础 ⭐',
    unlocked: false,
  },
  {
    id: 3,
    title: '03 Moving Platform',
    name: '移动平台',
    desc: '长按机关 · James按住开关移动踏板，Xinyi对岸开桥',
    difficulty: '进阶 ⭐⭐',
    unlocked: false,
  },
  {
    id: 4,
    title: '04 Box Puzzle',
    name: '重力箱谜题',
    desc: '推动箱子 · 压制开关与借力垫高起跳',
    difficulty: '进阶 ⭐⭐',
    unlocked: false,
  },
  {
    id: 5,
    title: '05 Water & Fire',
    name: '水火共生',
    desc: '元素抵抗 · Xinyi耐水，James耐火',
    difficulty: '挑战 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 6,
    title: '06 The Bridge',
    name: '凌空索桥',
    desc: '双重激活 · 展开横跨峡谷的机械巨桥',
    difficulty: '挑战 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 7,
    title: '07 Mirror Room',
    name: '镜像之室',
    desc: '双室对称 · 跨空间隔空遥控传送门',
    difficulty: '烧脑 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 8,
    title: '08 Speed Run',
    name: '疾速突破',
    desc: '坍塌浮岛 · 倒计时连携飞跃',
    difficulty: '竞速 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 9,
    title: '09 The Labyrinth',
    name: '合作迷宫',
    desc: '异室分途 · 寻找互开之钥并在中庭会合',
    difficulty: '综合 ⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 10,
    title: '10 Final Escape',
    name: '终局逃脱',
    desc: '六大区域终极连贯大挑战 · 逃出生天',
    difficulty: '大师 ⭐⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 11,
    title: '11 Sky Transport Station',
    name: '天空运输站',
    desc: '浮空运输平台 · 横渡天际深渊与高低连携',
    difficulty: '进阶 ⭐⭐',
    unlocked: false,
  },
  {
    id: 12,
    title: '12 Twin Switch',
    name: '双生开关',
    desc: '共时压感开关 · 远距连携踏板开启通路',
    difficulty: '进阶 ⭐⭐',
    unlocked: false,
  },
  {
    id: 13,
    title: '13 Weight Laboratory',
    name: '重量实验室',
    desc: '合金重箱推运 · 填坑垫高与压感机关重构',
    difficulty: '烧脑 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 14,
    title: '14 Elemental Laser Lab',
    name: '元素激光实验室',
    desc: '激光反射镜 · 转向控制器与元素免疫交叉破拆',
    difficulty: '挑战 ⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 15,
    title: '15 Time Shift Factory',
    name: '时间错位工厂',
    desc: '时间暂停开关 · 极速平台滞缓与幽灵幻影桥梁',
    difficulty: '挑战 ⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 16,
    title: '16 Portal Dimension',
    name: '空间折跃遗迹',
    desc: '虫洞方向重构 · 双向传送锚点与量子位置互换',
    difficulty: '烧脑 ⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 17,
    title: '17 Vanishing Road',
    name: '消失的道路',
    desc: '虚实幻影灵石 · 预警闪烁与节奏飞跃',
    difficulty: '竞速 ⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 18,
    title: '18 Parallel Worlds',
    name: '双轨同步',
    desc: '命脉相连回廊 · 我为你开路，你为我解禁',
    difficulty: '综合 ⭐⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 19,
    title: '19 Mechanical Core',
    name: '机械核心',
    desc: '全机制大型机械回廊 · 四阶序列密码解谜',
    difficulty: '大师 ⭐⭐⭐⭐⭐',
    unlocked: false,
  },
  {
    id: 20,
    title: '20 The Final Element Trial',
    name: '元素终极试炼',
    desc: '巅峰终局圣殿 · 水火交响与四段记录点大冒险',
    difficulty: '传说 🌟🌟🌟🌟🌟',
    unlocked: false,
  },
];

export function getLevelById(id: number): GameLevel {
  const found = ALL_LEVELS.find((lvl) => lvl.id === id);
  return found ? JSON.parse(JSON.stringify(found)) : JSON.parse(JSON.stringify(LEVEL_01));
}

export function getNextLevelId(currentId: number): number | null {
  if (currentId >= 20) return null;
  return currentId + 1;
}

export {
  LEVEL_01,
  LEVEL_02,
  LEVEL_03,
  LEVEL_04,
  LEVEL_05,
  LEVEL_06,
  LEVEL_07,
  LEVEL_08,
  LEVEL_09,
  LEVEL_10,
  LEVEL_11,
  LEVEL_12,
  LEVEL_13,
  LEVEL_14,
  LEVEL_15,
  LEVEL_16,
  LEVEL_17,
  LEVEL_18,
  LEVEL_19,
  LEVEL_20,
};
