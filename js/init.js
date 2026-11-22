```javascript
// ============================================================
// init.js — 초기화 (가장 마지막에 로드)
// ============================================================

// 기존 세션 확인
checkSession();

// 관리자 방문자 통계
document.addEventListener('DOMContentLoaded', function () {
  if (typeof loadVisitorStats === 'function') {
    loadVisitorStats();
  }
});
```