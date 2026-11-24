(function () {
  'use strict';

  /* ============================================================
   * 1) Config / State
   * ============================================================ */
  var PAGES = {
    home:      { t: 'หน้าหลัก',            top: 'home' },
    chat:      { t: 'ถาม AI',               top: 'chat' },
    programs:  { t: 'หลักสูตร',             top: 'programs' },
    career:    { t: 'แนะแนวอาชีพ',          top: 'career' },
    admission: { t: 'สมัครเรียน',           top: 'admission' },
    parent:    { t: 'ศูนย์ผู้ปกครอง',        top: 'parent' },
    news:      { t: 'ข่าวสารและกิจกรรม',     top: 'news' },
    more:      { t: 'เพิ่มเติม',            top: 'more' },
    contact:   { t: 'ติดต่อวิทยาลัย',        top: 'more' },
    map:       { t: 'แผนที่และที่ตั้ง',       top: 'more' },
    skills:    { t: 'ทักษะและโอกาสอาชีพ',    top: 'more' },
    learning:  { t: 'สื่อการเรียนรู้',        top: 'more' },
    calendar:  { t: 'ปฏิทินกิจกรรม',         top: 'more' },
    about:     { t: 'ข้อมูลวิทยาลัย',        top: 'more' },
    design:    { t: 'ระบบการออกแบบ',        top: 'more' },
    search:    { t: 'ค้นหา',                top: '' }
  };
  var ALIAS = { admissions: 'admission', ai: 'chat', program: 'programs', courses: 'programs', contacts: 'contact', guidance: 'career', parents: 'parent' };
  var BOTTOM = ['home', 'chat', 'programs', 'admission'];
  var SUGGESTED = ['จบ ม.3 เรียนต่ออะไรได้บ้าง', 'สมัครเรียนต้องทำอย่างไร', 'มีสาขาคอมพิวเตอร์ไหม', 'ผู้ปกครองต้องเตรียมอะไรบ้าง', 'ติดต่อเจ้าหน้าที่ได้อย่างไร'];
  var ICON_NAMES = ['home', 'chat', 'programs', 'admission', 'parent', 'news', 'contact', 'map', 'skills', 'community', 'tools', 'opportunities',
    'learning', 'certificate', 'calendar', 'settings', 'search', 'bell', 'back', 'forward', 'send', 'upload', 'external', 'success', 'warning', 'error', 'volume', 'mute', 'mic', 'like', 'love', 'smile', 'cry', 'angry'];
  var ICON_LABELS = { home: 'หน้าหลัก', chat: 'ถาม AI', programs: 'หลักสูตร', admission: 'สมัครเรียน', parent: 'ผู้ปกครอง', news: 'ข่าวสาร', contact: 'ติดต่อ', map: 'แผนที่',
    skills: 'ทักษะอาชีพ', community: 'ชุมชน', tools: 'เครื่องมือช่าง', opportunities: 'โอกาสอาชีพ', learning: 'สื่อการเรียนรู้', certificate: 'ใบประกาศ', calendar: 'ปฏิทิน',
    settings: 'ตั้งค่า', search: 'ค้นหา', bell: 'แจ้งเตือน', back: 'ย้อนกลับ', forward: 'ไปต่อ', send: 'ส่งข้อความ', upload: 'อัปโหลด', external: 'ลิงก์ภายนอก',
    success: 'สำเร็จ', warning: 'คำเตือน', error: 'ผิดพลาด', volume: 'เปิดเสียง', mute: 'ปิดเสียง', mic: 'ไมโครโฟน', like: 'ไลค์', love: 'เลิฟ', smile: 'ถูกใจ', cry: 'ร้องไห้', angry: 'โกรธ' };
  var EMPTY = { settings: {}, departments: [], programs: [], admissions: [], admissionDocs: [], news: [], faqs: [], parentInfo: [], contacts: [], knowledge: [], careerQuestions: [], popular: [], warnings: [], sampleMode: false };

  var state = {
    data: null, loading: true, error: null,
    page: 'home', params: {}, firstRender: true,
    programs: { q: '', dept: '', level: '' },
    newsCat: '',
    career: { i: 0, answers: [], done: false },
    chat: { messages: [], busy: false, sessionId: makeSession(), prefill: '' }
  };
  var bound = false;
  var lastFocus = null;
  var searchTimer = null;

  /* ============================================================
   * 2) Utilities
   * ============================================================ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function D() { return state.data || EMPTY; }

  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    try {
      var x = new URL(s);
      return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : '';
    } catch (e) { return ''; }
  }
  function telHref(p) {
    var n = String(p || '').replace(/[^0-9+]/g, '');
    return n ? 'tel:' + n : '';
  }
  function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function rich(t) {
    var lines = String(t === null || t === undefined ? '' : t).split(/\r?\n/), out = [], list = [];
    function flush() {
      if (list.length) { out.push('<ul>' + list.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'); list = []; }
    }
    lines.forEach(function (l) {
      var m = /^\s*[-•*]\s+(.*)$/.exec(l);
      if (m) list.push(m[1]);
      else { flush(); if (l.trim()) out.push('<p>' + inline(l) + '</p>'); }
    });
    flush();
    return out.join('');
  }
  function splitList(s) {
    return String(s || '').split(/[\n,;、|]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
    return out;
  }
  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(String(s).length <= 10 ? s + 'T00:00:00' : s);
    if (isNaN(d.getTime())) return '';
    try { return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(s); }
  }
  function monthLabel(key) {
    var d = new Date(key + '-01T00:00:00');
    try { return d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }); } catch (e) { return key; }
  }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function makeSession() {
    var id = '';
    try { id = sessionStorage.getItem('nicc_sid') || ''; } catch (e) { id = ''; }
    if (!id) {
      id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { sessionStorage.setItem('nicc_sid', id); } catch (e2) { /* ไม่รองรับ */ }
    }
    return id;
  }
