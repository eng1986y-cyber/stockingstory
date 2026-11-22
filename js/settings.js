// ============================================================
// settings.js — 사이트 설정
// 로고 / 홍보영상 / 배너 / 배경 / 푸터 / 계좌 / SNS / 배송비
// 의존: utils.js (esc), common-storage.js (upload/delete),
//       config.js (HERO_BG_KEY)
// ============================================================

// ============ 로고 ============
let currentLogoId = null, currentLogoUrl = '';

async function loadLogo() {
  const { data } = await db.from('logos').select('*').order('id', { ascending: false }).limit(1).maybeSingle();
  const preview = document.getElementById('logo-preview');
  const img = document.getElementById('logo-preview-img');
  document.getElementById('logo-site-name').value = data?.site_name || '';
  document.getElementById('logo-image-url').value = data?.image_url || '';
  currentLogoId = data?.id || null;
  currentLogoUrl = data?.image_url || '';
  if (data?.image_url) { img.src = data.image_url; preview.style.display = 'block'; }
  else preview.style.display = 'none';
}

document.getElementById('logo-image-file').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const m = document.getElementById('logo-msg');
  m.className = 'msg';
  m.textContent = '업로드 중...';
  try {
    const url = await uploadSiteImage(file, 'logos');
    document.getElementById('logo-image-url').value = url;
    document.getElementById('logo-preview-img').src = url;
    document.getElementById('logo-preview').style.display = 'block';
    m.className = 'msg success';
    m.textContent = '업로드 완료! 저장을 누르세요.';
  } catch (err) {
    m.className = 'msg error';
    m.textContent = (err.message || err);
  } finally {
    e.target.value = '';
  }
});

document.getElementById('logo-save-btn').onclick = async () => {
  const m = document.getElementById('logo-msg');
  const sn = document.getElementById('logo-site-name').value.trim();
  const url = document.getElementById('logo-image-url').value.trim();
  if (!sn && !url) {
    m.className = 'msg error';
    m.textContent = '사이트명 또는 URL 필요';
    return;
  }
  m.className = 'msg';
  m.textContent = '저장 중...';
  if (currentLogoUrl && currentLogoUrl !== url) await deleteSiteImageByUrl(currentLogoUrl);
  let error;
  if (currentLogoId) {
    ({ error } = await db.from('logos').update({
      site_name: sn || null, image_url: url || null,
      updated_at: new Date().toISOString()
    }).eq('id', currentLogoId));
  } else {
    const r = await db.from('logos').insert({ site_name: sn || null, image_url: url || null }).select().single();
    error = r.error;
    if (r.data) currentLogoId = r.data.id;
  }
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    localStorage.removeItem('logo_cache');
    loadLogo();
  }
};

document.getElementById('logo-delete-btn').onclick = async () => {
  if (!currentLogoId || !confirm('로고를 삭제할까요?')) return;
  const m = document.getElementById('logo-msg');
  if (currentLogoUrl) await deleteSiteImageByUrl(currentLogoUrl);
  const { error } = await db.from('logos').delete().eq('id', currentLogoId);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '삭제 완료!';
    document.getElementById('logo-site-name').value = '';
    document.getElementById('logo-image-url').value = '';
    document.getElementById('logo-preview').style.display = 'none';
    currentLogoId = null;
    currentLogoUrl = '';
    localStorage.removeItem('logo_cache');
  }
};

// ============ 푸터 ============
async function loadFooter() {
  const { data } = await db.from('settings').select('key, value')
    .in('key', ['footer_owner','footer_phone','footer_email','footer_address','footer_business','footer_text']);
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value || ''; });
  ['owner','phone','email','address','business','text'].forEach(k => {
    document.getElementById('footer-' + k).value = map['footer_' + k] || '';
  });
}

document.getElementById('save-footer').onclick = async () => {
  const m = document.getElementById('footer-msg');
  m.className = 'msg';
  m.textContent = '저장 중...';
  const updates = ['owner','phone','email','address','business','text'].map(k => ({
    key: 'footer_' + k,
    value: document.getElementById('footer-' + k).value.trim()
  }));
  const { error } = await db.from('settings').upsert(updates);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    localStorage.removeItem('footer_cache');
  }
};

