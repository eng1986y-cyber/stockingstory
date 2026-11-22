// ============================================================
// order-detail-modal.js — 주문 상세 모달
// 의존: config.js (ORDER_STATUS_OPTIONS), utils.js (esc, won)
// ============================================================

async function openOrderEditModal(groupOrOrder) {
  if (!groupOrOrder) return;
  const items = Array.isArray(groupOrOrder.items) ? groupOrOrder.items : [groupOrOrder];
  const first = items[0] || {};
  const orderNo = groupOrOrder.orderNumber || first.order_number || '-';
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop order-detail-backdrop';
  const statusOptions = [...new Set([...ORDER_STATUS_OPTIONS, ...items.map(x => x.status).filter(Boolean)])];

  // 합계 계산
  let totalProductPrice = 0, totalShippingFee = 0;
  items.forEach(it => {
    totalProductPrice += Number(it.product_price || 0) * Number(it.quantity || 1);
    totalShippingFee += Number(it.shipping_fee || 0);
  });

  // 쿠폰 조회
  let usedCoupon = null;
  if (first.order_number) {
    const couponRes = await db.from('coupons').select('*')
      .eq('is_used', true).eq('used_order_number', first.order_number).maybeSingle();
    usedCoupon = couponRes.data || null;
  }
  const couponDiscount = usedCoupon
    ? (usedCoupon.type === 'percent'
        ? Math.round(totalProductPrice * Number(usedCoupon.discount_value || 0) / 100)
        : Math.min(totalProductPrice, Number(usedCoupon.discount_value || 0)))
    : Number(first.coupon_discount || first.discount_amount || 0);
  const finalTotal = Math.max(0, totalProductPrice + totalShippingFee - couponDiscount);

  // 회원 폴백
  let memberData = null;
  if (first.member_id) {
    const { data: mData } = await db.from('members').select('*').eq('id', first.member_id).maybeSingle();
    memberData = mData;
  }

  // 값 폴백 헬퍼
  function pickValue(key, fallbackFromMember) {
    let v = items.map(x => x[key]).find(x => x !== undefined && x !== null && x !== '') ?? first[key] ?? '';
    if (!v && memberData && fallbackFromMember) {
      for (const f of fallbackFromMember) {
        if (memberData[f]) { v = memberData[f]; break; }
      }
    }
    return v;
  }

  const depositorName = pickValue('depositor_name', ['depositor_name','depositor']) || '';
  let customsNumber = pickValue('customs_number', ['customs_number','customs_code','personal_customs_code','customs_id']) || '';
  if (customsNumber) customsNumber = String(customsNumber).replace(/[^0-9]/g, '');
  const receiverName = pickValue('receiver_name', ['receiver_name','recipient_name','name']) || first.customer_name || '';
  const receiverPhone = pickValue('receiver_phone', ['receiver_phone','phone']) || first.customer_phone || '';
  const postcode = pickValue('postcode', ['postcode','zipcode']) || '';
  const address = pickValue('address', ['address','addr']) || '';
  const addressDetail = pickValue('address_detail', ['address_detail','addr_detail','address2']) || '';
  const adminMemo = first.memo || '';

  const recipientHtml = `
    <div class="nav-order-recipient-3col">
      <div class="rec-col">
        <label>입금자명
          <input class="edit-recipient" data-key="depositor_name" value="${esc(depositorName)}" placeholder="입금자명 입력">
        </label>
        <label>개인통관고유부호
          <input class="edit-recipient customs-input" data-key="customs_number"
            inputmode="numeric" maxlength="13" pattern="[0-9]{13}"
            oninput="this.value=this.value.replace(/[^0-9]/g,'')"
            value="${esc(customsNumber)}" placeholder="13자리 숫자">
        </label>
        <label>수취인
          <input class="edit-recipient" data-key="receiver_name" value="${esc(receiverName)}" placeholder="수취인 입력">
        </label>
        <label>연락처
          <input class="edit-recipient" data-key="receiver_phone" value="${esc(receiverPhone)}" placeholder="연락처 입력">
        </label>
      </div>
      <div class="rec-col">
        <label>우편번호
          <input class="edit-recipient" data-key="postcode" value="${esc(postcode)}" placeholder="우편번호">
        </label>
        <label>주소
          <input class="edit-recipient" data-key="address" value="${esc(address)}" placeholder="주소">
        </label>
        <label>상세주소
          <input class="edit-recipient" data-key="address_detail" value="${esc(addressDetail)}" placeholder="상세주소">
        </label>
      </div>
      <div class="rec-col memo-col">
        <label>관리자 메모
          <textarea class="edit-admin-memo" placeholder="내부 메모 (모든 상품에 동일하게 저장됩니다)">${esc(adminMemo)}</textarea>
        </label>
      </div>
    </div>`;

  const productsHtml = items.map((it, i) => {
    const optField = (label, val) => (val !== undefined && val !== null && val !== '')
      ? `<div class="opt-field"><span>${label}</span><b>${esc(val)}</b></div>`
      : '';
    const leftColContent =
      optField('색상', it.selected_color) +
      optField('사이즈', it.selected_size) +
      optField('선택 밑단', it.selected_hem) +
      optField('추가 옵션', it.selected_other) ||
      '<div class="opt-field"><span>옵션</span><b>-</b></div>';

    return `
      <div class="nav-order-product">
        <div class="nav-order-product-head">
          <div>
            <small>${i + 1}</small>
            <strong>${esc(it.product_name || '상품명 없음')}</strong>
            <span>${esc(it.product_code || '')}</span>
          </div>
          <b>${won(Number(it.product_price || 0) * Number(it.quantity || 1))}</b>
        </div>
        <div class="nav-order-product-summary">
          <span>단가: ${won(it.product_price)}</span>
          <span>수량: ${Number(it.quantity || 1)}개</span>
          <span>상품 소계: ${won(Number(it.product_price || 0) * Number(it.quantity || 1))}</span>
        </div>
        ${it.request_content ? `<div class="opt-field" style="margin-top:8px;"><span>고객 요청사항</span><b>${esc(it.request_content)}</b></div>` : ''}
        <div class="nav-order-product-options-2col">
          <div class="opt-col">
            ${leftColContent}
          </div>
          <div class="opt-col">
            <label>주문진행상태
              <select class="edit-status">
                ${statusOptions.map(s => `<option value="${s}" ${s === (it.status || '주문접수') ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </label>
            <label>택배사
              <select class="edit-courier">
                ${['','CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배','경동택배','대신택배','합동택배','천일택배','일양로지스','건영택배','EMS','기타'].map(c => `<option value="${esc(c)}" ${c === (it.courier || '') ? 'selected' : ''}>${c || '택배사 선택'}</option>`).join('')}
              </select>
            </label>
            <label>운송장 번호
              <input type="text" class="edit-tracking" value="${esc(it.tracking_number || '')}" placeholder="숫자만 입력">
            </label>
          </div>
        </div>
      </div>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box nav-order-modal">
      <div class="nav-order-top">
        <div>
          <small>STK STORY ORDER</small>
          <h2>주문 상세</h2>
          <b>${esc(orderNo)}</b>
        </div>
        <button type="button" class="nav-order-close" id="close-order-modal">×</button>
      </div>
      <div class="nav-order-section order-total-card">
        <div class="nav-order-summary order-total-grid">
          <div><span>총 상품 금액</span><b>${won(totalProductPrice)}</b></div>
          <div><span>배송비</span><b>${won(totalShippingFee)}</b></div>
          <div><span>쿠폰 할인${usedCoupon ? ` (${esc(usedCoupon.name || '쿠폰')})` : ''}</span><b style="color:#059669;">-${won(couponDiscount)}</b></div>
          <div class="order-final-total"><span>최종 결제 금액</span><b style="color:#e53935;">${won(finalTotal)}</b></div>
        </div>
      </div>
      <div class="nav-order-section">
        <h3>주문자 / 배송지 정보</h3>
        ${recipientHtml}
      </div>
      <div class="nav-order-section">
        <h3>주문 상품 (${items.length}건)</h3>
        ${productsHtml}
      </div>
      <div class="nav-order-footer">
        <button type="button" class="btn btn-danger" id="hard-delete-order">주문 완전 삭제</button>
        <button type="button" class="btn btn-secondary" id="cancel-order-edit">취소</button>
        <button type="button" class="btn btn-primary" id="save-order-edit">변경사항 저장</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('#close-order-modal').onclick = () => modal.remove();
  modal.querySelector('#cancel-order-edit').onclick = () => modal.remove();

  modal.querySelector('#hard-delete-order').onclick = async () => {
    if (!confirm(`주문 ${orderNo}의 모든 상품 데이터를 완전히 삭제할까요?\n이 작업은 복구할 수 없습니다.`)) return;
    const ids = items.map(it => it.id).filter(Boolean);
    const { error } = await db.from('orders').delete().in('id', ids);
    if (error) alert('완전 삭제 실패: ' + error.message);
    else {
      alert('주문이 완전히 삭제되었습니다.');
      modal.remove();
      selectedOrders.clear();
      loadOrders();
    }
  };

  modal.querySelector('#save-order-edit').onclick = async () => {
    const btn = modal.querySelector('#save-order-edit');
    btn.disabled = true;
    btn.textContent = '저장 중...';

    try {
      // 1) 수취인 입력 수집
      const recipientValues = {};
      modal.querySelectorAll('.edit-recipient').forEach(input => {
        recipientValues[input.dataset.key] = input.value.trim();
      });
      const adminMemoVal = (modal.querySelector('.edit-admin-memo')?.value || '').trim();

      // 통관번호 검증
      const customsRaw = recipientValues.customs_number || '';
      if (customsRaw && !/^\d{13}$/.test(customsRaw)) {
        alert('개인통관고유부호는 13자리 숫자여야 합니다. (현재 ' + customsRaw.length + '자리)');
        btn.disabled = false;
        btn.textContent = '변경사항 저장';
        return;
      }

      // 2) 상품별 편집값
      const productCards = modal.querySelectorAll('.nav-order-product');
      const perItemUpdates = [];
      items.forEach((it, idx) => {
        const card = productCards[idx];
        if (!card) return;
        perItemUpdates.push({
          id: it.id,
          status: card.querySelector('.edit-status').value,
          courier: card.querySelector('.edit-courier').value.trim(),
          tracking_number: card.querySelector('.edit-tracking').value.trim(),
        });
      });

      // 3) orders 스키마 확인 (없는 컬럼 자동 스킵)
      let orderColumns = null;
      try {
        const { data: probe, error: probeErr } = await db.from('orders').select('*').limit(1);
        if (!probeErr && probe && probe[0]) {
          orderColumns = new Set(Object.keys(probe[0]));
        } else {
          orderColumns = new Set([
            'id','order_number','member_id','product_id',
            'product_code','product_name','product_price','quantity','total_price',
            'customer_name','customer_phone','customer_email',
            'depositor_name','receiver_name','receiver_phone',
            'postcode','address','address_detail','customs_number',
            'selected_color','selected_size','selected_hem','selected_other',
            'request_content','memo','shipping_fee','grade_discount',
            'coupon_discount','discount_amount','status','courier','tracking_number',
            'is_deleted','created_at','updated_at'
          ]);
        }
      } catch (e) {
        console.warn('스키마 확인 실패:', e);
      }

      const filterBySchema = (obj) => {
        if (!orderColumns) return obj;
        const out = {};
        for (const k of Object.keys(obj)) {
          if (orderColumns.has(k) && obj[k] !== undefined && obj[k] !== '') out[k] = obj[k];
        }
        return out;
      };

      const recipientForOrders = filterBySchema({
        depositor_name: recipientValues.depositor_name,
        receiver_name:  recipientValues.receiver_name,
        receiver_phone: recipientValues.receiver_phone,
        postcode:       recipientValues.postcode,
        address:        recipientValues.address,
        address_detail: recipientValues.address_detail,
        customs_number: recipientValues.customs_number,
      });

      // 4) 주문 row별 개별 저장
      const errors = [];
      for (const upd of perItemUpdates) {
        const payload = {
          ...recipientForOrders,
          status: upd.status,
          courier: upd.courier || null,
          tracking_number: upd.tracking_number || null,
          memo: adminMemoVal || null,
        };
        const { error } = await db.from('orders').update(payload).eq('id', upd.id);
        if (error) errors.push(`[주문ID ${upd.id}] ${error.message}`);
      }

      // 5) members 반영
      let memberSaved = false, memberErrMsg = '';
      if (first.member_id) {
        const memberPayload = {};
        if (recipientValues.customs_number) memberPayload.customs_number = recipientValues.customs_number;
        if (recipientValues.receiver_name)  memberPayload.receiver_name = recipientValues.receiver_name;
        if (recipientValues.receiver_phone) memberPayload.receiver_phone = recipientValues.receiver_phone;
        if (recipientValues.postcode)       memberPayload.postcode = recipientValues.postcode;
        if (recipientValues.address)        memberPayload.address = recipientValues.address;
        if (recipientValues.address_detail) memberPayload.address_detail = recipientValues.address_detail;

        if (Object.keys(memberPayload).length > 0) {
          const { error: mErr } = await db.from('members').update(memberPayload).eq('id', first.member_id);
          if (mErr) memberErrMsg = mErr.message;
          else memberSaved = true;
        }
      }

      btn.disabled = false;
      btn.textContent = '변경사항 저장';

      if (errors.length === perItemUpdates.length) {
        alert('저장 실패:\n' + errors.join('\n'));
      } else if (errors.length > 0) {
        alert('일부 저장 실패 (성공 ' + (perItemUpdates.length - errors.length) + '/' + perItemUpdates.length + '):\n' + errors.join('\n'));
        loadOrders();
      } else {
        let msg = '저장 완료!';
        if (memberSaved) msg += '\n(회원 정보에도 반영됨)';
        if (memberErrMsg) msg += '\n\n⚠ 회원 정보 저장 실패: ' + memberErrMsg;
        alert(msg);
        modal.remove();
        loadOrders();
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 예외 발생: ' + (err.message || err));
      btn.disabled = false;
      btn.textContent = '변경사항 저장';
    }
  };
}