/* =============================================================
   converter-core.js — Nepal Land & Financial Engine
   Phase 1 — Math-audited, constants corrected to exact survey units.
   Function signatures and DOM contracts preserved from v0.
   ============================================================= */

/* ---------- Canonical Constants (exact) ---------- */
// Hilly hierarchy: 1 Ropani = 16 Aana = 64 Paisa = 256 Dam = 5,476 sq ft
const SQFT_ROPANI = 5476;
const SQFT_AANA   = SQFT_ROPANI / 16;   // 342.25
const SQFT_PAISA  = SQFT_AANA   / 4;    // 85.5625
const SQFT_DAM    = SQFT_PAISA  / 4;    // 21.390625

// Terai hierarchy: 1 Bigha = 20 Kattha = 400 Dhur = 72,900 sq ft
const SQFT_BIGHA  = 72900;
const SQFT_KATTHA = SQFT_BIGHA  / 20;   // 3645
const SQFT_DHUR   = SQFT_KATTHA / 20;   // 182.25

// Standard area
const SQFT_PER_SQM = 10.763910416709722;

/* ---------- Formatting ---------- */
const _fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const _fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n) => 'रु. ' + _fmtInt.format(Math.round(n || 0));
const num2  = (n) => _fmt.format(Math.round((n || 0) * 100) / 100);

