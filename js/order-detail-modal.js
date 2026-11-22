```javascript
// ============================================================
// order-detail-modal.js — 주문 상세 모달
// 의존: config.js (ORDER_STATUS_OPTIONS), utils.js (esc, won)
// ============================================================

async function openOrderEditModal(groupOrOrder) {
  if (!groupOrOrder) return;

  const items = Array.isArray(groupOrOrder.items)
    ? groupOrOrder.items
    : [groupOrOrder];

  const first = items[0] || {};
  const orderNo = groupOrOrder.orderNumber || first.order_number || '-';

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop order-detail-backdrop';

  const statusOptions = [...new Set([
    ...ORDER_STATUS_OPTIONS,
    ...items.map(x => x.status).filter(Boolean)
  ])];

  // ============================================================
  // 주문 금액 계산
  // ============================================================
  let totalProductPrice = 0;
  let totalShippingFee = 0;

  items.forEach(it => {
    totalProductPrice +=
      Number(it.product_price || 0) * Number(it.quantity || 1);

    totalShippingFee += Number(it.shipping_fee || 0);
  });

  // ============================================================
  // 쿠폰 조회
  // ============================================================
  let usedCoupon = null;

  if (first.order_number) {
    const couponRes = await db.from('coupons')
      .select('*')
      .eq('is_used', true)
      .eq('used_order_number', first.order_number)
      .maybeSingle();

    usedCoupon = couponRes.data || null;
  }

  const couponDiscount = usedCoupon
    ? (
        usedCoupon.type === 'percent'
          ? Math.round(
              totalProductPrice *
              Number(usedCoupon.discount_value || 0) / 100
            )
          : Math.min(
              totalProductPrice,
              Number(usedCoupon.discount_value || 0)
            )
      )
    : Number(first.coupon_discount || first.discount_amount || 0);

  const finalTotal = Math.max(
    0,
    totalProductPrice + totalShippingFee - couponDiscount
  );

  // ============================================================
  // 회원 정보 조회
  // ============================================================
  let memberData = null;

  if (first.member_id) {
    const { data: mData } = await db.from('members')
      .select('*')
      .eq('id', first.member_id)
      .maybeSingle();

    memberData = mData;
  }

  // ============================================================
  // 값 가져오기
  // ============================================================
  function pickValue(key, fallbackFromMember) {
    let v = items
      .map(x => x[key])
      .find(x => x !== undefined && x !== null && x !== '')
      ?? first[key]
      ?? '';

    if (!v && memberData && fallbackFromMember) {
      for (const f of fallbackFromMember) {
        if (memberData[f]) {
          v = memberData[f];
          break;
        }
      }
    }

    return v;
  }

  const depositorName =
    pickValue('depositor_name', ['depositor_name', 'depositor']) || '';

  let customsNumber =
    pickValue('customs_number', [
      'customs_number',
      'customs_code',
      'personal_customs_code',
      'customs_id'
    ]) || '';

  if (customsNumber) {
    customsNumber = String(customsNumber).replace(/[^0-9]/g, '');
  }

  const receiverName =
    pickValue('receiver_name', [
      'receiver_name',
      'recipient_name',
      'name'
    ]) || first.customer_name || '';

  const receiverPhone =
    pickValue('receiver_phone', [
      'receiver_phone',
      'phone'
    ]) || first.customer_phone || '';

  const postcode =
    pickValue('postcode', ['postcode', 'zipcode']) || '';

  const address =
    pickValue('address', ['address', 'addr']) || '';

  const addressDetail =
    pickValue('address_detail', [
      'address_detail',
      'addr_detail',
      'address2'
    ]) || '';

  // 주문 전체 공통 관리자 메모
  const adminMemo =
    items.map(x => x.memo)
      .find(x => x !== undefined && x !== null && x !== '') || '';

  // ============================================================
  // 주문자 / 배송지 HTML
  // ============================================================
  const recipientHtml = `
    <div class="nav-order-recipient-layout">

      <!-- 첫 번째 줄 : 4개 -->
      <div class="recipient-row-4">

        <label>
          입금자명
          <input
            class="edit-recipient"
            data-key="depositor_name"
            value="${esc(depositorName)}"
            placeholder="입금자명 입력">
        </label>

        <label>
          개인통관고유부호
          <input
            class="edit-recipient customs-input"
            data-key="customs_number"
            inputmode="numeric"
            maxlength="13"
            pattern="[0-9]{13}"
            oninput="this.value=this.value.replace(/[^0-9]/g,'')"
            value="${esc(customsNumber)}"
            placeholder="13자리 숫자">
        </label>

        <label>
          수취인
          <input
            class="edit-recipient"
            data-key="receiver_name"
            value="${esc(receiverName)}"
            placeholder="수취인 입력">
        </label>

        <label>
          연락처
          <input
            class="edit-recipient"
            data-key="receiver_phone"
            value="${esc(receiverPhone)}"
            placeholder="연락처 입력">
        </label>

      </div>

      <!-- 두 번째 줄 : 3개 -->
      <div class="recipient-row-3">

        <label>
          우편번호
          <input
            class="edit-recipient"
            data-key="postcode"
            value="${esc(postcode)}"
            placeholder="우편번호">
        </label>

        <label>
          주소
          <input
            class="edit-recipient"
            data-key="address"
            value="${esc(address)}"
            placeholder="주소">
        </label>

        <label>
          상세주소
          <input
            class="edit-recipient"
            data-key="address_detail"
            value="${esc(addressDetail)}"
            placeholder="상세주소">
        </label>

      </div>

      <!-- 세 번째 줄 : 관리자 메모 -->
      <div class="recipient-memo-row">

        <label>
          관리자 메모
          <textarea
            class="edit-admin-memo"
            placeholder="관리자 전용 메모">${esc(adminMemo)}</textarea>
        </label>

      </div>

    </div>
  `;

  // ============================================================
  // 주문 상품 HTML
  // ============================================================
  const productsHtml = items.map((it, i) => {

    const optField = (label, val) => `
      <div class="opt-field">
        <span>${label}</span>
        <b>${val !== undefined && val !== null && val !== ''
          ? esc(val)
          : '-'}</b>
      </div>
    `;

    return `
      <div class="nav-order-product">

        <!-- 상품 정보 -->
        <div class="nav-order-product-head">
          <div>
            <small>${i + 1}</small>
            <strong>${esc(it.product_name || '상품명 없음')}</strong>
            <span>${esc(it.product_code || '')}</span>
          </div>

          <b>
            ${won(
              Number(it.product_price || 0) *
              Number(it.quantity || 1)
            )}
          </b>
        </div>

        <!-- 가격 정보 -->
        <div class="nav-order-product-summary">
          <span>단가: ${won(it.product_price)}</span>
          <span>수량: ${Number(it.quantity || 1)}개</span>
          <span>
            상품 소계:
            ${won(
              Number(it.product_price || 0) *
              Number(it.quantity || 1)
            )}
          </span>
        </div>

        <!-- 고객 요청사항 -->
        ${
          it.request_content
            ? `
              <div class="opt-field customer-request-field">
                <span>고객 요청사항</span>
                <b>${esc(it.request_content)}</b>
              </div>
            `
            : ''
        }

        <!-- 상품 옵션 : 4개 나란히 -->
        <div class="product-options-row">

          ${optField('색상', it.selected_color)}
          ${optField('사이즈', it.selected_size)}
          ${optField('선택밑단', it.selected_hem)}
          ${optField('추가옵션', it.selected_other)}

        </div>

        <!-- 배송 정보 : 3개 나란히 -->
        <div class="product-shipping-row">

          <label>
            주문 진행 상태
            <select class="edit-status">
              ${statusOptions.map(s => `
                <option
                  value="${esc(s)}"
                  ${s === (it.status || '주문접수') ? 'selected' : ''}>
                  ${esc(s)}
                </option>
              `).join('')}
            </select>
          </label>

          <label>
            택배사
            <select class="edit-courier">
              ${
                [
                  '',
                  'CJ대한통운',
                  '롯데택배',
                  '한진택배',
                  '우체국택배',
                  '로젠택배',
                  '경동택배',
                  '대신택배',
                  '합동택배',
                  '천일택배',
                  '일양로지스',
                  '건영택배',
                  'EMS',
                  '기타'
                ].map(c => `
                  <option
                    value="${esc(c)}"
                    ${c === (it.courier || '') ? 'selected' : ''}>
                    ${c || '택배사 선택'}
                  </option>
                `).join('')
              }
            </select>
          </label>

          <label>
            운송장 번호
            <input
              type="text"
              class="edit-tracking"
              value="${esc(it.tracking_number || '')}"
              placeholder="운송장 번호 입력">
          </label>

        </div>

      </div>
    `;
  }).join('');

  // ============================================================
  // 모달 HTML
  // ============================================================
  modal.innerHTML = `
    <div class="modal-box nav-order-modal">

      <div class="nav-order-top">
        <div>
          <small>STK STORY ORDER</small>
          <h2>주문 상세</h2>
          <b>${esc(orderNo)}</b>
        </div>

        <button
          type="button"
          class="nav-order-close"
          id="close-order-modal">×</button>
      </div>

      <!-- 주문 금액 -->
      <div class="nav-order-section order-total-card">
        <div class="nav-order-summary order-total-grid">

          <div>
            <span>총 상품 금액</span>
            <b>${won(totalProductPrice)}</b>
          </div>

          <div>
            <span>배송비</span>
            <b>${won(totalShippingFee)}</b>
          </div>

          <div>
            <span>
              쿠폰 할인${usedCoupon
                ? ` (${esc(usedCoupon.name || '쿠폰')})`
                : ''}
            </span>
            <b style="color:#059669;">
              -${won(couponDiscount)}
            </b>
          </div>

          <div class="order-final-total">
            <span>최종 결제 금액</span>
            <b style="color:#e53935;">
              ${won(finalTotal)}
            </b>
          </div>

        </div>
      </div>

      <!-- 주문자 / 배송지 -->
      <div class="nav-order-section">
        <h3>주문자 / 배송지 정보</h3>
        ${recipientHtml}
      </div>

      <!-- 주문 상품 -->
      <div class="nav-order-section">
        <h3>주문 상품 (${items.length}건)</h3>
        ${productsHtml}
      </div>

      <!-- 하단 버튼 -->
      <div class="nav-order-footer">

        <button
          type="button"
          class="btn btn-danger"
          id="hard-delete-order">
          주문 완전 삭제
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          id="cancel-order-edit">
          취소
        </button>

        <button
          type="button"
          class="btn btn-primary"
          id="save-order-edit">
          변경사항 저장
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // ============================================================
  // 모달 닫기
  // ============================================================
  modal.querySelector('#close-order-modal').onclick = () => modal.remove();
  modal.querySelector('#cancel-order-edit').onclick = () => modal.remove();

  // ============================================================
  // 주문 완전 삭제
  // ============================================================
  modal.querySelector('#hard-delete-order').onclick = async () => {

    if (!confirm(
      `주문 ${orderNo}의 모든 상품 데이터를 완전히 삭제할까요?\n` +
      `이 작업은 복구할 수 없습니다.`
    )) return;

    const ids = items.map(it => it.id).filter(Boolean);

    const { error } = await db.from('orders')
      .delete()
      .in('id', ids);

    if (error) {
      alert('완전 삭제 실패: ' + error.message);
    } else {
      alert('주문이 완전히 삭제되었습니다.');

      modal.remove();
      selectedOrders.clear();
      loadOrders();
    }
  };

  // ============================================================
  // 변경사항 저장
  // ============================================================
  modal.querySelector('#save-order-edit').onclick = async () => {

    const btn = modal.querySelector('#save-order-edit');

    btn.disabled = true;
    btn.textContent = '저장 중...';

    try {

      // 1. 주문자 / 배송지 정보 수집
      const recipientValues = {};

      modal.querySelectorAll('.edit-recipient').forEach(input => {
        recipientValues[input.dataset.key] = input.value.trim();
      });

      // 관리자 메모
      const adminMemoVal =
        (modal.querySelector('.edit-admin-memo')?.value || '').trim();

      // 2. 개인통관번호 확인
      const customsRaw = recipientValues.customs_number || '';

      if (customsRaw && !/^\d{13}$/.test(customsRaw)) {

        alert(
          '개인통관고유부호는 13자리 숫자여야 합니다. ' +
          '(현재 ' + customsRaw.length + '자리)'
        );

        btn.disabled = false;
        btn.textContent = '변경사항 저장';
        return;
      }

      // 3. 상품별 배송정보 수집
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

      // 4. orders 테이블 컬럼 확인
      let orderColumns = null;

      try {

        const { data: probe, error: probeErr } = await db.from('orders')
          .select('*')
          .limit(1);

        if (!probeErr && probe && probe[0]) {

          orderColumns = new Set(Object.keys(probe[0]));

        } else {

          orderColumns = new Set([
            'id',
            'order_number',
            'member_id',
            'product_id',
            'product_code',
            'product_name',
            'product_price',
            'quantity',
            'total_price',
            'customer_name',
            'customer_phone',
            'customer_email',
            'depositor_name',
            'receiver_name',
            'receiver_phone',
            'postcode',
            'address',
            'address_detail',
            'customs_number',
            'selected_color',
            'selected_size',
            'selected_hem',
            'selected_other',
            'request_content',
            'memo',
            'shipping_fee',
            'grade_discount',
            'coupon_discount',
            'discount_amount',
            'status',
            'courier',
            'tracking_number',
            'is_deleted',
            'created_at',
            'updated_at'
          ]);
        }

      } catch (e) {
        console.warn('스키마 확인 실패:', e);
      }

      // 스키마에 존재하는 컬럼만 저장
      const filterBySchema = (obj) => {

        if (!orderColumns) return obj;

        const out = {};

        for (const k of Object.keys(obj)) {
          if (
            orderColumns.has(k) &&
            obj[k] !== undefined &&
            obj[k] !== ''
          ) {
            out[k] = obj[k];
          }
        }

        return out;
      };

      // 5. 주문자 / 배송지 공통 정보
      const recipientForOrders = filterBySchema({
        depositor_name: recipientValues.depositor_name,
        receiver_name: recipientValues.receiver_name,
        receiver_phone: recipientValues.receiver_phone,
        postcode: recipientValues.postcode,
        address: recipientValues.address,
        address_detail: recipientValues.address_detail,
        customs_number: recipientValues.customs_number,
      });

      // 6. 주문 상품별 저장
      // 관리자 메모는 주문 전체 공통으로 저장
      const errors = [];

      for (const upd of perItemUpdates) {

        const payload = {
          ...recipientForOrders,
          status: upd.status,
          courier: upd.courier || null,
          tracking_number: upd.tracking_number || null,
          memo: adminMemoVal || null,
        };

        const { error } = await db.from('orders')
          .update(payload)
          .eq('id', upd.id);

        if (error) {
          errors.push(`[주문ID ${upd.id}] ${error.message}`);
        }
      }

      // ==========================================================
      // 7. 회원 정보 업데이트
      // ==========================================================
      let memberSaved = false;
      let memberErrMsg = '';

      if (first.member_id) {

        const memberPayload = {};

        if (recipientValues.customs_number)
          memberPayload.customs_number = recipientValues.customs_number;

        if (recipientValues.receiver_name)
          memberPayload.receiver_name = recipientValues.receiver_name;

        if (recipientValues.receiver_phone)
          memberPayload.receiver_phone = recipientValues.receiver_phone;

        if (recipientValues.postcode)
          memberPayload.postcode = recipientValues.postcode;

        if (recipientValues.address)
          memberPayload.address = recipientValues.address;

        if (recipientValues.address_detail)
          memberPayload.address_detail = recipientValues.address_detail;

        if (Object.keys(memberPayload).length > 0) {

          const { error: mErr } = await db.from('members')
            .update(memberPayload)
            .eq('id', first.member_id);

          if (mErr) {
            memberErrMsg = mErr.message;
          } else {
            memberSaved = true;
          }
        }
      }

      // ==========================================================
      // 8. 저장 결과
      // ==========================================================
      btn.disabled = false;
      btn.textContent = '변경사항 저장';

      if (errors.length === perItemUpdates.length) {

        alert('저장 실패:\n' + errors.join('\n'));

      } else if (errors.length > 0) {

        alert(
          '일부 저장 실패 (성공 ' +
          (perItemUpdates.length - errors.length) +
          '/' + perItemUpdates.length +
          '):\n' +
          errors.join('\n')
        );

        loadOrders();

      } else {

        let msg = '저장 완료!';

        if (memberSaved) {
          msg += '\n(회원 정보에도 반영됨)';
        }

        if (memberErrMsg) {
          msg += '\n\n⚠ 회원 정보 저장 실패: ' + memberErrMsg;
        }

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
```
