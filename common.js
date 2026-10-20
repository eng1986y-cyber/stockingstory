// ===== 공통 유틸 =====

// ⭐ 페이지 판별 (스크립트 로드 즉시 실행)
const _pathName = location.pathname.split('/').pop().replace('.html','') || 'index';
const _isIndex = (_pathName === '' || _pathName === 'index');
const _isAdmin = (_pathName === 'admin' || _pathName === 'edit');
const _isDark = !_isIndex && !_isAdmin;

if (_isDark) {
  document.documentElement.style.background = '#0a0a0a';
}

// ⭐⭐⭐ 스타일을 즉시 주입 (DOMContentLoaded 이전) — CSS 우선순위 확보
(function injectCommonStyles() {
  if (document.getElementById('common-js-style')) return;
  const style = document.createElement('style');
  style.id = 'common-js-style';
  style.textContent = `
    /* ⭐ body 스크롤은 브라우저 기본 사용 */
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      -webkit-text-size-adjust: 100%;
    }

    /* ⭐ 상단 헤더: sticky로 스크롤 시 상단 고정 */
    #app-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 99999 !important;
      background: #fff;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    body.dark #app-header { background: #0f0f0f; }

    /* PC 상단 네비게이션 */
    .header-nav-wrap {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
    }

    /* ⭐⭐⭐ 모바일: 상단 헤더 네비 무조건 숨김 (최우선순위) ⭐⭐⭐ */
    @media (max-width: 768px) {
      #app-header .header-nav-wrap,
      #app-header .header-nav-wrap * {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
      }
      #app-header header {
        padding: 10px 16px 8px 16px !important;
      }
      #app-header .header-name-row {
        margin-bottom: 0 !important;
        min-height: 16px !important;
        line-height: 16px !important;
      }
      /* ⭐ 모바일 하단 탭바 공간 확보 */
      body {
        padding-bottom: calc(65px + env(safe-area-inset-bottom)) !important;
      }
    }

    /* 로딩 스피너 */
    .page-loader {
      position: fixed; inset: 0;
      background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
      z-index: 999999;
      transition: opacity 0.2s ease;
    }
    .page-loader.hide { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #e5e7eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* 이미지 복사/드래그 방지 */
    img {
      -webkit-user-drag: none !important;
      user-drag: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
      pointer-events: none !important;
    }
    a img { pointer-events: auto !important; }

    /* 플로팅 스크롤 버튼 */
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
      width: 44px; height: 44px; border-radius: 50%;
      border: 1px solid #ddd; background: #fff; color: #222;
      font-size: 18px; font-weight: 700; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      display: flex; align-items: center; justify-content: center;
      padding: 0; line-height: 1;
    }
    body.dark #scroll-btns button {
      border-color: #333; background: #1a1a1a; color: #e5e7eb;
    }
    @media (max-width: 768px) {
      #scroll-btns { bottom: calc(85px + env(safe-area-inset-bottom)); }
      #scroll-btns button { width: 40px; height: 40px; font-size: 16px; }
    }

    /* Footer */
    #app-footer { margin-top: 40px; padding: 24px 16px; background: #fafafa; border-top: 1px solid #eee; color: #666; font-size: 13px; line-height: 1.8; }
    body.dark #app-footer { background: #0f0f0f; border-top-color: #1f1f1f; color: #888; }
    #app-footer .footer-inner { max-width: 1400px; margin: 0 auto; text-align: center; }
    #app-footer .footer-title { font-weight: 700; font-size: 14px; color: #333; margin-bottom: 8px; }
    body.dark #app-footer .footer-title { color: #ccc; }
    #app-footer .footer-row { display: flex; flex-wrap: wrap; gap: 6px 16px; justify-content: center; }
    #app-footer .footer-item { color: #666; }
    body.dark #app-footer .footer-item { color: #888; }
    #app-footer .footer-text { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ddd; font-size: 12px; color: #999; white-space: pre-wrap; max-width: 800px; margin-left: auto; margin-right: auto; }
    body.dark #app-footer .footer-text { border-top-color: #222; color: #555; }

    /* ⭐⭐⭐ 모바일 하단 고정 탭바 (fixed) ⭐⭐⭐ */
    #mobile-bottom-nav {
      display: none;
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      height: 65px;
      background: #fff;
      border-top: 1px solid #eee;
      z-index: 99999 !important;
      justify-content: space-around;
      align-items: center;
      padding-bottom: env(safe-area-inset-bottom);
    }
    body.dark #mobile-bottom-nav {
      background: #0f0f0f;
      border-top-color: #222;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-decoration: none;
      color: #9ca3af;
      font-size: 11px;
      font-weight: 500;
      flex: 1;
      height: 100%;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .bottom-nav-item.active { color: #111827; }
    body.dark .bottom-nav-item.active { color: #fff; }
    .bottom-nav-item .nav-icon {
      width: 22px; height: 22px;
      stroke: currentColor; stroke-width: 1.5;
      fill: none; stroke-linecap: round; stroke-linejoin: round;
    }
    .bottom-nav-item .cart-badge {
      position: absolute;
      top: 6px;
      right: 50%;
      transform: translateX(16px);
      background: #ef4444; color: #fff;
      font-size: 10px; font-weight: bold;
      border-radius: 10px; padding: 2px 5px; line-height: 1;
    }

    @media (max-width: 768px) {
      #mobile-bottom-nav { display: flex !important; }
    }
  `;
  document.head.appendChild(style);
})();

