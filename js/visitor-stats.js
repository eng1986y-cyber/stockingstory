// ============================================================
// visitor-stats.js — 방문자 통계
// ============================================================

async function loadVisitorStats() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const part = t => parts.find(x => x.type === t)?.value || '';

    const todayKst = `${part('year')}-${part('month')}-${part('day')}`;

    const todayStart = new Date(`${todayKst}T00:00:00+09:00`);
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    const client = window.db || db;

    const { count: todayCount, error: todayErr } = await client
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString());

    const { count: yesterdayCount, error: yesterdayErr } = await client
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString());

    const { count: totalCount, error: totalErr } = await client
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    if (todayErr || yesterdayErr || totalErr) {
      throw todayErr || yesterdayErr || totalErr;
    }

    document.getElementById('stat-today').textContent =
      (todayCount || 0).toLocaleString();

    document.getElementById('stat-yesterday').textContent =
      (yesterdayCount || 0).toLocaleString();

    document.getElementById('stat-total').textContent =
      (totalCount || 0).toLocaleString();

  } catch (err) {
    console.error('방문자 통계 로드 실패:', err);

    document.getElementById('stat-today').textContent = '-';
    document.getElementById('stat-yesterday').textContent = '-';
    document.getElementById('stat-total').textContent = '-';
  }
}