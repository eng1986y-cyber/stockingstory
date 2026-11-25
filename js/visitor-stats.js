// js/visitor-stats.js
// 방문자 통계 모듈 (Supabase 기반) — 단일 진실 공급원
// - 방문 기록: 메인 페이지에서 recordVisit() 호출
// - 통계 조회: 관리자 페이지 init.js에서 loadVisitorStats() 호출
// - 테이블: visitor_logs (visit_date, visitor_id, created_at)

(function () {
  'use strict';

  // Supabase 클라이언트 가져오기 (여러 변수명 지원)
  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.db) return window.db;
    if (window.sb) return window.sb;
    if (window._supabase) return window._supabase;
    return null;
  }

  // KST 기준 날짜 (YYYY-MM-DD)
  function kstDateStr(offsetDays = 0) {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (t) => parts.find((p) => p.type === t)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  function todayStr() {
    return kstDateStr(0);
  }

  function yesterdayStr() {
    return kstDateStr(-1);
  }

  // 방문자 식별자 (localStorage 기반, 브라우저별 1회 생성)
  function getVisitorId() {
    const KEY = 'stk_visitor_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      try { localStorage.setItem(KEY, id); } catch {}
    }
    return id;
  }

  // 오늘 이미 기록했는지 확인 (중복 방지: 하루 1회)
  function hasVisitedToday() {
    const KEY = 'stk_last_visit';
    const last = localStorage.getItem(KEY);
    return last === todayStr();
  }

  function markVisitedToday() {
    try { localStorage.setItem('stk_last_visit', todayStr()); } catch {}
  }

  /**
   * 방문 기록 (메인 페이지에서 호출)
   * visitor_logs 테이블 스키마:
   *   id bigserial PK
   *   visit_date date
   *   visitor_id text
   *   created_at timestamptz default now()
   */
  async function recordVisit() {
    const client = getClient();
    if (!client) {
      console.warn('[visitor-stats] Supabase client not found');
      return;
    }

    if (hasVisitedToday()) {
      console.log('[visitor-stats] already visited today');
      return;
    }

    try {
      const visitorId = getVisitorId();
      const { error } = await client
        .from('visitor_logs')
        .insert({
          visit_date: todayStr(),
          visitor_id: visitorId,
        });

      if (error) {
        console.error('[visitor-stats] insert error:', error);
        return;
      }
      markVisitedToday();
      console.log('[visitor-stats] visit recorded');
    } catch (e) {
      console.error('[visitor-stats] recordVisit exception:', e);
    }
  }

  /**
   * 방문 통계 조회 (관리자 페이지)
   */
  async function loadVisitorStats() {
    const client = getClient();
    const elToday = document.getElementById('stat-today');
    const elYesterday = document.getElementById('stat-yesterday');
    const elTotal = document.getElementById('stat-total');

    if (!elToday && !elYesterday && !elTotal) return; // 관리자 상품 탭 아님

    if (!client) {
      console.error('[visitor-stats] Supabase client not found');
      [elToday, elYesterday, elTotal].forEach((el) => { if (el) el.textContent = 'ERR'; });
      return;
    }

    const today = todayStr();
    const yesterday = yesterdayStr();

    try {
      const { count: todayCount, error: e1 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', today);
      if (e1) throw e1;

      const { count: yesterdayCount, error: e2 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', yesterday);
      if (e2) throw e2;

      const { count: totalCount, error: e3 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true });
      if (e3) throw e3;

      if (elToday) elToday.textContent = (todayCount ?? 0).toLocaleString();
      if (elYesterday) elYesterday.textContent = (yesterdayCount ?? 0).toLocaleString();
      if (elTotal) elTotal.textContent = (totalCount ?? 0).toLocaleString();

      console.log('[visitor-stats] stats loaded', { todayCount, yesterdayCount, totalCount });
    } catch (e) {
      console.error('[visitor-stats] loadVisitorStats error:', e);
      [elToday, elYesterday, elTotal].forEach((el) => {
        if (el && el.textContent === '-') el.textContent = '0';
      });
    }
  }

  // 전역 노출
  window.recordVisit = recordVisit;
  window.loadVisitorStats = loadVisitorStats;
})();