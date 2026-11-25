// ============================================================
// init.js — 초기화 (가장 마지막에 로드)
// ============================================================

// 모든 모듈이 로드된 후 세션 확인
checkSession();

// js/init.js
document.addEventListener('DOMContentLoaded', () => {
  // ... 기존 초기화 코드 ...

  // 방문 통계 로드 (관리자 페이지)
  if (typeof window.loadVisitorStats === 'function') {
    window.loadVisitorStats();
  }
});