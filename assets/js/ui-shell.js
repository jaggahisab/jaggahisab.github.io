/* ui-shell.js — bridge-first shell behavior */
(function () {
  'use strict';

  var tabs     = document.querySelectorAll('[role="tab"]');
  var panels   = document.querySelectorAll('[role="tabpanel"]');
  var tabsWrap = document.querySelector('.tab-bar');

  var bar      = document.getElementById('sticky-summary');
  var barLabel = document.getElementById('sticky-label');
  var barVal   = document.getElementById('sticky-result');
  var root     = document.getElementById('unified-converter');

  var lastDetail = {
    ropani: 0, aana: 0, paisa: 0, dam: 0,
    bigha: 0, kattha: 0, dhur: 0, sqft: 0, emi: 0
  };

  var primary = (root && root.getAttribute('data-primary-unit')) || 'aana';

  var labelMap = {
    ropani: 'रोपनी', aana: 'आना', paisa: 'पैसा', dam: 'दाम',
    bigha: 'बिघा', kattha: 'कट्ठा', dhur: 'धुर', sqft: 'वर्ग फिट',
    emi: 'मासिक किस्ता', interest: 'कुल ब्याज', price: 'कुल मूल्य',
    malpot: 'कुल लागत'
  };

  var fmt    = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
  var fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  function pickActiveTab() {
    var active = document.querySelector('.tab-bar [aria-selected="true"]');
    return active ? active.getAttribute('data-tab') : 'converter';
  }

  function renderBar(detail) {
    if (!bar || !barLabel || !barVal) return;
    var tab = pickActiveTab();
    var label = 'नतिजा';
    var value = '—';

    if (tab === 'converter') {
      label = labelMap[primary] || 'नतिजा';
      var units = ['ropani', 'aana', 'paisa', 'dam', 'bigha', 'kattha', 'dhur', 'sqft'];
      if (units.indexOf(primary) !== -1 && detail) {
        var v = detail[primary] || 0;
        value = v ? fmt.format(Math.round(v * 100) / 100) + ' ' + labelMap[primary] : '—';
      }
    } else if (tab === 'emi') {
      label = 'मासिक किस्ता';
      value = detail && detail.emi ? 'रु. ' + fmtInt.format(Math.round(detail.emi)) : '—';
    } else if (tab === 'interest') {
      label = 'कुल ब्याज';
      var t1 = document.getElementById('resInterestAmount');
      value = t1 ? t1.textContent : '—';
    } else if (tab === 'price') {
      label = 'कुल मूल्य';
      var t2 = document.getElementById('resTotalPrice');
      value = t2 ? t2.textContent : '—';
    } else if (tab === 'malpot') {
      label = 'कुल लागत';
      var t3 = document.getElementById('resMalpotTotal');
      value = t3 ? t3.textContent : '—';
    }

    barLabel.textContent = label;
    barVal.textContent   = value;
    bar.classList.remove('is-pulse');
    void bar.offsetWidth;
    bar.classList.add('is-pulse');
  }

  function activateTab(name) {
    var tabArr = Array.prototype.slice.call(tabs);
    if (!tabArr.some(function (t) { return t.getAttribute('data-tab') === name; })) {
      name = tabArr.length ? tabArr[0].getAttribute('data-tab') : 'converter';
    }
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.classList.toggle('is-active', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== name;
    });
    renderBar(lastDetail);
  }

  if (tabsWrap) {
    var defaultTab = tabsWrap.getAttribute('data-default') || 'converter';
    activateTab(defaultTab);

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        activateTab(t.getAttribute('data-tab'));
      });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(t);
        var next = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
        next.focus();
        next.click();
      });
    });
  }

  if (!bar || !root) return;

  document.addEventListener('jaggahisab:update', function (e) {
    lastDetail = e.detail;
    renderBar(e.detail);
  });

  var malpotInputs = document.querySelectorAll('[id^="malpot"]');
  malpotInputs.forEach(function (el) {
    var handler = function () {
      if (typeof window.calculateMalpot === 'function') window.calculateMalpot();
      renderBar(lastDetail);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });

  if (document.getElementById('malpotPropertyValue') &&
      typeof window.calculateMalpot === 'function') {
    window.calculateMalpot();
  }

  renderBar(lastDetail);
})();
