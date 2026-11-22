// ============================================================
// product-size-detail.js — 사이즈 상세 행 (등록 폼)
// ============================================================

function createSizeDetailRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'sd-row';
  row.innerHTML = `
    <input type="text" class="sd-size" placeholder="사이즈" value="${esc(data.size || '')}">
    <input type="text" class="sd-weight" placeholder="권장몸무게" value="${esc(data.weight || '')}">
    <input type="text" class="sd-height" placeholder="신장" value="${esc(data.height || '')}">
    <button type="button" class="sd-del-btn"></button>`;
  row.querySelector('.sd-del-btn').onclick = () => {
    row.remove();
    updateSizeDetailEmptyState();
  };
  return row;
}

function updateSizeDetailEmptyState() {
  const c = document.getElementById('size-detail-rows');
  if (!c) return;
  const has = c.querySelector('.sd-row');
  const empty = c.querySelector('.sd-empty');
  if (!has && !empty) {
    const el = document.createElement('div');
    el.className = 'sd-empty';
    el.textContent = '사이즈 상세 없음. "+ 행 추가"를 누르세요.';
    c.appendChild(el);
  } else if (has && empty) {
    empty.remove();
  }
}

function initSizeDetailAddButton() {
  const btn = document.getElementById('sd-add-btn');
  if (!btn) return;
  btn.onclick = () => {
    const c = document.getElementById('size-detail-rows');
    const e = c.querySelector('.sd-empty');
    if (e) e.remove();
    c.appendChild(createSizeDetailRow());
  };
}

function getSizeDetailFromForm() {
  const c = document.getElementById('size-detail-rows');
  const out = [];
  if (!c) return out;
  c.querySelectorAll('.sd-row').forEach(r => {
    const s = r.querySelector('.sd-size').value.trim();
    const w = r.querySelector('.sd-weight').value.trim();
    const h = r.querySelector('.sd-height').value.trim();
    if (!s && !w && !h) return;
    out.push({ size: s, weight: w, height: h });
  });
  return out;
}

function renderSizeDetailRows(rows) {
  const c = document.getElementById('size-detail-rows');
  if (!c) return;
  c.innerHTML = '';
  if (!rows || rows.length === 0) {
    updateSizeDetailEmptyState();
    return;
  }
  rows.forEach(r => c.appendChild(createSizeDetailRow(r)));
}

// 초기화
initSizeDetailAddButton();
updateSizeDetailEmptyState();
