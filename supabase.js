const supabaseUrl = "https://alpdhgcipjeekzrpxlbh.supabase.co";
const supabaseKey = "sb_publishable_OVbjUaCErU6bscQ3XSLDgA_p7MtTWya";

// CDN이 로드될 때까지 대기
window.addEventListener('DOMContentLoaded', () => {
  window.db = supabase.createClient(supabaseUrl, supabaseKey);
});