var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwg8wCAuusSyHotm3-QYCLZvxX8R-E0R2H0t2P7w7uG2Pjw1JTxFOxigtsAGWAP4Ho/exec';

  function hasBackend() {
    return !!GAS_API_URL;
  }

  function callServer(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    return fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: name, args: args })
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* ============================================================
   * 3) Icon system
   * ============================================================ */
  function icon(name, cls) {
    return '<svg class="ico ' + esc(cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + esc(name) + '"/></svg>';
  }

  /* ============================================================
   * 4) Mascot "น้อง NICC" — SVG component (ใช้ซ้ำได้)
   *    mascot(pose, size, opts)  pose: welcome|assistant|learning|career|success|thinking|empty|error|head
   * ============================================================ */
  var POSE_LABEL = {
    welcome: 'น้อง NICC ยกมือทักทาย', assistant: 'น้อง NICC ผู้ช่วยตอบคำถาม', learning: 'น้อง NICC แนะนำหลักสูตร',
    career: 'น้อง NICC ถือหลอดไฟแนะแนวอาชีพ', success: 'น้อง NICC แสดงความยินดี', thinking: 'น้อง NICC กำลังคิด',
    empty: 'น้อง NICC ไม่พบข้อมูล', error: 'น้อง NICC แจ้งข้อผิดพลาด', head: 'โลโก้น้อง NICC'
  };
  function mArm(d) {
    return '<path d="' + d + '" fill="none" stroke="#9DB9EC" stroke-width="17" stroke-linecap="round"/>' +
           '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round"/>';
  }
  function mHand(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="10.5" fill="#1655FF"/><circle cx="' + x + '" cy="' + y + '" r="8" fill="#FFFFFF" stroke="#9DB9EC" stroke-width="1.5"/>';
  }
  function mEye(cx, ry, hx, hy) {
    return '<ellipse cx="' + cx + '" cy="102" rx="14" ry="' + (ry + 3) + '" fill="#3EB7F7" opacity=".5" filter="url(#mgGlow)"/>' +
           '<ellipse cx="' + cx + '" cy="102" rx="10" ry="' + ry + '" fill="#2FD0FF"/>' +
           '<ellipse cx="' + (cx + hx) + '" cy="' + (102 + hy) + '" rx="3.5" ry="4.5" fill="#FFFFFF" opacity=".92"/>';
  }
  function mEyes(kind) {
    var s = 'fill="none" stroke="#2FD0FF" stroke-width="5" stroke-linecap="round"';
    if (kind === 'joy') return '<path d="M66 107 Q78 90 90 107" ' + s + '/><path d="M110 107 Q122 90 134 107" ' + s + '/>';
    if (kind === 'think') return mEye(78, 13, 3, -5) + mEye(122, 13, 3, -5);
    if (kind === 'worried') return mEye(78, 10, -3, -2) + mEye(122, 10, -3, -2) +
      '<path d="M66 91 L89 85" stroke="#2FD0FF" stroke-width="3" stroke-linecap="round"/><path d="M134 91 L111 85" stroke="#2FD0FF" stroke-width="3" stroke-linecap="round"/>';
    if (kind === 'empty') return mEye(78, 13, -3, -4) + mEye(122, 13, -3, -4) +
      '<path d="M110 84 Q122 78 134 84" fill="none" stroke="#2FD0FF" stroke-width="3" stroke-linecap="round"/>';
    return mEye(78, 13, -3, -4) + mEye(122, 13, -3, -4);
  }
  function mMouth(kind) {
    var s = 'fill="none" stroke="#2FD0FF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"';
    if (kind === 'open') return '<path d="M86 118 Q100 137 114 118 Z" fill="#2FD0FF"/>';
    if (kind === 'flat') return '<path d="M92 124 H108" ' + s + '/>';
    if (kind === 'wavy') return '<path d="M88 124 q4 -5 8 0 t8 0 t8 0" ' + s + '/>';
    if (kind === 'meh') return '<path d="M92 122 q8 4 16 0" ' + s + '/>';
    return '<path d="M88 120 Q100 130 112 120" ' + s + '/>';
  }
  function mConfetti() {
    var c = ['#FFC629', '#3EB7F7', '#1655FF', '#FF6B8A'], out = '', pts = [[4, 58, 25], [14, 28, 70], [190, 52, 40], [186, 24, 100], [30, 12, 10], [168, 8, 130], [-2, 90, 60], [200, 86, 20]];
    pts.forEach(function (p, i) {
      out += '<rect x="' + p[0] + '" y="' + p[1] + '" width="8" height="3.5" rx="1.5" fill="' + c[i % 4] + '" transform="rotate(' + p[2] + ' ' + (p[0] + 4) + ' ' + (p[1] + 2) + ')"/>';
    });
    return out + '<circle cx="22" cy="48" r="2.5" fill="#FFC629"/><circle cx="178" cy="34" r="2.5" fill="#3EB7F7"/>';
  }
  var POSES = {
    welcome: { eyes: 'happy', mouth: 'smile',
      L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208),
      R: mArm('M154 172 Q194 164 188 122') + mHand(188, 114) +
         '<path d="M195 96 l6 -5 M197 110 h6 M194 126 l6 5" stroke="#FFC629" stroke-width="3" stroke-linecap="round" fill="none"/>' },
    assistant: { eyes: 'happy', mouth: 'smile',
      back: '<g transform="rotate(-8 60 202)"><rect x="42" y="188" width="38" height="28" rx="5" fill="#0B2E8A" stroke="#FFFFFF" stroke-width="2"/><rect x="46" y="192" width="30" height="20" rx="3" fill="#2FD0FF" opacity=".85"/></g>',
      L: mArm('M46 172 Q32 196 50 205') + mHand(52, 205),
      R: mArm('M154 172 Q176 178 190 164') + mHand(192, 162),
      front: '<rect x="2" y="4" width="42" height="30" rx="13" fill="#FFFFFF" stroke="#3EB7F7" stroke-width="2"/><path d="M14 32 l-4 9 l13 -8z" fill="#FFFFFF" stroke="#3EB7F7" stroke-width="2" stroke-linejoin="round"/><path d="M13 19h.01M23 19h.01M33 19h.01" stroke="#1655FF" stroke-width="4.5" stroke-linecap="round"/>' },
    learning: { eyes: 'happy', mouth: 'smile',
      back: '<path d="M100 190 q-18 -9 -40 -6 v28 q22 -3 40 6z" fill="#FFFFFF" stroke="#1655FF" stroke-width="2.5" stroke-linejoin="round"/><path d="M100 190 q18 -9 40 -6 v28 q-22 -3 -40 6z" fill="#FFF3C4" stroke="#1655FF" stroke-width="2.5" stroke-linejoin="round"/><path d="M70 194 h20 M70 201 h16 M110 194 h20 M110 201 h16" stroke="#9DB9EC" stroke-width="2" stroke-linecap="round"/>',
      L: mArm('M46 172 Q38 200 62 207') + mHand(62, 207),
      R: mArm('M154 172 Q162 200 138 207') + mHand(138, 207) },
    career: { eyes: 'happy', mouth: 'open',
      L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208),
      R: mArm('M154 172 Q194 164 188 132') + mHand(188, 124),
      front: '<path d="M188 74 a14 14 0 0 1 8 26 v6 h-16 v-6 a14 14 0 0 1 8 -26z" fill="#FFC629" stroke="#E8A800" stroke-width="2" stroke-linejoin="round"/><path d="M182 111 h12" stroke="#9DB9EC" stroke-width="3" stroke-linecap="round"/><path d="M188 58 v-8 M174 64 l-5 -5 M202 64 l5 -5" stroke="#FFC629" stroke-width="3" stroke-linecap="round"/>' },
    success: { eyes: 'joy', mouth: 'open',
      L: mArm('M46 172 Q8 164 12 118') + mHand(12, 110),
      R: mArm('M154 172 Q192 164 188 118') + mHand(188, 110),
      front: mConfetti() },
    thinking: { eyes: 'think', mouth: 'flat',
      L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208),
      R: mArm('M154 172 Q172 158 138 143') + mHand(131, 140),
      front: '<ellipse cx="174" cy="20" rx="27" ry="14" fill="#FFFFFF" stroke="#3EB7F7" stroke-width="2"/><path d="M164 20h.01M174 20h.01M184 20h.01" stroke="#1655FF" stroke-width="4.5" stroke-linecap="round"/>' },
    empty: { eyes: 'empty', mouth: 'meh',
      L: mArm('M46 172 Q18 180 16 154') + mHand(16, 146),
      R: mArm('M154 172 Q182 180 184 154') + mHand(184, 146),
      front: '<text x="2" y="128" font-family="Noto Sans Thai, sans-serif" font-size="28" font-weight="900" fill="#FFC629">?</text><text x="184" y="124" font-family="Noto Sans Thai, sans-serif" font-size="24" font-weight="900" fill="#3EB7F7">?</text>' },
    error: { eyes: 'worried', mouth: 'wavy',
      back: '<polygon points="182,112 204,152 160,152" fill="#FFC629" stroke="#E8A800" stroke-width="3" stroke-linejoin="round"/><text x="182" y="146" text-anchor="middle" font-family="Noto Sans Thai, sans-serif" font-size="26" font-weight="900" fill="#0B2E8A">!</text>',
      L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208),
      R: mArm('M154 172 Q178 176 182 162') + mHand(182, 160) },
    head: { eyes: 'happy', mouth: 'smile' }
  };

  function mascot(pose, size, opts) {
    opts = opts || {};
    var key = POSES[pose] ? pose : 'welcome';
    var P = POSES[key], isHead = key === 'head';
    var vb = isHead ? '28 12 144 142' : '-5 0 210 230';
    var ratio = isHead ? 142 / 144 : 230 / 210;
    var w = size || 160, h = Math.round(w * ratio);
    var a11y = opts.deco ? 'aria-hidden="true"' : 'role="img" aria-label="' + esc(POSE_LABEL[key]) + '"';
    var s = '<svg class="mascot' + (opts.float ? ' mascot-float' : '') + '" viewBox="' + vb + '" width="' + w + '" height="' + h + '" ' + a11y + ' focusable="false" xmlns="http://www.w3.org/2000/svg">';
    if (!isHead) {
      s += '<ellipse cx="100" cy="224" rx="46" ry="5" fill="#0B2E8A" opacity=".12"/>';
      s += '<path d="M62 150h76a14 14 0 0 1 14 14v38a16 16 0 0 1-16 16H64a16 16 0 0 1-16-16v-38a14 14 0 0 1 14-14z" fill="url(#mgBody)" stroke="#BFD3F5" stroke-width="2"/>';
      s += '<rect x="68" y="158" width="64" height="42" rx="14" fill="url(#mgBlue)"/>';
      s += '<circle cx="100" cy="178" r="17" fill="none" stroke="#FFC629" stroke-width="6" stroke-dasharray="4.6 4.3"/>';
      s += '<circle cx="100" cy="178" r="14" fill="#0B2E8A" stroke="#FFC629" stroke-width="2"/>';
      s += '<text x="100" y="181.5" text-anchor="middle" font-family="Noto Sans Thai, sans-serif" font-weight="900" font-size="9.5" fill="#FFFFFF">NICC</text>';
      s += '<circle cx="46" cy="170" r="12" fill="url(#mgBlue)" stroke="#FFC629" stroke-width="3"/><circle cx="154" cy="170" r="12" fill="url(#mgBlue)" stroke="#FFC629" stroke-width="3"/>';
      s += P.back || '';
    }
    // head
    s += '<rect x="40" y="58" width="120" height="90" rx="40" fill="url(#mgBody)" stroke="#BFD3F5" stroke-width="2"/>';
    s += '<rect x="52" y="76" width="96" height="58" rx="26" fill="url(#mgFace)"/>';
    s += '<path d="M66 85 Q100 76 134 85" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>';
    s += '<circle cx="38" cy="104" r="13" fill="url(#mgBlue)" stroke="#FFC629" stroke-width="3"/><circle cx="38" cy="104" r="5" fill="#3EB7F7"/>';
    s += '<circle cx="162" cy="104" r="13" fill="url(#mgBlue)" stroke="#FFC629" stroke-width="3"/><circle cx="162" cy="104" r="5" fill="#3EB7F7"/>';
    s += '<path d="M36 117 Q34 141 62 143" fill="none" stroke="#0B2E8A" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="143" r="4.5" fill="#FFC629"/>';
    s += mEyes(P.eyes) + mMouth(P.mouth);
    // graduation cap
    s += '<polygon points="30,42 100,68 170,42 170,47 100,73 30,47" fill="#071F63"/>';
    s += '<path d="M64 50 v16 c0 7 16 10 36 10 s36 -3 36 -10 V50 z" fill="#0B2E8A"/>';
    s += '<polygon points="100,16 170,42 100,68 30,42" fill="url(#mgBlue)" stroke="#071F63" stroke-width="1.5" stroke-linejoin="round"/>';
    s += '<circle cx="100" cy="42" r="8" fill="none" stroke="#FFC629" stroke-width="4" stroke-dasharray="3.1 3.1"/><circle cx="100" cy="42" r="6" fill="#FFC629"/><circle cx="100" cy="42" r="2.3" fill="#0B2E8A"/>';
    s += '<path d="M100 42 L156 49 V68" fill="none" stroke="#FFC629" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M152 66 h8 l2.5 13 h-13z" fill="#FFC629"/>';
    if (!isHead) {
      s += P.L || '';
      s += P.R || '';
      s += P.front || '';
    }
    return s + '</svg>';
  }

  /* ============================================================
   * 5) Small UI helpers
   * ============================================================ */
  function thumb(url, iconName, alt) {
    var u = safeUrl(url);
    return '<div class="thumb">' + icon(iconName || 'programs', 'xl') +
      (u ? '<img src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="lazy" referrerpolicy="no-referrer">' : '') + '</div>';
  }
  function sampleBadge(row) {
    return row && row._sample ? '<span class="badge badge-sample">ข้อมูลตัวอย่าง</span>' : '';
  }
  function emptyState(title, msg, pose, actions) {
    return '<div class="empty">' + mascot(pose || 'empty', 120) + '<h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p>' + (actions || '') + '</div>';
  }
  function pageHead(title, sub, pose) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
      '<div class="ph-art">' + mascot(pose || 'welcome', 96, { deco: true }) + '</div></div>';
  }
  function navBtn(page, label, cls, ico, q) {
    return '<a class="btn ' + (cls || 'btn-primary') + '" href="?page=' + esc(page) + '" data-nav="' + esc(page) + '"' + (q ? ' data-q="' + esc(q) + '"' : '') + '>' +
      (ico ? icon(ico, 'sm') : '') + esc(label) + '</a>';
  }
  function extLink(url, label, cls) {
    var u = safeUrl(url);
    if (!u) return '';
    return '<a class="btn ' + (cls || 'btn-ghost') + ' btn-sm" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + icon('external', 'sm') + '</a>';
  }
  /* ปุ่มติดตามข่าวที่เพจเฟซบุ๊ก — ใช้ลิงก์จากชีต Settings (คีย์ facebook_url) ถ้ายังไม่ตั้งค่าจะไม่แสดงปุ่ม */
  function fbFollowHtml(cls, label) {
    var u = safeUrl((D().settings || {}).facebook_url);
    if (!u) return '';
    return '<a class="btn ' + (cls || 'btn-primary') + '" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' +
      esc(label || 'ติดตามข่าวทั้งหมดที่เฟซบุ๊ก') + icon('external', 'sm') + '</a>';
  }
  function showToast(msg, type) {
    var box = $('#toasts');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = icon(type === 'err' ? 'warning' : 'success', 'sm') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, String(msg).length > 50 ? 7000 : 3200);
  }
  function deptById(id) {
    var list = D().departments;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function programById(id) {
    var list = D().programs;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function newsById(id) {
    var list = D().news;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- Modal ---------- */
  function openModal(html) {
    var root = $('#modal-root');
    lastFocus = document.activeElement;
    root.innerHTML = '<div class="modal-back" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<button type="button" class="icon-btn modal-close" data-action="modal-close" aria-label="ปิดหน้าต่าง">' + icon('close') + '</button>' +
      '<div class="modal-body">' + html + '</div></div></div>';
    document.body.style.overflow = 'hidden';
    var btn = $('.modal-close', root);
    if (btn) btn.focus();
  }
  function closeModal() {
    var root = $('#modal-root');
    if (!root || !root.firstChild) return;
    root.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
  }
  function trapFocus(e) {
    var modal = $('.modal');
    if (!modal) return;
    var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', modal);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============================================================
   * 5.5) Voice — เสียงพูด (Text-to-Speech) และสั่งงานด้วยเสียง (Speech-to-Text)
   *      ใช้ Web Speech API ของเบราว์เซอร์ ไม่ต้องมี API Key เพิ่ม
   * ============================================================ */
  var TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var voice = { on: false, th: null, rec: null, listening: false, warned: false };
  /* ข้อความเสียงเริ่มต้น (ถ้าไม่ตั้งค่า voice_<หน้า> ในชีต Settings จะใช้ข้อความนี้) */
  var DEFAULT_SPEECH = {
    home: 'กลับสู่หน้าหลักครับ',
    chat: 'สวัสดีครับ น้องนิคเองครับ พิมพ์ถาม หรือกดปุ่มไมค์พูดถามได้เลยนะครับ',
    programs: 'มาดูหลักสูตรที่เปิดสอนกันครับ',
    career: 'มาค้นหาอาชีพที่ใช่สำหรับคุณกันครับ',
    admission: 'สมัครเรียนกับเราได้เลยครับ',
    parent: 'ศูนย์ผู้ปกครองครับ มีข้อมูลที่ควรรู้ครับ',
    news: 'ติดตามข่าวสารและกิจกรรมล่าสุดครับ',
    more: 'เมนูเพิ่มเติมครับ', contact: 'ติดต่อวิทยาลัยได้ที่นี่เลยครับ', map: 'ดูแผนที่และที่ตั้งวิทยาลัยครับ',
    skills: 'ทักษะและโอกาสทางอาชีพครับ', learning: 'สื่อการเรียนรู้ครับ', calendar: 'ปฏิทินกิจกรรมครับ',
    about: 'ข้อมูลวิทยาลัยครับ', design: 'ระบบการออกแบบครับ', search: 'ค้นหาข้อมูลได้เลยครับ'
  };
  var DEFAULT_ON_SPEECH = 'เปิดเสียงแล้วครับ น้องนิคพร้อมช่วยเหลือครับ';

  function vset(key) { return String(((D().settings || {})[key]) || '').trim(); }
  function vnum(key, def, min, max) {
    var n = parseFloat(vset(key).replace(',', '.'));
    if (isNaN(n)) n = def;
    return Math.min(max, Math.max(min, n));
  }
  function pageSpeech(page) {
    return vset('voice_' + page) || DEFAULT_SPEECH[page] || (PAGES[page] ? PAGES[page].t : '');
  }


  function toSpeech(t) {
    return String(t === null || t === undefined ? '' : t)
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
      .replace(/\*\*/g, '')
      .replace(/^\s*[-•*]\s+/gm, '')
      .replace(/[•*_#>`~|“”]/g, ' ')
      .replace(/น้อง\s*(NICC|นิค)/gi, 'น้องนิค')
      .replace(/\bNICC\b/g, 'เอ็นไอซีซี')
      .replace(/\bSmart\b/gi, 'สมาร์ท')
      .replace(/\bGuild\b/gi, 'กิลด์')
      .replace(/\bAI\b/g, 'เอไอ')
      .replace(/ปวช\./g, 'ปอ วอ ชอ')
      .replace(/ปวส\./g, 'ปอ วอ สอ')
      .replace(/ม\.\s*3/g, 'มัธยมศึกษาปีที่ 3')
      .replace(/ม\.\s*6/g, 'มัธยมศึกษาปีที่ 6')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
  function chunkText(t) {
    var parts = t.replace(/([.!?])\s+/g, '$1\n').split(/\n+/), out = [];
    parts.forEach(function (p) {
      p = p.trim();
      if (!p) return;
      var buf = '';
      p.split(' ').forEach(function (w) {
        while (w.length > 180) { if (buf) { out.push(buf); buf = ''; } out.push(w.slice(0, 180)); w = w.slice(180); }
        if (buf && (buf + ' ' + w).length > 160) { out.push(buf); buf = w; }
        else buf = buf ? buf + ' ' + w : w;
      });
      if (buf) out.push(buf);
    });
    return out;
  }
  function pickThaiVoice() {
    if (!TTS) return null;
    var vs = window.speechSynthesis.getVoices() || [];
    voice.voicesLoaded = vs.length > 0;
    var th = vs.filter(function (v) { return /^th([-_]|$)/i.test(v.lang); });
    voice.thList = th;
    var want = vset('voice_name').toLowerCase(), pick = null;
    if (want) pick = th.filter(function (v) { return v.name.toLowerCase().indexOf(want) >= 0; })[0] || null;
    if (!pick) {
      // เลือกเสียงผู้ชายก่อน (ชื่อที่พบบ่อย: Niwat, Pattara) ถ้าไม่มีใช้เสียงไทยอื่นที่มี
      pick = th.filter(function (v) { return /niwat|pattara|male|ชาย/i.test(v.name) && !/female|หญิง/i.test(v.name); })[0] ||
             th.filter(function (v) { return /google|premium|enhanced|natural/i.test(v.name); })[0] || th[0] || null;
    }
    voice.th = pick;
    return pick;
  }
  function stopSpeaking() {
    if (!TTS) return;
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }
  function speak(text) {
    if (!TTS) { showToast('เบราว์เซอร์นี้ไม่รองรับเสียงพูด', 'err'); return false; }
    var clean = toSpeech(text);
    if (!clean) return false;
    stopSpeaking();
    pickThaiVoice();
    if (!voice.th && voice.voicesLoaded && !voice.warned) {
      voice.warned = true;
      showToast('อุปกรณ์นี้ยังไม่มีเสียงภาษาไทย เสียงอาจไม่ชัด — ติดตั้งเสียงไทยได้ที่การตั้งค่าอุปกรณ์', 'err');
    }
    var chunks = chunkText(clean);
    setTimeout(function () {
      chunks.forEach(function (c) {
        var u = new window.SpeechSynthesisUtterance(c);
        u.lang = 'th-TH';
        if (voice.th) u.voice = voice.th;
        u.rate = vnum('voice_rate', 1.05, 0.6, 1.6); u.pitch = vnum('voice_pitch', 1.3, 0.5, 2); u.volume = 1;
        window.speechSynthesis.speak(u);
      });
    }, 60);
    return true;
  }
  function speakPage(page) {
    if (voice.on) speak(pageSpeech(page));
  }
  function updateVoiceUi() {
    var btn = $('#voice-toggle'), ico = $('#voice-ico');
    if (!btn) return;
    btn.hidden = !TTS;
    btn.setAttribute('aria-pressed', voice.on ? 'true' : 'false');
    var label = voice.on ? 'ปิดเสียงพูด' : 'เปิดเสียงพูด';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.classList.toggle('is-on', voice.on);
    if (ico) ico.setAttribute('href', voice.on ? '#i-volume' : '#i-mute');
  }
  function setVoice(on, silent) {
    if (on && !TTS) { showToast('เบราว์เซอร์นี้ไม่รองรับเสียงพูด แนะนำ Google Chrome, Microsoft Edge หรือ Safari', 'err'); return; }
    voice.on = !!on;
    try { localStorage.setItem('nicc_voice', voice.on ? '1' : '0'); } catch (e) { /* ไม่รองรับ */ }
    updateVoiceUi();
    if (!voice.on) stopSpeaking();
    else if (!silent) speak(vset('voice_on') || DEFAULT_ON_SPEECH);
    if (!silent) showToast(voice.on ? 'เปิดเสียงพูดแล้ว' : 'ปิดเสียงพูดแล้ว', 'ok');
  }
  function initVoice() {
    try { voice.on = TTS && localStorage.getItem('nicc_voice') === '1'; } catch (e) { voice.on = false; }
    if (TTS) {
      pickThaiVoice();
      try { window.speechSynthesis.addEventListener('voiceschanged', pickThaiVoice); } catch (e) { /* ignore */ }
    }
    updateVoiceUi();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopSpeaking(); });
    window.addEventListener('pagehide', stopSpeaking);
  }

  /* ---------- Speech-to-Text: พูดถาม AI ---------- */
  function updateMicUi(active, msg) {
    var mic = $('#chat-mic'), st = $('#voice-status');
    if (mic) {
      mic.classList.toggle('is-listening', !!active);
      mic.classList.toggle('is-unsupported', !SR);
      mic.setAttribute('aria-pressed', active ? 'true' : 'false');
      mic.setAttribute('aria-label', active ? 'หยุดฟังและส่งคำถาม' : 'พูดถามด้วยเสียง');
    }
    if (st) { st.hidden = !active; st.textContent = active ? (msg || 'กำลังฟัง… พูดคำถามได้เลย') : ''; }
  }
  function abortListening() {
    if (voice.rec) {
      voice.rec._cancel = true;
      try { voice.rec.abort(); } catch (e) { /* ignore */ }
      voice.rec = null;
    }
    voice.listening = false;
    updateMicUi(false);
  }
  function micPolicyBlocked() {
    try {
      var pp = document.permissionsPolicy || document.featurePolicy;
      if (pp && typeof pp.allowsFeature === 'function') return !pp.allowsFeature('microphone');
    } catch (e) { /* ไม่รองรับการตรวจ */ }
    return false;
  }
  function hideMicHelp() {
    var box = $('#voice-help');
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }
  function showMicHelp() {
    var blocked = micPolicyBlocked(), inFrame = false;
    try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
    var title = 'ใช้ไมโครโฟนไม่ได้ในหน้านี้';
    var msg = blocked
      ? 'หน้านี้ถูกฝังอยู่ในกรอบของ Google Apps Script ซึ่งไม่เปิดสิทธิ์ไมโครโฟนให้เว็บแอป (ไม่ใช่ปัญหาที่เครื่องหรือเบราว์เซอร์ของคุณ) ตอนนี้ให้พิมพ์ถามแทนได้เลยครับ'
      : 'เบราว์เซอร์ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน — กดไอคอนล็อกข้างที่อยู่เว็บแล้วเลือก “อนุญาต” ไมโครโฟน หรือตรวจสิทธิ์ไมโครโฟนของเบราว์เซอร์ในการตั้งค่าเครื่อง แล้วลองกดไมค์ใหม่';
    var box = $('#voice-help');
    if (!box) { showToast(title + ' — ' + msg, 'err'); return; }
    box.hidden = false;
    box.innerHTML = '<div class="banner banner-info" role="alert">' + icon('mic', 'sm') + '<div><b>' + esc(title) + '</b><p>' + esc(msg) + '</p><div class="btn-row">' +
      (blocked && inFrame ? '<button type="button" class="btn btn-ghost btn-sm" data-action="open-tab">' + icon('external', 'sm') + 'ลองเปิดในแท็บใหม่</button>' : '') +
      '<button type="button" class="btn btn-quiet btn-sm" data-action="mic-help-close">ปิด</button></div></div></div>';
  }
  function handleVoiceError(code) {
    if (code === 'aborted') return;
    if (code === 'not-allowed' || code === 'service-not-allowed') { showMicHelp(); return; }
    var perm = 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน — กดไอคอนล็อกข้างที่อยู่เว็บแล้วเลือก “อนุญาต” หากยังไม่ได้ ให้เปิดเว็บแอปในแท็บใหม่โดยตรง หรือพิมพ์ถามแทน';
    var map = {
      'not-allowed': perm, 'service-not-allowed': perm,
      'no-speech': 'ไม่ได้ยินเสียง ลองพูดใหม่ให้ใกล้ไมค์ขึ้น',
      'audio-capture': 'ไม่พบไมโครโฟนในอุปกรณ์นี้',
      'network': 'บริการรู้จำเสียงต้องใช้อินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ',
      'language-not-supported': 'อุปกรณ์นี้ไม่รองรับการรู้จำเสียงภาษาไทย'
    };
    showToast(map[code] || 'รับเสียงไม่สำเร็จ กรุณาลองใหม่หรือพิมพ์ถามแทน', 'err');
  }
  function startListening() {
    if (!SR) { showToast('เบราว์เซอร์นี้ไม่รองรับการพูดสั่งงาน แนะนำ Google Chrome, Microsoft Edge หรือ Safari', 'err'); return; }
    if (voice.listening && voice.rec) { try { voice.rec.stop(); } catch (e) { /* ignore */ } return; }
    if (micPolicyBlocked()) { showMicHelp(); return; }
    if (state.chat.busy) return;
    stopSpeaking();
    var rec = new SR();
    var heard = '', finalText = '', errored = false;
    rec.lang = 'th-TH';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = function () { voice.listening = true; hideMicHelp(); updateMicUi(true); };
    rec.onresult = function (ev) {
      var interim = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      heard = (finalText + interim).trim();
      var input = $('#chat-input');
      if (input) { input.value = heard; autoGrow(input); }
    };
    rec.onerror = function (ev) { errored = true; handleVoiceError(ev && ev.error); };
    rec.onend = function () {
      voice.listening = false;
      voice.rec = null;
      updateMicUi(false);
      if (rec._cancel || errored) return;
      var q = (finalText || heard).replace(/\s+/g, ' ').trim();
      if (!q) { showToast('ไม่ได้ยินเสียง ลองกดไมค์แล้วพูดใหม่อีกครั้ง', 'err'); return; }
      if (!voice.on && TTS) { setVoice(true, true); showToast('เปิดเสียงตอบให้อัตโนมัติ (ปิดได้ที่ปุ่มลำโพงด้านบน)', 'ok'); }
      sendChat(q);
    };
    voice.rec = rec;
    try { rec.start(); }
    catch (e) { voice.rec = null; showToast('เริ่มรับเสียงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'err'); }
  }

  /* ============================================================
   * 6) Navigation (Deep link + history)
   * ============================================================ */
  function resolvePage(p) {
    var k = String(p || 'home').toLowerCase();
    if (ALIAS[k]) k = ALIAS[k];
    return PAGES[k] ? k : 'home';
  }
  function pushHistory(page, params) {
    var q = { page: page };
    if (params && params.q) q.q = params.q;
    try {
      if (window.google && google.script && google.script.history) {
        google.script.history.push({ page: page, params: params || {} }, q, '');
      } else if (window.history && history.pushState) {
        history.pushState({ page: page, params: params || {} }, '');
      }
    } catch (e) { /* บางสภาพแวดล้อมไม่อนุญาต ไม่กระทบการใช้งาน */ }
  }
  function navigate(page, params, opts) {
    opts = opts || {};
    closeModal();
    abortListening();
    stopSpeaking();
    state.page = resolvePage(page);
    state.params = params || {};
    if (opts.push !== false) pushHistory(state.page, state.params);
    render();
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    speakPage(state.page);
  }
  function setupHistory() {
    try {
      if (window.google && google.script && google.script.history) {
        google.script.history.replace({ page: state.page, params: state.params }, { page: state.page }, '');
        google.script.history.setChangeHandler(function (ev) {
          var st = ev && ev.state;
          var qp = ev && ev.location && ev.location.parameters && ev.location.parameters.page;
          var pg = (st && st.page) || (qp && qp[0]) || 'home';
          navigate(pg, (st && st.params) || {}, { push: false });
        });
        return;
      }
    } catch (e) { /* ใช้ popstate แทน */ }
    window.addEventListener('popstate', function (ev) {
      var st = ev.state;
      navigate((st && st.page) || 'home', (st && st.params) || {}, { push: false });
    });
  }

  /* ============================================================
   * 7) Data loading
   * ============================================================ */
  function loadData() {
    state.loading = true;
    state.error = null;
    render();
    if (!hasBackend()) {
      state.loading = false;
      state.data = EMPTY;
      state.error = { type: 'nobackend', msg: 'ไม่พบการเชื่อมต่อ Google Apps Script — กรุณาเปิดผ่าน Web App ที่ Deploy แล้ว (ลิงก์ที่ลงท้ายด้วย /exec หรือ /dev)' };
      onDataReady();
      return;
    }
    callServer('getBootstrap').then(function (res) {
      state.loading = false;
      if (res && res.ok) {
        state.data = Object.assign({}, EMPTY, res.data);
      } else {
        state.data = EMPTY;
        state.error = { type: 'server', msg: (res && res.error) || 'โหลดข้อมูลไม่สำเร็จ' };
      }
      onDataReady();
    }).catch(function (err) {
      state.loading = false;
      state.data = EMPTY;
      state.error = { type: 'network', msg: err && err.message === 'TIMEOUT' ? 'เชื่อมต่อนานเกินไป กรุณาลองใหม่' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' };
      onDataReady();
    });
  }
  function onDataReady() {
    renderFooter();
    var dot = $('#news-dot');
    if (dot) dot.hidden = !(D().news && D().news.length);
    if (state.page === 'chat') return; // ไม่ล้างข้อความที่ผู้ใช้กำลังพิมพ์
    render();
  }

  /* ============================================================
   * 8) Rendering
   * ============================================================ */
  function render() {
    var view = $('#view');
    if (!view) return;
    var page = state.page;
    var top = PAGES[page] ? PAGES[page].top : '';
    var bottomKey = BOTTOM.indexOf(page) >= 0 ? page : (top ? 'more' : '');

    $$('#top-nav a').forEach(function (a) {
      var on = a.getAttribute('data-nav') === top;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('#bottom-nav a').forEach(function (a) {
      var on = a.getAttribute('data-nav') === bottomKey;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = (PAGES[page] ? PAGES[page].t + ' | ' : '') + 'NICC Smart Guild';

    var needsData = ['chat', 'design'].indexOf(page) < 0;
    var html;
    if (state.loading && needsData) html = renderLoading();
    else if (state.error && needsData && state.error.type !== 'nobackend') html = renderError();
    else html = notices(page) + pageHtml(page);

    view.innerHTML = html;
    if (page === 'chat') afterChat();
    if (page === 'career') renderCareerBody();
    var changed = state.lastPage !== page;
    state.lastPage = page;
    if (!state.firstRender && changed) {
      var h = $('h1', view);
      if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }
    state.firstRender = false;
  }

  function pageHtml(page) {
    switch (page) {
      case 'home': return renderHome();
      case 'chat': return renderChat();
      case 'programs': return renderPrograms();
      case 'career': return renderCareer();
      case 'admission': return renderAdmission();
      case 'parent': return renderParent();
      case 'news': return renderNews();
      case 'more': return renderMore();
      case 'contact': return renderContact();
      case 'map': return renderMap();
      case 'skills': return renderSkills();
      case 'learning': return renderKnowledgePage('สื่อการเรียนรู้', 'เอกสารและสื่อที่วิทยาลัยเผยแพร่', ['สื่อการเรียนรู้'], 'learning', 'learning');
      case 'calendar': return renderCalendar();
      case 'about': return renderAbout();
      case 'design': return renderDesign();
      case 'search': return renderSearch();
      default: return renderHome();
    }
  }

  function renderLoading() {
    return '<div class="wrap"><div class="loading-box" role="status">' + mascot('thinking', 110, { float: true }) +
      '<p>น้อง NICC กำลังโหลดข้อมูล…</p></div>' +
      '<div class="grid grid-cards"><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div></div></div>';
  }
  function renderError() {
    var msg = state.error ? state.error.msg : 'เกิดข้อผิดพลาด';
    return '<div class="wrap section">' + emptyState('โหลดข้อมูลไม่สำเร็จ', msg, 'error',
      '<div class="btn-row" style="justify-content:center;margin-top:8px"><button type="button" class="btn btn-primary" data-action="reload">' + icon('forward', 'sm') + 'ลองใหม่อีกครั้ง</button></div>') + '</div>';
  }
  function notices(page) {
    if (page === 'chat' || page === 'design') return '';
    var out = '';
    if (state.error && state.error.type === 'nobackend') {
      out += '<div class="wrap"><div class="banner banner-err" role="alert">' + icon('warning', 'sm err') + '<span>' + esc(state.error.msg) + '</span></div></div>';
    } else if (state.error) {
      out += '<div class="wrap"><div class="banner banner-err" role="alert">' + icon('warning', 'sm err') + '<span>' + esc(state.error.msg) + '</span> <button type="button" class="btn btn-sm btn-ghost" data-action="reload">ลองใหม่</button></div></div>';
    }
    if (D().sampleMode && state.data) {
      out += '<div class="wrap"><div class="banner banner-sample" role="note">' + icon('warning', 'sm warn') +
        '<span>กำลังแสดง <b>ข้อมูลตัวอย่าง</b> เพื่อทดสอบระบบ — เมื่อใส่ข้อมูลจริงแล้ว ให้ตั้งค่า SHOW_SAMPLE_DATA เป็น FALSE ในชีต Settings</span></div></div>';
    }
    if (page === 'home' && D().warnings && D().warnings.length) {
      out += '<div class="wrap"><div class="banner banner-info" role="note">' + icon('settings', 'sm') +
        '<span>ฐานข้อมูลยังไม่ครบ ไม่พบชีต: ' + esc(D().warnings.join(', ')) + ' — ให้ผู้ดูแลรัน setupNICC()</span></div></div>';
    }
    return out;
  }

  /* ---------- Cards ---------- */
  function programCard(p) {
    var dept = deptById(p.department_id);
    return '<article class="card is-click" data-action="program" data-id="' + esc(p.id) + '">' +
      thumb(dept && dept.image_url, 'tools', dept ? dept.name : p.name) +
      '<div class="card-body"><div class="meta-row">' +
      (dept ? '<span class="badge">' + esc(dept.name) + '</span>' : '') +
      (p.level ? '<span class="badge badge-muted">' + esc(p.level) + '</span>' : '') + sampleBadge(p) + '</div>' +
      '<h3>' + esc(p.name) + '</h3><p class="clamp">' + esc(p.description) + '</p></div>' +
      '<div class="card-foot"><button type="button" class="btn btn-ghost btn-sm" data-action="program" data-id="' + esc(p.id) + '">ดูรายละเอียด' + icon('forward', 'sm') + '</button></div></article>';
  }
  /* การ์ดข่าว: ถ้าแอดมินใส่ link_url (ลิงก์โพสต์เฟซบุ๊ก) ในชีต News → กดแล้วเปิดโพสต์ต้นฉบับในแท็บใหม่
     ถ้าไม่มีลิงก์ → เปิดหน้าต่างรายละเอียดข่าวในเว็บ */
  function newsCard(n) {
    var link = safeUrl(n.link_url);
    var act = link ? 'data-action="open-link" data-href="' + esc(link) + '"' : 'data-action="news" data-id="' + esc(n.id) + '"';
    var foot = link
      ? '<a class="btn btn-ghost btn-sm" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" aria-label="อ่านเพิ่มเติมที่เฟซบุ๊ก: ' + esc(n.title) + '">อ่านเพิ่มเติมที่เฟซบุ๊ก' + icon('external', 'sm') + '</a>'
      : '<button type="button" class="btn btn-ghost btn-sm" data-action="news" data-id="' + esc(n.id) + '">อ่านต่อ' + icon('forward', 'sm') + '</button>';
    return '<article class="card is-click" ' + act + '>' +
      thumb(n.image_url, 'news', n.title) +
      '<div class="card-body"><div class="meta-row">' + (n.category ? '<span class="badge">' + esc(n.category) + '</span>' : '') +
      (n.published_at ? '<span class="small muted">' + esc(fmtDate(n.published_at)) + '</span>' : '') + sampleBadge(n) + '</div>' +
      '<h3>' + esc(n.title) + '</h3><p class="clamp">' + esc(n.summary) + '</p></div>' +
      '<div class="card-foot">' + foot + '</div></article>';
  }
  function contactCard(c) {
    var tel = telHref(c.phone), url = safeUrl(c.url);
    return '<div class="card card-flat"><div class="meta-row"><h3 style="margin:0">' + esc(c.department) + '</h3>' + sampleBadge(c) + '</div>' +
      (c.description ? '<p class="muted" style="margin:6px 0 10px">' + esc(c.description) + '</p>' : '') +
      '<div class="btn-row">' +
      (tel ? '<a class="btn btn-primary btn-sm" href="' + esc(tel) + '">' + icon('contact', 'sm') + esc(c.phone) + '</a>' : '') +
      (url ? '<a class="btn btn-ghost btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">เปิดลิงก์' + icon('external', 'sm') + '</a>' : '') +
      (!tel && !url ? '<span class="small muted">ยังไม่มีเบอร์โทรหรือลิงก์</span>' : '') + '</div></div>';
  }
  function admissionStatus(r) {
    if (!r.start_date || !r.end_date) return '';
    var t = todayIso();
    if (t < r.start_date) return '<span class="badge badge-muted">ยังไม่เปิดรับสมัคร</span>';
    if (t > r.end_date) return '<span class="badge badge-muted">ปิดรับสมัครแล้ว</span>';
    return '<span class="badge badge-ok">เปิดรับสมัคร</span>';
  }
  function admissionCard(r) {
    var apply = safeUrl(r.application_url);
    var dates = (r.start_date || r.end_date)
      ? '<dl class="kv">' + (r.start_date ? '<dt>เริ่มรับสมัคร</dt><dd>' + esc(fmtDate(r.start_date)) + '</dd>' : '') +
        (r.end_date ? '<dt>สิ้นสุด</dt><dd>' + esc(fmtDate(r.end_date)) + '</dd>' : '') + '</dl>'
      : '<p class="small muted">ยังไม่ประกาศวันรับสมัคร</p>';
    return '<article class="card"><div class="card-body"><div class="meta-row">' +
      (r.level ? '<span class="badge">' + esc(r.level) + '</span>' : '') +
      (r.academic_year ? '<span class="badge badge-muted">ปีการศึกษา ' + esc(r.academic_year) + '</span>' : '') +
      admissionStatus(r) + sampleBadge(r) + '</div>' +
      '<h3>' + esc(r.title) + '</h3>' + dates +
      (r.requirements ? '<div class="small"><b>คุณสมบัติ</b>' + rich(r.requirements) + '</div>' : '') + '</div>' +
      '<div class="card-foot">' + (apply
        ? '<a class="btn btn-primary" href="' + esc(apply) + '" target="_blank" rel="noopener noreferrer">สมัครเรียนรอบนี้' + icon('external', 'sm') + '</a>'
        : '<span class="small muted">ยังไม่มีลิงก์สมัคร — โปรดติดตามประกาศจากวิทยาลัย</span>') + '</div></article>';
  }

  /* ---------- Home ---------- */
  function renderHome() {
    var d = D(), s = d.settings || {};
    var tiles = [
      ['chat', 'ถาม AI', 'chat', 'ตอบทุกคำถาม'], ['programs', 'หลักสูตร', 'programs', 'ค้นหาสาขา'],
      ['career', 'แนะแนว', 'opportunities', 'สำรวจความสนใจ'], ['admission', 'สมัครเรียน', 'admission', 'รอบรับสมัคร'],
      ['parent', 'ผู้ปกครอง', 'parent', 'ข้อมูลที่ต้องรู้'], ['news', 'ข่าวสาร', 'news', 'กิจกรรมล่าสุด'],
      ['contact', 'ติดต่อ', 'contact', 'ช่องทางติดต่อ'], ['map', 'แผนที่', 'map', 'ที่ตั้งวิทยาลัย']
    ];
    var progs = d.programs.slice(0, 4);
    var news = d.news.slice(0, 3);
    var round = d.admissions[0];

    return '<section class="hero" aria-labelledby="hero-title"><div class="hero-deco" aria-hidden="true"><svg class="ico" style="width:100%;height:auto;stroke-width:.6" focusable="false"><use href="#i-settings"/></svg></div>' +
      '<div class="hero-in"><div class="hero-copy">' +
      '<h1 id="hero-title">เชื่อมโยงการอาชีพ<span class="y">สู่อนาคตที่ยั่งยืน</span></h1>' +
      '<p class="lead">น้อง NICC พร้อมพาคุณรู้จัก' + esc(s.college_name_th || 'วิทยาลัยการอาชีพนครศรีธรรมราช') + ' ค้นหาหลักสูตร สำรวจความสนใจ และเตรียมสมัครเรียนได้ในที่เดียว</p>' +
      '<form class="search" data-search-form role="search" aria-label="ค้นหาข้อมูล"><label class="sr-only" for="home-q">ค้นหาหลักสูตร ข่าวสาร หรือข้อมูล</label>' + icon('search') +
      '<input id="home-q" class="js-q" type="search" placeholder="ค้นหาหลักสูตร สาขา ข่าวสาร…" autocomplete="off" maxlength="80">' +
      '<button type="submit" class="btn btn-primary btn-sm">ค้นหา</button></form>' +
      '<div class="btn-row" style="margin-top:16px">' + navBtn('programs', 'ค้นหาหลักสูตร', 'btn-primary', 'programs') + navBtn('admission', 'สมัครเรียน', 'btn-accent', 'admission') + '</div>' +
      '<div class="pillars"><span>' + icon('skills', 'sm') + 'เรียนรู้ทักษะ</span><span>' + icon('opportunities', 'sm') + 'สร้างโอกาส</span><span>' + icon('community', 'sm') + 'พัฒนาชุมชน</span><span>' + icon('tools', 'sm') + 'นวัตกรรม</span></div>' +
      '</div><div class="hero-art">' + mascot('welcome', 380, { float: true }) + '</div></div></section>' +

      '<div class="wrap"><section class="section" aria-labelledby="qa-title"><div class="section-head"><h2 id="qa-title">ทางลัดที่ใช้บ่อย</h2></div><div class="tiles">' +
      tiles.map(function (t) {
        return '<a class="tile" href="?page=' + t[0] + '" data-nav="' + t[0] + '">' + icon(t[2], 'lg') + '<span>' + esc(t[1]) + '<small>' + esc(t[3]) + '</small></span></a>';
      }).join('') + '</div></section>' +

      '<section class="section" aria-labelledby="rec-title"><div class="section-head"><div><h2 id="rec-title">หลักสูตรแนะนำ</h2><p>เลือกสาขาที่ตรงกับความสนใจของคุณ</p></div>' + navBtn('programs', 'ดูทั้งหมด', 'btn-ghost btn-sm', 'forward') + '</div>' +
      (progs.length ? '<div class="grid grid-cards">' + progs.map(programCard).join('') + '</div>'
        : emptyState('ยังไม่มีหลักสูตรที่เผยแพร่', 'ผู้ดูแลระบบสามารถเพิ่มหลักสูตรในชีต Programs และตั้งสถานะเป็น active', 'empty')) + '</section>' +

      '<section class="section" aria-labelledby="career-promo"><div class="feature"><div>' + mascot('career', 150, { deco: true }) + '</div><div>' +
      '<h2 id="career-promo">ยังไม่แน่ใจว่าจะเรียนสาขาไหน</h2><p>ตอบคำถามสั้น ๆ เกี่ยวกับสิ่งที่คุณสนใจ แล้วดูว่าหลักสูตรไหนสอดคล้องกับคำตอบของคุณ เป็นเพียงเครื่องมือช่วยสำรวจความสนใจเบื้องต้น ไม่ใช่การประเมินความสามารถ</p></div>' +
      '<div>' + navBtn('career', 'เริ่มสำรวจความสนใจ', 'btn-accent', 'forward') + '</div></div></section>' +

      '<section class="section" aria-labelledby="news-title"><div class="section-head"><div><h2 id="news-title">ข่าวสารและกิจกรรมล่าสุด</h2></div>' + navBtn('news', 'ข่าวทั้งหมด', 'btn-ghost btn-sm', 'forward') + '</div>' +
      (news.length ? '<div class="grid grid-cards">' + news.map(newsCard).join('') + '</div>'
        : emptyState('ยังไม่มีข่าวที่เผยแพร่', 'เมื่อวิทยาลัยเพิ่มข่าวและตั้งสถานะเป็น active ข่าวจะแสดงที่นี่', 'empty')) + '</section>' +

      '<section class="section" aria-labelledby="adm-title"><div class="feature feature-warm"><div>' + mascot('success', 150, { deco: true }) + '</div><div>' +
      '<h2 id="adm-title">ประชาสัมพันธ์การรับสมัคร</h2>' +
      (round ? '<p><b>' + esc(round.title) + '</b>' + (round.level ? ' • ' + esc(round.level) : '') +
        (round.start_date && round.end_date ? '<br>' + esc(fmtDate(round.start_date)) + ' – ' + esc(fmtDate(round.end_date)) : '') + '</p>'
        : '<p>ขณะนี้ยังไม่มีรอบรับสมัครที่เปิดใช้งาน กรุณาติดตามประกาศจากวิทยาลัย</p>') +
      '</div><div>' + navBtn('admission', 'ดูรายละเอียดการสมัคร', 'btn-primary', 'forward') + '</div></div></section></div>';
  }

  /* ---------- Programs ---------- */
  function programFilters() {
    var f = state.programs, d = D();
    var levels = uniq(d.programs.map(function (p) { return p.level; }).filter(Boolean));
    return '<div class="filters"><div class="field"><label for="prog-q">ค้นหาหลักสูตร</label>' +
      '<div class="search">' + icon('search') + '<input id="prog-q" type="search" placeholder="ชื่อสาขา คำอธิบาย หรืออาชีพ" value="' + esc(f.q) + '" autocomplete="off" maxlength="80"></div></div>' +
      '<div class="field"><label for="prog-dept">หมวดหมู่ (แผนก)</label><select id="prog-dept" class="input"><option value="">ทั้งหมด</option>' +
      d.departments.map(function (x) { return '<option value="' + esc(x.id) + '"' + (f.dept === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="prog-level">ระดับการศึกษา</label><select id="prog-level" class="input"><option value="">ทั้งหมด</option>' +
      levels.map(function (x) { return '<option value="' + esc(x) + '"' + (f.level === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div></div>';
  }
  function filteredPrograms() {
    var f = state.programs, q = f.q.trim().toLowerCase();
    return D().programs.filter(function (p) {
      if (f.dept && p.department_id !== f.dept) return false;
      if (f.level && p.level !== f.level) return false;
      if (q) {
        var hay = (p.name + ' ' + p.description + ' ' + p.career_paths + ' ' + ((deptById(p.department_id) || {}).name || '')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function programResults() {
    var list = filteredPrograms();
    if (!list.length) {
      return emptyState('ไม่พบหลักสูตรที่ตรงกับเงื่อนไข', D().programs.length ? 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง' : 'ยังไม่มีหลักสูตรที่เผยแพร่ในระบบ', 'empty',
        D().programs.length ? '<button type="button" class="btn btn-ghost btn-sm" data-action="programs-reset">ล้างตัวกรอง</button>' : '');
    }
    return '<p class="small muted" role="status">พบ ' + list.length + ' หลักสูตร</p><div class="grid grid-cards">' + list.map(programCard).join('') + '</div>';
  }
  function renderPrograms() {
    if (state.params.q && !state.programs.q) state.programs.q = state.params.q;
    return '<div class="wrap">' + pageHead('หลักสูตรที่เปิดสอน', 'ค้นหาตามสาขา ระดับการศึกษา หรืออาชีพที่สนใจ', 'learning') + programFilters() +
      '<div id="prog-results">' + programResults() + '</div></div>';
  }
  function openProgram(id) {
    var p = programById(id);
    if (!p) return;
    var dept = deptById(p.department_id);
    var careers = splitList(p.career_paths);
    openModal(
      thumb(dept && dept.image_url, 'tools', p.name) +
      '<div class="meta-row">' + (dept ? '<span class="badge">' + esc(dept.name) + '</span>' : '') + (p.level ? '<span class="badge badge-muted">' + esc(p.level) + '</span>' : '') +
      (p.academic_year ? '<span class="badge badge-muted">ปีการศึกษา ' + esc(p.academic_year) + '</span>' : '') + sampleBadge(p) + '</div>' +
      '<h2 id="modal-title" style="margin-top:8px">' + esc(p.name) + '</h2>' +
      (p.description ? rich(p.description) : '<p class="muted">ยังไม่มีคำอธิบายหลักสูตร</p>') +
      (careers.length ? '<h3>เส้นทางอาชีพที่เกี่ยวข้อง</h3><div class="chips">' + careers.map(function (c) { return '<span class="chip static">' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="btn-row" style="margin-top:20px">' + navBtn('admission', 'สมัครเรียน', 'btn-primary', 'admission') + navBtn('contact', 'ติดต่อวิทยาลัย', 'btn-ghost', 'contact') +
      '<button type="button" class="btn btn-accent" data-action="ask-about" data-text="' + esc('ขอข้อมูลหลักสูตร ' + p.name) + '">' + icon('chat', 'sm') + 'ถามน้อง NICC</button></div>');
  }

  /* ---------- Career Match ---------- */
  function renderCareer() {
    return '<div class="wrap">' + pageHead('แนะแนวอาชีพ', 'สำรวจความสนใจเบื้องต้นแล้วดูหลักสูตรที่สอดคล้องกับคำตอบ', 'career') +
      '<div class="banner banner-info" role="note">' + icon('warning', 'sm') + '<span><b>โปรดทราบ:</b> นี่เป็นเครื่องมือช่วยสำรวจความสนใจเบื้องต้นเท่านั้น ไม่ใช่การประเมินความสามารถหรือการรับประกันอาชีพ ระบบจับคู่คำตอบกับหลักสูตรตามที่วิทยาลัยกำหนดไว้ในฐานข้อมูล (ไม่มีการสุ่ม)</span></div>' +
      '<div id="career-body" class="section"></div></div>';
  }
  function renderCareerBody() {
    var box = $('#career-body');
    if (!box) return;
    var Q = D().careerQuestions, c = state.career;
    if (!Q.length) {
      box.innerHTML = emptyState('ยังไม่มีแบบสำรวจความสนใจ', 'ผู้ดูแลระบบเพิ่มคำถามได้ในชีต CareerQuestions แล้วตั้งสถานะเป็น active ระหว่างนี้ลองดูหลักสูตรทั้งหมดหรือถามน้อง NICC ได้เลย', 'empty',
        '<div class="btn-row" style="justify-content:center;margin-top:8px">' + navBtn('programs', 'ดูหลักสูตร', 'btn-primary', 'programs') + navBtn('chat', 'ถามน้อง NICC', 'btn-ghost', 'chat') + '</div>');
      return;
    }
    if (c.done) { box.innerHTML = careerResultHtml(); return; }
    if (c.i >= Q.length) c.i = 0;
    var q = Q[c.i], sel = c.answers[c.i];
    var pct = Math.round(((c.i + (sel !== undefined && sel !== null ? 1 : 0)) / Q.length) * 100);
    box.innerHTML = '<div class="card card-flat"><div class="meta-row" style="justify-content:space-between"><b>ข้อ ' + (c.i + 1) + ' จาก ' + Q.length + '</b>' + sampleBadge(q) + '</div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" style="margin:10px 0 18px"><i style="width:' + pct + '%"></i></div>' +
      '<h2 id="cq-title">' + esc(q.question) + '</h2>' +
      '<div class="opt-list" role="radiogroup" aria-labelledby="cq-title">' +
      q.options.map(function (o, idx) {
        return '<button type="button" class="opt" role="radio" aria-checked="' + (sel === idx ? 'true' : 'false') + '" data-action="career-pick" data-idx="' + idx + '"><span class="radio"></span><span>' + esc(o.label) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="btn-row" style="justify-content:space-between">' +
      (c.i > 0 ? '<button type="button" class="btn btn-ghost" data-action="career-prev">' + icon('back', 'sm') + 'ย้อนกลับ</button>' : '<span></span>') +
      '<button type="button" class="btn btn-primary" data-action="career-next"' + (sel === undefined || sel === null ? ' disabled' : '') + '>' +
      (c.i === Q.length - 1 ? 'ดูผลลัพธ์' : 'ข้อถัดไป') + icon('forward', 'sm') + '</button></div></div>';
  }
  function computeCareer() {
    var Q = D().careerQuestions, progs = D().programs, c = state.career, scores = {}, reasons = {}, answered = 0;
    c.answers.forEach(function (ai, qi) {
      if (ai === undefined || ai === null || !Q[qi] || !Q[qi].options[ai]) return;
      answered++;
      var o = Q[qi].options[ai], hit = {};
      (o.programs || []).forEach(function (id) { if (programById(id)) hit[id] = 1; });
      (o.departments || []).forEach(function (did) { progs.forEach(function (p) { if (p.department_id === did) hit[p.id] = 1; }); });
      Object.keys(hit).forEach(function (id) {
        scores[id] = (scores[id] || 0) + (o.weight || 1);
        (reasons[id] = reasons[id] || []).push(o.label);
      });
    });
    var ranked = Object.keys(scores).map(function (id) { return { p: programById(id), score: scores[id], why: reasons[id] }; })
      .filter(function (r) { return r.p; })
      .sort(function (a, b) { return b.score - a.score || String(a.p.name).localeCompare(String(b.p.name)); })
      .slice(0, 4);
    return { ranked: ranked, answered: answered };
  }
  function careerResultHtml() {
    var r = computeCareer();
    var head = '<div class="card card-flat" style="margin-bottom:16px"><div style="display:flex;gap:16px;align-items:center">' + mascot(r.ranked.length ? 'success' : 'empty', 96, { deco: true }) +
      '<div><h2 style="margin:0 0 4px">ผลการสำรวจความสนใจ</h2><p class="muted" style="margin:0">จากคำตอบ ' + r.answered + ' ข้อ — ผลนี้เป็นเพียงข้อเสนอแนะเบื้องต้น</p></div></div></div>';
    var body;
    if (!r.ranked.length) {
      body = emptyState('ยังไม่มีหลักสูตรที่ผูกกับคำตอบของคุณ', 'ข้อมูลการจับคู่ในฐานข้อมูลอาจยังไม่ครบ ลองดูหลักสูตรทั้งหมดหรือสอบถามเจ้าหน้าที่', 'empty');
    } else {
      body = '<div class="grid grid-cards">' + r.ranked.map(function (x) {
        var dept = deptById(x.p.department_id);
        return '<article class="card"><div class="card-body"><div class="meta-row">' + (dept ? '<span class="badge">' + esc(dept.name) + '</span>' : '') +
          (x.p.level ? '<span class="badge badge-muted">' + esc(x.p.level) + '</span>' : '') + sampleBadge(x.p) + '</div>' +
          '<h3>' + esc(x.p.name) + '</h3><p class="clamp">' + esc(x.p.description) + '</p>' +
          '<div class="reason"><b>ทำไมจึงแนะนำ:</b> ตรงกับ ' + x.why.length + ' จาก ' + r.answered + ' คำตอบ — คุณเลือก “' + x.why.map(esc).join('” และ “') + '”</div></div>' +
          '<div class="card-foot"><button type="button" class="btn btn-ghost btn-sm" data-action="program" data-id="' + esc(x.p.id) + '">ดูหลักสูตร' + icon('forward', 'sm') + '</button></div></article>';
      }).join('') + '</div>';
    }
    return head + body + '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn btn-ghost" data-action="career-restart">' + icon('back', 'sm') + 'ทำแบบสำรวจใหม่</button>' +
      navBtn('admission', 'ดูการรับสมัคร', 'btn-primary', 'admission') + '</div>';
  }

  /* ---------- Admission ---------- */
  function renderAdmission() {
    var d = D(), s = d.settings || {};
    var rounds = d.admissions;
    var levels = uniq(d.admissionDocs.map(function (x) { return x.level || 'ทั่วไป'; }));
    var statusUrl = safeUrl(s.admission_status_url);
    var html = '<div class="wrap">' + pageHead('สมัครเรียน', 'ดูรอบรับสมัคร คุณสมบัติ และเอกสารที่ต้องเตรียม', 'success');
    html += '<section class="section" aria-labelledby="rounds-t"><div class="section-head"><h2 id="rounds-t">รอบรับสมัคร</h2></div>' +
      (rounds.length ? '<div class="grid grid-cards">' + rounds.map(admissionCard).join('') + '</div>'
        : emptyState('ยังไม่มีรอบรับสมัครที่เปิดใช้งาน', 'กรุณาติดตามประกาศจากวิทยาลัย หรือสอบถามเจ้าหน้าที่', 'empty',
          '<div class="btn-row" style="justify-content:center;margin-top:8px">' + navBtn('contact', 'ติดต่อวิทยาลัย', 'btn-primary', 'contact') + navBtn('chat', 'ถามน้อง NICC', 'btn-ghost', 'chat') + '</div>')) + '</section>';
    html += '<section class="section" aria-labelledby="docs-t"><div class="section-head"><h2 id="docs-t">เอกสารที่ต้องเตรียม</h2></div>' +
      (levels.length ? '<div class="grid grid-2">' + levels.map(function (lv) {
        var items = d.admissionDocs.filter(function (x) { return (x.level || 'ทั่วไป') === lv; });
        return '<div class="card card-flat"><h3>ระดับ ' + esc(lv) + '</h3><ul class="list-plain">' +
          items.map(function (i) { return '<li>' + icon('success', 'sm') + '<span>' + esc(i.item) + ' ' + sampleBadge(i) + '</span></li>'; }).join('') + '</ul></div>';
      }).join('') + '</div>' : emptyState('ยังไม่มีรายการเอกสาร', 'วิทยาลัยยังไม่ได้เผยแพร่รายการเอกสารสำหรับการสมัคร', 'empty')) + '</section>';
    html += '<section class="section" aria-labelledby="stat-t"><div class="card card-flat"><h2 id="stat-t">ตรวจสอบสถานะการสมัคร</h2>' +
      (statusUrl ? '<p class="muted">สำหรับผู้ที่สมัครแล้ว สามารถตรวจสอบสถานะได้ที่ลิงก์ของวิทยาลัย</p><a class="btn btn-primary" href="' + esc(statusUrl) + '" target="_blank" rel="noopener noreferrer">ตรวจสอบสถานะ' + icon('external', 'sm') + '</a>'
        : '<p class="muted">ขณะนี้ยังไม่มีระบบตรวจสอบสถานะออนไลน์ในเว็บไซต์นี้ หากต้องการทราบสถานะ โปรดติดต่อเจ้าหน้าที่</p>' + navBtn('contact', 'ติดต่อเจ้าหน้าที่', 'btn-ghost', 'contact')) + '</div></section></div>';
    return html;
  }

  /* ---------- Parent Center ---------- */
  function groupBy(list, key) {
    var map = {}, order = [];
    list.forEach(function (x) { var k = x[key] || 'ทั่วไป'; if (!map[k]) { map[k] = []; order.push(k); } map[k].push(x); });
    return order.map(function (k) { return { key: k, items: map[k] }; });
  }
  function renderParent() {
    var d = D(), s = d.settings || {};
    var info = groupBy(d.parentInfo, 'category');
    var pnews = d.news.filter(function (n) { return String(n.category || '').indexOf('ผู้ปกครอง') >= 0; });
    var html = '<div class="wrap">' + pageHead('ศูนย์ผู้ปกครอง', 'ข้อมูลที่ผู้ปกครองควรรู้ ช่องทางติดต่อ และคำถามที่พบบ่อย', 'welcome');
    html += '<section class="section"><div class="section-head"><h2>ข่าวสารสำหรับผู้ปกครอง</h2></div>' +
      (pnews.length ? '<div class="grid grid-cards">' + pnews.slice(0, 3).map(newsCard).join('') + '</div>'
        : emptyState('ยังไม่มีข่าวสำหรับผู้ปกครอง', 'ข่าวในหมวด “ผู้ปกครอง” จะแสดงที่นี่', 'empty')) + '</section>';
    html += '<section class="section"><div class="section-head"><h2>ข้อมูลการเตรียมตัวและการติดตาม</h2></div>' +
      (info.length ? info.map(function (g) {
        return '<div style="margin-bottom:12px"><h3>' + esc(g.key) + '</h3>' + g.items.map(function (i) {
          return '<details class="acc"><summary><span>' + esc(i.title) + ' ' + sampleBadge(i) + '</span></summary><div class="acc-body">' + rich(i.content) + '</div></details>';
        }).join('') + '</div>';
      }).join('') : emptyState('ยังไม่มีข้อมูลสำหรับผู้ปกครอง', 'ผู้ดูแลระบบเพิ่มข้อมูลได้ในชีต ParentInfo', 'empty')) + '</section>';
    html += '<section class="section"><div class="section-head"><h2>ช่องทางติดต่อฝ่ายต่าง ๆ</h2></div>' +
      (d.contacts.length ? '<div class="grid grid-cards">' + d.contacts.map(contactCard).join('') + '</div>'
        : emptyState('ยังไม่มีช่องทางติดต่อ', 'ผู้ดูแลระบบเพิ่มข้อมูลได้ในชีต Contacts', 'empty')) + '</section>';
    html += '<section class="section"><div class="section-head"><h2>คำถามที่พบบ่อย</h2></div>' +
      (d.faqs.length ? d.faqs.map(function (f) {
        var src = safeUrl(f.source_url);
        return '<details class="acc"><summary><span>' + esc(f.question) + ' ' + sampleBadge(f) + '</span></summary><div class="acc-body">' + rich(f.answer) +
          (src ? '<p><a href="' + esc(src) + '" target="_blank" rel="noopener noreferrer">แหล่งข้อมูล' + icon('external', 'sm') + '</a></p>' : '') + '</div></details>';
      }).join('') : emptyState('ยังไม่มีคำถามที่พบบ่อย', 'ผู้ดูแลระบบเพิ่มข้อมูลได้ในชีต FAQs', 'empty')) + '</section>';
    var links = [extLink(s.website_url, 'เว็บไซต์วิทยาลัย', 'btn-ghost'), extLink(s.facebook_url, 'Facebook', 'btn-ghost'), extLink(s.line_url, 'LINE', 'btn-ghost')].join('');
    if (links) html += '<section class="section"><div class="section-head"><h2>ลิงก์ข้อมูลของวิทยาลัย</h2></div><div class="btn-row">' + links + '</div></section>';
    return html + '</div>';
  }

  /* ---------- News ---------- */
  function newsList() {
    var cat = state.newsCat;
    var list = D().news.filter(function (n) { return !cat || n.category === cat; });
    if (!list.length) return emptyState('ไม่พบข่าวในหมวดนี้', D().news.length ? 'ลองเลือกหมวดอื่น' : 'ยังไม่มีข่าวที่เผยแพร่', 'empty');
    return '<div class="grid grid-cards">' + list.map(newsCard).join('') + '</div>';
  }
  function renderNews() {
    var cats = uniq(D().news.map(function (n) { return n.category; }).filter(Boolean));
    var fb = fbFollowHtml('btn-primary', 'ติดตามข่าวทั้งหมดที่เฟซบุ๊ก');
    return '<div class="wrap">' + pageHead('ข่าวสารและกิจกรรม', 'ติดตามข่าวประชาสัมพันธ์และกิจกรรมล่าสุดของวิทยาลัย', 'assistant') +
      (fb ? '<div class="btn-row" style="margin:8px 0 4px">' + fb + '</div>' : '') +
      (cats.length ? '<div class="chips" role="group" aria-label="กรองตามหมวดหมู่" style="margin:12px 0 20px" id="news-chips">' + newsChipsHtml(cats) + '</div>' : '') +
      '<div id="news-results">' + newsList() + '</div></div>';
  }
  function newsChipsHtml(cats) {
    return '<button type="button" class="chip' + (!state.newsCat ? ' is-active' : '') + '" aria-pressed="' + (!state.newsCat) + '" data-action="news-cat" data-cat="">ทั้งหมด</button>' +
      cats.map(function (c) {
        return '<button type="button" class="chip' + (state.newsCat === c ? ' is-active' : '') + '" aria-pressed="' + (state.newsCat === c) + '" data-action="news-cat" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('');
  }
  function openNews(id) {
    var n = newsById(id);
    if (!n) return;
    var link = safeUrl(n.link_url);
    openModal((n.image_url ? thumb(n.image_url, 'news', n.title) : '') +
      '<div class="meta-row">' + (n.category ? '<span class="badge">' + esc(n.category) + '</span>' : '') +
      (n.published_at ? '<span class="small muted">' + esc(fmtDate(n.published_at)) + '</span>' : '') + sampleBadge(n) + '</div>' +
      '<h2 id="modal-title" style="margin-top:8px">' + esc(n.title) + '</h2>' +
      (n.summary ? '<p class="muted">' + esc(n.summary) + '</p>' : '') + (n.body ? rich(n.body) : '') +
      (link ? '<p><a class="btn btn-primary" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">อ่านเพิ่มเติม' + icon('external', 'sm') + '</a></p>' : ''));
  }

  /* ---------- More & sub pages ---------- */
  function renderMore() {
    var items = [
      ['career', 'แนะแนวอาชีพ', 'opportunities', 'สำรวจความสนใจ'], ['parent', 'ศูนย์ผู้ปกครอง', 'parent', 'ข้อมูลและคำถามที่พบบ่อย'],
      ['news', 'ข่าวสาร', 'news', 'ข่าวและกิจกรรม'], ['calendar', 'ปฏิทินกิจกรรม', 'calendar', 'กิจกรรมของวิทยาลัย'],
      ['skills', 'ทักษะและโอกาส', 'skills', 'อาชีพที่เกี่ยวข้อง'], ['learning', 'สื่อการเรียนรู้', 'learning', 'เอกสารและสื่อ'],
      ['contact', 'ติดต่อวิทยาลัย', 'contact', 'โทร อีเมล โซเชียล'], ['map', 'แผนที่', 'map', 'ที่ตั้งวิทยาลัย'],
      ['about', 'ข้อมูลวิทยาลัย', 'community', 'แผนกและข้อมูลทั่วไป'], ['design', 'ระบบการออกแบบ', 'settings', 'สี ตัวอักษร มาสคอต ไอคอน']
    ];
    return '<div class="wrap">' + pageHead('เพิ่มเติม', 'เมนูอื่น ๆ ของ NICC Smart Guild', 'assistant') +
      '<div class="tiles tiles-more">' + items.map(function (t) {
        return '<a class="tile" href="?page=' + t[0] + '" data-nav="' + t[0] + '">' + icon(t[2], 'lg') + '<span>' + esc(t[1]) + '<small>' + esc(t[3]) + '</small></span></a>';
      }).join('') + '</div></div>';
  }
  function renderContact() {
    var d = D(), s = d.settings || {};
    var rows = [];
    if (s.phone) rows.push('<li>' + icon('contact', 'sm') + '<span><a href="' + esc(telHref(s.phone)) + '">' + esc(s.phone) + '</a></span></li>');
    if (s.email) rows.push('<li>' + icon('news', 'sm') + '<span>' + esc(s.email) + '</span></li>');
    if (s.address) rows.push('<li>' + icon('map', 'sm') + '<span>' + esc(s.address) + '</span></li>');
    if (s.office_hours) rows.push('<li>' + icon('calendar', 'sm') + '<span>' + esc(s.office_hours) + '</span></li>');
    var links = [extLink(s.website_url, 'เว็บไซต์', 'btn-ghost'), extLink(s.facebook_url, 'Facebook', 'btn-ghost'), extLink(s.line_url, 'LINE', 'btn-ghost')].join('');
    return '<div class="wrap">' + pageHead('ติดต่อวิทยาลัย', s.college_name_th || 'วิทยาลัยการอาชีพนครศรีธรรมราช', 'assistant') +
      '<section class="section"><div class="card card-flat"><h2>ข้อมูลติดต่อทั่วไป</h2>' +
      (rows.length ? '<ul class="list-plain">' + rows.join('') + '</ul>' : '<p class="muted">ยังไม่ได้ตั้งค่าช่องทางติดต่อหลัก (ผู้ดูแลตั้งค่าได้ในชีต Settings)</p>') +
      (links ? '<div class="btn-row" style="margin-top:12px">' + links + '</div>' : '') + '</div></section>' +
      '<section class="section"><div class="section-head"><h2>ติดต่อแยกตามฝ่าย</h2></div>' +
      (d.contacts.length ? '<div class="grid grid-cards">' + d.contacts.map(contactCard).join('') + '</div>'
        : emptyState('ยังไม่มีข้อมูลติดต่อรายฝ่าย', 'ผู้ดูแลระบบเพิ่มข้อมูลได้ในชีต Contacts', 'empty')) + '</section></div>';
  }
  function renderMap() {
    var s = D().settings || {}, url = safeUrl(s.map_url);
    return '<div class="wrap">' + pageHead('แผนที่และที่ตั้ง', 'เดินทางมายังวิทยาลัย', 'welcome') + '<section class="section">' +
      ((url || s.address) ? '<div class="card card-flat">' + icon('map', 'xl') + '<h2>' + esc(s.college_name_th || 'วิทยาลัยการอาชีพนครศรีธรรมราช') + '</h2>' +
        (s.address ? '<p>' + esc(s.address) + '</p>' : '<p class="muted">ยังไม่ได้ระบุที่อยู่</p>') +
        (url ? '<a class="btn btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">เปิดแผนที่นำทาง' + icon('external', 'sm') + '</a>' : '') + '</div>'
        : emptyState('ยังไม่มีข้อมูลที่ตั้ง', 'ผู้ดูแลระบบตั้งค่า address และ map_url ในชีต Settings', 'empty')) + '</section></div>';
  }
  function knowledgeCards(list) {
    return '<div class="grid grid-cards">' + list.map(function (k) {
      var src = safeUrl(k.source_url);
      return '<article class="card"><div class="card-body"><div class="meta-row">' + (k.category ? '<span class="badge">' + esc(k.category) + '</span>' : '') + sampleBadge(k) + '</div>' +
        '<h3>' + esc(k.title) + '</h3><div class="small muted">' + rich(k.content) + '</div></div>' +
        (src ? '<div class="card-foot"><a class="btn btn-ghost btn-sm" href="' + esc(src) + '" target="_blank" rel="noopener noreferrer">เปิดแหล่งข้อมูล' + icon('external', 'sm') + '</a></div>' : '') + '</article>';
    }).join('') + '</div>';
  }
  function renderKnowledgePage(title, sub, cats, pose, ico) {
    var list = D().knowledge.filter(function (k) { return cats.indexOf(k.category) >= 0; });
    return '<div class="wrap">' + pageHead(title, sub, pose) + '<section class="section">' +
      (list.length ? knowledgeCards(list) : emptyState('ยังไม่มีข้อมูล' + title, 'เพิ่มข้อมูลในชีต Knowledge โดยตั้ง category เป็น “' + cats[0] + '” และสถานะ active', 'empty')) + '</section></div>';
  }
  function renderSkills() {
    var careers = uniq([].concat.apply([], D().programs.map(function (p) { return splitList(p.career_paths); })));
    var list = D().knowledge.filter(function (k) { return ['ทักษะอาชีพ', 'โอกาสทางอาชีพ'].indexOf(k.category) >= 0; });
    return '<div class="wrap">' + pageHead('ทักษะและโอกาสอาชีพ', 'เส้นทางอาชีพที่เกี่ยวข้องกับหลักสูตรของวิทยาลัย', 'career') +
      '<section class="section"><div class="section-head"><h2>อาชีพที่เกี่ยวข้องกับหลักสูตร</h2></div>' +
      (careers.length ? '<div class="chips">' + careers.map(function (c) { return '<span class="chip static">' + esc(c) + '</span>'; }).join('') + '</div>'
        : emptyState('ยังไม่มีข้อมูลเส้นทางอาชีพ', 'เพิ่มในคอลัมน์ career_paths ของชีต Programs', 'empty')) + '</section>' +
      (list.length ? '<section class="section"><div class="section-head"><h2>ข้อมูลเพิ่มเติม</h2></div>' + knowledgeCards(list) + '</section>' : '') + '</div>';
  }
  function renderCalendar() {
    var list = D().news.filter(function (n) { return n.category === 'กิจกรรม'; });
    var groups = {}, order = [];
    list.forEach(function (n) {
      var k = String(n.published_at || '').slice(0, 7) || 'ไม่ระบุ';
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(n);
    });
    return '<div class="wrap">' + pageHead('ปฏิทินกิจกรรม', 'กิจกรรมจากข่าวหมวด “กิจกรรม” (วันที่ที่แสดงคือวันที่เผยแพร่ประกาศ)', 'success') + '<section class="section">' +
      (order.length ? order.map(function (k) {
        return '<h2>' + esc(k === 'ไม่ระบุ' ? k : monthLabel(k)) + '</h2><div class="grid grid-cards" style="margin-bottom:24px">' + groups[k].map(newsCard).join('') + '</div>';
      }).join('') : emptyState('ยังไม่มีกิจกรรม', 'เพิ่มข่าวหมวด “กิจกรรม” ในชีต News เพื่อแสดงที่นี่', 'empty')) + '</section></div>';
  }
  function renderAbout() {
    var d = D(), s = d.settings || {};
    var list = d.knowledge.filter(function (k) { return k.category === 'ข้อมูลวิทยาลัย'; });
    return '<div class="wrap">' + pageHead('ข้อมูลวิทยาลัย', s.college_name_en || '', 'welcome') +
      '<section class="section"><div class="card card-flat"><h2>' + esc(s.college_name_th || 'วิทยาลัยการอาชีพนครศรีธรรมราช') + '</h2><p class="footer-quote" style="color:#B7791F">“' + esc(s.tagline || 'เชื่อมโยงการอาชีพ สู่อนาคตที่ยั่งยืน') + '”</p></div></section>' +
      '<section class="section"><div class="section-head"><h2>แผนกวิชา</h2></div>' +
      (d.departments.length ? '<div class="grid grid-cards">' + d.departments.map(function (x) {
        return '<article class="card">' + thumb(x.image_url, 'tools', x.name) + '<div class="card-body"><div class="meta-row">' + sampleBadge(x) + '</div><h3>' + esc(x.name) + '</h3><p>' + esc(x.description) + '</p></div></article>';
      }).join('') + '</div>' : emptyState('ยังไม่มีข้อมูลแผนกวิชา', 'เพิ่มในชีต Departments', 'empty')) + '</section>' +
      (list.length ? '<section class="section"><div class="section-head"><h2>ข้อมูลทั่วไป</h2></div>' + knowledgeCards(list) + '</section>' : '') + '</div>';
  }
  function renderDesign() {
    var sw = [['Navy Blue', '#0B2E8A', 'ความน่าเชื่อถือ'], ['Royal Blue', '#1655FF', 'เทคโนโลยี การศึกษา'], ['Sky Blue', '#3EB7F7', 'ความสดใส เป็นมิตร'], ['Warm Yellow', '#FFC629', 'พลังบวก โอกาส'], ['White', '#FFFFFF', 'ความสะอาด'], ['Light Blue-Gray', '#F2F7FD', 'สบายตา พื้นหลัง']];
    var poses = [['welcome', 'Welcome'], ['assistant', 'Assistant'], ['learning', 'Learning'], ['career', 'Career'], ['success', 'Success'], ['thinking', 'Thinking'], ['empty', 'Empty State'], ['error', 'Error State']];
    return '<div class="wrap">' + pageHead('ระบบการออกแบบ', 'อัตลักษณ์ NICC Smart Guild — สี ตัวอักษร มาสคอต และชุดไอคอน', 'welcome') +
      '<section class="section"><h2>โทนสี</h2><div class="swatches">' + sw.map(function (x) {
        return '<div class="swatch"><i style="background:' + x[1] + ';' + (x[1] === '#FFFFFF' ? 'border-bottom:1px solid #D9E5F7' : '') + '"></i><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + ' • ' + esc(x[2]) + '</span></div>';
      }).join('') + '</div></section>' +
      '<section class="section"><h2>ตัวอักษร</h2><div class="grid grid-2"><div class="card card-flat"><div style="font-family:var(--font-head);font-size:2rem;font-weight:800;color:var(--navy)">Noto Sans Thai</div><p class="muted">หัวข้อ เมนู และองค์ประกอบหลัก • กขคงจ 1234567890</p></div>' +
      '<div class="card card-flat"><div style="font-family:var(--font-body);font-size:2rem;font-weight:700;color:var(--navy)">Sarabun</div><p class="muted">เนื้อหาและข้อความทั่วไป • กขคงจ 1234567890</p></div></div></section>' +
      '<section class="section"><h2>มาสคอตน้อง NICC</h2><div class="pose-grid">' + poses.map(function (p) {
        return '<div class="pose">' + mascot(p[0], 130, { deco: true }) + '<b>' + esc(p[1]) + '</b></div>';
      }).join('') + '</div></section>' +
      '<section class="section"><h2>ชุดไอคอน (Custom SVG)</h2><div class="icon-grid">' + ICON_NAMES.map(function (n) {
        return '<div class="icon-cell">' + icon(n, 'lg') + '<span>' + esc(ICON_LABELS[n] || n) + '</span></div>';
      }).join('') + '</div></section>' +
      voiceSectionHtml() + '<section class="section"><h2>ปุ่มและองค์ประกอบ</h2><div class="btn-row"><span class="btn btn-primary">ปุ่มหลัก' + icon('forward', 'sm') + '</span><span class="btn btn-accent">ปุ่มรอง</span><span class="btn btn-ghost">ปุ่มเส้นขอบ</span><span class="btn btn-primary" aria-disabled="true">ปุ่มปิดใช้งาน</span></div>' +
      '<div class="chips" style="margin-top:12px"><span class="chip is-active">ทั้งหมด</span><span class="chip">ช่างอุตสาหกรรม</span><span class="chip">พาณิชยกรรม</span><span class="badge badge-ok">เปิดรับสมัคร</span><span class="badge badge-sample">ข้อมูลตัวอย่าง</span></div></section></div>';
  }

  function voiceSectionHtml() {
    pickThaiVoice();
    var names = (voice.thList || []).map(function (v) { return v.name; });
    return '<section class="section"><h2>เสียงพูดน้องนิค</h2><div class="card card-flat">' +
      '<p class="muted">เสียงที่เครื่องนี้ใช้: <b>' + esc(voice.th ? voice.th.name : (TTS ? 'ค่าเริ่มต้นของเบราว์เซอร์ (ไม่พบเสียงไทยเฉพาะ)' : 'ไม่รองรับ')) + '</b> • ระดับเสียง ' +
      vnum('voice_pitch', 1.3, 0.5, 2) + ' • ความเร็ว ' + vnum('voice_rate', 1.05, 0.6, 1.6) + '</p>' +
      '<p class="small muted">เสียงภาษาไทยที่เครื่องนี้มี: ' + (names.length ? esc(names.join(', ')) : 'ไม่พบ') + '<br>ปรับได้ที่ชีต Settings: voice_pitch, voice_rate, voice_name และข้อความรายหน้า voice_home, voice_chat, …</p>' +
      '<button type="button" class="btn btn-primary" data-action="voice-test">' + icon('volume', 'sm') + 'ทดลองฟังเสียง</button></div></section>';
  }

  /* ---------- Search ---------- */
  function renderSearch() {
    var q = String(state.params.q || '').trim();
    var html = '<div class="wrap">' + pageHead('ค้นหา', 'ค้นหาหลักสูตร ข่าวสาร คำถามที่พบบ่อย และข้อมูลวิทยาลัย', 'assistant') +
      '<form class="search" data-search-form role="search" style="margin:12px 0 8px"><label class="sr-only" for="search-q">คำค้นหา</label>' + icon('search') +
      '<input id="search-q" class="js-q" type="search" value="' + esc(q) + '" placeholder="พิมพ์คำที่ต้องการค้นหา" maxlength="80" autocomplete="off">' +
      '<button type="submit" class="btn btn-primary btn-sm">ค้นหา</button></form>';
    if (!q) return html + '<p class="muted">พิมพ์คำค้นหาแล้วกด Enter</p></div>';
    var ql = q.toLowerCase(), d = D();
    function has(a) { return String(a || '').toLowerCase().indexOf(ql) >= 0; }
    var progs = d.programs.filter(function (p) { return has(p.name) || has(p.description) || has(p.career_paths); });
    var news = d.news.filter(function (n) { return has(n.title) || has(n.summary) || has(n.body); });
    var faqs = d.faqs.filter(function (f) { return has(f.question) || has(f.answer); });
    var know = d.knowledge.filter(function (k) { return has(k.title) || has(k.content); });
    var total = progs.length + news.length + faqs.length + know.length;
    html += '<p class="small muted" role="status">ผลการค้นหา “' + esc(q) + '” พบ ' + total + ' รายการ</p>';
    if (!total) {
      return html + emptyState('ไม่พบผลการค้นหา', 'ลองใช้คำอื่น หรือถามน้อง NICC เพื่อช่วยค้นหา', 'empty',
        '<div class="btn-row" style="justify-content:center;margin-top:8px">' + navBtn('chat', 'ถามน้อง NICC', 'btn-primary', 'chat') + '</div>') + '</div>';
    }
    if (progs.length) html += '<section class="section"><h2>หลักสูตร (' + progs.length + ')</h2><div class="grid grid-cards">' + progs.map(programCard).join('') + '</div></section>';
    if (news.length) html += '<section class="section"><h2>ข่าวสาร (' + news.length + ')</h2><div class="grid grid-cards">' + news.map(newsCard).join('') + '</div></section>';
    if (faqs.length) html += '<section class="section"><h2>คำถามที่พบบ่อย (' + faqs.length + ')</h2>' + faqs.map(function (f) {
      return '<details class="acc"><summary><span>' + esc(f.question) + '</span></summary><div class="acc-body">' + rich(f.answer) + '</div></details>';
    }).join('') + '</section>';
    if (know.length) html += '<section class="section"><h2>ข้อมูลวิทยาลัย (' + know.length + ')</h2>' + knowledgeCards(know) + '</section>';
    return html + '</div>';
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    var box = $('#footer-in');
    if (!box) return;
    var s = D().settings || {};
    var contact = [];
    if (s.phone) contact.push('<p><a href="' + esc(telHref(s.phone)) + '">' + esc(s.phone) + '</a></p>');
    if (s.email) contact.push('<p>' + esc(s.email) + '</p>');
    if (s.address) contact.push('<p>' + esc(s.address) + '</p>');
    if (s.office_hours) contact.push('<p>' + esc(s.office_hours) + '</p>');
    var ext = [['เว็บไซต์', s.website_url], ['Facebook', s.facebook_url], ['LINE', s.line_url]].filter(function (x) { return safeUrl(x[1]); })
      .map(function (x) { return '<a href="' + esc(safeUrl(x[1])) + '" target="_blank" rel="noopener noreferrer">' + esc(x[0]) + '</a>'; });
    box.innerHTML =
      '<div><div class="brand" style="margin-bottom:8px">' + mascot('head', 48, { deco: true }) + '<span class="brand-text"><span class="brand-name">NICC<em>Smart Guild</em></span></span></div>' +
      '<p>' + esc(s.college_name_th || 'วิทยาลัยการอาชีพนครศรีธรรมราช') + '</p>' + (s.college_name_en ? '<p style="opacity:.8">' + esc(s.college_name_en) + '</p>' : '') +
      '<p class="footer-quote">“' + esc(s.tagline || 'เชื่อมโยงการอาชีพ สู่อนาคตที่ยั่งยืน') + '”</p></div>' +
      '<div><h3>ติดต่อ</h3>' + (contact.length ? contact.join('') : '<p>ดูช่องทางติดต่อได้ที่หน้า “ติดต่อ”</p>') + '</div>' +
      '<div><h3>ลิงก์</h3><div class="footer-links"><a href="?page=programs" data-nav="programs">หลักสูตร</a><a href="?page=admission" data-nav="admission">สมัครเรียน</a><a href="?page=parent" data-nav="parent">ผู้ปกครอง</a><a href="?page=news" data-nav="news">ข่าวสาร</a><a href="?page=contact" data-nav="contact">ติดต่อ</a>' + ext.join('') + '</div></div>' +
      '<div class="footer-bottom" style="grid-column:1/-1">© ' + (new Date().getFullYear() + 543) + ' NICC Smart Guild — ระบบประชาสัมพันธ์และแนะแนวอาชีพอัจฉริยะ</div>';
  }

  /* ============================================================
   * 9) Chat
   * ============================================================ */
  function renderChat() {
    return '<section class="chat-shell" aria-label="แชตกับ NICC AI Assistant">' +
      '<header class="chat-head">' + mascot('assistant', 54, { deco: true }) + '<div><h1>NICC AI Assistant</h1><p>พร้อมตอบทุกคำถามเกี่ยวกับวิทยาลัย</p></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="chat-clear" aria-label="ล้างบทสนทนา">' + icon('trash', 'sm') + '<span>ล้างแชต</span></button></header>' +
      '<div class="chat-log" id="chat-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="chat-suggest" id="chat-suggest" aria-label="คำถามยอดนิยม">' + suggestHtml() + '</div>' +
      '<div class="voice-help" id="voice-help" hidden></div><p class="voice-status" id="voice-status" role="status" hidden></p>' +
      '<form class="chat-form" id="chat-form" autocomplete="off"><label class="sr-only" for="chat-input">พิมพ์ข้อความ</label>' +
      '<button type="button" class="btn btn-ghost btn-icon btn-mic" id="chat-mic" data-action="voice-mic" aria-pressed="false" aria-label="พูดถามด้วยเสียง" title="พูดถามด้วยเสียง">' + icon('mic') + '</button>' +
      '<textarea id="chat-input" rows="1" maxlength="500" placeholder="พิมพ์คำถาม หรือกดไมค์เพื่อพูด…"></textarea>' +
      '<button type="submit" class="btn btn-primary btn-icon" id="chat-send" aria-label="ส่งข้อความ">' + icon('send') + '</button></form>' +
      '<p class="chat-note">Enter = ส่ง • Shift+Enter = ขึ้นบรรทัดใหม่ • ระบบเก็บคำถามและคำตอบเพื่อปรับปรุงบริการ โปรดอย่าใส่ข้อมูลส่วนตัว • น้องนิคอาจคลาดเคลื่อนได้ โปรดยืนยันข้อมูลสำคัญกับเจ้าหน้าที่</p></section>';
  }
  var REACTS = [
    { k: 'like', icon: 'like', label: 'ไลค์' }, { k: 'love', icon: 'love', label: 'เลิฟ' },
    { k: 'happy', icon: 'smile', label: 'ถูกใจ' }, { k: 'cry', icon: 'cry', label: 'ร้องไห้' }, { k: 'angry', icon: 'angry', label: 'โกรธ' }
  ];
  function normQ(t) { return String(t || '').toLowerCase().replace(/[\s?!.,]/g, ''); }
  function suggestList() {
    var out = [], seen = {};
    (D().popular || []).forEach(function (p) {
      var k = normQ(p.question);
      if (k && !seen[k]) { seen[k] = 1; out.push({ text: p.question, n: p.count }); }
    });
    SUGGESTED.forEach(function (q) {
      var k = normQ(q);
      if (!seen[k]) { seen[k] = 1; out.push({ text: q, n: 0 }); }
    });
    return out.slice(0, 8);
  }
  function suggestHtml() {
    return '<span class="suggest-label">คำถามยอดนิยม</span>' + suggestList().map(function (x) {
      return '<button type="button" class="chip" data-action="chat-ask" data-text="' + esc(x.text) + '">' + esc(x.text) +
        (x.n > 1 ? ' <span class="chip-n" title="ถูกถาม ' + x.n + ' ครั้ง">' + x.n + '</span>' : '') + '</button>';
    }).join('');
  }
  function refreshPopular() {
    if (!hasBackend() || state.data === EMPTY || !state.data) return;
    callServer('getPopularQuestions').then(function (res) {
      if (res && res.ok && Array.isArray(res.data) && state.data && state.data !== EMPTY) {
        state.data.popular = res.data;
        var box = $('#chat-suggest');
        if (box) box.innerHTML = suggestHtml();
      }
    }).catch(function () { /* ใช้รายการเดิม */ });
  }
  function reactBarHtml(m, idx) {
    if (!m.logId || m.error) return '';
    var note = '';
    if (m.reaction === 'cry' || m.reaction === 'angry') note = '<p class="react-note">ขอโทษครับ น้องนิคจะพยายามปรับปรุงนะครับ ลองถามใหม่ หรือติดต่อเจ้าหน้าที่ได้เลยครับ</p>';
    else if (m.reaction) note = '<p class="react-note">ขอบคุณครับ ดีใจที่ช่วยได้ครับ</p>';
    return '<div class="react-wrap" data-bar="' + idx + '"><div class="react-bar" role="group" aria-label="ให้คะแนนความพึงพอใจต่อคำตอบนี้"><span class="react-q">คำตอบนี้เป็นอย่างไรครับ</span>' +
      REACTS.map(function (r) {
        var on = m.reaction === r.k;
        return '<button type="button" class="react-btn' + (on ? ' is-picked' : '') + '" data-r="' + r.k + '" data-action="react" data-idx="' + idx + '" aria-pressed="' + on + '" aria-label="' + r.label + '" title="' + r.label + '">' + icon(r.icon) + '</button>';
      }).join('') + '</div>' + note + '</div>';
  }
  function updateReactBar(idx) {
    var el = document.querySelector('[data-bar="' + idx + '"]');
    var m = state.chat.messages[idx];
    if (el && m) el.outerHTML = reactBarHtml(m, idx);
  }
  function setReaction(idx, r) {
    var m = state.chat.messages[idx];
    if (!m || !m.logId || m.fbBusy) return;
    var prev = m.reaction || '';
    m.reaction = prev === r ? '' : r;
    m.fbBusy = true;
    updateReactBar(idx);
    callServer('submitFeedback', m.logId, r, state.chat.sessionId).then(function (res) {
      if (res && res.ok) {
        m.reaction = res.reaction || '';
        if (m.reaction) showToast('ขอบคุณสำหรับความคิดเห็นครับ', 'ok');
      } else {
        m.reaction = prev;
        showToast((res && res.error) || 'บันทึกความคิดเห็นไม่สำเร็จ', 'err');
      }
    }).catch(function () {
      m.reaction = prev;
      showToast('บันทึกความคิดเห็นไม่สำเร็จ กรุณาลองใหม่', 'err');
    }).then(function () {
      m.fbBusy = false;
      updateReactBar(idx);
    });
  }

  function chatMsgHtml(m, idx) {
    if (m.role === 'user') return '<div class="msg user"><div class="bubble">' + esc(m.text) + '</div></div>';
    var cls = m.error ? 'is-err' : (m.mode === 'fallback' ? 'is-warn' : '');
    var tags = {
      faq: icon('success', 'sm ok') + 'คำตอบจากคำถามที่พบบ่อยของวิทยาลัย',
      ai: icon('chat', 'sm') + 'สรุปโดย AI จากข้อมูลวิทยาลัย — โปรดยืนยันกับเจ้าหน้าที่ก่อนตัดสินใจ',
      database: icon('learning', 'sm') + 'ข้อมูลจากฐานข้อมูลของวิทยาลัย',
      fallback: icon('warning', 'sm warn') + 'ไม่พบข้อมูลยืนยัน'
    };
    var tag = m.error ? icon('error', 'sm err') + 'เกิดข้อผิดพลาด' : (tags[m.mode] || '');
    var src = '';
    if (m.sources && m.sources.length) {
      src = '<div class="sources"><b>แหล่งข้อมูลอ้างอิง</b>' + m.sources.map(function (s) {
        var u = safeUrl(s.url);
        return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + icon('external', 'sm') + esc(s.title) + '</a>'
                 : '<span class="src">' + icon('learning', 'sm') + esc(s.title) + '</span>';
      }).join('') + '</div>';
    }
    var extra = (m.mode === 'fallback') ? '<p style="margin-top:8px">' + navBtn('contact', 'ดูช่องทางติดต่อ', 'btn-ghost btn-sm', 'contact') + '</p>' : '';
    return '<div class="msg ai"><div class="av">' + mascot('head', 38, { deco: true }) + '</div><div class="bubble ' + cls + '">' +
      (tag ? '<div class="bubble-tag">' + tag + (m.sample ? ' <span class="badge badge-sample">ข้อมูลตัวอย่าง</span>' : '') + '</div>' : '') +
      rich(m.text) + src + extra +
      ((TTS && !m.error) ? '<div class="msg-tools"><button type="button" class="btn btn-quiet btn-sm" data-action="speak-msg" data-idx="' + idx + '" aria-label="ฟังคำตอบนี้">' + icon('volume', 'sm') + 'ฟังคำตอบ</button></div>' : '') +
      reactBarHtml(m, idx) +
      '</div></div>';
  }
  function redrawChat() {
    var log = $('#chat-log');
    if (!log) return;
    var s = state.chat;
    var html = '<div class="msg ai"><div class="av">' + mascot('welcome', 60, { deco: true }) + '</div><div class="bubble"><p><b>สวัสดีครับ! 👋</b></p>' +
      '<p>ผมน้อง NICC ยินดีให้ข้อมูลด้านการเรียน หลักสูตร และการสมัครเรียนของวิทยาลัย มีอะไรให้ช่วยไหมครับ</p></div></div>';
    html += s.messages.map(chatMsgHtml).join('');
    if (s.busy) {
      html += '<div class="msg ai" role="status" aria-label="น้อง NICC กำลังพิมพ์"><div class="av">' + mascot('head', 38, { deco: true }) + '</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>';
    }
    log.innerHTML = html;
    log.scrollTop = log.scrollHeight;
    var btn = $('#chat-send');
    if (btn) btn.disabled = s.busy;
  }
  function afterChat() {
    redrawChat();
    updateMicUi(voice.listening);
    refreshPopular();
    var input = $('#chat-input');
    if (input && state.chat.prefill) {
      input.value = state.chat.prefill;
      state.chat.prefill = '';
      autoGrow(input);
    }
    if (input && window.matchMedia && window.matchMedia('(min-width: 900px)').matches) input.focus();
  }
  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  }
  function sendChat(text) {
    var s = state.chat;
    var q = String(text || '').replace(/\s+/g, ' ').trim();
    if (!q || s.busy) return;
    if (q.length > 500) { showToast('คำถามยาวเกินไป (ไม่เกิน 500 ตัวอักษร)', 'err'); return; }
    stopSpeaking();
    s.messages.push({ role: 'user', text: q });
    s.busy = true;
    var input = $('#chat-input');
    if (input) { input.value = ''; autoGrow(input); }
    redrawChat();
    callServer('askAI', q, s.sessionId).then(function (res) {
      if (res && res.ok) {
        s.messages.push({ role: 'ai', text: res.answer, mode: res.mode, sources: res.sources || [], sample: !!res.sample, logId: res.logId || '', reaction: '' });
      } else {
        s.messages.push({ role: 'ai', text: (res && res.error) || 'ขออภัย ระบบตอบคำถามขัดข้องชั่วคราว', error: true });
      }
    }).catch(function (err) {
      var msg = (err && err.message === 'NO_BACKEND')
        ? 'ไม่พบการเชื่อมต่อ Google Apps Script — กรุณาเปิดผ่าน Web App ที่ Deploy แล้ว'
        : 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่โดยตรง';
      s.messages.push({ role: 'ai', text: msg, error: true });
    }).then(function () {
      s.busy = false;
      if (state.page === 'chat') redrawChat();
      var last = s.messages[s.messages.length - 1];
      if (voice.on && last && last.role === 'ai') speak(last.text);
      if (state.page === 'chat') refreshPopular();
    });
  }

  /* ============================================================
   * 10) Events (ผูกครั้งเดียวด้วย Event Delegation)
   * ============================================================ */
  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-action],[data-nav]') : null;
    if (!el) return;
    var action = el.getAttribute('data-action');

    if (action === 'modal-bg') { if (e.target === el) closeModal(); return; }

    if (!action && el.hasAttribute('data-nav')) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      var q = el.getAttribute('data-q');
      navigate(el.getAttribute('data-nav'), q ? { q: q } : {});
      return;
    }
    // ปุ่มที่มีทั้ง data-action อยู่ภายในการ์ดที่มี data-action: ใช้ตัวในสุดเสมอ (closest)
    switch (action) {
      case 'program': openProgram(el.getAttribute('data-id')); break;
      case 'news': openNews(el.getAttribute('data-id')); break;
      case 'open-link':
        if (e.target.closest && e.target.closest('a[href]')) break;   // กดที่ลิงก์โดยตรง ให้เบราว์เซอร์เปิดเอง ไม่เปิดซ้ำ
        var href = safeUrl(el.getAttribute('data-href'));
        if (href) { try { window.open(href, '_blank', 'noopener'); } catch (err) { showToast('เปิดลิงก์ไม่ได้ กรุณาลองกดปุ่ม “อ่านเพิ่มเติม”', 'err'); } }
        break;
      case 'modal-close': closeModal(); break;
      case 'reload': loadData(); break;
      case 'programs-reset':
        state.programs = { q: '', dept: '', level: '' };
        navigate('programs', {}, { push: false });
        break;
      case 'news-cat':
        state.newsCat = el.getAttribute('data-cat') || '';
        var chips = $('#news-chips'), res = $('#news-results');
        if (chips) chips.innerHTML = newsChipsHtml(uniq(D().news.map(function (n) { return n.category; }).filter(Boolean)));
        if (res) res.innerHTML = newsList();
        break;
      case 'chat-ask': sendChat(el.getAttribute('data-text')); break;
      case 'voice-toggle': setVoice(!voice.on); break;
      case 'voice-mic': startListening(); break;
      case 'mic-help-close': hideMicHelp(); break;
      case 'open-tab':
        try { window.open(window.location.href, '_blank', 'noopener'); } catch (e) { showToast('เปิดแท็บใหม่ไม่ได้ กรุณาพิมพ์ถามแทน', 'err'); }
        break;
      case 'react': setReaction(Number(el.getAttribute('data-idx')), el.getAttribute('data-r')); break;
      case 'voice-test': speak('สวัสดีครับ ผมน้องนิคเองครับ ยินดีที่ได้รู้จักครับ มีอะไรให้ผมช่วยไหมครับ'); break;
      case 'speak-msg':
        var sm = state.chat.messages[Number(el.getAttribute('data-idx'))];
        if (sm) speak(sm.text);
        break;
      case 'chat-clear':
        abortListening();
        stopSpeaking();
        state.chat.messages = [];
        redrawChat();
        showToast('ล้างบทสนทนาแล้ว', 'ok');
        break;
      case 'ask-about':
        state.chat.prefill = el.getAttribute('data-text') || '';
        navigate('chat');
        break;
      case 'career-pick':
        state.career.answers[state.career.i] = Number(el.getAttribute('data-idx'));
        renderCareerBody();
        var chosen = $('.opt[aria-checked="true"]');
        if (chosen) chosen.focus();
        break;
      case 'career-next':
        if (state.career.i >= D().careerQuestions.length - 1) state.career.done = true; else state.career.i++;
        renderCareerBody();
        break;
      case 'career-prev':
        if (state.career.i > 0) state.career.i--;
        renderCareerBody();
        break;
      case 'career-restart':
        state.career = { i: 0, answers: [], done: false };
        renderCareerBody();
        break;
      default: break;
    }
  }
  function onSubmit(e) {
    var f = e.target;
    if (f.id === 'chat-form') {
      e.preventDefault();
      var input = $('#chat-input');
      if (input) sendChat(input.value);
      return;
    }
    if (f.hasAttribute && f.hasAttribute('data-search-form')) {
      e.preventDefault();
      var qi = $('.js-q', f);
      var q = qi ? qi.value.trim() : '';
      navigate('search', q ? { q: q } : {});
    }
  }
  function onInput(e) {
    var t = e.target;
    if (t.id === 'chat-input') { autoGrow(t); return; }
    if (t.id === 'prog-q') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.programs.q = t.value;
        var r = $('#prog-results');
        if (r) r.innerHTML = programResults();
      }, 160);
    }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'prog-dept' || t.id === 'prog-level') {
      if (t.id === 'prog-dept') state.programs.dept = t.value; else state.programs.level = t.value;
      var r = $('#prog-results');
      if (r) r.innerHTML = programResults();
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab' && $('.modal')) { trapFocus(e); return; }
    var t = e.target;
    if (t && t.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      sendChat(t.value);
    }
  }
  function bindEvents() {
    if (bound) return;
    bound = true;
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG') t.classList.add('img-broken');
    }, true);
  }

  /* ============================================================
   * 11) Init
   * ============================================================ */
  function hydrateStatic() {
    $$('[data-mascot]').forEach(function (el) {
      el.innerHTML = mascot(el.getAttribute('data-mascot'), Number(el.getAttribute('data-size')) || 46, { deco: true });
    });
  }
  function init() {
    var app = $('#app');
    state.page = resolvePage(app ? app.getAttribute('data-initial-page') : 'home');
    hydrateStatic();
    bindEvents();
    initVoice();
    renderFooter();
    setupHistory();
    loadData();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

