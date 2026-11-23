// ============================================================
// visitor-tracker.js — 방문자 기록
// ============================================================

(async function () {
  'use strict';

  const client = window.db || (typeof getSupabaseClient === 'function' ? getSupabaseClient() : null);

  if (!client) {
    console.error('방문자 기록 실패: Supabase 연결을 찾을 수 없습니다.');
    return;
  }

  function getKstDate() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const get = type =>
      parts.find(item => item.type === type)?.value || '';

    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  const today = getKstDate();
  const storageKey = `stkstory_visitor_${today}`;

  try {
    if (localStorage.getItem(storageKey) === '1') {
      return;
    }
  } catch (error) {
    console.warn('방문자 중복 확인 저장소 접근 실패:', error);
  }

  try {
    const { error } = await client
      .from('visitors') // ⭐ 테이블명 visitors 로 변경
      .insert({
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    try {
      localStorage.setItem(storageKey, '1');
    } catch (storageError) {
      console.warn('방문자 중복 방지 저장 실패:', storageError);
    }

    console.log('방문 기록 저장 완료');

  } catch (error) {
    console.error('방문 기록 저장 실패:', error);
  }
})();