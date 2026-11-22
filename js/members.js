// ============================================================
// members.js — 회원 목록 / 상세 / 등급·상태 / 통관번호 / 쿠폰 발급
// 의존: utils.js (esc, formatKST), config.js
// ============================================================

let allMembers = [];
let filteredMembers = [];
let memberPage = 1;
const MEMBER_PER_PAGE = 10;

async function loadMembers() {
  const listEl = document.getElementById('member-list');
  listEl.innerHTML = '<div class="tab-loading">회원 목록 로딩 중...</div>';
  const { data, error } = await db.from('members').select('*').order('created_at', { ascending: false });
  if (error) {
    listEl.innerHTML = '<p style="color:#dc2626;">' + error.message + '</p>';
    return;
  }
  allMembers = data || [];
  document.getElementById('member-check-all').checked = false;
  applyMemberSearch(document.getElementById('member-search').value.trim());
}

function applyMemberSearch(text) {
  const k = text.toLowerCase().trim();
  if (!k) filteredMembers = [...allMembers];
  else filteredMembers = allMembers.filter(m => {
    return [m.name, m.email, m.phone, m.id, m.user_id, m.username,
      m.receiver_name, m.recipient_name, m.postcode, m.address, m.address_detail,
      m.customs_number, m.customs_code, m.status, m.grade
    ].some(v => String(v || '').toLowerCase().includes(k));
  });
  memberPage = 1;
  renderMembers();
}

