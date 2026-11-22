// visitor-tracker.js — 방문 기록 (한국시간 날짜 기준 브라우저당 1회/일)
(() => {
  if (!window.db) {
    console.warn('[visitor-tracker] Supabase client(window.db)가 없습니다.');
    return;
  }

  const kstDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  const key = `stk_visitor_recorded_${kstDate}`;
  if (localStorage.getItem(key)) return;

  // 날짜별 저장 키만 남기고 오래된 키 정리
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('stk_visitor_recorded_') && k !== key) localStorage.removeItem(k);
    });
  } catch (_) {}

  window.db.from('visitors')
    .insert({ created_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) {
        console.warn('[visitor-tracker] 기록 실패:', error.message);
        return;
      }
      localStorage.setItem(key, '1');
    })
    .catch(err => console.warn('[visitor-tracker] 기록 실패:', err));
})();
