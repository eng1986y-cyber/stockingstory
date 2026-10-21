// ===== 공통 유틸 =====

// ⭐ 페이지 판별
const _pathName = location.pathname.split('/').pop().replace('.html','') || 'index';
const _isIndex = (_pathName === '' || _pathName === 'index');
const _isAdmin = (_pathName === 'admin' || _pathName === 'edit');
const _isDark = !_isIndex && !_isAdmin;

if (_isDark) {
  document.documentElement.style.background = '#0a0a0a';
}

(function() {
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      margin: 0; padding: 0;
      height: 100% !important;
      overflow: hidden !important;
      width: 100%;
      -webkit-text-size-adjust: 100%;
      overscroll-behavior: none;
    }
    .site-wrapper {
      display: flex; flex-direction: column;
      height: 100vh; height: 100dvh;
      width: 100%; overflow: hidden;
    }
    #app-header {
      flex-shrink: 0; flex-grow: 0;
      position: relative; z-index: 99999;
      background: #fff; width: 100%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      margin-bottom: 0 !important;
    }
    body.dark #app-header { background: #0f0f0f; }

    .site-main-scroll {
      flex: 1 1 0; min-height: 0;
      overflow-y: scroll; overflow-x: hidden;
      width: 100%; position: relative;
      padding-top: 0 !important;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: #d1d5db transparent;
    }
    body.dark .site-main-scroll { scrollbar-color: #333 transparent; }

    .site-main-scroll::-webkit-scrollbar { width: 8px; }
    .site-main-scroll::-webkit-scrollbar-track { background: transparent; }
    .site-main-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
    .site-main-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
    body.dark .site-main-scroll::-webkit-scrollbar-thumb { background: #333; }
    body.dark .site-main-scroll::-webkit-scrollbar-thumb:hover { background: #555; }

    .header-nav-wrap {
      display: flex; gap: 8px; flex-wrap: wrap;
      align-items: center; justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .header-nav-wrap { display: none !important; }
      #app-header header { padding: 10px 16px 8px 16px !important; }
      .header-name-row {
        margin-bottom: 0 !important;
        min-height: 16px !important; line-height: 16px !important;
      }
      .site-main-scroll { overflow-y: auto; }
    }

    .page-loader {
      position: fixed; inset: 0; background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
      z-index: 999999; transition: opacity 0.2s ease;
    }
    .page-loader.hide { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #e5e7eb;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    img {
      -webkit-user-drag: none !important; user-drag: none !important;
      user-select: none !important; -webkit-user-select: none !important;
      -webkit-touch-callout: none !important; pointer-events: none !important;
    }
    a img { pointer-events: auto !important; }

    #scroll-btns {
      position: fixed; left: 50%; transform: translateX(calc(700px + 16px));
      bottom: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 900;
    }
    #scroll-btns button {
      width: 44px; height: 44px; border-radius: 50%;
      border: 1px solid #ddd; background: #fff; color: #222;
      font-size: 18px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.12);
      display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1;
    }
    body.dark #scroll-btns button {
      border-color: #333; background: #1a1a1a; color: #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,.5);
    }
    @media (max-width: 1450px) { #scroll-btns { left: auto; right: 16px; transform: none; } }
    @media (max-width: 768px) {
      #scroll-btns { right: 12px; bottom: 85px; }
      #scroll-btns button { width: 40px; height: 40px; font-size: 16px; }
    }

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

    #app-footer .footer-sns-row {
      display: flex; justify-content: center; align-items: center;
      gap: 12px; margin-top: 14px;
    }
    #app-footer .footer-sns-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      border: 1px solid #e5e7eb; background: #fff; color: #4b5563;
      text-decoration: none; transition: all 0.15s ease;
      pointer-events: auto !important;
    }
    #app-footer .footer-sns-btn svg { pointer-events: none !important; }
    #app-footer .footer-sns-btn:hover {
      background: #111827; color: #fff; border-color: #111827;
    }
    body.dark #app-footer .footer-sns-btn {
      background: #1a1a1a; border-color: #333; color: #e5e7eb;
    }
    body.dark #app-footer .footer-sns-btn:hover {
      background: #e5e7eb; color: #111; border-color: #e5e7eb;
    }

    @media (max-width: 768px) {
      #app-footer {
        padding: 20px 16px;
        margin-top: 24px; font-size: 12px;
      }
      #app-footer .footer-sns-row {
        display: flex !important;
        visibility: visible !important;
        gap: 14px;
        margin-top: 16px;
        margin-bottom: 4px;
      }
      #app-footer .footer-sns-btn {
        display: inline-flex !important;
        visibility: visible !important;
        width: 44px; height: 44px;
      }
      #app-footer .footer-sns-btn svg {
        display: block !important;
        width: 22px; height: 22px;
      }
      #app-footer .footer-text { margin-top: 14px; padding-top: 14px; font-size: 11px; }

      .site-main-scroll {
        padding-bottom: calc(65px + env(safe-area-inset-bottom));
      }
    }

    #mobile-bottom-nav {
      display: none;
      height: 65px;
      flex-shrink: 0; flex-grow: 0;
      background: #fff; border-top: 1px solid #eee;
      z-index: 99999;
      justify-content: space-around; align-items: center;
      padding-bottom: env(safe-area-inset-bottom);
    }
    body.dark #mobile-bottom-nav {
      background: #0f0f0f; border-top-color: #222;
    }
    .bottom-nav-item {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px; text-decoration: none;
      color: #9ca3af; font-size: 10px; font-weight: 500;
      flex: 1 1 0; min-width: 0; height: 100%;
      border: none; background: none; cursor: pointer;
      padding: 0 2px; white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .bottom-nav-item > span {
      font-size: 10px; line-height: 1.1; white-space: nowrap;
    }
    .bottom-nav-item.active { color: #111827; }
    body.dark .bottom-nav-item.active { color: #fff; }
    .bottom-nav-item .nav-icon {
      width: 20px; height: 20px;
      stroke: currentColor; stroke-width: 1.5;
      fill: none; stroke-linecap: round; stroke-linejoin: round;
    }
    .bottom-nav-item .cart-badge {
      position: absolute; top: 6px; right: 50%;
      transform: translateX(16px);
      background: #ef4444; color: #fff;
      font-size: 10px; font-weight: bold;
      border-radius: 10px; padding: 2px 5px; line-height: 1;
    }

    @media (max-width: 768px) {
      #mobile-bottom-nav { display: flex; }
    }

    #mobile-bottom-nav.nav-count-6 .bottom-nav-item { padding: 0 1px; gap: 2px; }
    #mobile-bottom-nav.nav-count-6 .bottom-nav-item .nav-icon { width: 18px; height: 18px; }
    #mobile-bottom-nav.nav-count-6 .bottom-nav-item > span { font-size: 9px; }
  `;
  document.head.appendChild(style);
})();

document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

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
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('btn-scroll-bottom').addEventListener('click', () => {
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: mainScroll.scrollHeight, behavior: 'smooth' });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  });
  const updateVisibility = () => {
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) {
      wrap.style.display = (mainScroll.scrollHeight > mainScroll.clientHeight + 50) ? 'flex' : 'none';
    } else {
      wrap.style.display = (document.documentElement.scrollHeight > window.innerHeight + 50) ? 'flex' : 'none';
    }
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
    const { data } = await client.from('settings').select('key, value').in('key', [
      'footer_owner','footer_phone','footer_email','footer_address','footer_business','footer_text',
      'footer_instagram','footer_blog','footer_band'
    ]);
    const obj = {};
    (data || []).forEach(row => { obj[row.key] = row.value || ''; });
    setCachedFooter(obj);
  } catch (e) {}
}

// ⭐⭐⭐ 방문 기록 (visits 테이블에 insert) ⭐⭐⭐
function getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem('visitor_sid');
    if (!sid) {
      sid = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('visitor_sid', sid);
    }
    return sid;
  } catch (e) {
    return 'sid_anon_' + Math.random().toString(36).slice(2, 10);
  }
}

async function recordVisit() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    // 같은 세션에서 같은 페이지를 너무 자주 기록하지 않도록 5분 이내 중복 방지
    const key = 'last_visit_' + _pathName;
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || 0);
    if (now - last < 5 * 60 * 1000) return;
    localStorage.setItem(key, String(now));

    await client.from('visits').insert({
      path: _pathName || 'index',
      session_id: getOrCreateSessionId(),
      user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 500) : null,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
    });
  } catch (e) {
    // 실패해도 사이트 동작에는 영향 없음
  }
}

function renderFooter() {
  let wrap = document.getElementById('app-footer');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'app-footer';
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) mainScroll.appendChild(wrap);
    else document.body.appendChild(wrap);
  }
  const f = getCachedFooter();
  const owner = f.footer_owner || '';
  const phone = f.footer_phone || '';
  const email = f.footer_email || '';
  const address = f.footer_address || '';
  const business = f.footer_business || '';
  const text = f.footer_text || '';
  const instagram = f.footer_instagram || '';
  const blog = f.footer_blog || '';
  const band = f.footer_band || '';
  const hasSns = instagram || blog || band;

  if (!owner && !phone && !email && !address && !business && !text && !hasSns) {
    wrap.style.display = 'none';
    refreshFooterCache();
    return;
  }
  wrap.style.display = 'block';

  const items = [];
  if (phone) items.push(`<span class="footer-item">📞 ${phone}</span>`);
  if (email) items.push(`<span class="footer-item">✉️ ${email}</span>`);
  if (business) items.push(`<span class="footer-item">사업자번호: ${business}</span>`);

  const snsLinks = [];
  if (instagram) snsLinks.push(`
    <a href="${instagram}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Instagram">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    </a>`);
  if (blog) snsLinks.push(`
    <a href="${blog}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Naver Blog">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><path d="M8 16V8l8 8V8"></path>
      </svg>
    </a>`);
  if (band) snsLinks.push(`
    <a href="${band}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Naver Band">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    </a>`);

  wrap.innerHTML = `
    <div class="footer-inner">
      ${owner ? `<div class="footer-title">${owner}</div>` : ''}
      ${address ? `<div class="footer-item" style="margin-bottom:6px;">${address}</div>` : ''}
      ${items.length ? `<div class="footer-row">${items.join('')}</div>` : ''}
      ${snsLinks.length ? `<div class="footer-sns-row">${snsLinks.join('')}</div>` : ''}
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

function buildBottomNav(current, isMember, svgIcons) {
  const commonTabs = `
    <a href="index.html" data-nav="home" class="bottom-nav-item ${current === 'home' ? 'active' : ''}">
      ${svgIcons.home}<span>홈</span>
    </a>
    <a href="cart.html" data-nav="cart" class="bottom-nav-item ${current === 'cart' ? 'active' : ''}">
      ${svgIcons.cart}
      <span id="bottom-cart-badge" class="cart-badge" style="display:none;">0</span>
      <span>장바구니</span>
    </a>
    <a href="orders.html" data-nav="orders" class="bottom-nav-item ${current === 'orders' ? 'active' : ''}">
      ${svgIcons.orders}<span>주문조회</span>
    </a>
  `;

  const memberTabs = isMember
    ? `<a href="myorders.html" data-nav="myorders" class="bottom-nav-item ${current === 'myorders' ? 'active' : ''}">
         ${svgIcons.myorders}<span>주문내역</span>
       </a>
       <a href="mypage.html" data-nav="mypage" class="bottom-nav-item ${current === 'mypage' ? 'active' : ''}">
         ${svgIcons.mypage}<span>내정보</span>
       </a>
       <a href="#" data-nav="logout" id="bottom-logout-btn" class="bottom-nav-item">
         ${svgIcons.logout}<span>로그아웃</span>
       </a>`
    : `<a href="login.html" data-nav="login" class="bottom-nav-item ${current === 'login' ? 'active' : ''}">
         ${svgIcons.login}<span>로그인</span>
       </a>
       <a href="signup.html" data-nav="signup" class="bottom-nav-item ${current === 'signup' ? 'active' : ''}">
         ${svgIcons.signup}<span>회원가입</span>
       </a>`;

  return { html: commonTabs + memberTabs, count: isMember ? 6 : 5 };
}

function updateBottomNavBadge() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const badge = document.getElementById('bottom-cart-badge');
  if (badge) {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'block' : 'none';
  }
}

function bindBottomLogout() {
  const blb = document.getElementById('bottom-logout-btn');
  if (blb) {
    blb.onclick = (e) => {
      e.preventDefault();
      if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('member');
        location.href = 'index.html';
      }
    };
  }
}

function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  const isDark = _isDark;
  const theme = isDark ? {
    headerBg: '#0f0f0f', borderColor: '#222', logoColor: '#fff',
    btnBg: '#1a1a1a', btnBgActive: '#e5e7eb', btnText: '#e5e7eb', btnTextActive: '#111', btnBorder: '#333', btnBorderActive: '#e5e7eb', nameColor: '#888',
  } : {
    headerBg: '#fff', borderColor: '#eee', logoColor: '#222',
    btnBg: '#fff', btnBgActive: '#222', btnText: '#222', btnTextActive: '#fff', btnBorder: '#ddd', btnBorderActive: '#222', nameColor: '#555',
  };

  let bottomNav = document.getElementById('mobile-bottom-nav');
  const wrapper = document.querySelector('.site-wrapper');
  if (!bottomNav) {
    bottomNav = document.createElement('nav');
    bottomNav.id = 'mobile-bottom-nav';
  }
  if (wrapper) {
    if (bottomNav.parentNode !== wrapper) wrapper.appendChild(bottomNav);
    else wrapper.appendChild(bottomNav);
  } else if (!bottomNav.parentNode) {
    document.body.appendChild(bottomNav);
  }

  const member = localStorage.getItem('member');
  let m = null;
  try { m = member ? JSON.parse(member) : null; } catch { m = null; }
  const isMember = !!(m && m.id);

  const svgIcons = {
    home: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    cart: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    orders: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    myorders: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    mypage: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    logout: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    login: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    signup: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`
  };

  const { html: navHtml, count } = buildBottomNav(current, isMember, svgIcons);
  bottomNav.className = `nav-count-${count}`;
  bottomNav.innerHTML = navHtml;
  updateBottomNavBadge();
  bindBottomLogout();

  if (_headerRendered && wrap.querySelector('header')) {
    wrap.querySelectorAll('[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === current;
      el.style.background = isActive ? theme.btnBgActive : theme.btnBg;
      el.style.color = isActive ? theme.btnTextActive : theme.btnText;
      el.style.borderColor = isActive ? theme.btnBorderActive : theme.btnBorder;
    });
    const cc = document.getElementById('cart-count');
    if (cc) cc.textContent = JSON.parse(localStorage.getItem('cart') || '[]').length;
    return;
  }

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

  const userBtns = isMember
    ? `<a href="mypage.html" data-nav="mypage" style="${btnStyle(current === 'mypage')}">내정보</a>
       <a href="myorders.html" data-nav="myorders" style="${btnStyle(current === 'myorders')}">주문내역</a>
       <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>`
    : `<a href="login.html" data-nav="login" style="${btnStyle(current === 'login')}">로그인</a>
       <a href="signup.html" data-nav="signup" style="${btnStyle(current === 'signup')}">회원가입</a>`;

  const nameRow = `
    <div class="header-name-row" style="text-align:center; font-size:13px; color:${theme.nameColor}; margin-bottom:12px; min-height:18px; line-height:18px; font-weight:500;">
      ${isMember ? `${m.name}님` : ''}
    </div>
  `;

  const logoHtml = logoImageUrl
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block; margin:0 auto;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:${theme.logoColor}; text-decoration:none; display:inline-block;">${siteName}</a>`;

  wrap.innerHTML = `
    <header style="background:${theme.headerBg}; border-bottom:1px solid ${theme.borderColor}; padding:12px 16px 10px 16px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:8px; text-align:center;">${logoHtml}</div>
        ${nameRow}
        <div class="header-nav-wrap">
          <a href="cart.html" data-nav="cart" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count" style="margin-left:4px;">0</span></a>
          <a href="orders.html" data-nav="orders" style="${btnStyle(current === 'orders')}">주문조회</a>
          ${userBtns}
        </div>
      </div>
    </header>
  `;

  _headerRendered = true;
  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = JSON.parse(localStorage.getItem('cart') || '[]').length;

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

document.addEventListener('DOMContentLoaded', async () => {
  if (_isAdmin) {
    if (_isDark) document.body.classList.add('dark');
    applyPhoneAttrs();
    return;
  }

  const existingHeader = document.getElementById('app-header');
  const existingBottomNav = document.getElementById('mobile-bottom-nav');
  const bodyChildren = Array.from(document.body.children);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'site-wrapper';
  
  const mainScroll = document.createElement('div');
  mainScroll.className = 'site-main-scroll';

  bodyChildren.forEach(child => {
    if (child.id === 'app-header') return;
    if (child.id === 'mobile-bottom-nav') return;
    if (child.tagName === 'SCRIPT') return;
    if (child.id === 'app-footer') return;
    if (child.classList.contains('page-loader')) return;
    if (child.id === 'scroll-btns') return;
    mainScroll.appendChild(child);
  });

  if (existingHeader) wrapper.appendChild(existingHeader);
  wrapper.appendChild(mainScroll);
  if (existingBottomNav) wrapper.appendChild(existingBottomNav);
  
  document.body.insertBefore(wrapper, document.body.firstChild);

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

  // ⭐ 방문 기록 (통계용)
  recordVisit();

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