function renderMembers() {
  const listEl = document.getElementById('member-list');
  const total = filteredMembers.length;
  const totalPages = Math.ceil(total / MEMBER_PER_PAGE) || 1;
  const start = (memberPage - 1) * MEMBER_PER_PAGE;
  const items = filteredMembers.slice(start, start + MEMBER_PER_PAGE);

  if (items.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">회원이 없습니다.</p>';
    document.getElementById('member-pagination').innerHTML = '';
    return;
  }

  listEl.innerHTML = items.map(m => `
    <div class="row-item">
      <input type="checkbox" class="row-check member-check" data-id="${m.id}">
      <div style="flex:1; min-width:200px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="row-strong">${esc(m.name || '이름없음')}</span>
          <span class="badge grade-${m.grade || '일반회원'}">${m.grade || '일반회원'}</span>
        </div>
        <div style="font-size:12px; color:#6b7280; line-height:1.5;">
          아이디: ${esc(m.user_id || m.username || '-')} | 이름: ${esc(m.name || '-')}<br>
          연락처: ${esc(m.phone || '-')} | 이메일: ${esc(m.email || '-')}<br>
          통관번호: ${esc(m.customs_number || m.customs_code || m.personal_customs_code || '-')}
        </div>
      </div>
      <div class="row-actions">
        <button class="btn btn-success btn-sm issue-coupon-btn" data-id="${m.id}">쿠폰 발급</button>
        <button class="btn btn-secondary btn-sm member-detail-btn" data-id="${m.id}">상세보기</button>
        <button class="btn btn-danger btn-sm del-member-btn" data-id="${m.id}">삭제</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.issue-coupon-btn').forEach(btn => {
    btn.onclick = () => openCouponIssueModal(btn.dataset.id);
  });
  listEl.querySelectorAll('.member-detail-btn').forEach(btn => {
    btn.onclick = () => openMemberDetailModal(btn.dataset.id);
  });
  listEl.querySelectorAll('.del-member-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('정말 삭제할까요?')) return;
      const { error } = await db.from('members').delete().eq('id', btn.dataset.id);
      if (error) alert('삭제 실패: ' + error.message);
      else loadMembers();
    };
  });

  renderMemberPagination(totalPages);
}

function renderMemberPagination(totalPages) {
  const el = document.getElementById('member-pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn ${i === memberPage ? 'btn-primary' : 'btn-secondary'} btn-sm" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    memberPage = Number(b.dataset.page);
    renderMembers();
  });
}

// ============ 쿠폰 발급 모달 ============
function openCouponIssueModal(memberId) {
  const member = allMembers.find(x => String(x.id) === String(memberId));
  if (!member) return alert('회원 정보를 찾을 수 없습니다. 목록을 새로고침해 주세요.');
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal-box" style="max-width:520px;border-radius:4px;">
    <h2>회원 쿠폰 발급</h2>
    <p style="font-size:13px;color:#64748b;margin:-5px 0 12px;">${esc(member.name)} / ${esc(member.email)}</p>
    <form id="member-coupon-form" class="modal-form">
      <label>쿠폰명</label><input name="name" placeholder="예: 감사 쿠폰">
      <label>할인 유형</label><select name="type"><option value="percent">퍼센트 할인</option><option value="amount">금액 할인</option></select>
      <label>할인값</label><input name="value" type="number" min="1" value="10" required>
      <label>유효기간 (일)</label><input name="days" type="number" min="1" value="30" required>
      <div id="member-coupon-msg" class="msg"></div>
      <div class="modal-actions">
        <button type="submit" class="btn btn-success">쿠폰 발급</button>
        <button type="button" id="close-member-coupon" class="btn btn-secondary">닫기</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#close-member-coupon').onclick = () => modal.remove();
  modal.querySelector('#member-coupon-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const msg = modal.querySelector('#member-coupon-msg');
    const value = Number(f.value.value);
    const days = Number(f.days.value);
    if (!(value > 0) || !(days > 0)) {
      msg.className = 'msg error';
      msg.textContent = '할인값과 유효기간을 확인하세요.';
      return;
    }
    const code = 'CP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    msg.className = 'msg';
    msg.textContent = '발급 중...';
    const { error } = await db.from('coupons').insert({
      member_id: member.id, code,
      name: f.name.value.trim() || '관리자 발급 쿠폰',
      type: f.type.value, discount_value: value,
      expires_at: expiry.toISOString(), is_used: false
    });
    if (error) {
      msg.className = 'msg error';
      msg.textContent = '발급 실패: ' + error.message;
    } else {
      msg.className = 'msg success';
      msg.textContent = '발급 완료! 쿠폰 코드: ' + code;
      f.querySelector('button[type="submit"]').disabled = true;
      if (document.getElementById('tab-coupons').classList.contains('active')) loadCouponsAndMembers();
    }
  };
}

// ============ 회원 상세 모달 ============
function openMemberDetailModal(memberId) {
  const m = allMembers.find(x => String(x.id) === String(memberId));
  if (!m) return;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  const display = (v) => v === null || v === undefined || v === ''
    ? '-' : (typeof v === 'object' ? JSON.stringify(v) : String(v));

  const formatMemberCreatedAt = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return display(value);
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(d);
    const part = type => parts.find(x => x.type === type)?.value || '';
    return `${part('year')}/${part('month')}/${part('day')} ${part('hour')}:${part('minute')}`;
  };

  const fields = [
    ['회원가입 날짜', formatMemberCreatedAt(m.created_at)],
    ['아이디', display(m.user_id || m.username)],
    ['이름', m.name],
    ['수취인', display(m.receiver_name || m.recipient_name)],
    ['연락처', m.phone || m.receiver_phone],
    ['개인통관고유부호', display(m.customs_number || m.customs_code || m.personal_customs_code)],
    ['이메일', m.email],
    ['우편번호', m.postcode],
    ['주소', m.address],
    ['상세주소', m.address_detail]
  ];
  const fieldsHtml = fields.map(([label, value]) =>
    `<div class="nav-order-field"><span>${label}</span><b>${esc(display(value))}</b></div>`
  ).join('');

  const status = m.status || '정상';
  const grade = m.grade || '일반회원';
  const currentCustoms = m.customs_number || m.customs_code || m.personal_customs_code || '';

  modal.innerHTML = `<div class="modal-box modal-lg" style="border-radius:4px;max-width:900px;">
    <h2>회원 상세 및 관리</h2>
    <div class="member-detail-card">
      <div class="member-detail-grid">${fieldsHtml}</div>
      <div class="member-detail-actions">
        <label>회원 상태
          <select id="member-status-select">
            <option value="정상" ${status==='정상'?'selected':''}>정상</option>
            <option value="정지" ${status==='정지'?'selected':''}>정지</option>
            <option value="탈퇴" ${status==='탈퇴'?'selected':''}>탈퇴</option>
          </select>
        </label>
        <label>회원 등급
          <select id="member-grade-select">
            <option value="일반회원" ${grade==='일반회원'?'selected':''}>일반회원</option>
            <option value="도매회원" ${grade==='도매회원'?'selected':''}>도매회원</option>
            <option value="VIP회원" ${grade==='VIP회원'?'selected':''}>VIP회원</option>
          </select>
        </label>
        <label style="flex:1;min-width:200px;">개인통관고유부호
          <input id="member-customs-input" type="text" inputmode="numeric" maxlength="13" pattern="[0-9]{13}"
            value="${esc(currentCustoms)}" placeholder="13자리 숫자"
            oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        </label>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="member-detail-save">관리 내용 저장</button>
      <button class="btn btn-secondary" id="member-detail-close">닫기</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#member-detail-close').onclick = () => modal.remove();

  modal.querySelector('#member-detail-save').onclick = async () => {
    const statusValue = modal.querySelector('#member-status-select').value;
    const gradeValue = modal.querySelector('#member-grade-select').value;
    const customsVal = (modal.querySelector('#member-customs-input')?.value || '').trim();

    if (customsVal && !/^\d{13}$/.test(customsVal)) {
      alert('개인통관고유부호는 13자리 숫자여야 합니다.');
      return;
    }

    const payload = { status: statusValue, grade: gradeValue };
    if (customsVal) payload.customs_number = customsVal;

    const btn = modal.querySelector('#member-detail-save');
    btn.disabled = true;
    btn.textContent = '저장 중...';

    const { error } = await db.from('members').update(payload).eq('id', m.id);
    btn.disabled = false;
    btn.textContent = '관리 내용 저장';

    if (error) {
      if (/customs_number|column/i.test(error.message) && customsVal) {
        const { error: e2 } = await db.from('members').update({ status: statusValue, grade: gradeValue }).eq('id', m.id);
        if (e2) { alert('저장 실패: ' + e2.message); return; }
        alert('회원 상태/등급은 저장되었으나, 개인통관부호 컬럼이 members 테이블에 없습니다.\nSupabase에서 아래 SQL 실행 후 다시 시도하세요:\n\nALTER TABLE members ADD COLUMN IF NOT EXISTS customs_number text;');
      } else {
        alert('저장 실패: ' + error.message);
      }
    } else {
      alert('회원 관리 정보가 저장되었습니다.');
      modal.remove();
      loadMembers();
    }
  };
}

// ============ 검색 이벤트 ============
document.getElementById('member-search-btn').onclick = () =>
  applyMemberSearch(document.getElementById('member-search').value.trim());
document.getElementById('member-reset-btn').onclick = () => {
  document.getElementById('member-search').value = '';
  applyMemberSearch('');
};
document.getElementById('member-search').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyMemberSearch(e.target.value.trim());
  }
});
