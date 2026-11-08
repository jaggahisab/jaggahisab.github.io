/* ui-shell.js — bridge-first shell behavior */
(function () {
  'use strict';

  /* ---------- Tab router (only used on pages with tabs) ---------- */
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');
  const tabsWrap = document.querySelector('.tab-bar');

  function activateTab(name) {
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.classList.toggle('is-active', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => { p.hidden = p.dataset.panel !== name; });
  }

  if (tabsWrap) {
    const defaultTab = tabsWrap.dataset.default || 'converter';
    activateTab(defaultTab);
    tabs.forEach(t => {
      t.addEventListener('click', () => activateTab(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const list = Array.from(tabs);
          const i = list.indexOf(t);
          const next = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
          next.focus(); next.click();
        }
      });
    });
  }

  /* ---------- Sticky bar ---------- */
  const bar = document.getElementById('sticky-summary');
  const barLabel = document.getElementById('sticky-label');
  const barVal = document.getElementById('sticky-result');
  const root = document.getElementById('unified-converter');
  if (!bar || !root) return;

  const primary = root.dataset.primaryUnit || 'aana';
  const labelMap = {
    ropani: 'रोपनी', aana: 'आना', paisa: 'पैसा', dam: 'दाम',
    bigha: 'बिघा', kattha: 'कट्ठा', dhur: 'धुर', sqft: 'वर्ग फिट',
    emi: 'मासिक किस्ता', interest: 'कुल ब्याज', price: 'कुल मूल्य'
  };
  const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  function pickActiveTab() {
    const active = document.querySelector('.tab-bar [aria-selected="true"]');
    return active ? active.dataset.tab : 'converter';
  }

  function renderBar(detail) {
    const tab = pickActiveTab();
    let label = 'नतिजा';
    let value = '—';

    if (tab === 'converter') {
      label = labelMap[primary] || 'नतिजा';
      const units = ['ropani','aana','paisa','dam','bigha','kattha','dhur','sqft'];
      if (units.includes(primary)) {
        const v = detail[primary] || 0;
        value = v ? `${fmt.format(Math.round(v * 100) / 100)} ${labelMap[primary]}` : '—';
      }
    } else if (tab === 'emi') {
      label = 'मासिक किस्ता';
      value = detail.emi ? `रु. ${fmtInt.format(Math.round(detail.emi))}` : '—';
    } else if (tab === 'interest') {
      label = 'कुल ब्याज';
      const t = document.getElementById('resInterestAmount');
      value = t ? t.textContent : '—';
    } else if (tab === 'price') {
      label = 'कुल मूल्य';
      const t = document.getElementById('resTotalPrice');
      value = t ? t.textContent : '—';
    }
    barLabel.textContent = label;
    barVal.textContent = value;
    bar.classList.remove('is-pulse');
    void bar.offsetWidth;
    bar.classList.add('is-pulse');
  }

  document.addEventListener('jaggahisab:update', e => renderBar(e.detail));

  /* Attach to inputs so typed-but-unchanged fields still pulse */
  document.querySelectorAll('#unified-converter input, #unified-converter select')
    .forEach(el => el.addEventListener('input', () => {
      /* updateOutputs already dispatches, but this ensures pulse even if value unchanged */
    }));

  /* Initial paint */
  renderBar({ ropani: 0, aana: 0, paisa: 0, dam: 0, bigha: 0, kattha: 0, dhur: 0, sqft: 0 });
})();
