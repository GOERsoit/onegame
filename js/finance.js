/* =========================================================
   finance.js —— 金融页逻辑（银行 + 投资）
   ========================================================= */
(function () {

  /* ---------- 读取存档 ---------- */
  const save = loadGame();
  renderNavEnergy(save.energy);

  /* ---------- 元素引用 ---------- */
  const capitalGrid = document.getElementById('capitalGrid');

  const depositAmount = document.getElementById('depositAmount');
  const depositRate = document.getElementById('depositRate');
  const depositInput = document.getElementById('depositInput');
  const withdrawInput = document.getElementById('withdrawInput');
  const btnDeposit = document.getElementById('btnDeposit');
  const btnWithdraw = document.getElementById('btnWithdraw');
  const btnDepositAll = document.getElementById('btnDepositAll');
  const btnWithdrawAll = document.getElementById('btnWithdrawAll');

  const loanAmount = document.getElementById('loanAmount');
  const loanRate = document.getElementById('loanRate');
  const loanMax = document.getElementById('loanMax');
  const loanInput = document.getElementById('loanInput');
  const repayInput = document.getElementById('repayInput');
  const btnLoan = document.getElementById('btnLoan');
  const btnRepay = document.getElementById('btnRepay');
  const btnRepayAll = document.getElementById('btnRepayAll');

  const investGrid = document.getElementById('investGrid');
  const investList = document.getElementById('investList');

  /* ---------- 资本总览渲染 ---------- */
  function renderCapital() {
    const deposit = save.bank.deposit;
    const energy = save.energy;
    const power = (function () {
      let sum = 0;
      for (let i = 0; i < UPGRADE_ORDER.length; i++) {
        sum += (save.upgrades[UPGRADE_ORDER[i]] || 0) *
               (UPGRADES[UPGRADE_ORDER[i]].capitalPerLevel || 0);
      }
      return sum;
    })();
    const influence = countUnlocked(save) * 500;
    const loan = save.bank.loan;
    const capital = calcCapital(save);

    capitalGrid.innerHTML =
      '<div class="capital-item"><div class="summary-label">存款</div>' +
        '<div class="summary-value">' + formatNumber(deposit) + '</div></div>' +
      '<div class="capital-item"><div class="summary-label">当前能量</div>' +
        '<div class="summary-value">' + formatNumber(energy) + '</div></div>' +
      '<div class="capital-item"><div class="summary-label">购买力</div>' +
        '<div class="summary-value">' + formatNumber(power) + '</div></div>' +
      '<div class="capital-item"><div class="summary-label">影响力</div>' +
        '<div class="summary-value">' + formatNumber(influence) + '</div></div>' +
      '<div class="capital-item danger-text"><div class="summary-label">欠款×10</div>' +
        '<div class="summary-value">-' + formatNumber(loan * 10) + '</div></div>' +
      '<div class="capital-item accent"><div class="summary-label">资本</div>' +
        '<div class="summary-value">' + formatNumber(capital) + '</div></div>';
  }

  /* ---------- 银行渲染 ---------- */
  function renderBank() {
    depositAmount.textContent = formatNumber(save.bank.deposit);
    const rate = calcDepositRate(save.upgrades);
    const perSec = save.bank.deposit * rate;
    depositRate.textContent = formatNumber(perSec) + ' / 秒';

    loanAmount.textContent = formatNumber(save.bank.loan);
    const lrate = save.bank.loan > 0
      ? calcLoanRate(save.bank.loan, calcCapital(save) + save.bank.loan * 10)
      : calcLoanRate(0, calcCapital(save));
    loanRate.textContent = (lrate * 100).toFixed(4) + '% / 秒';
    loanMax.textContent = formatNumber(calcMaxLoan(save));
  }

  /* ---------- 银行操作 ---------- */
  function getInputNumber(el) {
    const v = Number(el.value);
    if (!isFinite(v) || v <= 0) return 0;
    return Math.floor(v);
  }

  function clearInputs() {
    depositInput.value = '';
    withdrawInput.value = '';
    loanInput.value = '';
    repayInput.value = '';
  }

  btnDeposit.addEventListener('click', function () {
    const amt = getInputNumber(depositInput);
    if (amt <= 0) { notify('请输入有效的存款金额', 'error'); return; }
    if (save.energy < amt) { notify('能量不足', 'error'); return; }
    save.energy -= amt;
    save.bank.deposit += amt;
    saveGame(save);
    refreshAll();
    clearInputs();
    notify('已存入 ' + formatNumber(amt), 'success');
    handleAchievements(save);
    refreshAll();
  });

  btnWithdraw.addEventListener('click', function () {
    const amt = getInputNumber(withdrawInput);
    if (amt <= 0) { notify('请输入有效的取出金额', 'error'); return; }
    if (save.bank.deposit < amt) { notify('存款不足', 'error'); return; }
    save.bank.deposit -= amt;
    save.energy += amt;
    saveGame(save);
    refreshAll();
    clearInputs();
    notify('已取出 ' + formatNumber(amt), 'success');
  });

  btnDepositAll.addEventListener('click', function () {
    if (save.energy <= 0) { notify('没有可存入的能量', 'error'); return; }
    const amt = Math.floor(save.energy);
    save.bank.deposit += amt;
    save.energy -= amt;
    saveGame(save);
    refreshAll();
    notify('已全部存入 ' + formatNumber(amt), 'success');
    handleAchievements(save);
    refreshAll();
  });

  btnWithdrawAll.addEventListener('click', function () {
    if (save.bank.deposit <= 0) { notify('没有可取出的存款', 'error'); return; }
    const amt = Math.floor(save.bank.deposit);
    save.energy += amt;
    save.bank.deposit = 0;
    saveGame(save);
    refreshAll();
    notify('已全部取出 ' + formatNumber(amt), 'success');
  });

  btnLoan.addEventListener('click', function () {
    const amt = getInputNumber(loanInput);
    if (amt <= 0) { notify('请输入有效的借款金额', 'error'); return; }
    const maxLoan = calcMaxLoan(save);
    if (amt > maxLoan) {
      notify('超出可贷额度，最多可借 ' + formatNumber(maxLoan), 'error');
      return;
    }
    save.bank.loan += amt;
    save.energy += amt;
    saveGame(save);
    refreshAll();
    clearInputs();
    notify('已借款 ' + formatNumber(amt), 'error');
  });

  btnRepay.addEventListener('click', function () {
    const amt = getInputNumber(repayInput);
    if (amt <= 0) { notify('请输入有效的还款金额', 'error'); return; }
    if (save.bank.loan <= 0) { notify('没有欠款需要偿还', 'error'); return; }
    const actual = Math.min(amt, save.bank.loan);
    if (save.energy < actual) { notify('能量不足，无法还这么多', 'error'); return; }
    save.energy -= actual;
    save.bank.loan -= actual;
    saveGame(save);
    refreshAll();
    clearInputs();
    notify('已还款 ' + formatNumber(actual), 'success');
  });

  btnRepayAll.addEventListener('click', function () {
    if (save.bank.loan <= 0) { notify('没有欠款需要偿还', 'error'); return; }
    const actual = Math.min(save.energy, save.bank.loan);
    if (actual <= 0) { notify('能量不足，无法还款', 'error'); return; }
    save.energy -= actual;
    save.bank.loan -= actual;
    saveGame(save);
    refreshAll();
    notify('已还款 ' + formatNumber(actual), 'success');
  });

  /* ---------- 投资渲染 ---------- */
  function renderInvest() {
    const capital = calcCapital(save);
    let html = '';

    const keys = ['safe', 'balanced', 'stock', 'large'];
    for (let i = 0; i < keys.length; i++) {
      const inv = INVESTMENTS[keys[i]];
      const unlocked = capital >= inv.capitalReq;
      const canAffordMin = save.energy >= inv.minAmount;
      const durFactor = calcInvestDurationFactor(save.upgrades);
      const actualDuration = Math.floor(inv.duration * durFactor);

      html +=
        '<div class="invest-card' + (unlocked ? '' : ' locked') + '">' +
          '<div class="invest-icon"><span class="icon ' + inv.icon + '"></span></div>' +
          '<div class="invest-body">' +
            '<div class="invest-head"><h3>' + inv.name + '</h3>' +
              (unlocked ? '' : '<span class="badge">需资本 ' + formatNumber(inv.capitalReq) + '</span>') +
            '</div>' +
            '<p class="invest-desc">' + inv.desc + '</p>' +
            '<div class="invest-meta">' +
              '投入范围：' + formatNumber(inv.minAmount) + ' ~ ' + formatNumber(inv.maxAmount) + '<br>' +
              '周期：' + actualDuration + ' 秒　回报：' +
              Math.round(inv.minReturn * 100) + '% ~ ' + Math.round(inv.maxReturn * 100) +
              (inv.lossChance > 0 ? '　亏损概率：' + Math.round(inv.lossChance * 100) + '%' : '　无风险') +
            '</div>' +
            '<div class="invest-input-row">' +
              '<input class="input invest-input" type="number" min="0" ' +
                'placeholder="投入金额" data-inv="' + inv.id + '"' +
                (unlocked ? '' : ' disabled') + '>' +
              '<button class="btn btn-primary invest-btn" data-inv="' + inv.id + '"' +
                (unlocked && canAffordMin ? '' : ' disabled') + '>投资</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    investGrid.innerHTML = html;

    const buttons = investGrid.querySelectorAll('.invest-btn');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        const id = this.getAttribute('data-inv');
        doInvest(id);
      });
    }
  }

  /* ---------- 执行投资 ---------- */
  function doInvest(id) {
    const inv = INVESTMENTS[id];
    if (!inv) return;
    const capital = calcCapital(save);
    if (capital < inv.capitalReq) {
      notify('资本不足，无法进行该投资', 'error');
      return;
    }
    const input = investGrid.querySelector('input[data-inv="' + id + '"]');
    let amt = Number(input ? input.value : 0);
    if (!isFinite(amt) || amt <= 0) { notify('请输入有效的投入金额', 'error'); return; }
    amt = Math.floor(amt);
    if (amt < inv.minAmount) {
      notify('最低投入 ' + formatNumber(inv.minAmount), 'error');
      return;
    }
    if (amt > inv.maxAmount) {
      notify('最高投入 ' + formatNumber(inv.maxAmount), 'error');
      return;
    }
    if (save.energy < amt) { notify('能量不足', 'error'); return; }

    save.energy -= amt;
    const durFactor = calcInvestDurationFactor(save.upgrades);
    const duration = Math.floor(inv.duration * durFactor);
    save.investments.push({
      id: 'inv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: id,
      amount: amt,
      startTime: Date.now(),
      duration: duration
    });
    saveGame(save);
    refreshAll();
    notify('投资成功：' + inv.name + '，' + duration + ' 秒后结算', 'success');
    handleAchievements(save);
    refreshAll();
  }

  /* ---------- 进行中的投资列表 ---------- */
  function renderInvestList() {
    if (!save.investments || save.investments.length === 0) {
      investList.innerHTML = '<p class="hint">暂无进行中的投资。</p>';
      return;
    }
    let html = '';
    const now = Date.now();
    for (let i = 0; i < save.investments.length; i++) {
      const it = save.investments[i];
      const inv = INVESTMENTS[it.type];
      if (!inv) continue;
      const elapsed = (now - it.startTime) / 1000;
      const remain = Math.max(0, it.duration - elapsed);
      const progress = Math.min(100, (elapsed / it.duration) * 100);

      html +=
        '<div class="invest-active">' +
          '<div class="invest-active-head">' +
            '<strong>' + inv.name + '</strong>' +
            '<span class="badge">' + formatNumber(it.amount) + '</span>' +
          '</div>' +
          '<div class="invest-progress"><div class="invest-progress-bar" style="width:' +
            progress.toFixed(1) + '%"></div></div>' +
          '<div class="invest-active-foot">' +
            '<span>剩余 ' + Math.ceil(remain) + ' 秒</span>' +
            '<button class="btn btn-ghost invest-cancel" data-id="' + it.id + '">取消（损失 10%）</button>' +
          '</div>' +
        '</div>';
    }
    investList.innerHTML = html;

    const btns = investList.querySelectorAll('.invest-cancel');
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        cancelInvest(this.getAttribute('data-id'));
      });
    }
  }

  /* ---------- 取消投资 ---------- */
  function cancelInvest(id) {
    const idx = save.investments.findIndex(function (x) { return x.id === id; });
    if (idx < 0) return;
    const it = save.investments[idx];
    const refund = Math.floor(it.amount * 0.9);
    save.energy += refund;
    save.investments.splice(idx, 1);
    saveGame(save);
    refreshAll();
    notify('已取消投资，返还 ' + formatNumber(refund), 'error');
  }

  /* ---------- 结算投资（每秒检查） ---------- */
  function settleInvestments() {
    if (!save.investments || save.investments.length === 0) return;
    const now = Date.now();
    let changed = false;
    let remaining = [];

    for (let i = 0; i < save.investments.length; i++) {
      const it = save.investments[i];
      const inv = INVESTMENTS[it.type];
      if (!inv) continue;
      const elapsed = (now - it.startTime) / 1000;
      if (elapsed >= it.duration) {
        /* 结算 */
        let result;
        const luckBonus = calcInvestLuckBonus(save.upgrades);
        const lossRoll = Math.random();
        const effectiveLossChance = inv.lossChance / luckBonus;

        if (inv.lossChance > 0 && lossRoll < effectiveLossChance) {
          /* 亏损：随机损失 20% ~ 100% 的 maxLoss */
          const lossFactor = (0.2 + Math.random() * 0.8) * inv.maxLoss;
          const loss = Math.floor(it.amount * lossFactor);
          result = -loss;
        } else {
          /* 盈利：在 min ~ max 之间随机 */
          const rate = inv.minReturn + Math.random() * (inv.maxReturn - inv.minReturn);
          const gain = Math.floor(it.amount * rate);
          result = gain;
        }

        save.energy += it.amount + result;
        save.totalEnergy += Math.max(0, result);
        save.investCount = (save.investCount || 0) + 1;

        if (result >= 0) {
          notify(inv.name + ' 结算：+' + formatNumber(result), 'success');
        } else {
          notify(inv.name + ' 结算：' + formatNumber(result), 'error');
        }
        changed = true;
      } else {
        remaining.push(it);
      }
    }

    if (changed) {
      save.investments = remaining;
      saveGame(save);
      handleAchievements(save);
    }
  }

  /* ---------- 银行利息结算 ---------- */
  function tickBank() {
    /* 存款利息 */
    if (save.bank.deposit > 0) {
      const rate = calcDepositRate(save.upgrades);
      save.bank.deposit += save.bank.deposit * rate;
    }
    /* 贷款利息 */
    if (save.bank.loan > 0) {
      const cap = calcCapital(save) + save.bank.loan * 10;
      const lrate = calcLoanRate(save.bank.loan, cap);
      save.bank.loan += save.bank.loan * lrate;
    }
  }

  /* ---------- 全局刷新 ---------- */
  function refreshAll() {
    renderCapital();
    renderBank();
    renderInvest();
    renderInvestList();
    renderNavEnergy(save.energy);
  }

  /* ---------- 主循环：每秒 ---------- */
  setInterval(function () {
    tickBank();
    settleInvestments();
    refreshAll();
  }, 1000);

  /* ---------- 每 5 秒保存 ---------- */
  setInterval(function () {
    saveGame(save);
  }, 5000);

  window.addEventListener('beforeunload', function () {
    saveGame(save);
  });

  /* ---------- 启动 ---------- */
  refreshAll();
})();