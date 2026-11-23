// ============================================================
// order-detail-modal.js — 주문 상세 모달 (통관번호 완벽 연동)
// ============================================================

async function openOrderEditModal(groupOrOrder) {
  if (!document.getElementById('order-detail-layout-style')) {
    const style = document.createElement('style');
    style.id = 'order-detail-layout-style';
    style.textContent = `
      .nav-order-recipient-layout { display:grid; gap:12px; }
      .recipient-row-4 { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
      .recipient-row-3 { display:grid; grid-template-columns:minmax(110px,.7fr) minmax(0,1.5fr) minmax(0,1.2fr); gap:10px; }
      .recipient-memo-row { display:grid; grid-template-columns:1fr; }
      .recipient-row-4 label,.recipient-row-3 label,.recipient-memo-row label,
      .product-shipping-row label { display:flex; flex-direction:column; gap:6px; min-width:0; }
      .recipient-row-4 input,.recipient-row-3 input,.recipient-memo-row textarea,
      .product-shipping-row input,.product-shipping-row select { width:100%; min-width:0; box-sizing:border-box; }
      .recipient-memo-row textarea { min-height:70px; resize:vertical; }
      .product-options-row { display:grid; grid-template-columns:minmax(0,1fr); gap:12px; margin-top:12px; }
      .product-options-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; align-content:start; }
      .product-options-grid .opt-field { min-width:0; background:#f7f8fa; border:1px solid #e4e7ec; border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:5px; }
      .product-options-grid .opt-field span { font-size:11px; color:#667085; font-weight:600; }
      .product-options-grid .opt-field b { font-size:14px; color:#20242b; font-weight:700; line-height:1.4; overflow-wrap:anywhere; }
      .order-shipping-editor { border:1px solid #e5e7eb; border-radius:12px; background:#fafafa; padding:12px; display:grid; gap:10px; }
      .order-shipping-editor h4 { margin:0; font-size:14px; font-weight:700; }
      .product-shipping-row { display:grid; grid-template-columns:1fr 1fr 1.5fr; gap:8px; align-items:end; }
      .product-shipping-row label { font-size:12px; font-weight:600; color:#4b5563; }
      .product-shipping-row input,.product-shipping-row select { min-height:38px; border:1px solid #d1d5db; border-radius:8px; padding:7px 9px; background:#fff; }
      @media(max-width:700px) {
        .recipient-row-4 { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .recipient-row-3 { grid-template-columns:1fr; }
        .product-options-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .product-shipping-row { grid-template-columns:1fr 1fr; }
        .product-shipping-row label:last-child { grid-column:1 / -1; }
      }
      @media(max-width:420px) {
        .product-shipping-row { grid-template-columns:1fr; }
        .product-shipping-row label:last-child { grid-column:auto; }
      }
    `;
    document.head.appendChild(style);
  }

  if (!groupOrOrder) return;
  const items = Array.isArray(groupOrOrder.items) ? groupOrOrder.items : [groupOrOrder];
  const first = items[0] || {};
  const orderNo = groupOrOrder.orderNumber || first.order_number || '-';
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop order-detail-backdrop';

  const baseStatusOptions = (typeof ORDER_STATUS_OPTIONS !== 'undefined' && Array.isArray(ORDER_STATUS_OPTIONS))
    ? ORDER_STATUS_OPTIONS
    : ['주문접수','입금대기','입금완료','상품준비중','배송중','배송완료','주문취소'];
  const statusOptions = [...new Set([...baseStatusOptions, ...items.map(x => x.status).filter(Boolean)])];

  let totalProductPrice = 0, totalShippingFee = 0;
  items.forEach(it => {
    totalProductPrice += Number(it.product_price || 0) * Number(it.quantity || 1);
    totalShippingFee += Number(it.shipping_fee || 0);
  });

  let usedCoupon = null;
  if (first.order_number) {
    const couponRes = await db.from('coupons').select('*').eq('is_used', true)
      .eq('used_order_number', first.order_number).maybeSingle();
    usedCoupon = couponRes.data || null;
  }
  const couponDiscount = usedCoupon
    ? (usedCoupon.type === 'percent'
        ? Math.round(totalProductPrice * Number(usedCoupon.discount_value || 0) / 100)
        : Math.min(totalProductPrice, Number(usedCoupon.discount_value || 0)))
    : Number(first.coupon_discount || first.discount_amount || 0);
  const finalTotal = Math.max(0, totalProductPrice + totalShippingFee - couponDiscount);

  // ⭐ 회원 정보(members) 로드 (member_id가 없으면 이름+연락처로 대조)
  let memberData = null;
  if (first.member_id) {
    const { data: mData } = await db.from('members').select('*').eq('id', first.member_id).maybeSingle();
    memberData = mData;
  } else if (first.customer_name && first.customer_phone) {
    // member_id가 없을 경우 이름과 연락처로 회원 찾기
    const { data: mData } = await db.from('members')
      .select('*')
      .eq('name', first.customer_name)
      .eq('phone', first.customer_phone)
      .maybeSingle();
    memberData = mData;
  }

  // ⭐ 값 가져오기 헬퍼
  function pickValue(key, fallbackFromMember) {
    let value = items.map(x => x[key]).find(x => x !== undefined && x !== null && x !== '') ?? first[key] ?? '';
    if (!value && memberData && fallbackFromMember) {
      for (const field of fallbackFromMember) {
        if (memberData[field]) { value = memberData[field]; break; }
      }
    }
    return value;
  }

  const depositorName = pickValue('depositor_name', ['depositor_name','depositor']) || '';
  
  // ⭐ 통관번호: orders에 없으면 members에서 무조건 가져옴
  let customsNumber = pickValue('customs_number', ['customs_number','customs_code','personal_customs_code','customs_id']) || '';
  customsNumber = String(customsNumber).trim().toUpperCase().replace(/[^P0-9]/g, '');

  const receiverName = pickValue('receiver_name', ['receiver_name','recipient_name','name']) || first.customer_name || '';
  const receiverPhone = pickValue('receiver_phone', ['receiver_phone','phone']) || first.customer_phone || '';
  const postcode = pickValue('postcode', ['postcode','zipcode']) || '';
  const address = pickValue('address', ['address','addr']) || '';
  const addressDetail = pickValue('address_detail', ['address_detail','addr_detail','address2']) || '';
  const adminMemo = first.memo || '';

  const recipientHtml = `
    <div class="nav-order-recipient-layout">
      <div class="recipient-row-4">
        <label>입금자명<input class="edit-recipient" data-key="depositor_name" value="${esc(depositorName)}" placeholder="입금자명 입력"></label>
        <label>개인통관고유부호<input class="edit-recipient customs-input" data-key="customs_number" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="13" pattern="P[0-9]{12}" oninput="this.value=this.value.toUpperCase().replace(/[^P0-9]/g,'').replace(/P/g,(m,i)=>i===0?'P':'')" value="${esc(customsNumber)}" placeholder="P + 숫자 12자리"></label>
        <label>수취인<input class="edit-recipient" data-key="receiver_name" value="${esc(receiverName)}" placeholder="수취인 입력"></label>
        <label>연락처<input class="edit-recipient" data-key="receiver_phone" value="${esc(receiverPhone)}" placeholder="연락처 입력"></label>
      </div>
      <div class="recipient-row-3">
        <label>우편번호<input class="edit-recipient" data-key="postcode" value="${esc(postcode)}" placeholder="우편번호"></label>
        <label>주소<input class="edit-recipient" data-key="address" value="${esc(address)}" placeholder="주소"></label>
        <label>상세주소<input class="edit-recipient" data-key="address_detail" value="${esc(addressDetail)}" placeholder="상세주소"></label>
      </div>
      <div class="order-shipping-editor">
        <h4>주문 진행 / 배송 정보</h4>
        <div class="product-shipping-row">
          <label>주문 진행 상태
            <select class="edit-status">${statusOptions.map(status => `<option value="${esc(status)}" ${status === (first.status || '주문접수') ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select>
          </label>
          <label>택배사
            <select class="edit-courier">${['','CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배','경동택배','대신택배','합동택배','천일택배','일양로지스','건영택배','EMS','기타'].map(c => `<option value="${esc(c)}" ${c === (first.courier || '') ? 'selected' : ''}>${c || '택배사 선택'}</option>`).join('')}</select>
          </label>
          <label>운송장 번호
            <input type="text" class="edit-tracking" value="${esc(first.tracking_number || '')}" placeholder="운송장 번호 입력">
          </label>
        </div>
      </div>
      <div class="recipient-memo-row">
        <label>관리자 메모<textarea class="edit-admin-memo" placeholder="내부 메모 (모든 상품에 동일하게 저장됩니다)">${esc(adminMemo)}</textarea></label>
      </div>
    </div>`;

  const productsHtml = items.map((it, i) => {
    const optField = (label, value) => `<div class="opt-field"><span>${label}</span><b>${value !== undefined && value !== null && value !== '' ? esc(value) : '-'}</b></div>`;
    const optionsHtml = optField('색상',it.selected_color) + optField('사이즈',it.selected_size) +
      optField('선택 밑단',it.selected_hem) + optField('추가 옵션',it.selected_other);
    return `
      <div class="nav-order-product">
        <div class="nav-order-product-head"><div><small>${i+1}</small><strong>${esc(it.product_name || '상품명 없음')}</strong><span>${esc(it.product_code || '')}</span></div><b>${won(Number(it.product_price || 0) * Number(it.quantity || 1))}</b></div>
        <div class="nav-order-product-summary"><span>단가: ${won(it.product_price)}</span><span>수량: ${Number(it.quantity || 1)}개</span><span>상품 소계: ${won(Number(it.product_price || 0) * Number(it.quantity || 1))}</span></div>
        ${it.request_content ? `<div class="opt-field" style="margin-top:8px;"><span>고객 요청사항</span><b>${esc(it.request_content)}</b></div>` : ''}
        <div class="product-options-row"><div class="product-options-grid">${optionsHtml}</div></div>
      </div>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box nav-order-modal">
      <div class="nav-order-top"><div><small>STK STORY ORDER</small><h2>주문 상세</h2><b>${esc(orderNo)}</b></div><button type="button" class="nav-order-close" id="close-order-modal">×</button></div>
      <div class="nav-order-section order-total-card"><div class="nav-order-summary order-total-grid">
        <div><span>총 상품 금액</span><b>${won(totalProductPrice)}</b></div><div><span>배송비</span><b>${won(totalShippingFee)}</b></div>
        <div><span>쿠폰 할인${usedCoupon ? ` (${esc(usedCoupon.name || '쿠폰')})` : ''}</span><b style="color:#059669;">-${won(couponDiscount)}</b></div>
        <div class="order-final-total"><span>최종 결제 금액</span><b style="color:#e53935;">${won(finalTotal)}</b></div>
      </div></div>
      <div class="nav-order-section"><h3>주문자 / 배송지 정보</h3>${recipientHtml}</div>
      <div class="nav-order-section"><h3>주문 상품 (${items.length}건)</h3>${productsHtml}</div>
      <div class="nav-order-footer"><button type="button" class="btn btn-danger" id="hard-delete-order">주문 완전 삭제</button><button type="button" class="btn btn-secondary" id="cancel-order-edit">취소</button><button type="button" class="btn btn-primary" id="save-order-edit">변경사항 저장</button></div>
    </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#close-order-modal').onclick = () => modal.remove();
  modal.querySelector('#cancel-order-edit').onclick = () => modal.remove();

  modal.querySelector('#hard-delete-order').onclick = async () => {
    if (!confirm(`주문 ${orderNo}의 모든 상품 데이터를 완전히 삭제할까요?\n이 작업은 복구할 수 없습니다.`)) return;
    const ids = items.map(item => item.id).filter(Boolean);
    const { error } = await db.from('orders').delete().in('id', ids);
    if (error) alert('완전 삭제 실패: ' + error.message);
    else {
      alert('주문이 완전히 삭제되었습니다.');
      modal.remove();
      if (typeof selectedOrders !== 'undefined' && selectedOrders?.clear) selectedOrders.clear();
      if (typeof loadOrders === 'function') loadOrders();
    }
  };

  modal.querySelector('#save-order-edit').onclick = async () => {
    const btn = modal.querySelector('#save-order-edit');
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
      const recipientValues = {};
      modal.querySelectorAll('.edit-recipient').forEach(input => recipientValues[input.dataset.key] = input.value.trim());
      recipientValues.customs_number = (recipientValues.customs_number || '').toUpperCase();
      const adminMemoVal = (modal.querySelector('.edit-admin-memo')?.value || '').trim();
      const sharedShipping = {
        status: modal.querySelector('.edit-status')?.value || first.status || '주문접수',
        courier: modal.querySelector('.edit-courier')?.value.trim() || null,
        tracking_number: modal.querySelector('.edit-tracking')?.value.trim() || null
      };

      let orderColumns = null;
      try {
        const { data: probe, error: probeErr } = await db.from('orders').select('*').limit(1);
        if (!probeErr && probe && probe[0]) orderColumns = new Set(Object.keys(probe[0]));
        else orderColumns = new Set(['id','order_number','member_id','product_id','product_code','product_name','product_price','quantity','total_price','customer_name','customer_phone','customer_email','depositor_name','receiver_name','receiver_phone','postcode','address','address_detail','customs_number','selected_color','selected_size','selected_hem','selected_other','request_content','memo','shipping_fee','grade_discount','coupon_discount','discount_amount','status','courier','tracking_number','is_deleted','created_at','updated_at']);
      } catch (error) { console.warn('스키마 확인 실패:', error); }
      const filterBySchema = obj => {
        if (!orderColumns) return obj;
        const filtered = {};
        for (const key of Object.keys(obj)) if (orderColumns.has(key) && obj[key] !== undefined) filtered[key] = obj[key];
        return filtered;
      };
      const recipientForOrders = filterBySchema({
        depositor_name:recipientValues.depositor_name, receiver_name:recipientValues.receiver_name,
        receiver_phone:recipientValues.receiver_phone, postcode:recipientValues.postcode,
        address:recipientValues.address, address_detail:recipientValues.address_detail,
        customs_number:recipientValues.customs_number
      });
      const errors = [];
      for (const item of items) {
        const payload = { ...recipientForOrders, ...sharedShipping, memo:adminMemoVal || null };
        const { error } = await db.from('orders').update(filterBySchema(payload)).eq('id',item.id);
        if (error) errors.push(`[주문ID ${item.id}] ${error.message}`);
      }
      
      // ⭐ 저장할 때도 members 테이블에 통관번호 업데이트
      let memberSaved = false, memberErrMsg = '';
      const targetMemberId = first.member_id || memberData?.id;
      
      if (targetMemberId) {
        const memberPayload = { 
          customs_number: recipientValues.customs_number || null,
          receiver_name: recipientValues.receiver_name || null,
          receiver_phone: recipientValues.receiver_phone || null,
          postcode: recipientValues.postcode || null,
          address: recipientValues.address || null,
          address_detail: recipientValues.address_detail || null
        };
        Object.keys(memberPayload).forEach(k => { if (memberPayload[k] === '') memberPayload[k] = null; });

        const { error: memberError } = await db.from('members').update(memberPayload).eq('id', targetMemberId);
        if (memberError) memberErrMsg = memberError.message; 
        else memberSaved = true;
      }
      
      btn.disabled = false; btn.textContent = '변경사항 저장';
      if (errors.length === items.length) alert('저장 실패:\n' + errors.join('\n'));
      else if (errors.length) {
        alert('일부 저장 실패 (성공 ' + (items.length-errors.length) + '/' + items.length + '):\n' + errors.join('\n'));
        if (typeof loadOrders === 'function') loadOrders();
      } else {
        let message = '저장 완료!';
        if (memberSaved) message += '\n(회원 정보에도 반영됨)';
        if (memberErrMsg) message += '\n\n⚠ 회원 정보 저장 실패: ' + memberErrMsg;
        alert(message); modal.remove(); if (typeof loadOrders === 'function') loadOrders();
      }
    } catch (error) {
      console.error(error); alert('저장 중 예외 발생: ' + (error.message || error));
      btn.disabled = false; btn.textContent = '변경사항 저장';
    }
  };
}
window.openOrderEditModal = openOrderEditModal;