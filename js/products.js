// ============================================================
// products.js — 상품 등록 / 목록 / 검색 / 페이지네이션 / 수정 / 복제 / 삭제
// 의존: utils.js (esc, won), product-size-detail.js, config.js
// ============================================================

const form = document.getElementById('product-form');
const msg = document.getElementById('msg');
const parseList = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);

// ============ 상품 등록 ============
form.addEventListener('submit', async e => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '등록 중...';
  const { error } = await db.from('products').insert({
    product_code: form.product_code.value.trim() || null,
    name: form.name.value.trim(),
    price: Number(form.price.value),
    main_image: form.main_image.value.trim(),
    detail_images: form.detail_images.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
    colors: parseList(form.colors.value),
    sizes: parseList(form.sizes.value),
    hem_option: parseList(form.hem_option.value),
    other_option: parseList(form.other_option.value),
    min_qty: Number(form.min_qty.value) || 1,
    target_grade: form.target_grade.value || 'all',
    size_detail: getSizeDetailFromForm(),
  });
  if (error) {
    msg.className = 'msg error';
    msg.textContent = error.message;
  } else {
    msg.className = 'msg success';
    msg.textContent = '등록 완료!';
    form.reset();
    form.min_qty.value = 1;
    form.target_grade.value = 'all';
    renderSizeDetailRows([]);
    loadAdminList();
  }
});

// ============ 상품 목록 ============
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const PER_PAGE_DESKTOP = 10;
const PER_PAGE_MOBILE = 4;
const MAX_PAGES = 10;
const isAdminMobile = () => window.matchMedia('(max-width: 560px)').matches;
const getPerPage = () => isAdminMobile() ? PER_PAGE_MOBILE : PER_PAGE_DESKTOP;
let selectedProductIds = new Set();
const listEl = document.getElementById('admin-list');

function targetGradeBadge(g) {
  if (g === 'wholesale') return `<span class="target-badge target-wholesale">도매</span>`;
  if (g === 'vip') return `<span class="target-badge target-vip">VIP</span>`;
  return `<span class="target-badge target-all">일반</span>`;
}

async function loadAdminList() {
  const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    listEl.innerHTML = '<p>불러오기 실패</p>';
    return;
  }
  allProducts = data || [];
  document.getElementById('product-count').textContent = `총 ${allProducts.length}개`;
  applySearch(document.getElementById('product-search').value.trim());
}

function applySearch(text) {
  const norm = v => String(v ?? '').normalize('NFKC').toLocaleLowerCase().trim();
  const k = norm(text);
  if (!k) {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(p => {
      const vals = [p.name, p.product_code, p.colors, p.sizes, p.hem_option, p.other_option, p.min_qty, p.price, p.id, p.target_grade];
      return vals.some(v => norm(Array.isArray(v) ? v.join(' ') : v).includes(k));
    });
  }
  currentPage = 1;
  selectedProductIds.clear();
  if (typeof checkAllProducts !== 'undefined' && checkAllProducts) checkAllProducts.checked = false;
  renderProducts();
}

function renderProducts() {
  const perPage = getPerPage();
  const totalPages = Math.min(Math.ceil(filteredProducts.length / perPage), MAX_PAGES);
  const start = (currentPage - 1) * perPage;
  const items = filteredProducts.slice(start, start + perPage);

  if (filteredProducts.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;width:100%;">조건에 맞는 상품이 없습니다</p>';
    document.getElementById('admin-pagination').innerHTML = '';
    updateBulkBtn();
    return;
  }

  listEl.innerHTML = items.map(p => {
    const opts = [];
    if (p.colors?.length) opts.push(`색상: ${p.colors.join(',')}`);
    if (p.sizes?.length) opts.push(`사이즈: ${p.sizes.join(',')}`);
    if (p.hem_option?.length) opts.push(`밑단: ${p.hem_option.join(',')}`);
    if (p.other_option?.length) opts.push(`기타: ${p.other_option.join(',')}`);
    opts.push(`최소: ${p.min_qty || 1}개`);
    if (p.detail_images?.length) opts.push(`상세: ${p.detail_images.length}장`);
    if (p.size_detail?.length) opts.push(`사이즈: ${p.size_detail.length}행`);
    const detail = opts.join('  ·  ');
    const checked = selectedProductIds.has(String(p.id));
    return `
      <div class="product-row">
        <input type="checkbox" class="product-check" data-id="${p.id}" ${checked ? 'checked' : ''}>
        <img src="${p.main_image || ''}" alt="" loading="lazy">
        <div class="prod-info">
          <div class="prod-name-wrap">
            ${targetGradeBadge(p.target_grade)}
            <span class="prod-name">${esc(p.name || '(상품명 없음)')}</span>
            ${p.product_code ? `<span class="prod-code">${esc(p.product_code)}</span>` : ''}
          </div>
          <div class="prod-detail-text">${esc(detail || '옵션 정보 없음')}</div>
        </div>
        <div class="prod-price">${won(p.price)}</div>
        <div class="prod-actions">
          <a href="product.html?id=${p.id}" target="_blank" class="btn btn-secondary btn-sm">보기</a>
          <button class="btn btn-primary btn-sm edit-btn" data-id="${p.id}">수정</button>
          <button class="btn btn-success btn-sm copy-btn" data-id="${p.id}">복제</button>
          <button class="btn btn-danger btn-sm del-btn" data-id="${p.id}">삭제</button>
        </div>
      </div>`;
  }).join('');

  bindProductEvents();
  renderPagination(totalPages);
  updateBulkBtn();
}

