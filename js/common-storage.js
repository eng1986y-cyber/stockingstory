// ============================================================
// common-storage.js — Supabase Storage 업로드/삭제 유틸
// ============================================================

async function uploadSiteImage(file, folder) {
  if (!file) throw new Error('업로드할 이미지를 선택하세요.');
  if (!file.type || !file.type.startsWith('image/')) throw new Error('이미지 파일만 가능합니다.');
  if (file.size > 10 * 1024 * 1024) throw new Error('10MB 이하만 가능합니다.');
  const ext = ((file.name.split('.').pop() || 'jpg').toLowerCase()).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await db.storage.from(SITE_ASSET_BUCKET).upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type
  });
  if (error) {
    if (/bucket not found/i.test(error.message || '')) {
      throw new Error('Storage에 "site-assets" 공개 버킷을 먼저 만들어 주세요.');
    }
    throw error;
  }
  const { data } = db.storage.from(SITE_ASSET_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('공개 URL을 가져오지 못했습니다.');
  return data.publicUrl;
}

async function deleteSiteImageByUrl(url) {
  if (!url || typeof url !== 'string') return;
  try {
    const marker = `/storage/v1/object/public/${SITE_ASSET_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    let path = url.slice(idx + marker.length);
    const q = path.indexOf('?');
    if (q !== -1) path = path.slice(0, q);
    path = decodeURIComponent(path);
    if (!path) return;
    await db.storage.from(SITE_ASSET_BUCKET).remove([path]);
  } catch (e) {
    console.warn('deleteSiteImageByUrl 실패:', e);
  }
}
