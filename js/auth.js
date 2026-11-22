// ============================================================
// auth.js — 로그인/세션/탭 전환
// ============================================================

const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm   = document.getElementById('login-form');
const loginMsg    = document.getElementById('login-msg');

async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) showAdmin(); else showLogin();
}

function showLogin() {
  loginScreen.style.display = 'block';
  adminScreen.style.display = 'none';
}

function showAdmin() {
  loginScreen.style.display = 'none';
  adminScreen.style.display = 'block';
  // 아래 함수들은 다른 모듈에서 정의됨 (호출 시점에는 로드 완료 상태)
  loadAdminList();
  loadGlobalDetailImages();
  loadVisitorStats();
}

// ============ 탭 전환 ============
document.querySelectorAll('.admin-tabbar .nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tabbar .nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    document.querySelector('.admin-layout').scrollTop = 0;

    const tab = btn.dataset.tab;
    if (tab === 'orders')   loadOrders();
    if (tab === 'members')  loadMembers();
    if (tab === 'coupons')  loadCouponsAndMembers();
    if (tab === 'notices')  { loadNoticeAdminList(); loadBoardAdminList(); }
    if (tab === 'settings' && !window.__settingsLoaded) {
      document.getElementById('settings-loading').style.display = 'block';
      document.getElementById('settings-content').style.display = 'none';
      Promise.all([
        loadLogo(), loadFooter(), loadBanner(), loadHeroBg(),
        loadShippingSetting(), loadSnsLinks(), loadPromoVideo(),
        loadSignupCouponSetting(), loadAccountSetting()
      ]).finally(() => {
        document.getElementById('settings-loading').style.display = 'none';
        document.getElementById('settings-content').style.display = '';
        window.__settingsLoaded = true;
      });
    }
  });
});

// ============ 로그인 ============
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginMsg.textContent = '로그인 중...';
  loginMsg.className = 'msg';
  const { error } = await db.auth.signInWithPassword({
    email: loginForm.email.value.trim(),
    password: loginForm.password.value
  });
  if (error) {
    loginMsg.className = 'msg error';
    loginMsg.textContent = error.message;
  } else {
    loginMsg.textContent = '';
    showAdmin();
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await db.auth.signOut();
  showLogin();
});