// ============ 입금 계좌 ============
async function loadAccountSetting() {
  const { data } = await db.from('settings').select('key, value')
    .in('key', ['account_bank', 'account_number', 'account_holder']);
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value || ''; });
  document.getElementById('account-bank').value = map.account_bank || '';
  document.getElementById('account-number').value = map.account_number || '';
  document.getElementById('account-holder').value = map.account_holder || '';
}

document.getElementById('save-account').onclick = async () => {
  const m = document.getElementById('account-msg');
  m.className = 'msg';
  m.textContent = '저장 중...';
  const { error } = await db.from('settings').upsert([
    { key: 'account_bank', value: document.getElementById('account-bank').value.trim() },
    { key: 'account_number', value: document.getElementById('account-number').value.trim() },
    { key: 'account_holder', value: document.getElementById('account-holder').value.trim() },
  ]);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    localStorage.removeItem('footer_cache');
  }
};

// ============ SNS ============
async function loadSnsLinks() {
  const { data } = await db.from('settings').select('key, value')
    .in('key', ['footer_instagram','footer_blog','footer_band']);
  const map = {};
  (data || []).forEach(r => { map[r.key] = r.value || ''; });
  document.getElementById('footer-instagram').value = map.footer_instagram || '';
  document.getElementById('footer-blog').value = map.footer_blog || '';
  document.getElementById('footer-band').value = map.footer_band || '';
}

document.getElementById('save-sns').onclick = async () => {
  const m = document.getElementById('sns-msg');
  m.className = 'msg';
  m.textContent = '저장 중...';
  const norm = v => {
    const s = (v || '').trim();
    if (!s) return '';
    return /^https?:\/\//i.test(s) ? s : 'https://' + s;
  };
  const { error } = await db.from('settings').upsert([
    { key: 'footer_instagram', value: norm(document.getElementById('footer-instagram').value) },
    { key: 'footer_blog', value: norm(document.getElementById('footer-blog').value) },
    { key: 'footer_band', value: norm(document.getElementById('footer-band').value) },
  ]);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    localStorage.removeItem('footer_cache');
  }
};

// ============ 홍보 영상 ============
let currentPromoVideoUrl = '';

function getVideoEmbedUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (/\/embed\//i.test(s) || /player\.vimeo\.com/i.test(s)) return s;
  let m = s.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
  m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  m = s.match(/dailymotion\.com\/video\/([A-Za-z0-9]+)/);
  if (m) return `https://www.dailymotion.com/embed/video/${m[1]}`;
  m = s.match(/tv\.naver\.com\/v\/(\d+)/);
  if (m) return `https://tv.naver.com/embed/${m[1]}`;
  m = s.match(/tv\.kakao\.com\/v\/(\w+)/);
  if (m) return `https://tv.kakao.com/embed/player/cliplink/${m[1]}`;
  if (/facebook\.com\/.+\/videos\//.test(s) || /fb\.watch\//.test(s)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(s)}`;
  }
  m = s.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (m) return `https://www.instagram.com/p/${m[1]}/embed`;
  m = s.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;
  m = s.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
  if (m) return `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`;
  return s;
}

async function loadPromoVideo() {
  const { data } = await db.from('settings').select('value').eq('key', 'promo_video_url').maybeSingle();
  currentPromoVideoUrl = data?.value || '';
  document.getElementById('promo-video-url').value = currentPromoVideoUrl;
  const box = document.getElementById('promo-video-preview');
  const inner = document.getElementById('promo-video-preview-inner');
  if (currentPromoVideoUrl) {
    inner.innerHTML = `<iframe src="${getVideoEmbedUrl(currentPromoVideoUrl)}" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>`;
    box.style.display = 'block';
  } else {
    inner.innerHTML = '';
    box.style.display = 'none';
  }
}

document.getElementById('promo-video-save-btn').onclick = async () => {
  const m = document.getElementById('promo-video-msg');
  const url = document.getElementById('promo-video-url').value.trim();
  if (!url) {
    m.className = 'msg error';
    m.textContent = 'URL을 입력하세요.';
    return;
  }
  m.className = 'msg';
  m.textContent = '저장 중...';
  const { error } = await db.from('settings').upsert({ key: 'promo_video_url', value: url });
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    localStorage.removeItem('footer_cache');
    await loadPromoVideo();
  }
};

