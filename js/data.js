/* =========================================================
   data.js —— 数据配置（v2 优化版：新资本公式 + 资本门槛）
   ========================================================= */

const GAME_VERSION = 2;

/* ---------- 升级项配置 ---------- */
const UPGRADES = {
  /* === 分区1：点击强化 === */
  click: {
    id: 'click', name: '点击核心', desc: '每级提升点击收益（微指数增长）',
    group: 'click', basePrice: 10, priceGrowth: 'log',
    capitalReq: 0, maxLevel: 0, icon: 'icon-plus'
  },
  /* === 分区2：自动生产 === */
  auto: {
    id: 'auto', name: '自动核心', desc: '每级提升自动收益（类对数增长，前期快后期慢）',
    group: 'auto', basePrice: 250, priceGrowth: 'exp',
    capitalReq: 0, maxLevel: 0, icon: 'icon-gear'
  },
  /* === 分区3：倍率强化 === */
  clickMult: {
    id: 'clickMult', name: '指尖共鸣', desc: '点击收益 ×1.08 / 级（乘法叠加）',
    group: 'mult', basePrice: 500, priceGrowth: 1.40,
    capitalReq: 1000, maxLevel: 0, icon: 'icon-core'
  },
  autoMult: {
    id: 'autoMult', name: '能量回路', desc: '自动收益 ×1.08 / 级（乘法叠加）',
    group: 'mult', basePrice: 2000, priceGrowth: 1.40,
    capitalReq: 3000, maxLevel: 0, icon: 'icon-core'
  },
  globalMult: {
    id: 'globalMult', name: '全局增幅', desc: '所有收益 ×1.05 / 级（点击和自动都受益）',
    group: 'mult', basePrice: 10000, priceGrowth: 1.50,
    capitalReq: 20000, maxLevel: 0, icon: 'icon-trophy'
  },
  /* === 分区4：暴击系统 === */
  critRate: {
    id: 'critRate', name: '暴击训练', desc: '暴击率 +1.5% / 级（基础 5%，上限 75%）',
    group: 'crit', basePrice: 300, priceGrowth: 1.30,
    capitalReq: 500, maxLevel: 0, icon: 'icon-check'
  },
  critDmg: {
    id: 'critDmg', name: '暴击强化', desc: '暴击倍率 +0.5x / 级（基础 5x）',
    group: 'crit', basePrice: 800, priceGrowth: 1.30,
    capitalReq: 2000, maxLevel: 0, icon: 'icon-plus'
  },
  /* === 分区5：自动点击器 === */
  autoClicker: {
    id: 'autoClicker', name: '自动点击器', desc: '每秒自动点击 +0.2 次 / 级（享受点击收益、倍率、暴击）',
    group: 'autoClicker', basePrice: 5000, priceGrowth: 1.40,
    capitalReq: 10000, maxLevel: 0, icon: 'icon-gear',
    prereq: 'critRate'
  },
  /* === 分区6：离线强化 === */
  offlineCap: {
    id: 'offlineCap', name: '离线核心', desc: '离线上限 +1 小时 / 级（基础 8 小时）',
    group: 'offline', basePrice: 3000, priceGrowth: 1.35,
    capitalReq: 2000, maxLevel: 0, icon: 'icon-lock'
  },
  offlineEff: {
    id: 'offlineEff', name: '离线效率', desc: '离线收益效率 +10% / 级（基础 100%）',
    group: 'offline', basePrice: 2000, priceGrowth: 1.30,
    capitalReq: 1500, maxLevel: 0, icon: 'icon-coin'
  },
  /* === 分区7：里程碑（一次性） === */
  milestoneBank: {
    id: 'milestoneBank', name: '能量银行', desc: '购买后取消离线收益 8 小时上限，可无限累积',
    group: 'milestone', basePrice: 50000, priceGrowth: 1,
    capitalReq: 50000, maxLevel: 1, icon: 'icon-trophy'
  },
  milestoneDouble: {
    id: 'milestoneDouble', name: '双重核心', desc: '购买后每次点击额外获得 10% 自动收益',
    group: 'milestone', basePrice: 20000, priceGrowth: 1,
    capitalReq: 20000, maxLevel: 1, icon: 'icon-core'
  },
  milestoneSpeed: {
    id: 'milestoneSpeed', name: '时间加速', desc: '购买后自动收益结算频率 100ms → 50ms',
    group: 'milestone', basePrice: 80000, priceGrowth: 1,
    capitalReq: 80000, maxLevel: 1, icon: 'icon-settings'
  },
  /* === 分区8：点击特效 === */
  echoClick: {
    id: 'echoClick', name: '能量回响', desc: '每次点击有 5% × 等级 概率触发双倍点击',
    group: 'clickEffect', basePrice: 1500, priceGrowth: 1.35,
    capitalReq: 1500, maxLevel: 0, icon: 'icon-plus'
  },
  chainClick: {
    id: 'chainClick', name: '连锁点击', desc: '点击时额外获得 当前自动收益 × 等级 的能量',
    group: 'clickEffect', basePrice: 8000, priceGrowth: 1.40,
    capitalReq: 8000, maxLevel: 0, icon: 'icon-core'
  },
  /* === 分区9：被动加成 === */
  shield: {
    id: 'shield', name: '能量护盾', desc: '自动收益 +2% / 级（基于基础自动收益）',
    group: 'passive', basePrice: 2500, priceGrowth: 1.32,
    capitalReq: 3000, maxLevel: 0, icon: 'icon-lock'
  },
  resonance: {
    id: 'resonance', name: '能量共鸣', desc: '点击收益每 100 点，自动收益 +1% × 等级',
    group: 'passive', basePrice: 12000, priceGrowth: 1.45,
    capitalReq: 15000, maxLevel: 0, icon: 'icon-core'
  },
  /* === 分区10：时间类 === */
  timeFlow: {
    id: 'timeFlow', name: '时间流速', desc: '自动收益结算频率 +10% / 级',
    group: 'time', basePrice: 6000, priceGrowth: 1.38,
    capitalReq: 8000, maxLevel: 0, icon: 'icon-settings'
  },
  speedGear: {
    id: 'speedGear', name: '加速齿轮', desc: '投资周期 −2% / 级（最多减 50%）',
    group: 'time', basePrice: 4000, priceGrowth: 1.35,
    capitalReq: 5000, maxLevel: 0, icon: 'icon-gear'
  },
  /* === 分区11：幸运类 === */
  luckyCoin: {
    id: 'luckyCoin', name: '幸运硬币', desc: '投资成功率 + 现有成功率 × 3% / 级',
    group: 'luck', basePrice: 3500, priceGrowth: 1.35,
    capitalReq: 5000, maxLevel: 0, icon: 'icon-coin'
  },
  fateDice: {
    id: 'fateDice', name: '命运骰子', desc: '暴击率额外 + 现有暴击率 × 1% / 级',
    group: 'luck', basePrice: 5000, priceGrowth: 1.40,
    capitalReq: 8000, maxLevel: 0, icon: 'icon-trophy'
  },
  /* === 分区12：转化类 === */
  refine: {
    id: 'refine', name: '能量精炼', desc: '点击时额外把 5% × 等级 的点击收益转入银行存款',
    group: 'convert', basePrice: 7000, priceGrowth: 1.40,
    capitalReq: 10000, maxLevel: 0, icon: 'icon-coin'
  },
  depositBoost: {
    id: 'depositBoost', name: '存款利息强化', desc: '存款利率 + 现有利率 × 10% / 级',
    group: 'convert', basePrice: 9000, priceGrowth: 1.42,
    capitalReq: 12000, maxLevel: 0, icon: 'icon-coin'
  }
};

