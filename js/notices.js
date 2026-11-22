// ============================================================
// notices.js — 공지사항 / 회원 게시판 관리
// 의존: utils.js (esc), config.js
// ============================================================

let noticeTableName = 'notices';
let boardTableName = 'board_posts';
let editingNoticeId = null;
let editingNoticeContentColumn = 'content';

const noticeText = v => esc(v == null ? '' : String(v));

async function findReadableTable(candidates) {
  for (const t of candidates) {
    const r = await db.from(t).select('*').order('created_at', { ascending: false }).limit(300);
    if (!r.error) return { table: t, data: r.data || [] };
  }
  return null;
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
    el.innerHTML = '<p style="color:#dc2626">공지 테이블 조회 실패: notices/notice 테이블 또는 권한을 확인하세요.</p>';
    return;
  }
  noticeTableName = r.table;
  const rows = r.data;
  const count = document.getElementById('notice-admin-count');
  if (count) count.textContent = `(${rows.length}건)`;

  if (!rows.length) {
    el.innerHTML = '<p class="row-muted">등록된 공지가 없습니다.</p>';
    return;
  }

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
    // 기존 테이블이 content 대신 body 컬럼을 사용하는 경우 해당 컬럼으로 저장
    editingNoticeContentColumn = Object.prototype.hasOwnProperty.call(n, 'content') ? 'content' : 'body';
    const f = document.getElementById('notice-form');
    if (!f) return;
    f.elements.title.value = n.title || '';
    f.elements.content.value = n.content || n.body || '';
    const submit = f.querySelector('[type=submit]');
    if (submit) submit.textContent = '공지 수정';
    const msg = document.getElementById('notice-msg');
    if (msg) { msg.className = 'msg'; msg.textContent = '수정할 내용을 변경한 뒤 [공지 수정]을 눌러주세요.'; }
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  el.querySelectorAll('.notice-delete').forEach(b => b.onclick = async () => {
    if (!confirm('공지사항을 삭제할까요?')) return;
    const { error } = await db.from(noticeTableName).delete().eq('id', b.dataset.id);
    if (error) alert('삭제 실패: ' + error.message);
    else {
      if (editingNoticeId != null && String(editingNoticeId) === String(b.dataset.id)) resetNoticeEditor();
      await loadNoticeAdminList();
    }
  });
}

async function loadBoardAdminList() {
  const el = document.getElementById('board-admin-list');
  if (!el) return;
  el.innerHTML = '게시글 불러오는 중...';

  const r = await findReadableTable(['board_posts', 'boards', 'posts', 'member_board', 'inquiries']);
  if (!r) {
    el.innerHTML = '<p style="color:#dc2626">게시판 테이블 조회 실패: 게시판 테이블명 또는 권한을 확인하세요.</p>';
    return;
  }
  boardTableName = r.table;
  const rows = r.data;
  const count = document.getElementById('board-admin-count');
  if (count) count.textContent = `(${rows.length}건)`;

  if (!rows.length) {
    el.innerHTML = '<p class="row-muted">게시글이 없습니다.</p>';
    return;
  }

  el.innerHTML = rows.map(p => {
    const title = p.title || p.subject || '제목 없음';
    const body = p.content || p.body || p.message || '';
    const author = p.name || p.member_name || p.user_name || p.author || p.member_id || '작성자 미상';
    const secret = p.is_secret || p.secret;
    return `
      <div class="row-item">
        <div style="flex:1;min-width:180px">
          <b>${noticeText(title)}</b>${secret ? '<span class="board-secret-badge">비밀글</span>' : ''}
          <div class="row-muted">작성자: ${noticeText(author)} | ${noticeText(p.created_at || '')}</div>
          <div style="white-space:pre-wrap;margin-top:6px">${noticeText(body)}</div>
        </div>
        <div class="row-actions">
          <button class="btn btn-danger btn-sm board-delete" data-id="${noticeText(p.id)}">삭제</button>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.board-delete').forEach(b => b.onclick = async () => {
    if (!confirm('게시글을 삭제할까요?')) return;
    const { error } = await db.from(boardTableName).delete().eq('id', b.dataset.id);
    if (error) alert('삭제 실패: ' + error.message);
    else await loadBoardAdminList();
  });
}

// ============ 공지 등록/수정 ============
const noticeForm = document.getElementById('notice-form');
if (noticeForm) {
  noticeForm.onsubmit = async e => {
    e.preventDefault();
    const title = noticeForm.elements.title.value.trim();
    const content = noticeForm.elements.content.value.trim();
    const msg = document.getElementById('notice-msg');
    const submit = noticeForm.querySelector('[type=submit]');
    if (!title || !content) {
      if (msg) { msg.className = 'msg error'; msg.textContent = '제목과 내용을 입력해주세요.'; }
      return;
    }

    const isEditing = editingNoticeId !== null && editingNoticeId !== undefined;
    const payload = { title, [isEditing ? editingNoticeContentColumn : 'content']: content };
    if (submit) { submit.disabled = true; submit.textContent = '저장 중...'; }
    if (msg) { msg.className = 'msg'; msg.textContent = ''; }

    try {
      let res;
      if (isEditing) {
        // select 결과를 확인해 RLS 차단 또는 잘못된 ID로 0건 갱신되는 상황을 감지
        res = await db.from(noticeTableName)
          .update(payload)
          .eq('id', editingNoticeId)
          .select('id')
          .maybeSingle();
      } else {
        res = await db.from(noticeTableName).insert(payload).select('id').maybeSingle();
      }

      if (res.error) throw res.error;
      if (!res.data) {
        throw new Error('변경된 공지사항이 없습니다. 수정 권한(RLS 정책)과 공지 ID를 확인해주세요.');
      }

      resetNoticeEditor();
      if (msg) { msg.className = 'msg success'; msg.textContent = isEditing ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.'; }
      await loadNoticeAdminList();
    } catch (err) {
      if (msg) { msg.className = 'msg error'; msg.textContent = '저장 실패: ' + (err?.message || String(err)); }
      else alert('저장 실패: ' + (err?.message || String(err)));
      if (submit) submit.textContent = isEditing ? '공지 수정' : '공지 등록';
    } finally {
      if (submit) submit.disabled = false;
    }
  };
}

// ============ 서브탭 전환 (공지 / 게시판) ============
document.querySelectorAll('.notice-subtab-btn').forEach(btn => {
  btn.onclick = () => {
    const board = btn.dataset.subtab === 'board';
    document.getElementById('notice-subsection').style.display = board ? 'none' : 'block';
    document.getElementById('board-subsection').style.display = board ? 'block' : 'none';
    document.querySelectorAll('.notice-subtab-btn').forEach(x => {
      x.classList.toggle('active', x === btn);
      x.style.background = x === btn ? '#111827' : '#fff';
      x.style.color = x === btn ? '#fff' : '#374151';
    });
    if (board) loadBoardAdminList();
    else loadNoticeAdminList();
  };
});
