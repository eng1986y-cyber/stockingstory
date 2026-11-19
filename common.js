// ===== 공통 유틸 (개선판: 이슈 2·4·5·8 반영) =====

const _pathName = location.pathname.split('/').pop().replace('.html','') || 'index';
const _isIndex = (_pathName === '' || _pathName === 'index');
const _isAdmin = (_pathName === 'admin' || _pathName === 'edit');
const _isDark = !_isIndex && !_isAdmin;

if (_isDark) document.documentElement.style.background = '#0a0a0a';

// ⭐ 등급별 할인율
const GRADE_DISCOUNT = { '일반회원': 0, '도매회원': 50, 'VIP회원': 30 };
const GRADE_SHIPPING = {
  '도매회원': { method: '해운', fee: '착불' },
  'VIP회원': { method: '택배', fee: '무료' },
};

// ============================================================
// ⭐ [이슈2] 다중 플랫폼 영상 임베드 URL 변환
// ============================================================
function getVideoEmbedUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (!s) return '';

  if (/\/embed\//i.test(s) || /player\.vimeo\.com/i.test(s)) return s;

  let m = s.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;

  m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;

  m = s.match(/dailymotion\.com\/video\/([A-Za-z0-9]+)/);
  if (m) return `https://www.dailymotion.com/embed/video/${m[1]}`;

  m = s.match(/tv\.naver\.com\/v\/(\d+)/);
  if (m) return `https://tv.naver.com/embed/${m[1]}`;

  m = s.match(/tv\.kakao\.com\/v\/(\w+)/);
  if (m) return `https://tv.kakao.com/embed/player/cliplink/${m[1]}`;

  if (/facebook\.com\/.+\/videos\//.test(s) || /fb\.watch\//.test(s)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(s)}`;
  }

  m = s.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (m) return `https://www.instagram.com/p/${m[1]}/embed`;

  m = s.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;

  m = s.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
  if (m) return `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`;

  return s;
}
function getYouTubeEmbedUrl(url) { return getVideoEmbedUrl(url); }

// ============================================================
// ⭐ [이슈8] 공통 캐시 + 세션 1회 조회
// ============================================================
const _cache = new Map();
function cachedGet(key, ttl, fetcher) {
  const now = Date.now();
  const hit = _cache.get(key);
  if (hit && now - hit.t < ttl) return Promise.resolve(hit.v);
  return Promise.resolve(fetcher()).then(v => {
    _cache.set(key, { v, t: now });
    return v;
  });
}
function invalidateCache(key) { _cache.delete(key); }

// ⭐ [이슈4] 사용자별 장바구니 키
function getCartKey() {
  const m = getLoggedMember();
  return m?.id ? `cart_${m.id}` : 'cart_guest';
}
function getLocalCart() {
  try { return JSON.parse(localStorage.getItem(getCartKey()) || '[]'); } catch { return []; }
}
function saveLocalCart(cart) {
  try { localStorage.setItem(getCartKey(), JSON.stringify(cart || [])); } catch {}
}

function addToCartWithAuth(item) {
  const m = getLoggedMember();
  if (!m || !m.id) {
    if (confirm('로그인 후 장바구니를 이용할 수 있습니다.\n지금 로그인하시겠어요?')) {
      location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
    }
    return { ok: false, reason: 'not_logged_in' };
  }
  const cart = getLocalCart();
  const dup = cart.findIndex(it =>
    String(it.product_id) === String(item.product_id) &&
    (it.selected_color || null) === (item.selected_color || null) &&
    (it.selected_size || null) === (item.selected_size || null) &&
    (it.selected_hem || null) === (item.selected_hem || null) &&
    (it.selected_other || null) === (item.selected_other || null)
  );
  if (dup >= 0) cart[dup].quantity = Number(cart[dup].quantity || 0) + Number(item.quantity || 1);
  else cart.push(item);
  saveLocalCart(cart);
  if (typeof pushCartToServer === 'function') pushCartToServer(cart);
  return { ok: true, cart };
}

function canAccessWholesale(memberGrade) { return memberGrade === '도매회원'; }
function canAccessVip(memberGrade) { return memberGrade === 'VIP회원'; }
function canPurchaseProduct(memberGrade, targetGrade) {
  const g = memberGrade || '일반회원';
  const tg = targetGrade || 'all';
  if (tg === 'wholesale') return g === '도매회원';
  if (tg === 'vip') return g === 'VIP회원';
  return g === '일반회원' || g === 'VIP회원';
}
function getMemberGrade() {
  try {
    const m = JSON.parse(localStorage.getItem('member') || 'null');
    return m?.grade || '일반회원';
  } catch { return '일반회원'; }
}
function applyGradeDiscount(price) {
  const grade = getMemberGrade();
  const rate = GRADE_DISCOUNT[grade] || 0;
  return Math.round(Number(price) * (100 - rate) / 100);
}
function getLoggedMember() {
  try { return JSON.parse(localStorage.getItem('member') || 'null'); } catch { return null; }
}
function isLoggedInMember() {
  const m = getLoggedMember();
  return !!(m && m.id);
}