document.getElementById('promo-video-delete-btn').onclick = async () => {
  if (!currentPromoVideoUrl || !confirm('영상을 삭제할까요?')) return;
  const m = document.getElementById('promo-video-msg');
  const { error } = await db.from('settings').delete().eq('key', 'promo_video_url');
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '삭제 완료!';
    document.getElementById('promo-video-url').value = '';
    currentPromoVideoUrl = '';
    document.getElementById('promo-video-preview').style.display = 'none';
    localStorage.removeItem('footer_cache');
  }
};

// ============ 배너 ============
async function loadBanner() {
  const listEl = document.getElementById('banner-list');
  const { data, error } = await db.from('banners').select('*').order('id', { ascending: false });
  if (error) {
    listEl.innerHTML = '<p style="color:#dc2626;">' + error.message + '</p>';
    return;
  }
  const list = (data || []).filter(b => b.image_url);
  document.getElementById('banner-count').textContent = `(총 ${list.length}개)`;
  if (list.length === 0) {
    listEl.innerHTML = '<p style="color:#9ca3af;">등록된 배너가 없습니다.</p>';
    return;
  }
  listEl.innerHTML = list.map(b => `
    <div class="banner-item" data-id="${b.id}">
      <img class="banner-item-thumb" src="${b.image_url}" alt="" loading="lazy">
      <div class="banner-item-info">
        ${b.link_url
          ? `<a class="b-link" href="${b.link_url}" target="_blank" rel="noopener">${esc(b.link_url)}</a>`
          : `<span style="color:#9ca3af;">링크 없음</span>`}
      </div>
      <div class="b-actions">
        <button class="b-edit-btn" data-id="${b.id}">수정</button>
        <button class="b-del-btn" data-id="${b.id}">삭제</button>
      </div>
    </div>`).join('');

  listEl.querySelectorAll('.b-edit-btn').forEach(btn => btn.onclick = () => {
    const b = list.find(x => String(x.id) === String(btn.dataset.id));
    if (b) openBannerEditModal(b);
  });
  listEl.querySelectorAll('.b-del-btn').forEach(btn => btn.onclick = async () => {
    if (!confirm('배너를 삭제할까요?')) return;
    const t = list.find(x => String(x.id) === String(btn.dataset.id));
    if (t?.image_url) await deleteSiteImageByUrl(t.image_url);
    await db.from('banners').delete().eq('id', btn.dataset.id);
    loadBanner();
  });
}

function openBannerEditModal(b) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box">
      <h2>배너 수정</h2>
      <form id="banner-edit-form" class="modal-form">
        <label>배너 이미지 URL *</label>
        <input name="image_url" value="${esc(b.image_url || '')}" required>
        <label>또는 업로드</label>
        <input name="image_file" type="file" accept="image/*">
        <label>링크 URL</label>
        <input name="link_url" value="${esc(b.link_url || '')}">
        <div style="margin-top:8px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">미리보기</div>
          <img id="banner-edit-preview" src="${b.image_url || ''}"
            style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; border:1px solid #e5e7eb;">
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">저장</button>
          <button type="button" id="cancel-edit" class="btn btn-secondary">취소</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  const form = modal.querySelector('#banner-edit-form');
  const preview = modal.querySelector('#banner-edit-preview');

  form.querySelector('input[name="image_file"]').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadSiteImage(file, 'banners');
      form.querySelector('input[name="image_url"]').value = url;
      preview.src = url;
    } catch (err) {
      alert((err.message || err));
    } finally {
      e.target.value = '';
    }
  });
  modal.querySelector('#cancel-edit').onclick = () => modal.remove();
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const imageUrl = form.image_url.value.trim();
    const linkUrl = form.link_url.value.trim();
    if (!imageUrl) return;
    if (b.image_url && b.image_url !== imageUrl) await deleteSiteImageByUrl(b.image_url);
    const { error } = await db.from('banners').update({ image_url: imageUrl, link_url: linkUrl || null }).eq('id', b.id);
    if (error) alert(error.message);
    else { modal.remove(); loadBanner(); }
  });
}

document.getElementById('banner-image-file').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const m = document.getElementById('banner-msg');
  m.className = 'msg';
  m.textContent = '업로드 중...';
  try {
    const url = await uploadSiteImage(file, 'banners');
    document.getElementById('banner-image-url').value = url;
    m.className = 'msg success';
    m.textContent = '업로드 완료!';
  } catch (err) {
    m.className = 'msg error';
    m.textContent = (err.message || err);
  } finally {
    e.target.value = '';
  }
});

