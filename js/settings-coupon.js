// ============================================================
// settings-coupon.js — 회원가입 쿠폰 설정
// 의존: config.js
// ============================================================

async function loadSignupCouponSetting() {
  const { data } = await db.from('settings').select('key, value').in('key', [
    'signup_coupon_enabled', 'signup_coupon_name', 'signup_coupon_type',
    'signup_coupon_value', 'signup_coupon_days'
  ]);
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value; });
  document.getElementById('signup-coupon-enabled').checked = map.signup_coupon_enabled === 'true';
  document.getElementById('signup-coupon-name').value = map.signup_coupon_name || '가입 감사 10% 할인 쿠폰';
  document.getElementById('signup-coupon-type').value = map.signup_coupon_type || 'percent';
  document.getElementById('signup-coupon-value').value = map.signup_coupon_value || '10';
  document.getElementById('signup-coupon-days').value = map.signup_coupon_days || '30';
}

document.getElementById('save-signup-coupon').onclick = async () => {
  const m = document.getElementById('signup-coupon-msg');
  m.className = 'msg';
  m.textContent = '저장 중...';
  const enabled = document.getElementById('signup-coupon-enabled').checked;
  const name = document.getElementById('signup-coupon-name').value.trim();
  const type = document.getElementById('signup-coupon-type').value;
  const value = Number(document.getElementById('signup-coupon-value').value) || 0;
  const days = Number(document.getElementById('signup-coupon-days').value) || 30;
  const { error } = await db.from('settings').upsert([
    { key: 'signup_coupon_enabled', value: enabled ? 'true' : 'false' },
    { key: 'signup_coupon_name', value: name || '가입 감사 10% 할인 쿠폰' },
    { key: 'signup_coupon_type', value: type },
    { key: 'signup_coupon_value', value: String(value) },
    { key: 'signup_coupon_days', value: String(days) },
  ]);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
  }
};