// ============================================================
// ⭐ [이슈8] Supabase 클라이언트 싱글톤
// ============================================================
function getSupabaseClient() {
  if (typeof supabase === 'undefined') return null;
  let client = window.db;
  if (!client) {
    client = supabase.createClient(
      "https://alpdhgcipjeekzrpxlbh.supabase.co",
      "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya"
    );
    window.db = client;
  }
  return client;
}

// ============================================================
// ⭐ [이슈4] 서버 장바구니 동기화
// ============================================================
function mapServerCartRow(row) {
  return {
    product_id: row.product_id,
    product_code: row.product_code || '',
    product_name: row.product_name || '',
    original_price: Number(row.original_price ?? 0),
    product_price: Number(row.product_price ?? 0),
    target_grade: row.target_grade || 'all',
    discount_rate: Number(row.discount_rate ?? 0),
    min_qty: Number(row.min_qty ?? 1),
    main_image: row.main_image || '',
    quantity: Number(row.quantity ?? 1),
    selected_color: row.selected_color || null,
    selected_size: row.selected_size || null,
    selected_hem: row.selected_hem || null,
    selected_other: row.selected_other || null,
    _server_id: row.id,
  };
}
async function syncCartFromServer() {
  const m = getLoggedMember();
  if (!m || !m.id) return;
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { data, error } = await client.from('carts').select('*').eq('member_id', m.id).order('id', { ascending: true });
    if (error) { console.warn('장바구니 서버 로드 실패:', error.message); return; }
    const mapped = (data || []).map(mapServerCartRow);
    saveLocalCart(mapped);
    if (typeof updateBottomNavBadge === 'function') updateBottomNavBadge();
    if (typeof renderHeader === 'function' && document.getElementById('app-header')) {
      const mapPath = { 'index':'home','login':'login','signup':'signup','cart':'cart','orders':'orders','product':'product','mypage':'mypage','myorders':'myorders','wholesale':'wholesale','vip':'vip','products':'products' };
      renderHeader(mapPath[_pathName] || 'home');
    }
  } catch (e) { console.warn('장바구니 서버 로드 오류:', e); }
}
async function pushCartToServer(cartArray) {
  const m = getLoggedMember();
  if (!m || !m.id) return;
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('carts').delete().eq('member_id', m.id);
    const rows = (cartArray || []).map(it => ({
      member_id: m.id,
      product_id: it.product_id,
      product_code: it.product_code || '',
      product_name: it.product_name || '',
      original_price: Number(it.original_price ?? it.product_price ?? 0),
      product_price: Number(it.product_price ?? 0),
      target_grade: it.target_grade || 'all',
      discount_rate: Number(it.discount_rate ?? 0),
      min_qty: Number(it.min_qty ?? 1),
      main_image: it.main_image || '',
      quantity: Number(it.quantity ?? 1),
      selected_color: it.selected_color || null,
      selected_size: it.selected_size || null,
      selected_hem: it.selected_hem || null,
      selected_other: it.selected_other || null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    const { data, error } = await client.from('carts').insert(rows).select('id');
    if (error) { console.warn('장바구니 서버 저장 실패:', error.message); return; }
    if (Array.isArray(data)) {
      data.forEach((r, i) => { if (cartArray[i]) cartArray[i]._server_id = r.id; });
      saveLocalCart(cartArray);
    }
  } catch (e) { console.warn('장바구니 서버 저장 오류:', e); }
}

(function setupCartServerWatcher() {
  if (window.__cartServerWatcherInstalled) return;
  window.__cartServerWatcherInstalled = true;
  const onLogin = async () => { if (isLoggedInMember()) await syncCartFromServer(); };
  setTimeout(onLogin, 300);
  window.addEventListener('storage', e => { if (e.key === 'member') onLogin(); });
})();

function getCachedLogo() { try { return JSON.parse(localStorage.getItem('logo_cache') || 'null') || {}; } catch { return {}; } }
function setCachedLogo(obj) { try { localStorage.setItem('logo_cache', JSON.stringify(obj)); } catch {} }
function getCachedFooter() { try { return JSON.parse(localStorage.getItem('footer_cache') || 'null') || {}; } catch { return {}; } }
function setCachedFooter(obj) { try { localStorage.setItem('footer_cache', JSON.stringify(obj)); } catch {} }

async function refreshLogoCache() {
  return cachedGet('logo_cache_db', 5*60*1000, async () => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data } = await client.from('logos').select('*').order('id', { ascending: false }).limit(1).maybeSingle();
      setCachedLogo(data ? { image_url: data.image_url || '', site_name: data.site_name || '' } : { image_url: '', site_name: '' });
    } catch {}
  });
}
async function refreshFooterCache() {
  return cachedGet('footer_cache_db', 5*60*1000, async () => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data } = await client.from('settings').select('key, value').in('key', [
        'footer_owner','footer_phone','footer_email','footer_address','footer_business','footer_text',
        'footer_instagram','footer_blog','footer_band',
        'account_bank','account_number','account_holder'
      ]);
      const obj = {};
      (data || []).forEach(row => { obj[row.key] = row.value || ''; });
      setCachedFooter(obj);
    } catch {}
  });
}
function getCachedAccount() {
  const f = getCachedFooter();
  return { bank: f.account_bank || '', number: f.account_number || '', holder: f.account_holder || '' };
}

function getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem('visitor_sid');
    if (!sid) {
      sid = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('visitor_sid', sid);
    }
    return sid;
  } catch { return 'sid_anon_' + Math.random().toString(36).slice(2, 10); }
}
async function recordVisit() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const key = 'last_visit_' + _pathName;
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || 0);
    if (now - last < 5 * 60 * 1000) return;
    localStorage.setItem(key, String(now));
    await client.from('visits').insert({
      path: _pathName || 'index',
      session_id: getOrCreateSessionId(),
      user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 500) : null,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null
    });
  } catch {}
}

// ============================================================
// ⭐ 스타일 (모바일 채널톡 노출 포함)
// ============================================================
(function() {
  const style = document.createElement('style');
  style.textContent = `
    html, body { margin:0; padding:0; height:100%!important; overflow:hidden!important; width:100%; -webkit-text-size-adjust:100%; overscroll-behavior:none; }
    .site-wrapper { display:flex; flex-direction:column; height:100vh; height:100dvh; width:100%; overflow:hidden; }
    #app-header { flex-shrink:0; flex-grow:0; position:relative; z-index:99999; background:#fff; width:100%; box-shadow:0 4px 10px rgba(0,0,0,.05); margin-bottom:0!important; }
    body.dark #app-header { background:#0f0f0f; }
    .site-main-scroll { flex:1 1 0; min-height:0; overflow-y:scroll; overflow-x:hidden; width:100%; position:relative; padding-top:0!important; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:#d1d5db transparent; }
    body.dark .site-main-scroll { scrollbar-color:#333 transparent; }
    .site-main-scroll::-webkit-scrollbar { width:8px; }
    .site-main-scroll::-webkit-scrollbar-track { background:transparent; }
    .site-main-scroll::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px; }
    body.dark .site-main-scroll::-webkit-scrollbar-thumb { background:#333; }

    .header-nav-wrap { display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:flex-end; }
    .header-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; min-width:0; position:relative; }
    .header-product-search { display:flex; align-items:center; gap:6px; width:min(360px,42%); min-width:220px; height:36px; position:relative; flex:0 1 360px; margin-right:auto; z-index:100001; }
    .header-product-search input { width:100%; min-width:0; height:36px; box-sizing:border-box; padding:0 12px; border:none; border-radius:6px; background:#fff; color:#222; font:inherit; font-size:13px; outline:none; transition:box-shadow .16s ease; }
    .header-product-search input:focus { box-shadow:0 0 0 2px rgba(80,80,80,.12); }
    body.dark .header-product-search input { background:#171717; color:#eee; }
    .header-product-search button {
      display:inline-flex; align-items:center; justify-content:center;
      width:36px; min-width:36px; height:36px; padding:0;
      border:1px solid transparent; border-radius:6px;
      background:transparent!important; background-color:transparent!important;
      color:#222; box-shadow:none!important; cursor:pointer; flex-shrink:0;
    }
    .header-product-search button:hover,
    .header-product-search button:focus,
    .header-product-search button:focus-visible,
    .header-product-search button:active {
      background:transparent!important; background-color:transparent!important;
      box-shadow:none!important; outline:none;
    }
    body.dark .header-product-search button,
    body.dark .header-product-search button:hover,
    body.dark .header-product-search button:focus,
    body.dark .header-product-search button:focus-visible,
    body.dark .header-product-search button:active {
      background:transparent!important; background-color:transparent!important;
      color:#eee; box-shadow:none!important;
    }
    .header-product-search button svg { display:block; width:21px; height:21px; fill:none; stroke:currentColor; stroke-width:2; }
    .header-search-popup { display:none; position:absolute; top:calc(100% + 7px); left:0; width:min(520px,calc(100vw - 32px)); max-height:min(440px,65vh); overflow-y:auto; background:#fff; color:#222; border:1px solid #d9eaf2; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.18); z-index:100005; }
    .header-search-popup.open { display:block; }
    body.dark .header-search-popup { background:#171717; color:#eee; border-color:#333; }
    .header-search-result { display:flex; align-items:center; gap:11px; min-height:66px; padding:9px 12px; box-sizing:border-box; color:inherit; text-decoration:none; border-bottom:1px solid #eee; }
    body.dark .header-search-result { border-bottom-color:#2a2a2a; }
    .header-search-result:hover { background:#f0f9fd; }
    body.dark .header-search-result:hover { background:#222; }
    .header-search-result img { width:48px; height:48px; object-fit:cover; border-radius:6px; background:#f2f2f2; flex-shrink:0; }
    .header-search-result .hsr-info { min-width:0; flex:1; }
    .header-search-result .hsr-name { font-size:13px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .header-search-result .hsr-code { margin-top:4px; font-size:11px; color:#888; }
    .header-search-result .hsr-price { font-size:13px; font-weight:700; color:#e53935; white-space:nowrap; }
    .header-search-message { padding:18px 14px; text-align:center; font-size:13px; color:#888; }

    /* ===== 모바일 헤더: 상품 검색창을 상단에 항상 노출 ===== */
    @media (max-width:768px) {
      .header-toolbar { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
      .header-product-search {
        width:100% !important; min-width:0 !important; max-width:none !important;
        height:40px !important; flex:1 1 auto !important; margin-right:0 !important;
        display:flex !important;
      }
      .header-product-search input { height:40px !important; font-size:14px; }
      .header-product-search button { width:40px !important; min-width:40px !important; height:40px !important; }
      .header-search-popup { width:100%; max-height:55vh; }
      .header-nav-wrap { display:none !important; }
      #app-header header { padding:10px 16px 8px 16px !important; }
      .site-main-scroll { overflow-y:auto; }
    }

    .page-loader { position:fixed; inset:0; background:#0a0a0a; display:flex; align-items:center; justify-content:center; z-index:999999; transition:opacity .2s ease; }
    .page-loader.hide { opacity:0; pointer-events:none; }
    .spinner { width:40px; height:40px; border:3px solid rgba(255,255,255,.1); border-top-color:#e5e7eb; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    img { -webkit-user-drag:none!important; user-drag:none!important; user-select:none!important; -webkit-user-select:none!important; -webkit-touch-callout:none!important; pointer-events:none!important; }
    a img { pointer-events:auto!important; }

    #scroll-btns { position:fixed; right:24px; top:50%; transform:translateY(-50%); display:none; flex-direction:column; gap:10px; z-index:900; pointer-events:none; }
    #scroll-btns button { width:44px; height:44px; border-radius:50%; border:1px solid #ddd; background:rgba(255,255,255,.96); color:#222; font-size:18px; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; padding:0; pointer-events:auto; }
    body.dark #scroll-btns button { border-color:#333; background:rgba(26,26,26,.96); color:#e5e7eb; }
    @media (max-width:768px) { #scroll-btns { display:none!important; } }

    #app-footer { margin-top:40px; padding:24px 16px; background:#fafafa; border-top:1px solid #eee; color:#666; font-size:13px; line-height:1.8; }
    body.dark #app-footer { background:#0f0f0f; border-top-color:#1f1f1f; color:#888; }
    #app-footer .footer-inner { max-width:1400px; margin:0 auto; text-align:center; }
    #app-footer .footer-title { font-weight:700; font-size:14px; color:#333; margin-bottom:8px; }
    body.dark #app-footer .footer-title { color:#ccc; }
    #app-footer .footer-row { display:flex; flex-wrap:wrap; gap:6px 16px; justify-content:center; }
    #app-footer .footer-item { color:#666; }
    body.dark #app-footer .footer-item { color:#888; }
    #app-footer .footer-text { margin-top:12px; padding-top:12px; border-top:1px dashed #ddd; font-size:12px; color:#999; white-space:pre-wrap; max-width:800px; margin-left:auto; margin-right:auto; }
    body.dark #app-footer .footer-text { border-top-color:#222; color:#555; }
    #app-footer .footer-sns-row { display:flex; justify-content:center; align-items:center; gap:12px; margin-top:14px; }
    #app-footer .footer-sns-btn, #app-footer .footer-channel-btn {
      display:inline-flex; align-items:center; justify-content:center;
      width:40px; height:40px; box-sizing:border-box; border-radius:50%;
      border:1px solid #e5e7eb; background:#fff; color:#4b5563;
      text-decoration:none; cursor:pointer; padding:0; font:inherit;
    }
    #app-footer .footer-sns-btn:hover, #app-footer .footer-channel-btn:hover {
      background:#111827; color:#fff; border-color:#111827;
    }
    body.dark #app-footer .footer-sns-btn, body.dark #app-footer .footer-channel-btn {
      background:#1a1a1a; border-color:#333; color:#e5e7eb;
    }

    @media (max-width:768px) {
      #app-footer { padding:20px 16px; margin-top:24px; font-size:12px; }
      #app-footer .footer-sns-row { display:flex!important; gap:14px; margin-top:16px; margin-bottom:4px; flex-wrap:wrap; }
      #app-footer .footer-sns-btn, #app-footer .footer-channel-btn { display:inline-flex!important; width:44px; height:44px; }
      .site-main-scroll { padding-bottom:calc(65px + env(safe-area-inset-bottom) + 40px); }
    }
    @media (min-width:769px) {
      #app-footer .footer-channel-btn { display:none!important; }
    }

    #mobile-bottom-nav { display:none; height:65px; flex-shrink:0; background:#fff; border-top:1px solid #eee; z-index:99999; justify-content:space-around; align-items:center; padding-bottom:env(safe-area-inset-bottom); }
    body.dark #mobile-bottom-nav { background:#0f0f0f; border-top-color:#222; }
    .bottom-nav-item { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; text-decoration:none; color:#9ca3af; font-size:10px; font-weight:500; flex:1 1 0; min-width:0; height:100%; border:none; background:none; cursor:pointer; padding:0 2px; white-space:nowrap; position:relative; }
    .bottom-nav-item > span { font-size:10px; line-height:1.1; white-space:nowrap; }
    .bottom-nav-item.active { color:#111827; }
    body.dark .bottom-nav-item.active { color:#fff; }
    .bottom-nav-item .nav-icon { width:20px; height:20px; stroke:currentColor; stroke-width:1.5; fill:none; stroke-linecap:round; stroke-linejoin:round; }
    .bottom-nav-item .cart-badge { position:absolute; top:6px; right:50%; transform:translateX(16px); background:#ef4444; color:#fff; font-size:10px; font-weight:bold; border-radius:10px; padding:2px 5px; line-height:1; }
    @media (max-width:768px) { #mobile-bottom-nav { display:flex; } }
    #mobile-bottom-nav.nav-count-6 .bottom-nav-item { padding:0 1px; gap:2px; }
    #mobile-bottom-nav.nav-count-6 .bottom-nav-item .nav-icon { width:18px; height:18px; }
    #mobile-bottom-nav.nav-count-6 .bottom-nav-item > span { font-size:9px; }
    #mobile-bottom-nav.nav-count-7 .bottom-nav-item { padding:0 1px; gap:2px; }
    #mobile-bottom-nav.nav-count-7 .bottom-nav-item .nav-icon { width:16px; height:16px; }
    #mobile-bottom-nav.nav-count-7 .bottom-nav-item > span { font-size:8px; }

  `;
  document.head.appendChild(style);
})();