const UPGRADE_ORDER = Object.keys(UPGRADES);

/* ---------- 商店分区 ---------- */
const SHOP_GROUPS = [
  { key: 'click', name: '点击强化', icon: 'icon-plus', items: ['click'] },
  { key: 'auto', name: '自动生产', icon: 'icon-gear', items: ['auto'] },
  { key: 'mult', name: '倍率强化', icon: 'icon-core', items: ['clickMult', 'autoMult', 'globalMult'] },
  { key: 'crit', name: '暴击系统', icon: 'icon-check', items: ['critRate', 'critDmg'] },
  { key: 'autoClicker', name: '自动点击', icon: 'icon-gear', items: ['autoClicker'] },
  { key: 'offline', name: '离线强化', icon: 'icon-lock', items: ['offlineCap', 'offlineEff'] },
  { key: 'milestone', name: '里程碑', icon: 'icon-trophy', items: ['milestoneBank', 'milestoneDouble', 'milestoneSpeed'] },
  { key: 'clickEffect', name: '点击特效', icon: 'icon-plus', items: ['echoClick', 'chainClick'] },
  { key: 'passive', name: '被动加成', icon: 'icon-core', items: ['shield', 'resonance'] },
  { key: 'time', name: '时间类', icon: 'icon-settings', items: ['timeFlow', 'speedGear'] },
  { key: 'luck', name: '幸运类', icon: 'icon-coin', items: ['luckyCoin', 'fateDice'] },
  { key: 'convert', name: '转化类', icon: 'icon-coin', items: ['refine', 'depositBoost'] }
];