// 이미지 복사 방지
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

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

function createScrollButtons() {
  if (_isAdmin) return;
  if (document.getElementById('scroll-btns')) return;
  const wrap = document.createElement('div');
  wrap.id = 'scroll-btns';
  wrap.innerHTML = `
    <button id="btn-scroll-top" title="맨 위로">▲</button>
    <button id="btn-scroll-bottom" title="맨 아래로">▼</button>
  `;
  document.body.appendChild(wrap);
  
  document.getElementById('btn-scroll-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('btn-scroll-bottom').addEventListener('click', () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  });
  
  const updateVisibility = () => {
    const canScroll = document.documentElement.scrollHeight > window.innerHeight + 50;
    wrap.style.display = canScroll ? 'flex' : 'none';
  };
  updateVisibility();
  window.addEventListener('resize', updateVisibility);
  new MutationObserver(updateVisibility).observe(document.body, { childList: true, subtree: true, characterData: true });
}

function getCachedLogo() {
  try { return JSON.parse(localStorage.getItem('logo_cache') || 'null') || {}; }
  catch { return {}; }
}
function setCachedLogo(obj) {
  try { localStorage.setItem('logo_cache', JSON.stringify(obj)); } catch {}
}
function getCachedFooter() {
  try { return JSON.parse(localStorage.getItem('footer_cache') || 'null') || {}; }
  catch { return {}; }
}
function setCachedFooter(obj) {
  try { localStorage.setItem('footer_cache', JSON.stringify(obj)); } catch {}
}

function getSupabaseClient() {
  if (typeof supabase === 'undefined') return null;
  let client = window.db;
  if (!client) {
    client = supabase.createClient(
      "https://alpdhgcipjeekzrpxlbh.supabase.co",
      "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya",
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
    window.db = client;
  }
  return client;
}

async function refreshLogoCache() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { data } = await client.from('logos').select('*').order('id', { ascending: false }).limit(1).maybeSingle();
    if (data) setCachedLogo({ image_url: data.image_url || '', site_name: data.site_name || '' });
    else setCachedLogo({ image_url: '', site_name: '' });
  } catch (e) {}
}

async function refreshFooterCache() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { data } = await client.from('settings').select('key, value').in('key', ['footer_owner','footer_phone','footer_email','footer_address','footer_business','footer_text']);
    const obj = {};
    (data || []).forEach(row => { obj[row.key] = row.value || ''; });
    setCachedFooter(obj);
  } catch (e) {}
}

