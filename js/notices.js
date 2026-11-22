// ============================================================
// notices.js — 공지사항 / 회원 게시판 관리
// 의존: utils.js (esc), config.js (db)
// ============================================================

let noticeTableName = 'notices';
let boardTableName = 'board_posts';
let editingNoticeId = null;
let editingNoticeContentColumn = 'content';

const noticeText = v => esc(v == null ? '' : String(v));
const has = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);

async function findReadableTable(candidates) {
  for (const t of candidates) {
    const r = await db.from(t).select('*').order('created_at', { ascending: false }).limit(300);
    if (!r.error) return { table: t, data: r.data || [] };
  }
  return null;
}

function showNoticeMessage(message, type = 'error') {
  const msg = document.getElementById('notice-msg');
  if (msg) { msg.className = 'msg ' + type; msg.textContent = message; }
  else alert(message);
}

function resetNoticeEditor() {
  editingNoticeId = null;
  editingNoticeContentColumn = 'content';
  const f = document.getElementById('notice-form');
  if (f) {
    f.reset();
    const submit = f.querySelector('[type=submit]');
    if (submit) submit.textContent = '공지 등록';
  }
}

async function loadNoticeAdminList() {
  const el = document.getElementById('notice-admin-list');
  if (!el) return;
  el.innerHTML = '로딩중...';
  const r = await findReadableTable(['notices', 'notice']);
  if (!r) {
    el.innerHTML = '<p style="color:#dc2626">공지 테이블 조회 실패: notices/notice 테이블 또는 SELECT 권한을 확인하세요.</p>';
    return;
  }
  noticeTableName = r.table;
  const rows = r.data;
  const count = document.getElementById('notice-admin-count');
  if (count) count.textContent = `(${rows.length}건)`;
  if (!rows.length) { el.innerHTML = '<p class="row-muted">등록된 공지가 없습니다.</p>'; return; }

  el.innerHTML = rows.map(n => `
    <div class="row-item">
      <div style="flex:1;min-width:180px">
        <b>${noticeText(n.title || '제목 없음')}</b>
        <div class="row-muted">${noticeText(n.created_at || '')}</div>
        <div style="white-space:pre-wrap;margin-top:6px">${noticeText(n.content || n.body || '')}</div>
      </div>
      <div class="row-actions">
        <button class="btn btn-warning btn-sm notice-edit" data-id="${noticeText(n.id)}">수정</button>
        <button class="btn btn-danger btn-sm notice-delete" data-id="${noticeText(n.id)}">삭제</button>
      </div>
    </div>`).join('');

  el.querySelectorAll('.notice-edit').forEach(b => b.onclick = () => {
    const n = rows.find(x => String(x.id) === String(b.dataset.id));
    if (!n) return;
    editingNoticeId = n.id;
    editingNoticeContentColumn = has(n, 'content') ? 'content' : 'body';
    const f = document.getElementById('notice-form');
    if (!f) return;
    f.elements.title.value = n.title || '';
    f.elements.content.value = n.content || n.body || '';
    const submit = f.querySelector('[type=submit]');
    if (submit) submit.textContent = '공지 수정';
    showNoticeMessage('수정할 내용을 변경한 뒤 [공지 수정]을 눌러주세요.', '');
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  el.querySelectorAll('.notice-delete').forEach(b => b.onclick = async () => {
    if (!confirm('공지사항을 삭제할까요?')) return;
    b.disabled = true;
    const { error } = await db.from(noticeTableName).delete().eq('id', b.dataset.id);
    b.disabled = false;
    if (error) alert('삭제 실패: ' + error.message + '\nSupabase DELETE RLS 정책을 확인해주세요.');
    else {
      if (editingNoticeId != null && String(editingNoticeId) === String(b.dataset.id)) resetNoticeEditor();
      await loadNoticeAdminList();
    }
  });
}

// 게시판 관리자: 모든 글 조회/수정/삭제
async function loadBoardAdminList() {
  const el = document.getElementById('board-admin-list');
  if (!el) return;
  el.innerHTML = '게시글 불러오는 중...';
  const r = await findReadableTable(['board_posts', 'boards', 'posts', 'member_board', 'inquiries']);
  if (!r) {
    el.innerHTML = '<p style="color:#dc2626">게시판 테이블 조회 실패: 게시판 테이블명 또는 SELECT 권한을 확인하세요.</p>';
    return;
  }
  boardTableName = r.table;
  const rows = r.data;
  const count = document.getElementById('board-admin-count');
  if (count) count.textContent = `(${rows.length}건)`;
  if (!rows.length) { el.innerHTML = '<p class="row-muted">게시글이 없습니다.</p>'; return; }

  el.innerHTML = rows.map(p => {
    const title = p.title || p.subject || '제목 없음';
    const body = p.content || p.body || p.message || '';
    const author = p.name || p.member_name || p.user_name || p.author || p.member_id || '작성자 미상';
    const secret = p.is_secret || p.secret;
    return `<div class="row-item">
      <div style="flex:1;min-width:180px">
        <b>${noticeText(title)}</b>${secret ? '<span class="board-secret-badge">비밀글</span>' : ''}
        <div class="row-muted">작성자: ${noticeText(author)} | ${noticeText(p.created_at || '')}</div>
        <div style="white-space:pre-wrap;margin-top:6px">${noticeText(body)}</div>
      </div>
      <div class="row-actions">
        <button class="btn btn-warning btn-sm board-edit" data-id="${noticeText(p.id)}">수정</button>
        <button class="btn btn-danger btn-sm board-delete" data-id="${noticeText(p.id)}">삭제</button>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.board-edit').forEach(b => b.onclick = async () => {
    const p = rows.find(x => String(x.id) === String(b.dataset.id));
    if (!p) return;
    const titleKey = has(p, 'title') ? 'title' : (has(p, 'subject') ? 'subject' : 'title');
    const bodyKey = has(p, 'content') ? 'content' : (has(p, 'body') ? 'body' : (has(p, 'message') ? 'message' : 'content'));
    const nextTitle = prompt('게시글 제목을 수정하세요.', p[titleKey] || '');
    if (nextTitle === null) return;
    const nextBody = prompt('게시글 내용을 수정하세요.', p[bodyKey] || '');
    if (nextBody === null) return;
    if (!nextTitle.trim() || !nextBody.trim()) { alert('제목과 내용을 입력해주세요.'); return; }
    b.disabled = true;
    const { error } = await db.from(boardTableName).update({ [titleKey]: nextTitle.trim(), [bodyKey]: nextBody.trim() }).eq('id', p.id);
    b.disabled = false;
    if (error) alert('게시글 수정 실패: ' + error.message + '\nSupabase UPDATE RLS 정책을 확인해주세요.');
    else { alert('게시글 수정 요청을 완료했습니다.'); await loadBoardAdminList(); }
  });

  el.querySelectorAll('.board-delete').forEach(b => b.onclick = async () => {
    if (!confirm('게시글을 삭제할까요?')) return;
    b.disabled = true;
    const { error } = await db.from(boardTableName).delete().eq('id', b.dataset.id);
    b.disabled = false;
    if (error) alert('삭제 실패: ' + error.message + '\nSupabase DELETE RLS 정책을 확인해주세요.');
    else await loadBoardAdminList();
  });
}

// 공지 등록/수정: UPDATE 후 select()를 요구하지 않음
// Supabase RLS에서 UPDATE는 성공해도 SELECT 정책 때문에 반환 데이터가 비는 경우가 있음.
const noticeForm = document.getElementById('notice-form');
if (noticeForm) {
  noticeForm.onsubmit = async e => {
    e.preventDefault();
    const title = noticeForm.elements.title.value.trim();
    const content = noticeForm.elements.content.value.trim();
    const submit = noticeForm.querySelector('[type=submit]');
    if (!title || !content) { showNoticeMessage('제목과 내용을 입력해주세요.'); return; }
    const isEditing = editingNoticeId !== null && editingNoticeId !== undefined;
    const targetId = editingNoticeId;
    const payload = { title, [isEditing ? editingNoticeContentColumn : 'content']: content };
    if (submit) { submit.disabled = true; submit.textContent = '저장 중...'; }
    showNoticeMessage('', '');
    try {
      const res = isEditing
        ? await db.from(noticeTableName).update(payload).eq('id', targetId)
        : await db.from(noticeTableName).insert(payload);
      if (res.error) throw res.error;

      // 반환 데이터가 비어 있는 것은 UPDATE 실패의 증거가 아님.
      // RLS가 UPDATE를 0행으로 조용히 필터링하는 경우는 정책에서 해결해야 함.
      resetNoticeEditor();
      showNoticeMessage(isEditing
        ? '수정 요청이 처리되었습니다. 목록을 새로 불러왔습니다. 내용이 그대로라면 공지 테이블의 UPDATE RLS 정책과 ID를 확인해주세요.'
        : '공지사항이 등록되었습니다.', 'success');
      await loadNoticeAdminList();
    } catch (err) {
      showNoticeMessage('저장 실패: ' + (err?.message || String(err)) + '\nSupabase 공지 테이블의 INSERT/UPDATE RLS 정책과 컬럼명을 확인해주세요.');
      if (submit) submit.textContent = isEditing ? '공지 수정' : '공지 등록';
    } finally {
      if (submit) submit.disabled = false;
    }
  };
}

// 서브탭 전환
 document.querySelectorAll('.notice-subtab-btn').forEach(btn => {
  btn.onclick = () => {
    const board = btn.dataset.subtab === 'board';
    const noticeSection = document.getElementById('notice-subsection');
    const boardSection = document.getElementById('board-subsection');
    if (noticeSection) noticeSection.style.display = board ? 'none' : 'block';
    if (boardSection) boardSection.style.display = board ? 'block' : 'none';
    document.querySelectorAll('.notice-subtab-btn').forEach(x => {
      x.classList.toggle('active', x === btn);
      x.style.background = x === btn ? '#111827' : '#fff';
      x.style.color = x === btn ? '#fff' : '#374151';
    });
    if (board) loadBoardAdminList(); else loadNoticeAdminList();
  };
});

// 초기 화면에서 관리자 목록 표시
if (document.getElementById('notice-admin-list')) loadNoticeAdminList();