/* ---------- 成就树（20 个，含前置依赖） ---------- */
const ACHIEVEMENTS = {
  firstClick: {
    id: 'firstClick', name: '第一次触碰', desc: '点击能量核心 1 次',
    icon: 'icon-check', parent: null,
    cond: s => s.clickCount >= 1,
    progress: s => [s.clickCount, 1]
  },
  click100: {
    id: 'click100', name: '手速不错', desc: '点击能量核心 100 次',
    icon: 'icon-plus', parent: 'firstClick',
    cond: s => s.clickCount >= 100,
    progress: s => [s.clickCount, 100]
  },
  click1000: {
    id: 'click1000', name: '点击狂人', desc: '点击能量核心 1000 次',
    icon: 'icon-plus', parent: 'click100',
    cond: s => s.clickCount >= 1000,
    progress: s => [s.clickCount, 1000]
  },
  click10000: {
    id: 'click10000', name: '点击大师', desc: '点击能量核心 10000 次',
    icon: 'icon-trophy', parent: 'click1000',
    cond: s => s.clickCount >= 10000,
    progress: s => [s.clickCount, 10000]
  },
  energy100: {
    id: 'energy100', name: '小有积蓄', desc: '累计获得 100 能量',
    icon: 'icon-coin', parent: 'firstClick',
    cond: s => s.totalEnergy >= 100,
    progress: s => [s.totalEnergy, 100]
  },
  energy10000: {
    id: 'energy10000', name: '能量新星', desc: '累计获得 10000 能量',
    icon: 'icon-core', parent: 'energy100',
    cond: s => s.totalEnergy >= 10000,
    progress: s => [s.totalEnergy, 10000]
  },
  energyMillion: {
    id: 'energyMillion', name: '能量大亨', desc: '累计获得 1,000,000 能量',
    icon: 'icon-trophy', parent: 'energy10000',
    cond: s => s.totalEnergy >= 1000000,
    progress: s => [s.totalEnergy, 1000000]
  },
  energyBillion: {
    id: 'energyBillion', name: '能量之神', desc: '累计获得 100,000,000 能量',
    icon: 'icon-trophy', parent: 'energyMillion',
    cond: s => s.totalEnergy >= 100000000,
    progress: s => [s.totalEnergy, 100000000]
  },
  firstAuto: {
    id: 'firstAuto', name: '自动化开始', desc: '购买任意自动生产升级',
    icon: 'icon-gear', parent: 'firstClick',
    cond: s => (s.upgrades.auto || 0) + (s.upgrades.autoMult || 0) + (s.upgrades.autoClicker || 0) >= 1,
    progress: s => [(s.upgrades.auto || 0) + (s.upgrades.autoMult || 0) + (s.upgrades.autoClicker || 0), 1]
  },
  auto10: {
    id: 'auto10', name: '稳定输出', desc: '自动收益达到 10/秒',
    icon: 'icon-gear', parent: 'firstAuto',
    cond: s => s.autoPower >= 10,
    progress: s => [s.autoPower, 10]
  },
  auto1000: {
    id: 'auto1000', name: '自动帝国', desc: '自动收益达到 1000/秒',
    icon: 'icon-core', parent: 'auto10',
    cond: s => s.autoPower >= 1000,
    progress: s => [s.autoPower, 1000]
  },
  collector: {
    id: 'collector', name: '收藏家', desc: '所有升级总等级达到 10',
    icon: 'icon-achievement', parent: 'firstClick',
    cond: s => getTotalLevels(s.upgrades) >= 10,
    progress: s => [getTotalLevels(s.upgrades), 10]
  },
  allCollector: {
    id: 'allCollector', name: '全收集', desc: '所有升级都至少 1 级',
    icon: 'icon-trophy', parent: 'collector',
    cond: s => {
      for (let i = 0; i < UPGRADE_ORDER.length; i++) {
        if ((s.upgrades[UPGRADE_ORDER[i]] || 0) < 1) return false;
      }
      return true;
    },
    progress: s => {
      let n = 0;
      for (let i = 0; i < UPGRADE_ORDER.length; i++) {
        if ((s.upgrades[UPGRADE_ORDER[i]] || 0) >= 1) n++;
      }
      return [n, UPGRADE_ORDER.length];
    }
  },
  grandCollector: {
    id: 'grandCollector', name: '大师收藏家', desc: '所有升级总等级达到 100',
    icon: 'icon-trophy', parent: 'allCollector',
    cond: s => getTotalLevels(s.upgrades) >= 100,
    progress: s => [getTotalLevels(s.upgrades), 100]
  },
  firstDeposit: {
    id: 'firstDeposit', name: '第一次存款', desc: '在银行存入任意金额',
    icon: 'icon-coin', parent: 'firstClick',
    cond: s => (s.bank && s.bank.deposit > 0),
    progress: s => [(s.bank && s.bank.deposit > 0) ? 1 : 0, 1]
  },
  firstInvest: {
    id: 'firstInvest', name: '第一次投资', desc: '完成 1 次投资',
    icon: 'icon-coin', parent: 'firstDeposit',
    cond: s => (s.investCount || 0) >= 1,
    progress: s => [s.investCount || 0, 1]
  },
  investMaster: {
    id: 'investMaster', name: '投资大师', desc: '完成 10 次投资',
    icon: 'icon-trophy', parent: 'firstInvest',
    cond: s => (s.investCount || 0) >= 10,
    progress: s => [s.investCount || 0, 10]
  },
  financeMogul: {
    id: 'financeMogul', name: '金融大亨', desc: '资本达到 1,000,000',
    icon: 'icon-trophy', parent: 'investMaster',
    cond: s => calcCapital(s) >= 1000000,
    progress: s => [calcCapital(s), 1000000]
  },
  firstCrit: {
    id: 'firstCrit', name: '第一次暴击', desc: '触发 1 次暴击',
    icon: 'icon-check', parent: 'firstClick',
    cond: s => (s.critCount || 0) >= 1,
    progress: s => [s.critCount || 0, 1]
  },
  critMaster: {
    id: 'critMaster', name: '暴击达人', desc: '触发 100 次暴击',
    icon: 'icon-trophy', parent: 'firstCrit',
    cond: s => (s.critCount || 0) >= 100,
    progress: s => [s.critCount || 0, 100]
  }
};

