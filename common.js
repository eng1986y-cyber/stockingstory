// ===== 공통 유틸 =====

// 연락처 자동 하이픈 (이벤트 위임)
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.tagName !== 'INPUT') return;
  const isPhone = (el.name && /phone/i.test(el.name)) || (el.id && /phone/i.test(el.id));
  if (!isPhone) return;

  const num = el.value.replace(/[^0-9]/g, '').slice(0, 11);
  if (num.length < 4) el.value = num;
  else if (num.length < 7) el.value = num.slice(0,3) + '-' + num.slice(3);
  else if (num.length < 11) el.value = num.slice(0,3) + '-' + num.slice(3,6) + '-' + num.slice(6);
  else el.value = num.slice(0,3) + '-' + num.slice(3,7) + '-' + num.slice(7);
});

function applyPhoneAttrs() {
  document.querySelectorAll('input[name*="phone" i], input[id*="phone" i]').forEach(el => {
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('autocomplete', 'tel');
  });
}

// ===== 공통 헤더 렌더 =====
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  const member = localStorage.getItem('member');
  const m = member ? JSON.parse(member) : null;

  const btnStyle = (active) => `
    padding:8px 14px;
    background:${active ? '#222' : '#fff'};
    color:${active ? '#fff' : '#222'};
    border:1px solid #ddd;
    border-radius:6px;
    text-decoration:none;
    font-size:14px;
    font-weight:500;
    display:inline-block;
  `;

  const userBtns = m
    ? `
      <span style="color:#555; font-size:13px; padding:0 6px;">${m.name}님</span>
      <a href="mypage.html" style="${btnStyle(current === 'mypage')}">내정보</a>
      <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>
    `
    : `
      <a href="login.html" style="${btnStyle(current === 'login')}">로그인</a>
      <a href="signup.html" style="${btnStyle(current === 'signup')}">회원가입</a>
    `;

  wrap.innerHTML = `
    <header style="background:#fff; border-bottom:1px solid #eee; padding:14px 16px;">
      <div style="max-width:1100px; margin:0 auto;">
        <div style="margin-bottom:12px;">
          <a href="index.html" style="font-size:22px; font-weight:700; color:#222; text-decoration:none;">🛍️ 심플몰</a>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <a href="cart.html" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count">0</span></a>
          <a href="orders.html" style="${btnStyle(current === 'orders')}">주문조회</a>
          ${userBtns}
        </div>
      </div>
    </header>
  `;

  // 장바구니 개수
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = cart.length;

  // 로그아웃
  const lb = document.getElementById('logout-btn');
  if (lb) {
    lb.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('member');
      location.href = 'index.html';
    };
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  applyPhoneAttrs();
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });
});