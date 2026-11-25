// ============================================================
// config.js — Supabase 클라이언트 & 전역 상수
// ============================================================

// Supabase 클라이언트 생성
const db = supabase.createClient(
  "https://alpdhgcipjeekzrpxlbh.supabase.co",
  "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya"
);

// ⭐ 전역 노출 (다른 파일에서 window.supabaseClient / window.db / window.sb 로 접근 가능)
window.supabaseClient = db;
window.db = db;
window.sb = db;

const SITE_ASSET_BUCKET = 'site-assets';

const GLOBAL_DETAIL_IMAGE_KEYS = {
  notice: 'global_product_detail_notice_image',
  footer: 'global_product_detail_footer_image',
};

const HERO_BG_KEY = 'hero_bg_image';

const ORDER_COLS = [
  'order_number','product_code','product_name','product_price','quantity','total_price',
  'customer_name','customer_phone','depositor_name','postcode','address','address_detail',
  'customs_number','selected_color','selected_size','selected_hem','selected_other',
  'shipping_fee','grade_discount','status','courier','tracking_number','memo','created_at'
];

const ORDER_STATUS_OPTIONS = [
  '주문접수','입금대기','결제완료','상품준비중','배송준비중','배송중','배송완료','취소요청','취소완료'
];