function bindProductEvents() {
  // 체크박스
  listEl.querySelectorAll('.product-check').forEach(cb => {
    cb.onchange = () => {
      const id = String(cb.dataset.id);
      if (cb.checked) selectedProductIds.add(id);
      else selectedProductIds.delete(id);
      updateBulkBtn();
    };
  });

  // 수정
  listEl.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const p = allProducts.find(x => String(x.id) === String(btn.dataset.id));
      if (p) showProductEditModal(p);
    };
  });

  // 복제
  listEl.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = async () => {
      const p = allProducts.find(x => String(x.id) === String(btn.dataset.id));
      if (!p || !confirm(`"${p.name}"을 복사할까요?`)) return;
      btn.disabled = true;
      btn.textContent = '...';
      const { error } = await db.from('products').insert({
        product_code: p.product_code ? p.product_code + '-C' : null,
        name: p.name + ' (복사)',
        price: p.price,
        main_image: p.main_image,
        detail_images: p.detail_images || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
        hem_option: p.hem_option || [],
        other_option: p.other_option || [],
        min_qty: p.min_qty || 1,
        target_grade: p.target_grade || 'all',
        size_detail: p.size_detail || [],
      });
      if (error) {
        alert(error.message);
        btn.disabled = false;
        btn.textContent = '복제';
      } else {
        loadAdminList();
      }
    };
  });

  // 삭제
  listEl.querySelectorAll('.del-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('정말 삭제할까요?')) return;
      const { error } = await db.from('products').delete().eq('id', btn.dataset.id);
      if (error) alert('삭제 실패: ' + error.message);
      else {
        selectedProductIds.delete(String(btn.dataset.id));
        loadAdminList();
      }
    };
  });
}