const ACHIEVEMENT_ORDER = [
  'firstClick',
  'click100', 'click1000', 'click10000',
  'energy100', 'energy10000', 'energyMillion', 'energyBillion',
  'firstAuto', 'auto10', 'auto1000',
  'collector', 'allCollector', 'grandCollector',
  'firstDeposit', 'firstInvest', 'investMaster', 'financeMogul',
  'firstCrit', 'critMaster'
];

/* ---------- 投资配置 ---------- */
const INVESTMENTS = {
  safe: {
    id: 'safe', name: '稳健理财', desc: '无风险，收益稳定',
    capitalReq: 0, minAmount: 100, maxAmount: 10000,
    duration: 60, minReturn: 0.05, maxReturn: 0.08,
    lossChance: 0, maxLoss: 0, icon: 'icon-coin'
  },
  balanced: {
    id: 'balanced', name: '平衡基金', desc: '低风险，中等收益',
    capitalReq: 5000, minAmount: 1000, maxAmount: 100000,
    duration: 120, minReturn: 0.08, maxReturn: 0.15,
    lossChance: 0.05, maxLoss: 0.05, icon: 'icon-coin'
  },
  stock: {
    id: 'stock', name: '激进股票', desc: '中风险，高收益',
    capitalReq: 20000, minAmount: 5000, maxAmount: 500000,
    duration: 180, minReturn: 0.15, maxReturn: 0.4,
    lossChance: 0.15, maxLoss: 0.2, icon: 'icon-trophy'
  },
  large: {
    id: 'large', name: '大额投资', desc: '高风险，超高收益',
    capitalReq: 100000, minAmount: 50000, maxAmount: 5000000,
    duration: 300, minReturn: 0.3, maxReturn: 0.8,
    lossChance: 0.25, maxLoss: 0.3, icon: 'icon-trophy'
  }
};