document.getElementById('banner-save-btn').onclick = async () => {
  const m = document.getElementById('banner-msg');
  const imageUrl = document.getElementById('banner-image-url').value.trim();
  const linkUrl = document.getElementById('banner-link-url').value.trim();
  if (!imageUrl) {
    m.className = 'msg error';
    m.textContent = '이미지 URL 필요';
    return;
  }
  m.className = 'msg';
  m.textContent = '저장 중...';
  const { error } = await db.from('banners').insert({ image_url: imageUrl, link_url: linkUrl || null });
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '추가되었습니다!';
    document.getElementById('banner-image-url').value = '';
    document.getElementById('banner-link-url').value = '';
    loadBanner();
  }
};

// ============ 배경 이미지 ============
let currentHeroBgUrl = '';

function setHeroBgPreview(url) {
  const box = document.getElementById('hero-bg-preview');
  const img = document.getElementById('hero-bg-preview-img');
  if (url) {
    img.src = url;
    box.style.display = 'block';
  } else {
    img.removeAttribute('src');
    box.style.display = 'none';
  }
}

async function loadHeroBg() {
  const { data } = await db.from('settings').select('value').eq('key', HERO_BG_KEY).maybeSingle();
  const url = data?.value || '';
  currentHeroBgUrl = url;
  document.getElementById('hero-bg-image-url').value = url;
  setHeroBgPreview(url);
  document.documentElement.style.setProperty('--hero-bg', url ? `url("${url}")` : 'none');
}

document.getElementById('hero-bg-image-file').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const m = document.getElementById('hero-bg-msg');
  m.className = 'msg';
  m.textContent = '업로드 중...';
  try {
    const url = await uploadSiteImage(file, 'hero-bg');
    document.getElementById('hero-bg-image-url').value = url;
    setHeroBgPreview(url);
    m.className = 'msg success';
    m.textContent = '업로드 완료!';
  } catch (err) {
    m.className = 'msg error';
    m.textContent = (err.message || err);
  } finally {
    e.target.value = '';
  }
});

document.getElementById('hero-bg-image-url').addEventListener('input', e =>
  setHeroBgPreview(e.target.value.trim())
);

document.getElementById('hero-bg-save-btn').onclick = async () => {
  const m = document.getElementById('hero-bg-msg');
  const url = document.getElementById('hero-bg-image-url').value.trim();
  if (!url) {
    m.className = 'msg error';
    m.textContent = 'URL 필요';
    return;
  }
  m.className = 'msg';
  m.textContent = '저장 중...';
  if (currentHeroBgUrl && currentHeroBgUrl !== url) await deleteSiteImageByUrl(currentHeroBgUrl);
  const { error } = await db.from('settings').upsert({ key: HERO_BG_KEY, value: url });
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
    loadHeroBg();
  }
};

document.getElementById('hero-bg-delete-btn').onclick = async () => {
  if (!confirm('배경 이미지를 삭제할까요?')) return;
  const m = document.getElementById('hero-bg-msg');
  if (currentHeroBgUrl) await deleteSiteImageByUrl(currentHeroBgUrl);
  const { error } = await db.from('settings').delete().eq('key', HERO_BG_KEY);
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    document.getElementById('hero-bg-image-url').value = '';
    setHeroBgPreview('');
    currentHeroBgUrl = '';
    document.documentElement.style.setProperty('--hero-bg', 'none');
    m.className = 'msg success';
    m.textContent = '삭제 완료!';
  }
};

// ============ 배송비 ============
async function loadShippingSetting() {
  const { data } = await db.from('settings').select('value').eq('key', 'shipping_fee').maybeSingle();
  document.getElementById('global-shipping').value = data ? (data.value || 0) : 0;
}

document.getElementById('save-shipping').onclick = async () => {
  const val = Number(document.getElementById('global-shipping').value) || 0;
  const m = document.getElementById('shipping-msg');
  m.className = 'msg';
  m.textContent = '저장 중...';
  const { error } = await db.from('settings').upsert({ key: 'shipping_fee', value: String(val) });
  if (error) {
    m.className = 'msg error';
    m.textContent = error.message;
  } else {
    m.className = 'msg success';
    m.textContent = '저장 완료!';
  }
};