// ============ 상품 수정 모달 ============
function showProductEditModal(p) {
  const tg = p.target_grade || 'all';
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box modal-lg">
      <h2>상품 수정</h2>
      <form id="product-edit-form" class="modal-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <input name="product_code" placeholder="제품번호" value="${esc(p.product_code || '')}">
        <input name="name" placeholder="상품명" value="${esc(p.name)}" required>
        <input name="price" type="number" placeholder="가격" value="${p.price}" required>
        <input name="main_image" placeholder="메인 이미지 URL" value="${esc(p.main_image)}" required>
        <input name="colors" placeholder="색상(쉼표)" value="${(p.colors || []).join(',')}">
        <input name="sizes" placeholder="사이즈(쉼표)" value="${(p.sizes || []).join(',')}">
        <input name="hem_option" placeholder="밑단(쉼표)" value="${(p.hem_option || []).join(',')}">
        <input name="other_option" placeholder="기타옵션(쉼표)" value="${(p.other_option || []).join(',')}">
        <input name="min_qty" type="number" min="1" placeholder="최소수량" value="${p.min_qty || 1}">
        <select name="target_grade">
          <option value="all" ${tg === 'all' ? 'selected' : ''}>일반(전체)</option>
          <option value="wholesale" ${tg === 'wholesale' ? 'selected' : ''}>도매전용</option>
          <option value="vip" ${tg === 'vip' ? 'selected' : ''}>VIP전용</option>
        </select>
        <input name="detail_images" placeholder="상세 이미지 URL" style="grid-column:1/-1;" value="${(p.detail_images || []).join(', ')}">
        <div class="edit-size-section" style="grid-column:1/-1;">
          <div class="es-head">
            <div style="font-size:13px;font-weight:700;color:#111827;">사이즈 상세</div>
            <button type="button" class="es-add-btn" id="es-add-btn">+ 행 추가</button>
          </div>
          <div class="edit-size-rows" id="edit-size-rows"></div>
        </div>
        <div class="modal-actions" style="grid-column:1/-1;">
          <button type="submit" class="btn btn-primary">수정 완료</button>
          <button type="button" id="cancel-edit" class="btn btn-secondary">취소</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);

  function createES(data = {}) {
    const r = document.createElement('div');
    r.className = 'es-row';
    r.innerHTML = `
      <input type="text" class="es-size" placeholder="사이즈" value="${esc(data.size || '')}">
      <input type="text" class="es-weight" placeholder="권장몸무게" value="${esc(data.weight || '')}">
      <input type="text" class="es-height" placeholder="신장" value="${esc(data.height || '')}">
      <button type="button" class="es-del-btn"></button>`;
    r.querySelector('.es-del-btn').onclick = () => r.remove();
    return r;
  }

  const rowsEl = modal.querySelector('#edit-size-rows');
  (p.size_detail || []).forEach(r => rowsEl.appendChild(createES(r)));
  modal.querySelector('#es-add-btn').onclick = () => rowsEl.appendChild(createES());
  modal.querySelector('#cancel-edit').onclick = () => modal.remove();

  modal.querySelector('#product-edit-form').onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target;
    const sd = [];
    modal.querySelectorAll('#edit-size-rows .es-row').forEach(r => {
      const s = r.querySelector('.es-size').value.trim();
      const w = r.querySelector('.es-weight').value.trim();
      const h = r.querySelector('.es-height').value.trim();
      if (!s && !w && !h) return;
      sd.push({ size: s, weight: w, height: h });
    });
    const btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '저장 중...';
    const { error } = await db.from('products').update({
      product_code: f.product_code.value.trim() || null,
      name: f.name.value.trim(),
      price: Number(f.price.value),
      main_image: f.main_image.value.trim(),
      detail_images: f.detail_images.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
      colors: parseList(f.colors.value),
      sizes: parseList(f.sizes.value),
      hem_option: parseList(f.hem_option.value),
      other_option: parseList(f.other_option.value),
      min_qty: Number(f.min_qty.value) || 1,
      target_grade: f.target_grade.value || 'all',
      size_detail: sd,
    }).eq('id', p.id);
    if (error) {
      alert(error.message);
      btn.disabled = false;
      btn.textContent = '수정 완료';
    } else {
      alert('수정 완료!');
      modal.remove();
      loadAdminList();
    }
  };
}

// ============ 선택 삭제 / 페이지네이션 / 검색 ============
const checkAllProducts = document.getElementById('check-all-products');
const bulkDelBtn = document.getElementById('bulk-del-btn');

function updateBulkBtn() {
  if (selectedProductIds.size > 0) {
    bulkDelBtn.classList.add('active');
    bulkDelBtn.textContent = `선택 삭제 (${selectedProductIds.size})`;
  } else {
    bulkDelBtn.classList.remove('active');
    bulkDelBtn.textContent = '선택 삭제';
  }
  const cbs = listEl.querySelectorAll('.product-check');
  if (cbs.length === 0) {
    checkAllProducts.checked = false;
    checkAllProducts.disabled = true;
  } else {
    checkAllProducts.disabled = false;
    checkAllProducts.checked = Array.from(cbs).every(cb => cb.checked);
  }
}

checkAllProducts.onchange = () => {
  listEl.querySelectorAll('.product-check').forEach(cb => {
    cb.checked = checkAllProducts.checked;
    const id = String(cb.dataset.id);
    if (checkAllProducts.checked) selectedProductIds.add(id);
    else selectedProductIds.delete(id);
  });
  updateBulkBtn();
};

bulkDelBtn.onclick = async () => {
  if (selectedProductIds.size === 0) return;
  if (!confirm(`선택한 ${selectedProductIds.size}개 상품을 삭제할까요?`)) return;
  bulkDelBtn.disabled = true;
  const { error } = await db.from('products').delete().in('id', Array.from(selectedProductIds));
  bulkDelBtn.disabled = false;
  if (error) alert(error.message);
  else {
    alert('삭제 완료!');
    selectedProductIds.clear();
    loadAdminList();
  }
};

document.getElementById('product-search-btn').onclick = () =>
  applySearch(document.getElementById('product-search').value.trim());
document.getElementById('product-reset-btn').onclick = () => {
  document.getElementById('product-search').value = '';
  applySearch('');
};
document.getElementById('product-search').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applySearch(e.target.value.trim());
  }
});

function renderPagination(totalPages) {
  const el = document.getElementById('admin-pagination');
  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    currentPage = Number(b.dataset.page);
    renderProducts();
  });
}

// 반응형 페이지 수 조정
let __lastAdminMobile = isAdminMobile();
window.addEventListener('resize', () => {
  const now = isAdminMobile();
  if (now !== __lastAdminMobile) {
    __lastAdminMobile = now;
    currentPage = 1;
    renderProducts();
  }
});
