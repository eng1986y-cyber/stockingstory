// ============================================================
// notices.js — 공지사항 / 회원 게시판 관리
// 의존: utils.js (esc), config.js
// ============================================================

let noticeTableName = 'notices';
let boardTableName = 'board_posts';
let editingNoticeId = null;

const noticeText = v => esc(v == null ? '' : String(v));

async function findReadableTable(candidates) {
  for (const t of candidates) {
    const r = await db.from(t).select('*').order('created_at', { ascending: false }).limit(300);
    if (!r.error) return { table: t, data: r.data || [] };
  }
  return null;
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
    const n = rows.find(x => String(x.id) === b.dataset.id);
    if (!n) return;
    editingNoticeId = n.id;
    const f = document.getElementById('notice-form');
    f.elements.title.value = n.title || '';
    f.elements.content.value = n.content || n.body || '';
    f.querySelector('[type=submit]').textContent = '공지 수정';
  });

  el.querySelectorAll('.notice-delete').forEach(b => b.onclick = async () => {
    if (!confirm('공지사항을 삭제할까요?')) return;
    const { error } = await db.from(noticeTableName).delete().eq('id', b.dataset.id);
    if (error) alert('삭제 실패: ' + error.message);
    else loadNoticeAdminList();
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
    else loadBoardAdminList();
  });
}

// ============ 공지 등록/수정 ============
const noticeForm = document.getElementById('notice-form');
if (noticeForm) {
  noticeForm.onsubmit = async e => {
    e.preventDefault();
    const title = noticeForm.elements.title.value.trim();
    const content = noticeForm.elements.content.value.trim();
    if (!title || !content) return;

    const payload = { title, content };
    const res = editingNoticeId
      ? await db.from(noticeTableName).update(payload).eq('id', editingNoticeId)
      : await db.from(noticeTableName).insert(payload);

    if (res.error) {
      const msg = document.getElementById('notice-msg');
      msg.className = 'msg error';
      msg.textContent = '저장 실패: ' + res.error.message;
      return;
    }
    editingNoticeId = null;
    noticeForm.reset();
    noticeForm.querySelector('[type=submit]').textContent = '공지 등록';
    const msg = document.getElementById('notice-msg');
    msg.className = 'msg success';
    msg.textContent = '저장되었습니다.';
    loadNoticeAdminList();
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
