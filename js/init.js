// js/init.js
document.addEventListener('DOMContentLoaded', () => {
  // ... 기존 초기화 코드 ...

  // 방문 통계 로드 (관리자 페이지)
  if (typeof window.loadVisitorStats === 'function') {
    window.loadVisitorStats();
  }
});