// ===== 공통 유틸 =====

// 좌우 흔들림 완전 방지
(function() {
  const style = document.createElement('style');
  style.textContent = `
    html {
      overflow-y: scroll !important;
      overflow-x: hidden !important;
    }
    body {
      overflow-x: hidden !important;
      margin: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    #app-header, #app-header * {
      box-sizing: border-box;
    }
    #app-header a, #app-header button, #app-header span {
      white-space: nowrap;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
})();

// 연락처 자동 하이픈
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

// ===== Supabase 클라이언트 (로고 로드용) =====
let _logoDb = null;
function getLogoDb() {
  if (_logoDb) return _logoDb;
  if (typeof supabase === 'undefined') return null;
  _logoDb = supabase.createClient(
    "https://alpdhgcipjeekzrpxlbh.supabase.co",
    "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya"
  );
  return _logoDb;
}

// ===== 공통 헤더 렌더 =====
async function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  const member = localStorage.getItem('member');
  const m = member ? JSON.parse(member) : null;

  // 로고 로드 (실패 시 기본값)
  let logoImageUrl = '';
  let siteName = '🛍️ 심플몰';
  try {
    const db = getLogoDb();
    if (db) {
      const { data } = await db.from('logos').select('*').order('id', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        logoImageUrl = data.image_url || '';
        siteName = data.site_name || siteName;
      }
    }
  } catch (e) {}

  const btnStyle = (active) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    min-width: 76px;
    height: 36px;
    background: ${active ? '#222' : '#fff'};
    color: ${active ? '#fff' : '#222'};
    border: 1px solid #ddd;
    border-radius: 6px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    box-sizing: border-box;
    flex-shrink: 0;
  `;

  const userBtns = m
    ? `
      <span style="color:#555; font-size:13px; padding:0 6px; white-space:nowrap;">${m.name}님</span>
      <a href="mypage.html" style="${btnStyle(current === 'mypage')}">내정보</a>
      <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>
    `
    : `
      <a href="login.html" style="${btnStyle(current === 'login')}">로그인</a>
      <a href="signup.html" style="${btnStyle(current === 'signup')}">회원가입</a>
    `;

  // 로고 영역: 이미지 있으면 이미지, 없으면 텍스트
  const logoHtml = logoImageUrl
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:#222; text-decoration:none;">${siteName}</a>`;

  wrap.innerHTML = `
    <header style="background:#fff; border-bottom:1px solid #eee; padding:14px 16px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:12px;">${logoHtml}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:flex-end;">
          <a href="cart.html" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count" style="margin-left:4px;">0</span></a>
          <a href="orders.html" style="${btnStyle(current === 'orders')}">주문조회</a>
          ${userBtns}
        </div>
      </div>
    </header>
  `;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = cart.length;

  const lb = document.getElementById('logout-btn');
  if (lb) {
    lb.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('member');
      location.href = 'index.html';
    };
  }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', () => {
  applyPhoneAttrs();
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });

  const path = location.pathname.split('/').pop().replace('.html', '') || 'index';
  const map = {
    'index': 'home',
    'login': 'login',
    'signup': 'signup',
    'cart': 'cart',
    'orders': 'orders',
    'product': 'product',
    'mypage': 'mypage',
  };
  const current = map[path] || 'home';

  if (document.getElementById('app-header')) {
    renderHeader(current);
  }
});