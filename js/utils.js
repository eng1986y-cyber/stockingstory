// ============================================================
// utils.js — 공통 유틸 함수
// ============================================================

function formatKST(dateStr, opts = {}) {
  if (!dateStr) return '-';
  let n = String(dateStr).trim();
  if (!n) return '-';
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(n) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(n)) {
    n = n.replace(' ', 'T') + 'Z';
  }
  const d = new Date(n);
  if (isNaN(d.getTime())) return '-';
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d);
  const g = t => p.find(x => x.type === t)?.value || '00';
  const y = g('year'), mo = g('month'), da = g('day');
  const hh = g('hour') === '24' ? '00' : g('hour'), mi = g('minute'), ss = g('second');
  if (opts.dateOnly) return `${y}-${mo}-${da}`;
  if (opts.full) return `${y}-${mo}-${da} ${hh}:${mi}:${ss}`;
  return `${y}-${mo}-${da} ${hh}:${mi}`;
}

const won = n => '₩ ' + Number(n || 0).toLocaleString();

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

// ============================================================
// 엑셀(CSV) / 인쇄 헬퍼
// ============================================================

function downloadCSV(filename, rows) {
  const csv = rows.map(row => row.map(cell => {
    const s = String(cell ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function printHTML(title, rows) {
  const w = window.open('', '_blank');
  const table = `<h2 style="font-family:'Bahnschrift Light',sans-serif;">${title}</h2>
    <table border="1" cellpadding="6" cellspacing="0"
      style="border-collapse:collapse;font-size:12px;width:100%;font-family:'Bahnschrift Light',sans-serif;">
      <thead><tr>${rows[0].map(h => `<th style="background:#f3f4f6;">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  w.document.write(`<html><head><title>${title}</title></head><body style="padding:20px;">${table}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 300);
}
