// ===== 공통 유틸 =====
// 연락처 자동 하이픈 + 숫자 키보드

// 연락처 input에 자동 적용 (이벤트 위임)
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches && el.matches('input[type="tel"], .phone-input, input[name*="phone" i]')) {
    const num = el.value.replace(/[^0-9]/g, '').slice(0, 11);
    if (num.length < 4) el.value = num;
    else if (num.length < 7) el.value = num.slice(0,3) + '-' + num.slice(3);
    else if (num.length < 11) el.value = num.slice(0,3) + '-' + num.slice(3,6) + '-' + num.slice(6);
    else el.value = num.slice(0,3) + '-' + num.slice(3,7) + '-' + num.slice(7);
  }
});

// 페이지 로드 시 기존 input에 inputmode 적용
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[name*="phone" i]').forEach(el => {
    if (!el.getAttribute('inputmode')) {
      el.setAttribute('inputmode', 'numeric');
      el.setAttribute('type', 'tel');
    }
  });
});

// 동적 모달 생성 시에도 자동 적용 (MutationObserver)
const observer = new MutationObserver(() => {
  document.querySelectorAll('input[name*="phone" i]').forEach(el => {
    if (!el.getAttribute('inputmode')) {
      el.setAttribute('inputmode', 'numeric');
      el.setAttribute('type', 'tel');
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, { childList: true, subtree: true });
});
