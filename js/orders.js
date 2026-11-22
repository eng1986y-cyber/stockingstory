// ============================================================
// orders.js — 주문 목록 / 그룹핑 / 검색 / 엑셀 / 인쇄 / 삭제
// 의존: config.js (ORDER_COLS), utils.js (esc, won, formatKST, downloadCSV, printHTML),
//       order-detail-modal.js (openOrderEditModal)
// ============================================================

let orderGroups = [];
let orderRows = [];
let selectedOrders = new Set();

async function loadOrders() {
  const listEl = document.getElementById('order-list');
  listEl.innerHTML = '<div class="tab-loading">로딩 중...</div>';
  const { data, error } = await db.from('orders').select('*')
    .order('created_at', { ascending: false }).limit(500);
  if (error) {
    listEl.innerHTML = '<p style="color:#dc2626;">' + error.message + '</p>';
    return;
  }
  orderRows = data || [];
  if (!orderRows.length) {
    listEl.innerHTML = '<p style="text-align:center;color:#9ca3af;">주문이 없습니다.</p>';
    orderGroups = [];
    return;
  }

  // 주문번호 기준 그룹핑
  const groupsMap = new Map();
  orderRows.forEach(o => {
    const key = o.order_number || `single_${o.id}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        orderNumber: key, first: o, items: [],
        ids: [], totalPrice: 0, totalQty: 0, isDeleted: false
      });
    }
    const g = groupsMap.get(key);
    g.items.push(o);
    g.ids.push(o.id);
    g.totalPrice += Number(o.total_price || 0);
    g.totalQty += Number(o.quantity || 0);
    if (o.is_deleted) g.isDeleted = true;
  });
  orderGroups = Array.from(groupsMap.values());

  listEl.innerHTML = orderGroups.map((g, idx) => {
    const f = g.first;
    const products = g.items.map(it => `${esc(it.product_name || '상품명 없음')} ×${Number(it.quantity || 1)}`).join(' / ');
    const productCodes = [...new Set(g.items.map(it => it.product_code).filter(Boolean))].join(', ');
    const detailOptions = g.items.map(it =>
      [it.selected_color, it.selected_size, it.selected_hem, it.selected_other].filter(Boolean).join(' / ')
    ).filter(Boolean);
    const optionPreview = detailOptions.length
      ? detailOptions.slice(0, 1).join('') + (detailOptions.length > 1 ? ` 외 ${detailOptions.length - 1}건` : '')
      : '-';
    const courier = [...new Set(g.items.map(x => x.courier).filter(Boolean))].join(', ');
    const tracking = [...new Set(g.items.map(x => x.tracking_number).filter(Boolean))].join(', ');
    const memo = [...new Set(g.items.map(x => x.memo).filter(Boolean))].join(' / ');
    const status = f.status || '주문접수';
    return `
      <div class="row-item ${g.isDeleted ? 'deleted-order' : ''}" style="align-items:flex-start; ${g.isDeleted ? 'border:2px solid #f59e0b;background:#fffbeb;' : ''}">
        <input type="checkbox" class="row-check order-group-check" data-group-idx="${idx}">
        <div style="flex:1;min-width:220px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:7px;">
            <span class="order-num">${esc(g.orderNumber)}</span>
            <span class="row-strong">${esc(f.customer_name || '-')}</span>
            <span class="row-muted">${esc(f.customer_phone || '-')}</span>
            <span class="badge" style="background:#1976d2;">${esc(status)}</span>
            ${g.isDeleted ? '<span class="badge" style="background:#d97706;">사용자 삭제 주문</span>' : ''}
            <span class="row-total">${won(g.totalPrice)}</span>
            <span class="row-muted">총 ${g.totalQty}개 · ${g.items.length}종</span>
          </div>
          <div style="font-size:12px;line-height:1.8;color:#4b5563;">
            <div><b>상품</b> : ${g.items.length > 1 ? `${esc(g.items[0].product_name || '상품명 없음')} 외 ${g.items.length - 1}건` : products}</div>
            <div><b>제품번호</b> : ${esc(productCodes || '-')}</div>
            <div><b>상세옵션</b> : ${esc(optionPreview)}</div>
            <div><b>택배</b> : ${esc(courier || '-')}　<b>운송장</b> : ${esc(tracking || '-')}</div>
            ${memo ? `<div><b>요청사항</b> : ${esc(memo)}</div>` : ''}
            <div class="row-muted">주문일시 : ${esc(formatKST(f.created_at))}</div>
          </div>
        </div>
        <div class="row-actions" style="margin-left:auto;align-self:center;">
          <button class="btn btn-warning btn-sm order-group-edit-btn" data-group-idx="${idx}">주문 상세</button>
          ${g.isDeleted ? `<button class="btn btn-success btn-sm order-group-restore-btn" data-group-idx="${idx}">복구</button>` : ''}
          <button class="btn btn-excel btn-sm order-group-excel-btn" data-group-idx="${idx}">엑셀</button>
          <button class="btn btn-print btn-sm order-group-print-btn" data-group-idx="${idx}">인쇄</button>
        </div>
      </div>`;
  }).join('');

  // 이벤트 바인딩
  listEl.querySelectorAll('.order-group-check').forEach(cb => {
    cb.onchange = () => {
      const idx = Number(cb.dataset.groupIdx);
      cb.checked ? selectedOrders.add(idx) : selectedOrders.delete(idx);
      updateOrderBulkBtn();
    };
  });
  listEl.querySelectorAll('.order-group-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const g = orderGroups[Number(btn.dataset.groupIdx)];
      if (!g) return;
      openOrderEditModal(g);
    };
  });
  listEl.querySelectorAll('.order-group-restore-btn').forEach(btn => {
    btn.onclick = async () => {
      const g = orderGroups[Number(btn.dataset.groupIdx)];
      if (!g || !confirm(`주문 ${g.orderNumber}을(를) 복구할까요?`)) return;
      const { error } = await db.from('orders').update({ is_deleted: false }).in('id', g.ids);
      if (error) alert('복구 실패: ' + error.message);
      else { alert('주문이 복구되었습니다.'); loadOrders(); }
    };
  });
  listEl.querySelectorAll('.order-group-excel-btn').forEach(btn => {
    btn.onclick = () => {
      const g = orderGroups[Number(btn.dataset.groupIdx)];
      if (g) downloadCSV(`order_${g.orderNumber}.csv`, [ORDER_COLS, ...g.items.map(o => ORDER_COLS.map(k => o[k] ?? ''))]);
    };
  });
  listEl.querySelectorAll('.order-group-print-btn').forEach(btn => {
    btn.onclick = () => {
      const g = orderGroups[Number(btn.dataset.groupIdx)];
      if (g) printHTML(`주문서 - ${g.orderNumber}`, [ORDER_COLS, ...g.items.map(o => ORDER_COLS.map(k => o[k] ?? ''))]);
    };
  });
}

function updateOrderBulkBtn() {
  const btn = document.getElementById('order-bulk-del-btn');
  btn.classList.toggle('active', selectedOrders.size > 0);
  btn.textContent = selectedOrders.size ? `삭제 표시 (${selectedOrders.size}건)` : '삭제 표시';
}

// ============ 전체 선택 ============
document.getElementById('order-check-all').onchange = e => {
  document.querySelectorAll('.order-group-check').forEach(cb => {
    cb.checked = e.target.checked;
    const idx = Number(cb.dataset.groupIdx);
    e.target.checked ? selectedOrders.add(idx) : selectedOrders.delete(idx);
  });
  updateOrderBulkBtn();
};

// ============ 선택 삭제 표시 (soft) ============
document.getElementById('order-bulk-del-btn').onclick = async () => {
  if (!selectedOrders.size) return;
  if (!confirm(`선택한 ${selectedOrders.size}개 주문을 삭제 표시할까요? (데이터는 보존됩니다)`)) return;
  const ids = [];
  selectedOrders.forEach(idx => { const g = orderGroups[idx]; if (g) ids.push(...g.ids); });
  const { error } = await db.from('orders').update({ is_deleted: true }).in('id', ids);
  if (error) alert(error.message);
  else {
    selectedOrders.clear();
    document.getElementById('order-check-all').checked = false;
    alert('삭제 표시했습니다.');
    loadOrders();
  }
};

// ============ 선택 완전 삭제 (hard) ============
document.getElementById('order-bulk-hard-del-btn').onclick = async () => {
  if (!selectedOrders.size) return alert('삭제할 주문을 선택해주세요.');
  if (!confirm(`선택한 ${selectedOrders.size}개 주문을 데이터베이스에서 완전히 삭제할까요?\n이 작업은 복구할 수 없습니다.`)) return;
  const ids = [];
  selectedOrders.forEach(idx => { const g = orderGroups[idx]; if (g) ids.push(...g.ids); });
  const { error } = await db.from('orders').delete().in('id', ids);
  if (error) alert('완전 삭제 실패: ' + error.message);
  else {
    selectedOrders.clear();
    document.getElementById('order-check-all').checked = false;
    alert('주문이 완전히 삭제되었습니다.');
    loadOrders();
  }
};

// ============ 선택 엑셀 / 인쇄 ============
document.getElementById('order-excel-selected-btn').onclick = () => {
  if (!selectedOrders.size) return alert('선택된 주문이 없습니다.');
  const rows = [ORDER_COLS];
  selectedOrders.forEach(idx => {
    const g = orderGroups[idx];
    if (g) g.items.forEach(o => rows.push(ORDER_COLS.map(k => o[k] ?? '')));
  });
  downloadCSV(`orders_selected_${Date.now()}.csv`, rows);
};

document.getElementById('order-print-selected-btn').onclick = () => {
  if (!selectedOrders.size) return alert('선택된 주문이 없습니다.');
  const rows = [ORDER_COLS];
  selectedOrders.forEach(idx => {
    const g = orderGroups[idx];
    if (g) g.items.forEach(o => rows.push(ORDER_COLS.map(k => o[k] ?? '')));
  });
  printHTML(`주문 목록 (${selectedOrders.size}건)`, rows);
};

// ============ 클라이언트 측 검색 (간이) ============
document.getElementById('order-search-btn').onclick = () => {
  const k = document.getElementById('order-search').value.trim().toLowerCase();
  document.querySelectorAll('#order-list .row-item').forEach(el => {
    el.style.display = (!k || el.textContent.toLowerCase().includes(k)) ? '' : 'none';
  });
};
document.getElementById('order-reset-btn').onclick = () => {
  document.getElementById('order-search').value = '';
  loadOrders();
};