/* ---------- Safe Number Reader ---------- */
function num(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/* ---------- State ---------- */
let currentTotalSqFt = 0;

/* ---------- Source handlers ---------- */
function calculateFromHilly() {
  const r = num('ropani'), a = num('aana'), p = num('paisa'), d = num('dam');
  currentTotalSqFt = r * SQFT_ROPANI + a * SQFT_AANA + p * SQFT_PAISA + d * SQFT_DAM;
  updateOutputs('hilly');
}

function calculateFromTerai() {
  const b = num('bigha'), k = num('kattha'), d = num('dhur');
  currentTotalSqFt = b * SQFT_BIGHA + k * SQFT_KATTHA + d * SQFT_DHUR;
  updateOutputs('terai');
}

function calculateFromSqFt() {
  currentTotalSqFt = num('sqft');
  updateOutputs('sqft');
}

function calculateFromSqM() {
  currentTotalSqFt = num('sqm') * SQFT_PER_SQM;
  updateOutputs('sqm');
}

function calculateEMIDirectly() { updateOutputs('directLoan'); }
function updateAll()             { updateOutputs(''); }

/* ---------- Master render ---------- */
function updateOutputs(source) {
  const sqft = currentTotalSqFt;

  /* --- Hilly decomposition --- */
  let remH = sqft;
  const ropani = Math.floor(remH / SQFT_ROPANI); remH %= SQFT_ROPANI;
  const aana   = Math.floor(remH / SQFT_AANA);   remH %= SQFT_AANA;
  const paisa  = Math.floor(remH / SQFT_PAISA);  remH %= SQFT_PAISA;
  const dam    = Math.round((remH / SQFT_DAM) * 100) / 100;

  if (source !== 'hilly') {
    setVal('ropani', ropani || '');
    setVal('aana',   aana   || '');
    setVal('paisa',  paisa  || '');
    setVal('dam',    dam    || '');
  }

  /* --- Terai decomposition --- */
  let remT = sqft;
  const bigha  = Math.floor(remT / SQFT_BIGHA);  remT %= SQFT_BIGHA;
  const kattha = Math.floor(remT / SQFT_KATTHA); remT %= SQFT_KATTHA;
  const dhur   = Math.round((remT / SQFT_DHUR) * 100) / 100;

  if (source !== 'terai') {
    setVal('bigha',  bigha  || '');
    setVal('kattha', kattha || '');
    setVal('dhur',   dhur   || '');
  }

  /* --- Standard area --- */
  if (source !== 'sqft') setVal('sqft', Math.round(sqft * 100) / 100 || '');
  if (source !== 'sqm')  setVal('sqm',  Math.round((sqft / SQFT_PER_SQM) * 100) / 100 || '');

  /* --- Land price --- */
  const rate      = num('rate');
  const rateUnit  = (document.getElementById('rateUnit') || {}).value || 'kattha';
  let   customQty = num('rateQuantity');
  let   totalPrice = 0;

  if (rate > 0) {
    if (customQty > 0) {
      totalPrice = customQty * rate;
    } else if (sqft > 0) {
      const map = {
        kattha: SQFT_KATTHA, dhur: SQFT_DHUR, bigha: SQFT_BIGHA,
        ropani: SQFT_ROPANI, aana: SQFT_AANA, sqft: 1
      };
      const unitSqFt = map[rateUnit] || 1;
      const convertedQty = sqft / unitSqFt;
      setVal('rateQuantity', Math.round(convertedQty * 100) / 100 || '');
      totalPrice = convertedQty * rate;
    }
  }

  /* --- Agent commission --- */
  const commRate = num('commissionRate');
  const commissionVal = (totalPrice * commRate) / 100;

  /* --- Bank loan & EMI --- */
  let loanAmt = num('directLoanAmount');
  const loanPct = num('loanPercent');
  if (source !== 'directLoan' && totalPrice > 0 && loanPct > 0) {
    loanAmt = (totalPrice * loanPct) / 100;
    setVal('directLoanAmount', Math.round(loanAmt));
  }
  const downPaymentVal = totalPrice > loanAmt ? totalPrice - loanAmt : 0;

  const annualInterest = num('interestRate');
  const tenureYears    = num('loanTenure');
  let emi = 0;
  if (loanAmt > 0 && tenureYears > 0) {
    const months = tenureYears * 12;
    if (annualInterest === 0) {
      emi = loanAmt / months;               // 0% interest — interest-free EMI
    } else {
      const r = annualInterest / 12 / 100;
      const p = Math.pow(1 + r, months);
      emi = (loanAmt * r * p) / (p - 1);
    }
  }

  /* --- Render dashboard --- */
  setText('resHilly',    `${ropani} रोपनी, ${aana} आना, ${paisa} पैसा, ${dam} दाम`);
  setText('resTerai',    `${bigha} बिघा, ${kattha} कट्ठा, ${dhur} धुर`);
  setText('resStandard', `${num2(sqft)} Sq. Ft / ${num2(sqft / SQFT_PER_SQM)} Sq. M`);

  setText('resTotalPrice',  money(totalPrice));
  setText('resCommission',  money(commissionVal) + (commRate ? ` (${commRate}%)` : ''));
  setText('resDownPayment', money(downPaymentVal));
  setText('resLoanAmount',  money(loanAmt));
  setText('resEMI',         money(emi) + ' / महिना');

  /* --- Notify ui-shell (sticky bar, etc.) --- */
  document.dispatchEvent(new CustomEvent('jaggahisab:update', {
    detail: { sqft, ropani, aana, paisa, dam, bigha, kattha, dhur,
              totalPrice, commissionVal, loanAmt, emi, downPaymentVal, source }
  }));
}

/* ---------- Sayakada & Simple Interest ---------- */
function calculateSimpleInterest() {
  const p = num('principalAmount');
  const typeEl = document.getElementById('interestType');
  const type = typeEl ? typeEl.value : 'sayakada';
  const r = num('customRate');
  const t = num('timeMonths');

  let interest = 0;
  if (p > 0 && r > 0 && t > 0) {
    interest = (type === 'sayakada')
      ? p * (r / 100) * t                      // monthly saikada
      : p * (r / 100) * (t / 12);              // annual
  }
  const totalPayable = p + interest;

  setText('resInterestAmount', money(interest));
  setText('resTotalPayable',   money(totalPayable));
}

/* ---------- Reset ---------- */
function resetAllFields() {
  document.querySelectorAll('input').forEach(i => { i.value = ''; });
  document.querySelectorAll('select').forEach(s => { s.selectedIndex = 0; });
  currentTotalSqFt = 0;
  updateOutputs('');
  calculateSimpleInterest();
}

/* ---------- Internal helpers ---------- */
function setVal(id, v)  { const e = document.getElementById(id); if (e) e.value = v; }
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateOutputs('');
  calculateSimpleInterest();
});
