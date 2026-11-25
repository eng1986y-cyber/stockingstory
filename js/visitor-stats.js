// js/visitor-stats.js
// 방문자 통계 모듈 (Supabase 기반) — 자립형 (config.js 불필요)
// - 테이블: visitor_logs (visit_date, visitor_id, created_at)

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // Supabase 설정 (index.html과 동일한 값)
  // ─────────────────────────────────────────────
  const SUPABASE_URL = "https://alpdhgcipjeekzrpxlbh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya";

  // 클라이언트 확보: 이미 있으면 재사용, 없으면 새로 생성
  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.db) return window.db;
    if (window.sb) return window.sb;
    if (window._supabase) return window._supabase;

    // 전역에 없으면 여기서 직접 생성
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      try {
        const c = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabaseClient = c;
        window.db = c;
        return c;
      } catch (e) {
        console.error('[visitor-stats] createClient 실패:', e);
        return null;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // 날짜 유틸 (KST)
  // ─────────────────────────────────────────────
  function kstDateStr(offsetDays = 0) {
    const now = new Date();
    now.setDate(now.getDate() + offsetDays);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const get = (t) => parts.find((p) => p.type === t)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  const todayStr = () => kstDateStr(0);
  const yesterdayStr = () => kstDateStr(-1);

  // ─────────────────────────────────────────────
  // 방문자 ID / 중복 방지
  // ─────────────────────────────────────────────
  function getVisitorId() {
    const KEY = 'stk_visitor_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      try { localStorage.setItem(KEY, id); } catch {}
    }
    return id;
  }
  function hasVisitedToday() {
    try { return localStorage.getItem('stk_last_visit') === todayStr(); }
    catch { return false; }
  }
  function markVisitedToday() {
    try { localStorage.setItem('stk_last_visit', todayStr()); } catch {}
  }

  // ─────────────────────────────────────────────
  // 방문 기록 (메인 페이지)
  // ─────────────────────────────────────────────
  async function recordVisit() {
    const client = getClient();
    if (!client) {
      console.warn('[visitor-stats] Supabase client not found (recordVisit)');
      return;
    }
    if (hasVisitedToday()) {
      console.log('[visitor-stats] already visited today');
      return;
    }
    try {
      const { error } = await client
        .from('visitor_logs')
        .insert({ visit_date: todayStr(), visitor_id: getVisitorId() });
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

  // ─────────────────────────────────────────────
  // 통계 조회 (관리자 페이지)
  // ─────────────────────────────────────────────
  async function loadVisitorStats() {
    const elToday = document.getElementById('stat-today');
    const elYesterday = document.getElementById('stat-yesterday');
    const elTotal = document.getElementById('stat-total');

    if (!elToday && !elYesterday && !elTotal) return;

    // 클라이언트가 늦게 준비될 수 있으므로 잠시 대기 후 재시도
    let client = getClient();
    if (!client) {
      // 최대 5회, 300ms 간격으로 재시도
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 300));
        client = getClient();
        if (client) break;
      }
    }

    if (!client) {
      console.error('[visitor-stats] Supabase client not found (loadVisitorStats)');
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