// ============================================================
// init.js — 초기화 (가장 마지막에 로드)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1) 세션 확인
  if (typeof checkSession === 'function') {
    try { checkSession(); } catch (e) { console.warn('[init] checkSession error:', e); }
  }

  // 2) 방문 통계 로드 (관리자 페이지인 경우만 내부에서 자동 판별)
  if (typeof window.loadVisitorStats === 'function') {
    // DOM 렌더링 안정화 후 호출
    setTimeout(() => {
      window.loadVisitorStats();
    }, 300);
  }
});