/* ---------- 银行配置 ---------- */
const BANK_CONFIG = {
  baseDepositRate: 0.00001,
  baseLoanRate: 0.00002,
  loanCapitalRatio: 0.5,
  loanRepayPercent: 0.1
};

/* =========================================================
   计算公式
   ========================================================= */

function calcClickBonus(level) {
  if (level <= 0) return 0;
  return (Math.pow(1.02, level) - 1) / 0.02;
}

function calcAutoBonus(level) {
  if (level <= 0) return 0;
  let sum = 0;
  for (let i = 1; i <= level; i++) {
    sum += 1 / (1 + 0.04 * (i - 1));
  }
  return sum;
}

function getUpgradePrice(id, level) {
  const u = UPGRADES[id];
  if (!u) return Infinity;
  if (u.maxLevel > 0 && level >= u.maxLevel) return Infinity;
  if (u.priceGrowth === 'log') {
    return Math.floor(u.basePrice * Math.pow(1 + level * 0.15, 1.8));
  } else if (u.priceGrowth === 'exp') {
    return Math.floor(u.basePrice * Math.pow(1.15, level));
  } else {
    return Math.floor(u.basePrice * Math.pow(u.priceGrowth, level));
  }
}

function calcClickPower(upgrades) {
  if (!upgrades) return 1;
  let base = 1 + calcClickBonus(upgrades.click || 0);
  base *= Math.pow(1.08, upgrades.clickMult || 0);
  base *= Math.pow(1.05, upgrades.globalMult || 0);
  return base;
}

function calcAutoPower(upgrades) {
  if (!upgrades) return 0;
  let base = calcAutoBonus(upgrades.auto || 0);
  base *= Math.pow(1.08, upgrades.autoMult || 0);
  base *= Math.pow(1.05, upgrades.globalMult || 0);
  base *= (1 + 0.02 * (upgrades.shield || 0));
  let cp = calcClickPower(upgrades);
  let resonanceBonus = Math.floor(cp / 100) * 0.01 * (upgrades.resonance || 0);
  base *= (1 + resonanceBonus);
  return base;
}

