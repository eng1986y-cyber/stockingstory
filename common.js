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

// ===== 로고 캐시 (localStorage) =====
function getCachedLogo() {
  try { return JSON.parse(localStorage.getItem('logo_cache') || 'null') || {}; }
  catch { return {}; }
}
function setCachedLogo(obj) {
  try { localStorage.setItem('logo_cache', JSON.stringify(obj)); } catch {}
}

// Supabase에서 로고 한 번만 가져와서 캐시 갱신 (헤더 재렌더 없음)
async function refreshLogoCache() {
  if (typeof supabase === 'undefined') return;
  try {
    const db = supabase.createClient(
      "https://alpdhgcipjeekzrpxlbh.supabase.co",
      "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya"
    );
    const { data } = await db.from('logos').select('*')
      .order('id', { ascending: false }).limit(1).maybeSingle();
    if (data) {
      setCachedLogo({ image_url: data.image_url || '', site_name: data.site_name || '' });
    } else {
      setCachedLogo({ image_url: '', site_name: '' });
    }
  } catch (e) {}
}

// ===== 공통 헤더 렌더 (동기, 헤더 한 번만 그림) =====
let _headerRendered = false;
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  // 이미 렌더된 헤더가 있으면 active 상태만 바꿈
  if (_headerRendered && wrap.querySelector('header')) {
    // active 스타일만 갱신
    wrap.querySelectorAll('[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === current;
      el.style.background = isActive ? '#222' : '#fff';
      el.style.color = isActive ? '#fff' : '#222';
    });
    // 장바구니 카운트만 갱신
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cc = document.getElementById('cart-count');
    if (cc) cc.textContent = cart.length;
    return;
  }

  const member = localStorage.getItem('member');
  const m = member ? JSON.parse(member) : null;

  // 로고는 캐시에서 즉시 사용
  const cached = getCachedLogo();
  const logoImageUrl = cached.image_url || '';
  const siteName = cached.site_name || '🛍️ 심플몰';

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
      <a href="mypage.html" data-nav="mypage" style="${btnStyle(current === 'mypage')}">내정보</a>
      <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>
    `
    : `
      <a href="login.html" data-nav="login" style="${btnStyle(current === 'login')}">로그인</a>
      <a href="signup.html" data-nav="signup" style="${btnStyle(current === 'signup')}">회원가입</a>
    `;

  const logoHtml = logoImageUrl
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:#222; text-decoration:none;">${siteName}</a>`;

  wrap.innerHTML = `
    <header style="background:#fff; border-bottom:1px solid #eee; padding:14px 16px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:12px;">${logoHtml}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:flex-end;">
          <a href="cart.html" data-nav="cart" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count" style="margin-left:4px;">0</span></a>
          <a href="orders.html" data-nav="orders" style="${btnStyle(current === 'orders')}">주문조회</a>
          ${userBtns}
        </div>
      </div>
    </header>
  `;

  _headerRendered = true;

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

  // 백그라운드에서 로고 캐시 갱신 (헤더 재렌더 없음)
  // 로고가 실제로 바뀐 경우에만 다음 방문 시 반영
  refreshLogoCache();
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