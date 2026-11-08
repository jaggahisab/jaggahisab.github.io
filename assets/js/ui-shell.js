/* ui-shell.js — bridge-first shell behavior */
(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const tabs     = document.querySelectorAll('[role="tab"]');
  const panels   = document.querySelectorAll('[role="tabpanel"]');
  const tabsWrap = document.querySelector('.tab-bar');

  const bar      = document.getElementById('sticky-summary');
  const barLabel = document.getElementById('sticky-label');
  const barVal   = document.getElementById('sticky-result');
  const root     = document.getElementById('unified-converter');

  /* ---------- State ---------- */
  let lastDetail = {
    ropani: 0, aana: 0, paisa: 0, dam: 0,
    bigha: 0, kattha: 0, dhur: 0, sqft: 0, emi: 0
  };

  /* ---------- Helpers ---------- */
  const primary = (root && root.dataset.primaryUnit) || 'aana';

  const labelMap = {
    ropani: 'रोपनी', aana: 'आना', paisa: 'पैसा', dam: 'दाम',
    bigha: 'बिघा', kattha: 'कट्ठा', dhur: 'धुर', sqft: 'वर्ग फिट',
    emi: 'मासिक किस्ता', interest: 'कुल ब्याज', price: 'कुल मूल्य',
    malpot: 'कुल लागत'
  };

  const fmt    = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  function pickActiveTab() {
    const active = document.querySelector('.tab-bar [aria-selected="true"]');
    return active ? active.dataset.tab : 'converter';
  }

  function renderBar(detail) {
    if (!bar || !barLabel || !barVal) return;
    const tab = pickActiveTab();
    let label = 'नतिजा';
    let value = '—';

    if (tab === 'converter') {
      label = labelMap[primary] || 'नतिजा';
      const units = ['ropani','aana','paisa','dam','bigha','kattha','dhur','sqft'];
      if (units.includes(primary) && detail) {
        const v = detail[primary] || 0;
        value = v ? `${fmt.format(Math.round(v * 100) / 100)} ${labelMap[primary]}` : '—';
      }
    } else if (tab === 'emi') {
      label = 'मासिक किस्ता';
      value = detail && detail.emi ? `रु. ${fmtInt.format(Math.round(detail.emi))}` : '—';
    } else if (tab === 'interest') {
      label = 'कुल ब्याज';
      const t = document.getElementById('resInterestAmount');
      value = t ? t.textContent : '—';
    } else if (tab === 'price') {
      label = 'कुल मूल्य';
      const t = document.getElementById('resTotalPrice');
      value = t ? t.textContent : '—';
    } else if (tab === 'malpot') {
      label = 'कुल लागत';
      const t = document.getElementById('resMalpotTotal');
      value = t ? t.textContent : '—';
    }

    barLabel.textContent = label;
    barVal.textContent   = value;
    bar.classList.remove('is-pulse');
    void bar.offsetWidth;
    bar.classList.add('is-pulse');
  }

  function activateTab(name) {
    const tabArr = Array.from(tabs);
    if (!tabArr.some(t => t.dataset.tab === name)) {
      name = tabArr.length ? tabArr[0].dataset.tab : 'converter';
    }
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.classList.toggle('is-active', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => { p.hidden = p.dataset.panel !== name; });
    renderBar(lastDetail);
  }

  /* ---------- Wire tabs ---------- */
  if (tabsWrap) {
    const defaultTab = tabsWrap.dataset.default || 'converter';
    activateTab(defaultTab);

    tabs.forEach(t => {
      t.addEventListener('click', () => activateTab(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const list = Array.from(tabs);
        const i    = list.indexOf(t);
        const next = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
        next.focus();
        next.click();
      });
    });
  }

  if (!bar || !root) return;

  /* ---------- Subscribe to core updates ---------- */
  document.addEventListener('jaggahisab:update', (e) => {
    lastDetail = e.detail;
    renderBar(e.detail);
  });

  /* ---------- Malpot inputs ---------- */
  document.querySelectorAll('[id^="malpot"]').forEach(el => {
    const handler = () => {
      if (typeof window.calculateMalpot === 'function') window.calculateMalpot();
      renderBar(lastDetail);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });

  if (document.getElementById('malpotPropertyValue')
      && typeof window.calculateMalpot === 'function') {
    window.calculateMalpot();
  }

  renderBar(lastDetail);
})();