function calcCritRate(upgrades) {
  if (!upgrades) return 0.05;
  let rate = 0.05 + 0.015 * (upgrades.critRate || 0);
  rate *= (1 + 0.01 * (upgrades.fateDice || 0));
  return Math.min(rate, 0.75);
}

function calcCritDmg(upgrades) {
  if (!upgrades) return 5;
  return 5 + 0.5 * (upgrades.critDmg || 0);
}

function calcAutoClickRate(upgrades) {
  if (!upgrades) return 0;
  return 0.2 * (upgrades.autoClicker || 0);
}

function calcOfflineCap(upgrades) {
  if (!upgrades) return 8;
  if ((upgrades.milestoneBank || 0) >= 1) return Infinity;
  return 8 + (upgrades.offlineCap || 0);
}

function calcOfflineEff(upgrades) {
  if (!upgrades) return 1;
  return 1 + 0.1 * (upgrades.offlineEff || 0);
}

function calcTickInterval(upgrades) {
  if (!upgrades) return 100;
  if ((upgrades.milestoneSpeed || 0) >= 1) return 50;
  let freq = 1 + 0.1 * (upgrades.timeFlow || 0);
  return Math.max(20, 100 / freq);
}

function calcInvestDurationFactor(upgrades) {
  if (!upgrades) return 1;
  let reduce = Math.min(0.02 * (upgrades.speedGear || 0), 0.5);
  return 1 - reduce;
}

function calcInvestLuckBonus(upgrades) {
  if (!upgrades) return 1;
  return 1 + 0.03 * (upgrades.luckyCoin || 0);
}

function calcDepositRate(upgrades) {
  let rate = BANK_CONFIG.baseDepositRate;
  if (upgrades) {
    rate *= (1 + 0.1 * (upgrades.depositBoost || 0));
  }
  return rate;
}

function calcLoanRate(amount, capital) {
  let baseRate = BANK_CONFIG.baseLoanRate;
  let amountFactor = 1 + amount / 100000;
  let capFactor = 1 + 50000 / (capital + 1);
  return baseRate * amountFactor * capFactor;
}

function calcRefinePercent(upgrades) {
  if (!upgrades) return 0;
  return 0.05 * (upgrades.refine || 0);
}

function getTotalLevels(upgrades) {
  if (!upgrades) return 0;
  let sum = 0;
  for (let i = 0; i < UPGRADE_ORDER.length; i++) {
    sum += upgrades[UPGRADE_ORDER[i]] || 0;
  }
  return sum;
}

/* =========================================================
   资本公式（v2 优化版）
   资本 = 存款 + 投资中本金 + 能量×0.1
        + 总升级等级×50×0.3 + 成就数×20 - 欠款×3
   ========================================================= */

function calcCapital(save) {
  if (!save) return 0;

  const deposit = (save.bank && save.bank.deposit) || 0;
  const loan = (save.bank && save.bank.loan) || 0;

  /* 投资中的本金 */
  let investingAmount = 0;
  if (Array.isArray(save.investments)) {
    for (let i = 0; i < save.investments.length; i++) {
      investingAmount += save.investments[i].amount || 0;
    }
  }

  /* 购买力：总等级 × 50 × 0.3 */
  const power = getTotalLevels(save.upgrades) * 50 * 0.3;

  /* 成就影响力：每个 × 20 */
  const influence = countUnlocked(save) * 20;

  const capital = deposit
    + investingAmount
    + save.energy * 0.1
    + power
    + influence
    - loan * 3;

  return Math.max(0, capital);
}

/* 最大贷款额度（不含扣欠款部分） */
function calcMaxLoan(save) {
  if (!save) return 0;

  const deposit = (save.bank && save.bank.deposit) || 0;
  const loan = (save.bank && save.bank.loan) || 0;

  let investingAmount = 0;
  if (Array.isArray(save.investments)) {
    for (let i = 0; i < save.investments.length; i++) {
      investingAmount += save.investments[i].amount || 0;
    }
  }

  const power = getTotalLevels(save.upgrades) * 50 * 0.3;
  const influence = countUnlocked(save) * 20;

  const baseCapital = deposit + investingAmount + save.energy * 0.1 + power + influence;

  const maxLoan = baseCapital * BANK_CONFIG.loanCapitalRatio - loan;
  return Math.max(0, maxLoan);
}

