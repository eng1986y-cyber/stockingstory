// js/visitor-stats.js
// 방문자 통계 모듈 (Supabase 기반)
// - 방문 기록: 메인 페이지에서 recordVisit() 호출
// - 통계 조회: 관리자 페이지에서 loadVisitorStats() 자동 호출

(function () {
  'use strict';

  // Supabase 클라이언트 가져오기 (config.js에서 window.supabaseClient 생성 가정)
  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.sb) return window.sb;
    if (window._supabase) return window._supabase;
    return null;
  }

  // 오늘 날짜 (YYYY-MM-DD, 로컬 기준)
  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 방문자 식별자 (localStorage 기반, 브라우저별 1회 생성)
  function getVisitorId() {
    const KEY = 'stk_visitor_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + '_' + Date.now();
      localStorage.setItem(KEY, id);
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
    localStorage.setItem('stk_last_visit', todayStr());
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

    // 하루 1회만 기록 (새로고침 중복 방지)
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
      // 오늘 방문자 수
      const { count: todayCount, error: e1 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', today);

      if (e1) throw e1;

      // 어제 방문자 수
      const { count: yesterdayCount, error: e2 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', yesterday);

      if (e2) throw e2;

      // 전체 방문자 수
      const { count: totalCount, error: e3 } = await client
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true });

      if (e3) throw e3;

      if (elToday) elToday.textContent = (todayCount ?? 0).toLocaleString();
      if (elYesterday) elYesterday.textContent = (yesterdayCount ?? 0).toLocaleString();
      if (elTotal) elTotal.textContent = (totalCount ?? 0).toLocaleString();
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

  // 관리자 페이지에서 자동 로드 (DOM 준비 후)
  document.addEventListener('DOMContentLoaded', () => {
    // 관리자 화면이 열린 뒤에 실행되도록 약간 대기
    setTimeout(() => {
      if (document.getElementById('stat-today')) {
        loadVisitorStats();
      }
    }, 300);
  });
})();