// ============================================================
// global-detail-images.js — 전체 상품 상세 공통 이미지
// (notice: 상세이미지 위 공지 이미지 / footer: 사용설명·배송안내 이미지)
// ============================================================

function setGlobalDetailImagePreview(type, url) {
  const prefix = type === 'notice' ? 'detail-notice' : 'detail-footer';
  const box = document.getElementById(prefix + '-preview');
  const img = document.getElementById(prefix + '-preview-img');
  if (!box || !img) return;
  if (url) { img.src = url; box.style.display = 'block'; }
  else { img.removeAttribute('src'); box.style.display = 'none'; }
}

async function loadGlobalDetailImages() {
  const { data } = await db.from('settings')
    .select('key,value')
    .in('key', Object.values(GLOBAL_DETAIL_IMAGE_KEYS));
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value || ''; });
  const notice = map[GLOBAL_DETAIL_IMAGE_KEYS.notice] || '';
  const footer = map[GLOBAL_DETAIL_IMAGE_KEYS.footer] || '';
  document.getElementById('detail-notice-url').value = notice;
  document.getElementById('detail-footer-url').value = footer;
  setGlobalDetailImagePreview('notice', notice);
  setGlobalDetailImagePreview('footer', footer);
}

// 각 타입(notice/footer)별 이벤트 바인딩
['notice', 'footer'].forEach(type => {
  const prefix = type === 'notice' ? 'detail-notice' : 'detail-footer';
  const fileInput = document.getElementById(prefix + '-file');
  const urlInput  = document.getElementById(prefix + '-url');
  const saveBtn   = document.getElementById(prefix + '-save');
  const deleteBtn = document.getElementById(prefix + '-delete');
  if (!fileInput) return; // DOM에 없으면 스킵

  // 파일 업로드
  fileInput.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const m = document.getElementById(prefix + '-msg');
    m.className = 'msg';
    m.textContent = '업로드 중...';
    try {
      const url = await uploadSiteImage(file, 'product-detail-global');
      urlInput.value = url;
      setGlobalDetailImagePreview(type, url);
      m.className = 'msg success';
      m.textContent = '업로드 완료! 저장 버튼을 누르세요.';
    } catch (err) {
      m.className = 'msg error';
      m.textContent = (err.message || err);
    } finally {
      e.target.value = '';
    }
  });

  // URL 직접 입력 → 미리보기
  urlInput.addEventListener('input', e => setGlobalDetailImagePreview(type, e.target.value.trim()));

  // 저장
  saveBtn.addEventListener('click', async () => {
    const m = document.getElementById(prefix + '-msg');
    const url = urlInput.value.trim();
    m.className = 'msg';
    m.textContent = '저장 중...';
    const key = GLOBAL_DETAIL_IMAGE_KEYS[type];
    const { data: old } = await db.from('settings').select('value').eq('key', key).maybeSingle();
    if (old?.value && old.value !== url) await deleteSiteImageByUrl(old.value);
    const { error } = await db.from('settings').upsert({ key, value: url });
    if (error) {
      m.className = 'msg error';
      m.textContent = error.message;
    } else {
      m.className = 'msg success';
      m.textContent = '저장 완료!';
    }
  });

  // 삭제
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('삭제할까요?')) return;
    const m = document.getElementById(prefix + '-msg');
    const key = GLOBAL_DETAIL_IMAGE_KEYS[type];
    const { data: old } = await db.from('settings').select('value').eq('key', key).maybeSingle();
    if (old?.value) await deleteSiteImageByUrl(old.value);
    const { error } = await db.from('settings').delete().eq('key', key);
    if (error) {
      m.className = 'msg error';
      m.textContent = error.message;
    } else {
      urlInput.value = '';
      setGlobalDetailImagePreview(type, '');
      m.className = 'msg success';
      m.textContent = '삭제 완료!';
    }
  });
});
