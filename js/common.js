// ===== 공통 유틸: 연락처 자동 하이픈 + 숫자 키보드 =====

// input 이벤트 위임 (동적 생성 input에도 자동 적용)
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.name && /phone/i.test(el.name) || (el.id && /phone/i.test(el.id))) {
    const num = el.value.replace(/[^0-9]/g, '').slice(0, 11);
    if (num.length < 4) el.value = num;
    else if (num.length < 7) el.value = num.slice(0,3) + '-' + num.slice(3);
    else if (num.length < 11) el.value = num.slice(0,3) + '-' + num.slice(3,6) + '-' + num.slice(6);
    else el.value = num.slice(0,3) + '-' + num.slice(3,7) + '-' + num.slice(7);
  }
});

// inputmode/type 자동 세팅
function applyPhoneAttrs() {
  document.querySelectorAll('input[name*="phone" i], input[id*="phone" i]').forEach(el => {
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('autocomplete', 'tel');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyPhoneAttrs();
  // 모달 등 동적 요소 감시
  new MutationObserver(applyPhoneAttrs).observe(document.body, { childList: true, subtree: true });
});
