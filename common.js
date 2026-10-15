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

    /* ⭐ 플로팅 스크롤 버튼 */
    #scroll-btns {
      position: fixed;
      right: 16px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 900;
    }
    #scroll-btns button {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: #fff;
      color: #222;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
      transition: background .15s, transform .1s;
    }
    #scroll-btns button:hover {
      background: #f0f0f0;
    }
    #scroll-btns button:active {
      transform: scale(.92);
    }
    @media (max-width: 768px) {
      #scroll-btns {
        right: 12px;
        bottom: 12px;
      }
      #scroll-btns button {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }
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

// ===== ⭐ 플로팅 스크롤 버튼 생성 =====
function createScrollButtons() {
  if (document.getElementById('scroll-btns')) return;

  const wrap = document.createElement('div');
  wrap.id = 'scroll-btns';
  wrap.innerHTML = `
    <button id="btn-scroll-top" title="맨 위로" aria-label="맨 위로">▲</button>
    <button id="btn-scroll-bottom" title="맨 아래로" aria-label="맨 아래로">▼</button>
  `;
  document.body.appendChild(wrap);

  const btnTop = document.getElementById('btn-scroll-top');
  const btnBottom = document.getElementById('btn-scroll-bottom');

  btnTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btnBottom.addEventListener('click', () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  });

  // 페이지가 짧아서 스크롤 없으면 숨김
  const updateVisibility = () => {
    const canScroll = document.documentElement.scrollHeight > window.innerHeight + 50;
    wrap.style.display = canScroll ? 'flex' : 'none';
  };
  updateVisibility();

  window.addEventListener('resize', updateVisibility);
  // DOM 변경(콘텐츠 로드) 감지
  const obs = new MutationObserver(updateVisibility);
  obs.observe(document.body, { childList: true, subtree: true });
  // 스크롤 시에도 재확인 (이미지 lazy 로드 등)
  window.addEventListener('scroll', updateVisibility, { passive: true });
}

// ===== 로고 캐시 =====
function getCachedLogo() {
  try { return JSON.parse(localStorage.getItem('logo_cache') || 'null') || {}; }
  catch { return {}; }
}
function setCachedLogo(obj) {
  try { localStorage.setItem('logo_cache', JSON.stringify(obj)); } catch {}
}

async function refreshLogoCache() {
  if (typeof supabase === 'undefined') return;
  try {
    let client = window.db;
    if (!client) {
      client = supabase.createClient(
        "https://alpdhgcipjeekzrpxlbh.supabase.co",
        "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya",
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      window.db = client;
    }
    const { data } = await client.from('logos').select('*')
      .order('id', { ascending: false }).limit(1).maybeSingle();
    if (data) {
      setCachedLogo({ image_url: data.image_url || '', site_name: data.site_name || '' });
    } else {
      setCachedLogo({ image_url: '', site_name: '' });
    }
  } catch (e) {}
}

// ===== 회원 상태 서버에서 재확인 =====
async function verifyMemberStatus() {
  const memberStr = localStorage.getItem('member');
  if (!memberStr) return true;

  let member;
  try { member = JSON.parse(memberStr); } catch { return true; }
  if (!member || !member.id) return true;

  if (typeof supabase === 'undefined') return true;

  try {
    let client = window.db;
    if (!client) {
      client = supabase.createClient(
        "https://alpdhgcipjeekzrpxlbh.supabase.co",
        "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya",
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );
      window.db = client;
    }

    const { data, error } = await client
      .from('members')
      .select('id, status')
      .eq('id', member.id)
      .maybeSingle();

    if (error) return true;

    if (!data) {
      localStorage.removeItem('member');
      alert('회원 정보가 없어졌습니다. 다시 로그인해주세요.');
      location.href = 'index.html';
      return false;
    }

    const status = data.status || '정상';

    if (status === '정지') {
      localStorage.removeItem('member');
      alert('정지된 계정입니다. 관리자에게 문의하세요.');
      location.href = 'index.html';
      return false;
    }
    if (status === '탈퇴') {
      localStorage.removeItem('member');
      alert('탈퇴한 계정입니다.');
      location.href = 'index.html';
      return false;
    }

    member.status = status;
    localStorage.setItem('member', JSON.stringify(member));
    return true;

  } catch (e) {
    return true;
  }
}

// ===== 공통 헤더 렌더 =====
let _headerRendered = false;
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  if (_headerRendered && wrap.querySelector('header')) {
    wrap.querySelectorAll('[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === current;
      el.style.background = isActive ? '#222' : '#fff';
      el.style.color = isActive ? '#fff' : '#222';
    });
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cc = document.getElementById('cart-count');
    if (cc) cc.textContent = cart.length;
    return;
  }

  const member = localStorage.getItem('member');
  const m = member ? JSON.parse(member) : null;

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
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block; margin:0 auto;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:#222; text-decoration:none; display:inline-block;">${siteName}</a>`;

  wrap.innerHTML = `
    <header style="background:#fff; border-bottom:1px solid #eee; padding:14px 16px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:12px; text-align:center;">${logoHtml}</div>
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

  refreshLogoCache();
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', async () => {
  applyPhoneAttrs();
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });

  // ⭐ 플로팅 스크롤 버튼 생성
  createScrollButtons();

  // 정지 회원 자동 로그아웃
  const isOk = await verifyMemberStatus();
  if (!isOk) return;

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