function renderFooter() {
  let wrap = document.getElementById('app-footer');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'app-footer';
    document.body.appendChild(wrap);
  }
  const f = getCachedFooter();
  const owner = f.footer_owner || '';
  const phone = f.footer_phone || '';
  const email = f.footer_email || '';
  const address = f.footer_address || '';
  const business = f.footer_business || '';
  const text = f.footer_text || '';

  if (!owner && !phone && !email && !address && !business && !text) {
    wrap.style.display = 'none';
    refreshFooterCache();
    return;
  }
  wrap.style.display = 'block';

  const items = [];
  if (phone) items.push(`<span class="footer-item">📞 ${phone}</span>`);
  if (email) items.push(`<span class="footer-item">✉️ ${email}</span>`);
  if (business) items.push(`<span class="footer-item">사업자번호: ${business}</span>`);

  wrap.innerHTML = `
    <div class="footer-inner">
      ${owner ? `<div class="footer-title">${owner}</div>` : ''}
      ${address ? `<div class="footer-item" style="margin-bottom:6px;">${address}</div>` : ''}
      ${items.length ? `<div class="footer-row">${items.join('')}</div>` : ''}
      ${text ? `<div class="footer-text">${text}</div>` : ''}
    </div>
  `;
}

async function verifyMemberStatus() {
  const memberStr = localStorage.getItem('member');
  if (!memberStr) return true;
  let member;
  try { member = JSON.parse(memberStr); } catch { return true; }
  if (!member || !member.id) return true;
  const client = getSupabaseClient();
  if (!client) return true;
  try {
    const { data, error } = await client.from('members').select('id, status').eq('id', member.id).maybeSingle();
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
  } catch (e) { return true; }
}

