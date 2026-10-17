// ===== 공통 유틸 =====

// ⭐ 페이지 판별
const _pathName = location.pathname.split('/').pop().replace('.html','') || 'index';
const _isIndex = (_pathName === '' || _pathName === 'index');
const _isAdmin = (_pathName === 'admin' || _pathName === 'edit');
const _isDark = !_isIndex && !_isAdmin;

if (_isDark) {
  document.documentElement.style.background = '#0a0a0a';
}

// 이미지 복사 방지 + 레이아웃 안정화 (스크롤바 강제로 인한 흔들림 방지)
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* ⭐ 페이지 이동 시 좌우 흔들림(스크롤바 유무 차이) 완전 방지 */
    html { overflow-y: scroll; } 
    
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
      left: 50%;
      transform: translateX(calc(700px + 16px));
      bottom: 20px;
      display: flex; flex-direction: column; gap: 8px; z-index: 900;
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
      box-shadow: 0 2px 8px rgba(0,0,0,.5);
    }

    @media (max-width: 1450px) {
      #scroll-btns { left: auto; right: 16px; transform: none; }
    }
    @media (max-width: 768px) {
      #scroll-btns { right: 12px; bottom: 12px; }
      #scroll-btns button { width: 40px; height: 40px; font-size: 16px; }
    }

    #app-footer {
      margin-top: 40px; padding: 24px 16px;
      background: #fafafa; border-top: 1px solid #eee;
      color: #666; font-size: 13px; line-height: 1.8;
    }
    body.dark #app-footer {
      background: #0f0f0f; border-top-color: #1f1f1f; color: #888;
    }
    #app-footer .footer-inner { max-width: 1400px; margin: 0 auto; text-align: center; }
    #app-footer .footer-title { font-weight: 700; font-size: 14px; color: #333; margin-bottom: 8px; }
    body.dark #app-footer .footer-title { color: #ccc; }
    #app-footer .footer-row { display: flex; flex-wrap: wrap; gap: 6px 16px; justify-content: center; }
    #app-footer .footer-item { color: #666; }
    body.dark #app-footer .footer-item { color: #888; }
    #app-footer .footer-text {
      margin-top: 12px; padding-top: 12px;
      border-top: 1px dashed #ddd;
      font-size: 12px; color: #999;
      white-space: pre-wrap; max-width: 800px;
      margin-left: auto; margin-right: auto;
    }
    body.dark #app-footer .footer-text { border-top-color: #222; color: #555; }
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
  new MutationObserver(updateVisibility).observe(document.body, { childList: true, subtree: true });
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
    const { data } = await client.from('logos').select('*')
      .order('id', { ascending: false }).limit(1).maybeSingle();
    if (data) setCachedLogo({ image_url: data.image_url || '', site_name: data.site_name || '' });
    else setCachedLogo({ image_url: '', site_name: '' });
  } catch (e) {}
}

async function refreshFooterCache() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { data } = await client.from('settings').select('key, value')
      .in('key', ['footer_owner','footer_phone','footer_email','footer_address','footer_business','footer_text']);
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

// ===== 헤더 렌더 =====
let _headerRendered = false;
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;

  const isDark = _isDark;
  const theme = isDark ? {
    headerBg: '#0f0f0f', borderColor: '#222',
    logoColor: '#fff',
    btnBg: '#1a1a1a', btnBgActive: '#e5e7eb',
    btnText: '#e5e7eb', btnTextActive: '#111',
    btnBorder: '#333', btnBorderActive: '#e5e7eb',
    nameColor: '#888',
  } : {
    headerBg: '#fff', borderColor: '#eee',
    logoColor: '#222',
    btnBg: '#fff', btnBgActive: '#222',
    btnText: '#222', btnTextActive: '#fff',
    btnBorder: '#ddd', btnBorderActive: '#222',
    nameColor: '#555',
  };

  if (_headerRendered && wrap.querySelector('header')) {
    wrap.querySelectorAll('[data-nav]').forEach(el => {
      const isActive = el.dataset.nav === current;
      el.style.background = isActive ? theme.btnBgActive : theme.btnBg;
      el.style.color = isActive ? theme.btnTextActive : theme.btnText;
      el.style.borderColor = isActive ? theme.btnBorderActive : theme.btnBorder;
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
    display: inline-flex; align-items: center; justify-content: center;
    padding: 8px 14px; min-width: 76px; height: 36px;
    background: ${active ? theme.btnBgActive : theme.btnBg};
    color: ${active ? theme.btnTextActive : theme.btnText};
    border: 1px solid ${active ? theme.btnBorderActive : theme.btnBorder};
    border-radius: 6px; text-decoration: none;
    font-size: 14px; font-weight: 500;
    white-space: nowrap; box-sizing: border-box;
    flex-shrink: 0;
  `;

  const userBtns = m
    ? `
      <a href="mypage.html" data-nav="mypage" style="${btnStyle(current === 'mypage')}">내정보</a>
      <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>
    `
    : `
      <a href="login.html" data-nav="login" style="${btnStyle(current === 'login')}">로그인</a>
      <a href="signup.html" data-nav="signup" style="${btnStyle(current === 'signup')}">회원가입</a>
    `;

  const nameRow = m
    ? `<div class="header-name-row" style="text-align:right; font-size:13px; color:${theme.nameColor}; margin-bottom:6px;">${m.name}님</div>`
    : '';

  const logoHtml = logoImageUrl
    ? `<a href="index.html" style="display:inline-block;"><img src="${logoImageUrl}" alt="${siteName}" style="height:40px; max-width:240px; object-fit:contain; display:block; margin:0 auto;"></a>`
    : `<a href="index.html" style="font-size:22px; font-weight:700; color:${theme.logoColor}; text-decoration:none; display:inline-block;">${siteName}</a>`;

  wrap.innerHTML = `
    <header style="background:${theme.headerBg}; border-bottom:1px solid ${theme.borderColor}; padding:14px 16px;">
      <div style="max-width:1400px; margin:0 auto;">
        <div style="margin-bottom:12px; text-align:center;">${logoHtml}</div>
        ${nameRow}
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

document.addEventListener('DOMContentLoaded', async () => {
  if (_isDark) document.body.classList.add('dark');

  applyPhoneAttrs();
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });

  createScrollButtons();
  renderFooter();

  const isOk = await verifyMemberStatus();
  if (!isOk) return;

  const map = {
    'index': 'home', 'login': 'login', 'signup': 'signup',
    'cart': 'cart', 'orders': 'orders', 'product': 'product', 'mypage': 'mypage',
  };
  const current = map[_pathName] || 'home';

  if (document.getElementById('app-header')) {
    renderHeader(current);
  }
});