/* 前置升级检查 */
function checkUpgradePrereq(save, id) {
  const u = UPGRADES[id];
  if (!u) return false;
  if (u.prereq && (save.upgrades[u.prereq] || 0) < 1) return false;
  return true;
}
/* =========================================================
   资本称号（段位系统）
   ========================================================= */
const CAPITAL_TITLES = [
  { min: 0,           name: '无名学徒', color: '#8ea0bd', icon: 'icon-core' },
  { min: 1000,        name: '初级工匠', color: '#3ddc97', icon: 'icon-plus' },
  { min: 5000,        name: '能量技师', color: '#3ddc97', icon: 'icon-gear' },
  { min: 10000,       name: '能量专家', color: '#22b3ff', icon: 'icon-gear' },
  { min: 50000,       name: '能量大师', color: '#22b3ff', icon: 'icon-check' },
  { min: 100000,      name: '能量宗师', color: '#a06bff', icon: 'icon-trophy' },
  { min: 500000,      name: '能量巨匠', color: '#a06bff', icon: 'icon-trophy' },
  { min: 1000000,     name: '能量大亨', color: '#f5c542', icon: 'icon-trophy' },
  { min: 5000000,     name: '能量领主', color: '#f5c542', icon: 'icon-trophy' },
  { min: 10000000,    name: '能量帝王', color: '#ff5a6a', icon: 'icon-trophy' },
  { min: 50000000,    name: '能量主宰', color: '#ff5a6a', icon: 'icon-trophy' },
  { min: 100000000,   name: '传奇',     color: '#ff2e88', icon: 'icon-trophy' },
  { min: 500000000,   name: '神话',     color: '#ff2e88', icon: 'icon-trophy' },
  { min: 1000000000,  name: '宇宙之主', color: '#ffffff', icon: 'icon-trophy' }
];

/** 根据资本返回当前称号 */
function getCapitalTitle(capital) {
  let result = CAPITAL_TITLES[0];
  for (let i = 0; i < CAPITAL_TITLES.length; i++) {
    if (capital >= CAPITAL_TITLES[i].min) result = CAPITAL_TITLES[i];
  }
  return result;
}

/** 获取下一个称号（已是最高则返回 null） */
function getNextCapitalTitle(capital) {
  for (let i = 0; i < CAPITAL_TITLES.length; i++) {
    if (capital < CAPITAL_TITLES[i].min) return CAPITAL_TITLES[i];
  }
  return null;
}
/* =========================================================
   玩家 ID 系统
   ========================================================= */

/* 系统保留 ID（虚拟玩家名字），玩家不能使用 */
const RESERVED_IDS = [
  '宇宙之主', '星尘', '暗夜行者', '闪电', '银河', '风', '老王',
  '路人甲', '土豪', '张三', '李四', '王五', '六六', '七七', '八八',
  '九九', '零零', '初心者', '萌新', '菜鸟',
  'admin', 'root', 'system', 'player', '你'
];

/** 生成一个随机玩家 ID：player + 4 位数字 */
function generateRandomId() {
  let id;
  let tries = 0;
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    id = 'player' + num;
    tries++;
  } while (RESERVED_IDS.indexOf(id) >= 0 && tries < 20);
  return id;
}

/** 校验玩家 ID 是否合法：2-12 字符，字母/数字/下划线/中文 */
function isValidPlayerId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 2 || trimmed.length > 12) return false;
  if (!/^[\w\u4e00-\u9fa5]+$/.test(trimmed)) return false;
  return true;
}

/** 是否与保留 ID 重名 */
function isReservedId(id) {
  if (!id) return false;
  return RESERVED_IDS.indexOf(String(id).trim()) >= 0;
}