// ===== 헤더 및 하단 탭바 렌더 =====
let _headerRendered = false;
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  // ⭐ 모바일 감지 (렌더링 자체를 분기)
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const isDark = _isDark;
  const theme = isDark ? {
    headerBg: '#0f0f0f', borderColor: '#222', logoColor: '#fff',
    btnBg: '#1a1a1a', btnBgActive: '#e5e7eb', btnText: '#e5e7eb', btnTextActive: '#111', btnBorder: '#333', btnBorderActive: '#e5e7eb', nameColor: '#888',
  } : {
    headerBg: '#fff', borderColor: '#eee', logoColor: '#222',
    btnBg: '#fff', btnBgActive: '#222', btnText: '#222', btnTextActive: '#fff', btnBorder: '#ddd', btnBorderActive: '#222', nameColor: '#555',
  };

  if (_headerRendered && wrap.querySelector('header')) {
    wrap.querySelectorAll('[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === current;
      el.style.background = isActive ? theme.btnBgActive : theme.btnBg;
      el.style.color = isActive ? theme.btnTextActive : theme.btnText;
      el.style.borderColor = isActive ? theme.btnBorderActive : theme.btnBorder;
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      if (el.dataset.nav === current) el.classList.add('active');
      else el.classList.remove('active');
    });

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cc = document.getElementById('cart-count');
    const badge = document.getElementById('bottom-cart-badge');
    if (cc) cc.textContent = cart.length;
    if (badge) {
      badge.textContent = cart.length;
      badge.style.display = cart.length > 0 ? 'block' : 'none';
    }
    return;
  }

  const member = localStorage.getItem('member');
  const m = member ? JSON.parse(member) : null;
  const cached = getCachedLogo();
  const logoImageUrl = cached.image_url || '';
  const siteName = cached.site_name || '스타킹스토리 심플라이프';

  const btnStyle = (active) => `
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    padding: 8px 14px; min-width: 76px; height: 36px;
    background: ${active ? theme.btnBgActive : theme.btnBg};
    color: ${active ? theme.btnTextActive : theme.btnText};
    border: 1px solid ${active ? theme.btnBorderActive : theme.btnBorder};
    border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;
    white-space: nowrap; box-sizing: border-box; flex-shrink: 0;
  `;

  const svgIcons = {
    home: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    cart: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    orders: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    mypage: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    login: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
  };

  const userBtns = m
    ? `<a href="mypage.html" data-nav="mypage" style="${btnStyle(current === 'mypage')}">내정보</a>
       <a href="myorders.html" data-nav="myorders" style="${btnStyle(current === 'myorders')}">주문내역</a>
       <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>`
    : `<a href="login.html" data-nav="login" style="${btnStyle(current === 'login')}">로그인</a>
       <a href="signup.html" data-nav="signup" style="${btnStyle(current === 'signup')}">회원가입</a>`;

  const nameRow = `
    <div class="header-name-row" style="text-align:center; font-size:13px; color:${theme.nameColor}; margin-bottom:12px; min-height:18px; line-height:18px; font-weight:500;">
      ${m ? `${m.name}님` : ''}
    </div>
  `;

  const logoHtml = logoImageUrl
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block; margin:0 auto;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:${theme.logoColor}; text-decoration:none; display:inline-block;">${siteName}</a>`;

  // ⭐⭐⭐ 핵심: 모바일이면 .header-nav-wrap을 아예 DOM에 넣지 않음 ⭐⭐⭐
  const navHtml = isMobile ? '' : `
    <div class="header-nav-wrap">
      <a href="cart.html" data-nav="cart" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count" style="margin-left:4px;">0</span></a>
      <a href="orders.html" data-nav="orders" style="${btnStyle(current === 'orders')}">주문조회</a>
      ${userBtns}
    </div>
  `;

  wrap.innerHTML = `
    <header style="background:${theme.headerBg}; border-bottom:1px solid ${theme.borderColor}; padding:${isMobile ? '10px 16px 8px 16px' : '12px 16px 10px 16px'};">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:${isMobile ? '4px' : '8px'}; text-align:center;">${logoHtml}</div>
        <div class="header-name-row" style="text-align:center; font-size:13px; color:${theme.nameColor}; margin-bottom:${isMobile ? '0' : '12px'}; min-height:${isMobile ? '16px' : '18px'}; line-height:${isMobile ? '16px' : '18px'}; font-weight:500;">
          ${m ? `${m.name}님` : ''}
        </div>
        ${navHtml}
      </div>
    </header>
  `;

  // ⭐ 하단 탭바 갱신 (모바일 전용이지만 PC에서도 DOM에 두고 CSS로 숨김)
  let bottomNav = document.getElementById('mobile-bottom-nav');
  if (!bottomNav) {
    bottomNav = document.createElement('nav');
    bottomNav.id = 'mobile-bottom-nav';
    document.body.appendChild(bottomNav);
  }

  const mobileTabMy = m 
    ? `<a href="mypage.html" data-nav="mypage" class="bottom-nav-item ${current === 'mypage' ? 'active' : ''}">${svgIcons.mypage}<span>내정보</span></a>`
    : `<a href="login.html" data-nav="login" class="bottom-nav-item ${current === 'login' ? 'active' : ''}">${svgIcons.login}<span>로그인</span></a>`;

  bottomNav.innerHTML = `
    <a href="index.html" data-nav="home" class="bottom-nav-item ${current === 'home' ? 'active' : ''}">${svgIcons.home}<span>홈</span></a>
    <a href="cart.html" data-nav="cart" class="bottom-nav-item ${current === 'cart' ? 'active' : ''}">
      ${svgIcons.cart}
      <span id="bottom-cart-badge" class="cart-badge" style="display:none;">0</span>
      <span>장바구니</span>
    </a>
    <a href="orders.html" data-nav="orders" class="bottom-nav-item ${current === 'orders' ? 'active' : ''}">${svgIcons.orders}<span>주문조회</span></a>
    ${mobileTabMy}
  `;

  _headerRendered = true;

  // 상단 카트 카운트 & 하단 배지 갱신
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cc = document.getElementById('cart-count');
  const badge = document.getElementById('bottom-cart-badge');
  if (cc) cc.textContent = cart.length;
  if (badge) {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'block' : 'none';
  }

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

// ⭐⭐⭐ DOM 부트스트랩: 재배치 로직 없음, 헤더/푸터/버튼만 렌더 ⭐⭐⭐
document.addEventListener('DOMContentLoaded', async () => {
  if (_isAdmin) {
    if (_isDark) document.body.classList.add('dark');
    applyPhoneAttrs();
    return;
  }

  const loader = document.createElement('div');
  loader.className = 'page-loader';
  if (!_isDark) loader.style.background = '#f8f8f8';
  loader.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loader);

  if (_isDark) document.body.classList.add('dark');
  applyPhoneAttrs();
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });

  createScrollButtons();
  renderFooter();

  const isOk = await verifyMemberStatus();
  if (!isOk) return;

  const map = { 'index': 'home', 'login': 'login', 'signup': 'signup', 'cart': 'cart', 'orders': 'orders', 'product': 'product', 'mypage': 'mypage', 'myorders': 'myorders' };
  const current = map[_pathName] || 'home';

  if (document.getElementById('app-header')) renderHeader(current);

  setTimeout(() => {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 300);
  }, 300);
});