// ============================================================
// coupons.js — 쿠폰 관리 (발급 / 목록 / 삭제)
// 의존: utils.js (esc, formatKST), config.js
// ============================================================

let allCoupons = [];

async function loadCouponsAndMembers() {
  // 회원 목록 (발급 셀렉트용)
  const { data: membersData } = await db.from('members').select('id, name, email').order('name');
  allMembers = membersData || [];

  const sel = document.getElementById('coupon-member-select');
  sel.innerHTML = '<option value="">회원 선택...</option>' +
    allMembers.map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.email)})</option>`).join('');

  const listEl = document.getElementById('coupon-list');
  listEl.innerHTML = '<div class="tab-loading">쿠폰 로딩 중...</div>';
  const { data, error } = await db.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) {
    listEl.innerHTML = '<p style="color:#dc2626;">' + error.message + '</p>';
    return;
  }
  allCoupons = data || [];
  renderCoupons();
}

function renderCoupons() {
  const listEl = document.getElementById('coupon-list');
  if (allCoupons.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">발급된 쿠폰이 없습니다.</p>';
    return;
  }
  const memberMap = new Map(allMembers.map(m => [String(m.id), m]));
  listEl.innerHTML = allCoupons.map(c => {
    const target = memberMap.get(String(c.member_id));
    const targetName = target ? `${esc(target.name)} (${esc(target.email)})` : '알 수 없음';
    const typeLabel = c.type === 'percent'
      ? `${c.discount_value}% 할인`
      : `${Number(c.discount_value).toLocaleString()}원 할인`;
    const isUsed = c.is_used
      ? '<span class="badge" style="background:#6b7280;">사용됨</span>'
      : '<span class="badge" style="background:#059669;">사용가능</span>';
    return `
      <div class="row-item">
        <div style="flex:1; min-width:200px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="row-strong">${esc(c.name || '이름없음')}</span>
            ${isUsed}
            <span style="font-size:12px; color:#1976d2; font-weight:600;">${targetName}</span>
          </div>
          <div style="font-size:12px; color:#6b7280; line-height:1.5;">
            할인: ${typeLabel} | 코드: ${esc(c.code)}<br>
            유효기간: ~${formatKST(c.expires_at, { dateOnly: true })}
            ${c.is_used && c.used_at ? ` | 사용일: ${formatKST(c.used_at, { dateOnly: true })}` : ''}
          </div>
        </div>
        <div class="row-actions">
          <button class="btn btn-danger btn-sm del-coupon-btn" data-id="${c.id}">삭제</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.del-coupon-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('쿠폰을 삭제할까요?')) return;
      const { error } = await db.from('coupons').delete().eq('id', btn.dataset.id);
      if (error) alert(error.message);
      else loadCouponsAndMembers();
    };
  });
}

// ============ 쿠폰 발급 폼 ============
document.getElementById('coupon-issue-form').onsubmit = async e => {
  e.preventDefault();
  const msg = document.getElementById('coupon-issue-msg');
  const memberId = document.getElementById('coupon-member-select').value;
  const type = document.getElementById('coupon-type-select').value;
  const value = Number(document.getElementById('coupon-value-input').value);
  const days = Number(document.getElementById('coupon-days-input').value);
  const name = document.getElementById('coupon-name-input').value.trim();

  if (!memberId) {
    msg.className = 'msg error';
    msg.textContent = '회원을 선택하세요.';
    return;
  }
  msg.className = 'msg';
  msg.textContent = '발급 중...';

  const code = 'CP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const { error } = await db.from('coupons').insert({
    member_id: memberId, code,
    name: name || '관리자 발급 쿠폰',
    type, discount_value: value,
    expires_at: expiresAt.toISOString(), is_used: false
  });

  if (error) {
    msg.className = 'msg error';
    msg.textContent = error.message;
  } else {
    msg.className = 'msg success';
    msg.textContent = '쿠폰이 발급되었습니다!';
    document.getElementById('coupon-name-input').value = '';
    loadCouponsAndMembers();
  }
};