document.addEventListener('contextmenu', e => { if (_isAdmin) return; e.preventDefault(); });
document.addEventListener('dragstart', e => { if (_isAdmin) return; if (e.target.tagName === 'IMG') e.preventDefault(); });

document.addEventListener('input', e => {
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
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (document.getElementById('scroll-btns')) return;
  const wrap = document.createElement('div');
  wrap.id = 'scroll-btns';
  wrap.innerHTML = `<button id="btn-scroll-top" title="맨 위로">▲</button><button id="btn-scroll-bottom" title="맨 아래로">▼</button>`;
  document.body.appendChild(wrap);
  document.getElementById('btn-scroll-top').onclick = () => {
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.getElementById('btn-scroll-bottom').onclick = () => {
    const mainScroll = document.querySelector('.site-main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: mainScroll.scrollHeight, behavior: 'smooth' });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };
}

let _footerRenderCount = 0;
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
  const owner = f.footer_owner || '', phone = f.footer_phone || '', email = f.footer_email || '';
  const address = f.footer_address || '', business = f.footer_business || '', text = f.footer_text || '';
  const instagram = f.footer_instagram || '', blog = f.footer_blog || '', band = f.footer_band || '';
  const hasSns = instagram || blog || band;
  if (!owner && !phone && !email && !address && !business && !text && !hasSns) {
    if (_footerRenderCount < 2) { _footerRenderCount++; refreshFooterCache().then(() => renderFooter()); return; }
  }
  _footerRenderCount = 0;
  wrap.style.display = 'block';
  const items = [];
  if (phone) items.push(`<span class="footer-item">📞 ${phone}</span>`);
  if (email) items.push(`<span class="footer-item">✉️ ${email}</span>`);
  if (business) items.push(`<span class="footer-item">사업자번호: ${business}</span>`);
  const snsLinks = [];
  if (instagram) snsLinks.push(`<a href="${instagram}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Instagram"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>`);
  if (blog) snsLinks.push(`<a href="${blog}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Naver Blog"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M8 16V8l8 8V8"></path></svg></a>`);
  if (band) snsLinks.push(`<a href="${band}" target="_blank" rel="noopener noreferrer" class="footer-sns-btn" aria-label="Naver Band"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></a>`);
  // 모바일에서는 밴드 버튼 바로 옆에 채널톡 아이콘 표시
  snsLinks.push(`<button type="button" class="footer-channel-btn" aria-label="채널톡 문의" title="채널톡 문의" onclick="if(window.ChannelIO) window.ChannelIO('showMessenger')"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-2 2v-9.5A7.5 7.5 0 0 1 10.5 4h2A7.5 7.5 0 0 1 20 11.5Z"></path><path d="M8 11h8M8 14h5"></path></svg></button>`);
  wrap.innerHTML = `
    <div class="footer-inner">
      ${owner ? `<div class="footer-title">${owner}</div>` : ''}
      ${address ? `<div class="footer-item" style="margin-bottom:6px;">${address}</div>` : ''}
      ${items.length ? `<div class="footer-row">${items.join('')}</div>` : ''}
      <div class="footer-sns-row">${snsLinks.join('')}</div>
      ${text ? `<div class="footer-text">${text}</div>` : ''}
    </div>
  `;
}

// ============================================================
// 헤더 상품검색
// ============================================================
let _headerSearchProducts = null;
let _headerSearchLoading = false;
let _headerSearchCacheTime = 0;

function escapeHeaderSearchHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}
async function getHeaderSearchProducts() {
  const now = Date.now();
  if (_headerSearchProducts && now - _headerSearchCacheTime < 60*1000) return _headerSearchProducts;
  if (_headerSearchLoading) {
    while (_headerSearchLoading) await new Promise(r => setTimeout(r, 80));
    return _headerSearchProducts || [];
  }
  _headerSearchLoading = true;
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('상품 검색 연결 실패');
    const { data, error } = await client.from('products')
      .select('id,name,product_code,main_image,price,target_grade,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    _headerSearchProducts = data || [];
    _headerSearchCacheTime = now;
    return _headerSearchProducts;
  } finally { _headerSearchLoading = false; }
}

function bindHeaderProductSearch() {
  const form = document.getElementById('header-product-search');
  const input = document.getElementById('header-product-search-input');
  const popup = document.getElementById('header-search-popup');
  if (!form || !input || !popup || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  const closePopup = () => { popup.classList.remove('open'); popup.innerHTML = ''; };
  const showMessage = msg => { popup.innerHTML = `<div class="header-search-message">${escapeHeaderSearchHtml(msg)}</div>`; popup.classList.add('open'); };

  const runSearch = async () => {
    const keyword = String(input.value || '').normalize('NFKC').toLocaleLowerCase().trim();
    if (!keyword) { closePopup(); return; }
    showMessage('상품을 검색하고 있습니다...');
    try {
      const products = await getHeaderSearchProducts();
      const matches = products.filter(p => {
        const name = String(p.name || '').normalize('NFKC').toLocaleLowerCase();
        const code = String(p.product_code || '').normalize('NFKC').toLocaleLowerCase();
        return name.includes(keyword) || code.includes(keyword);
      }).slice(0, 30);
      if (!matches.length) { showMessage('검색 결과가 없습니다.'); return; }

      popup.innerHTML = matches.map(p => {
        const id = encodeURIComponent(p.id);
        const name = escapeHeaderSearchHtml(p.name || '상품명 없음');
        const code = escapeHeaderSearchHtml(p.product_code || '');
        const image = escapeHeaderSearchHtml(p.main_image || '');
        const tg = p.target_grade || 'all';
        const badge = tg === 'wholesale' ? ' <span style="background:#f59e0b;color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;">도매</span>'
                   : tg === 'vip' ? ' <span style="background:#a855f7;color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;">VIP</span>'
                   : '';
        return `
          <a class="header-search-result" role="option" href="product.html?id=${id}">
            ${image ? `<img src="${image}" alt="" loading="lazy">` : `<span style="width:48px;height:48px;border-radius:6px;background:#f2f2f2;flex-shrink:0;"></span>`}
            <span class="hsr-info"><span class="hsr-name">${name}${badge}</span>${code ? `<span class="hsr-code">제품번호: ${code}</span>` : ''}</span>
            <span class="hsr-price">${Number(p.price || 0).toLocaleString()}원~</span>
          </a>`;
      }).join('');
      popup.classList.add('open');
    } catch (error) {
      console.error('상단 상품 검색 오류:', error);
      showMessage('상품 검색 중 오류가 발생했습니다.');
    }
  };

  form.addEventListener('submit', e => { e.preventDefault(); runSearch(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
  document.addEventListener('click', e => { if (!form.contains(e.target)) closePopup(); });
  input.addEventListener('focus', () => { if (popup.innerHTML.trim()) popup.classList.add('open'); });
}

function buildBottomNav(current, isMember, svgIcons, memberGrade) {
  const commonTabs = `
    <a href="index.html" data-nav="home" class="bottom-nav-item ${current === 'home' ? 'active' : ''}">${svgIcons.home}<span>홈</span></a>
    <a href="products.html" data-nav="products" class="bottom-nav-item ${current === 'products' ? 'active' : ''}">${svgIcons.products}<span>전체상품</span></a>
    <a href="cart.html" data-nav="cart" class="bottom-nav-item ${current === 'cart' ? 'active' : ''}">${svgIcons.cart}<span id="bottom-cart-badge" class="cart-badge" style="display:none;">0</span><span>장바구니</span></a>
    <a href="orders.html" data-nav="orders" class="bottom-nav-item ${current === 'orders' ? 'active' : ''}">${svgIcons.orders}<span>주문조회</span></a>
  `;
  const wholesaleTab = `<a href="wholesale.html" data-nav="wholesale" class="bottom-nav-item ${current === 'wholesale' ? 'active' : ''}">${svgIcons.wholesale}<span>도매</span></a>`;
  const vipTab = `<a href="vip.html" data-nav="vip" class="bottom-nav-item ${current === 'vip' ? 'active' : ''}">${svgIcons.vip}<span>VIP</span></a>`;
  let gradeTabs = '';
  if (isMember && memberGrade === '도매회원') gradeTabs = wholesaleTab;
  else if (isMember && memberGrade === 'VIP회원') gradeTabs = vipTab;
  const memberTabs = isMember
    ? `<a href="myorders.html" data-nav="myorders" class="bottom-nav-item ${current === 'myorders' ? 'active' : ''}">${svgIcons.myorders}<span>주문내역</span></a>
       <a href="mypage.html" data-nav="mypage" class="bottom-nav-item ${current === 'mypage' ? 'active' : ''}">${svgIcons.mypage}<span>내정보</span></a>
       <a href="#" data-nav="logout" id="bottom-logout-btn" class="bottom-nav-item">${svgIcons.logout}<span>로그아웃</span></a>`
    : `<a href="login.html" data-nav="login" class="bottom-nav-item ${current === 'login' ? 'active' : ''}">${svgIcons.login}<span>로그인</span></a>
       <a href="signup.html" data-nav="signup" class="bottom-nav-item ${current === 'signup' ? 'active' : ''}">${svgIcons.signup}<span>회원가입</span></a>`;
  const gradeCount = (gradeTabs.match(/<a /g) || []).length;
  const count = 4 + gradeCount + (isMember ? 3 : 2);
  return { html: commonTabs + gradeTabs + memberTabs, count };
}
function updateBottomNavBadge() {
  const cart = getLocalCart();
  const badge = document.getElementById('bottom-cart-badge');
  if (badge) {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'block' : 'none';
  }
}
function bindBottomLogout() {
  const blb = document.getElementById('bottom-logout-btn');
  if (blb) blb.onclick = e => {
    e.preventDefault();
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('member');
      location.href = 'index.html';
    }
  };
}

let _headerRendered = false;
function renderHeader(current) {
  const wrap = document.getElementById('app-header');
  if (!wrap) return;
  const isDark = _isDark;
  const theme = isDark ? {
    headerBg:'#0f0f0f', borderColor:'#222', logoColor:'#fff',
    btnBg:'#1a1a1a', btnBgActive:'#e5e7eb', btnText:'#e5e7eb', btnTextActive:'#111',
    btnBorder:'#333', btnBorderActive:'#e5e7eb', nameColor:'#888'
  } : {
    headerBg:'#fff', borderColor:'#eee', logoColor:'#222',
    btnBg:'#fff', btnBgActive:'#222', btnText:'#222', btnTextActive:'#fff',
    btnBorder:'#ddd', btnBorderActive:'#222', nameColor:'#555'
  };
  let bottomNav = document.getElementById('mobile-bottom-nav');
  const wrapper = document.querySelector('.site-wrapper');
  if (!bottomNav) { bottomNav = document.createElement('nav'); bottomNav.id = 'mobile-bottom-nav'; }
  if (wrapper) wrapper.appendChild(bottomNav);
  else if (!bottomNav.parentNode) document.body.appendChild(bottomNav);
  const m = getLoggedMember();
  const isMember = !!(m && m.id);
  const memberGrade = m?.grade || '일반회원';
  const svgIcons = {
    home: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    products: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    cart: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    orders: `<svg class="nav-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    myorders: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    mypage: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    logout: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    login: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    signup: `<svg class="nav-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
    wholesale: `<svg class="nav-icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    vip: `<svg class="nav-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };
  const { html: navHtml, count } = buildBottomNav(current, isMember, svgIcons, memberGrade);
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
    if (cc) cc.textContent = getLocalCart().length;
    bindHeaderProductSearch();
    return;
  }

  const cached = getCachedLogo();
  const logoImageUrl = cached.image_url || '';
  const siteName = cached.site_name || '스타킹스토리 심플라이프';
  const btnStyle = active => `
    display:inline-flex; align-items:center; justify-content:center; gap:4px;
    padding:8px 14px; min-width:76px; height:36px;
    background:${active ? theme.btnBgActive : theme.btnBg};
    color:${active ? theme.btnTextActive : theme.btnText};
    border:1px solid ${active ? theme.btnBorderActive : theme.btnBorder};
    border-radius:6px; text-decoration:none; font-size:14px; font-weight:500;
    white-space:nowrap; box-sizing:border-box; flex-shrink:0;
  `;
  const wholesaleBtn = (isMember && memberGrade === '도매회원')
    ? `<a href="wholesale.html" data-nav="wholesale" style="${btnStyle(current === 'wholesale')}">도매전용관</a>` : '';
  const vipBtn = (isMember && memberGrade === 'VIP회원')
    ? `<a href="vip.html" data-nav="vip" style="${btnStyle(current === 'vip')}">⭐ VIP전용관</a>` : '';
  const gradeBtn = wholesaleBtn + vipBtn;
  const userBtns = isMember
    ? `${gradeBtn}
       <a href="mypage.html" data-nav="mypage" style="${btnStyle(current === 'mypage')}">내정보</a>
       <a href="myorders.html" data-nav="myorders" style="${btnStyle(current === 'myorders')}">주문내역</a>
       <a href="#" id="logout-btn" style="${btnStyle(false)}">로그아웃</a>`
    : `<a href="login.html" data-nav="login" style="${btnStyle(current === 'login')}">로그인</a>
       <a href="signup.html" data-nav="signup" style="${btnStyle(current === 'signup')}">회원가입</a>`;
  const nameRow = `
    <div class="header-name-row" style="text-align:center; font-size:13px; color:${theme.nameColor}; margin-bottom:8px; min-height:18px; line-height:18px; font-weight:500;">
      ${isMember ? `${m.name}님 <span style="color:${memberGrade === '도매회원' ? '#f59e0b' : memberGrade === 'VIP회원' ? '#a855f7' : '#6b7280'}; font-weight:700;">[${memberGrade}]</span>` : ''}
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
        <div class="header-toolbar">
          <form class="header-product-search" id="header-product-search" role="search">
            <input id="header-product-search-input" type="search" placeholder="상품명 또는 제품번호 검색" autocomplete="off" aria-label="상품 검색">
            <button type="submit" aria-label="상품 검색 실행"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg></button>
            <div class="header-search-popup" id="header-search-popup" role="listbox"></div>
          </form>
          <nav class="header-nav-wrap" aria-label="회원 메뉴">
            <a href="products.html" data-nav="products" style="${btnStyle(current === 'products')}">전체상품</a>
            <a href="cart.html" data-nav="cart" style="${btnStyle(current === 'cart')}">장바구니 <span id="cart-count" style="margin-left:4px;">0</span></a>
            <a href="orders.html" data-nav="orders" style="${btnStyle(current === 'orders')}">주문조회</a>
            ${userBtns}
          </nav>
        </div>
      </div>
    </header>
  `;
  _headerRendered = true;
  bindHeaderProductSearch();
  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = getLocalCart().length;
  const lb = document.getElementById('logout-btn');
  if (lb) lb.onclick = e => {
    e.preventDefault();
    localStorage.removeItem('member');
    location.href = 'index.html';
  };
  refreshLogoCache();
}

// ============================================================
// 부트스트랩
// ============================================================
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

  const tasks = [
    refreshFooterCache().then(() => renderFooter()),
    recordVisit()
  ];
  if (isLoggedInMember()) tasks.push(syncCartFromServer().catch(()=>{}));
  await Promise.allSettled(tasks);

  const map = { 'index':'home','login':'login','signup':'signup','cart':'cart','orders':'orders','product':'product','mypage':'mypage','myorders':'myorders','wholesale':'wholesale','vip':'vip','products':'products' };
  const current = map[_pathName] || 'home';
  if (document.getElementById('app-header')) renderHeader(current);

  setTimeout(() => {
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 300);
  }, 300);
});

// ============================================================
// 채널톡 부트 (모바일에서도 정상 노출)
// ============================================================
(function() {
  var w = window;
  if (w.ChannelIO) return;
  var ch = function() { ch.c(arguments); };
  ch.q = []; ch.c = function(args) { ch.q.push(args); };
  w.ChannelIO = ch;
  function l() {
    if (w.ChannelIOInitialized) return;
    w.ChannelIOInitialized = true;
    var s = document.createElement('script');
    s.type = 'text/javascript'; s.async = true;
    s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'; s.charset = 'UTF-8';
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  }
  if (document.readyState === 'complete') l();
  else window.addEventListener('DOMContentLoaded', l, false);
  // 모바일에서는 기본 플로팅 채널톡 버튼을 숨기고,
  // SNS 영역의 footer-channel-btn으로만 상담창을 열도록 설정합니다.
  // PC에서는 기존 기본 채널톡 버튼을 그대로 유지합니다.
  var mobileChannelQuery = window.matchMedia('(max-width: 768px)');
  window.ChannelIO('boot', {
    "pluginKey": "c5ed9957-c9e6-42af-887e-1b2ab2b6d1dd",
    "hideChannelButtonOnBoot": mobileChannelQuery.matches
  });

  // 화면 크기를 변경한 경우에도 모바일/PC 노출 상태를 맞춥니다.
  var syncChannelButtonVisibility = function() {
    if (!window.ChannelIO) return;
    if (mobileChannelQuery.matches) window.ChannelIO('hideChannelButton');
    else window.ChannelIO('showChannelButton');
  };
  if (typeof mobileChannelQuery.addEventListener === 'function') {
    mobileChannelQuery.addEventListener('change', syncChannelButtonVisibility);
  } else if (typeof mobileChannelQuery.addListener === 'function') {
    mobileChannelQuery.addListener(syncChannelButtonVisibility);
  }
})();