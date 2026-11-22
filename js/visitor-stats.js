// visitor-stats.js — 관리자 방문자 통계 (KST)
async function loadVisitorStats() {
  const ids = ['stat-today', 'stat-yesterday', 'stat-total'];
  try {
    const { data, error } = await db.rpc('get_visitor_stats');
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('통계 결과가 비어 있습니다.');

    document.getElementById('stat-today').textContent =
      Number(row.today_count || 0).toLocaleString();
    document.getElementById('stat-yesterday').textContent =
      Number(row.yesterday_count || 0).toLocaleString();
    document.getElementById('stat-total').textContent =
      Number(row.total_count || 0).toLocaleString();
  } catch (err) {
    console.warn('방문자 통계 로드 실패:', err);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '-';
    });
  }
}
