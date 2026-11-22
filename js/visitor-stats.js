```javascript
// ============================================================
// visitor-stats.js — 관리자 방문자 통계
// 한국시간 기준 오늘 / 어제 / 전체 방문자 조회
// ============================================================

async function loadVisitorStats() {
  const todayEl = document.getElementById('stat-today');
  const yesterdayEl = document.getElementById('stat-yesterday');
  const totalEl = document.getElementById('stat-total');

  if (!todayEl || !yesterdayEl || !totalEl) return;

  todayEl.textContent = '로딩중...';
  yesterdayEl.textContent = '로딩중...';
  totalEl.textContent = '로딩중...';

  try {
    const client = window.db || db;

    const { data, error } = await client.rpc('get_visitor_stats');

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) throw new Error('통계 결과가 없습니다.');

    todayEl.textContent =
      Number(result.today_count || 0).toLocaleString('ko-KR');

    yesterdayEl.textContent =
      Number(result.yesterday_count || 0).toLocaleString('ko-KR');

    totalEl.textContent =
      Number(result.total_count || 0).toLocaleString('ko-KR');

  } catch (error) {
    console.error('방문자 통계 조회 실패:', error);

    todayEl.textContent = '-';
    yesterdayEl.textContent = '-';
    totalEl.textContent = '-';
  }
}
```