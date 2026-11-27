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
  /* ลิงก์รูปจาก Google Drive (แบบแชร์) → ลิงก์ที่ใช้เป็นรูปในหน้าเว็บได้ */
  function imgSrc(u) {
    var s = safeUrl(u), m;
    if (!s) return '';
    m = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(s) || /drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/.exec(s);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600' : s;
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

  // ตั้งค่า IP Address ของ ESP32 (ดูจาก Serial Monitor ตอนเปิดเครื่อง)
  var ROBOT_LED_IP = 'http://172.20.10.3'; 

  function sendRobotEmotion(mode) {
    if (!ROBOT_LED_IP) return;
    // ยิงคำสั่งแบบ Fire-and-forget เพื่อไม่ให้หน่วงการทำงานของเว็บแอป
    fetch(ROBOT_LED_IP + '/emotion?mode=' + encodeURIComponent(mode), {
      method: 'GET',
      mode: 'cors'
    }).catch(function () {
      // ข้าม Error กรณีบอร์ดยังไม่ได้เปิดหรืออยู่นอกวง Wi-Fi
    });
  }
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

  /* ============================================================
   * ท่าทางน้อง NICC ตามแผนก (ใช้กับ NICC Card Quest)
   * pose: auto, ev, electric, machine, build, it, account, hotel, chef, market, fish, farm, robot
   * pose ที่มี hat จะใช้หมวกอาชีพแทนหมวกรับปริญญา
   * ============================================================ */
  function mGear(cx, cy, r, fill, stroke) {
    var n = 8, pts = [], i, a, w = Math.PI / n * 0.55;
    function pt(ang, rad) { return (cx + Math.cos(ang) * rad).toFixed(1) + ',' + (cy + Math.sin(ang) * rad).toFixed(1); }
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push(pt(a - w, r * 0.8), pt(a - w * 0.7, r), pt(a + w * 0.7, r), pt(a + w, r * 0.8));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.34).toFixed(1) + '" fill="#FFFFFF" stroke="' + stroke + '" stroke-width="2"/>';
  }
  function mRaiseR() { return mArm('M154 172 Q194 164 188 132') + mHand(188, 124); }
  function mTwoHands(xl, xr) {
    return { L: mArm('M46 172 Q38 200 ' + xl + ' 207') + mHand(xl, 207), R: mArm('M154 172 Q162 200 ' + xr + ' 207') + mHand(xr, 207) };
  }
  function mHardHat(main, dark, light, emblem) {
    return '<path d="M46 66 Q46 22 100 22 Q154 22 154 66Z" fill="' + main + '" stroke="' + dark + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="92" y="22" width="16" height="42" fill="' + light + '" stroke="' + dark + '" stroke-width="2"/>' +
      '<rect x="36" y="62" width="128" height="10" rx="5" fill="' + main + '" stroke="' + dark + '" stroke-width="2.5"/>' + (emblem || '');
  }
  var mGoggles = '<g fill="#FFFFFF" fill-opacity=".14" stroke="#FFC629" stroke-width="4"><rect x="61" y="86" width="36" height="31" rx="13"/><rect x="103" y="86" width="36" height="31" rx="13"/></g>' +
    '<path d="M97 101 H103" stroke="#FFC629" stroke-width="4" stroke-linecap="round"/>';
  var mChefHat = (function () {
    var shapes = '<circle cx="68" cy="42" r="17"/><circle cx="132" cy="42" r="17"/><circle cx="100" cy="30" r="22"/><rect x="54" y="44" width="92" height="22" rx="8"/>';
    return '<g fill="#BFD3F5" stroke="#BFD3F5" stroke-width="5" stroke-linejoin="round">' + shapes + '</g><g fill="#FFFFFF">' + shapes + '</g>' +
      '<path d="M62 58 H138" stroke="#FFC629" stroke-width="3.5" stroke-linecap="round"/>';
  })();
  var mHotelHat = '<path d="M58 64 L65 34 H135 L142 64Z" fill="#0B2E8A" stroke="#071F63" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="34" rx="35" ry="6" fill="#17358F" stroke="#071F63" stroke-width="2"/>' +
    '<rect x="60" y="50" width="80" height="7" fill="#FFC629"/><circle cx="100" cy="34" r="5" fill="#FFC629" stroke="#E8A800" stroke-width="1.5"/>';
  var mBucketHat = '<path d="M62 54 Q62 28 100 28 Q138 28 138 54Z" fill="#3EB7F7" stroke="#1688D9" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M38 66 Q100 78 162 66 Q154 54 138 52 H62 Q46 54 38 66Z" fill="#3EB7F7" stroke="#1688D9" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M63 49 Q100 56 137 49" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>';
  var mStrawHat = '<ellipse cx="100" cy="63" rx="64" ry="12" fill="#F2D27A" stroke="#C99A2E" stroke-width="2.5"/>' +
    '<path d="M66 62 Q66 28 100 28 Q134 28 134 62Z" fill="#F2D27A" stroke="#C99A2E" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M67 52 Q100 60 133 52" fill="none" stroke="#C62F43" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M82 38 q-4 8 -3 14 M100 33 v18 M118 38 q4 8 3 14" fill="none" stroke="#C99A2E" stroke-width="1.6" opacity=".6"/>';

  (function () {
    var calc = '', r, c, keyCols = ['#9DB9EC', '#9DB9EC', '#FFC629'];
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) calc += '<circle cx="' + (86 + c * 14) + '" cy="' + (198 + r * 8.5) + '" r="3.2" fill="' + keyCols[c] + '"/>';
    var th = mTwoHands(62, 138), tc = mTwoHands(74, 126), tb = mTwoHands(70, 130);

    POSES.auto = { eyes: 'happy', mouth: 'smile', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      back: '<g transform="translate(188 88) rotate(20)"><rect x="-5" y="-6" width="10" height="46" rx="5" fill="#C9D6EE" stroke="#6F8CC9" stroke-width="2"/>' +
        '<circle cx="0" cy="-14" r="14" fill="#C9D6EE" stroke="#6F8CC9" stroke-width="2"/><rect x="-6" y="-34" width="12" height="16" fill="#FFFFFF" stroke="#6F8CC9" stroke-width="2"/></g>' +
        '<path d="M170 60 l4 -7 M182 52 v-8 M158 70 l-7 -3" stroke="#FFC629" stroke-width="3" stroke-linecap="round" fill="none"/>' };
    POSES.ev = { eyes: 'happy', mouth: 'open', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      back: '<g transform="translate(188 86)"><rect x="-8" y="-20" width="5" height="13" rx="2" fill="#FFC629" stroke="#E8A800" stroke-width="1.5"/><rect x="3" y="-20" width="5" height="13" rx="2" fill="#FFC629" stroke="#E8A800" stroke-width="1.5"/>' +
        '<rect x="-14" y="-8" width="28" height="30" rx="8" fill="#FFFFFF" stroke="#1655FF" stroke-width="2.5"/><polygon points="3,-2 -7,10 0,10 -4,19 8,6 1,6" fill="#16B890" stroke="#0C8A5E" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M0 22 q0 12 -2 20" fill="none" stroke="#0B2E8A" stroke-width="5" stroke-linecap="round"/></g>' +
        '<path d="M164 70 q-10 -4 -14 -14 M212 70 q8 -4 10 -12" stroke="#16B890" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    POSES.electric = { eyes: 'happy', mouth: 'open', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      hat: mHardHat('#2A6BFF', '#0B2E8A', '#5C8CFF', '<polygon points="70,34 62,50 69,50 65,60 77,45 70,45 74,34" fill="#FFC629" stroke="#E8A800" stroke-width="1"/>'),
      back: '<circle cx="188" cy="92" r="27" fill="#FFF4D1"/><polygon points="196,64 172,96 186,96 180,122 206,88 191,88 199,64" fill="#FFC629" stroke="#E8A800" stroke-width="2.5" stroke-linejoin="round"/>' };
    POSES.machine = { eyes: 'happy', mouth: 'smile', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      hat: mHardHat('#FFFFFF', '#6F8CC9', '#D9E6FA') + mGoggles,
      back: mGear(188, 100, 21, '#9DB9EC', '#0B2E8A') + mGear(166, 76, 11, '#FFC629', '#E8A800') };
    POSES.build = { eyes: 'happy', mouth: 'smile', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      hat: mHardHat('#FFC629', '#E8A800', '#FFD65C'),
      back: '<g transform="translate(188 100) rotate(-16)"><rect x="-24" y="-15" width="48" height="30" rx="4" fill="#E3F3FE" stroke="#1655FF" stroke-width="2.5"/>' +
        '<path d="M-15 -6 H15 M-15 2 H5 M-15 9 H12" stroke="#3EB7F7" stroke-width="2" stroke-linecap="round"/><rect x="-27" y="-17" width="6" height="34" rx="3" fill="#BFD3F5" stroke="#1655FF" stroke-width="2"/></g>' };
    POSES.it = { eyes: 'happy', mouth: 'smile', L: th.L, R: th.R,
      back: '<rect x="64" y="175" width="72" height="31" rx="5" fill="#0B2E8A" stroke="#FFFFFF" stroke-width="2.5"/>' +
        '<text x="100" y="196" text-anchor="middle" font-family="Noto Sans Thai, sans-serif" font-weight="900" font-size="15" fill="#2FD0FF">&lt;/&gt;</text>' +
        '<path d="M54 208 H146 L140 217 H60Z" fill="#D9E6FA" stroke="#9DB9EC" stroke-width="2" stroke-linejoin="round"/>' };
    POSES.account = { eyes: 'happy', mouth: 'smile', L: tc.L, R: tc.R,
      back: '<rect x="74" y="171" width="52" height="48" rx="8" fill="#FFFFFF" stroke="#1655FF" stroke-width="2.5"/><rect x="80" y="177" width="40" height="13" rx="3" fill="#0B2E8A"/>' +
        '<text x="116" y="187.5" text-anchor="end" font-family="Noto Sans Thai, sans-serif" font-weight="900" font-size="9" fill="#2FD0FF">1,250</text>' + calc,
      front: '<circle cx="180" cy="150" r="12" fill="#FFC629" stroke="#E8A800" stroke-width="2.5"/><text x="180" y="155" text-anchor="middle" font-family="Noto Sans Thai, sans-serif" font-weight="900" font-size="14" fill="#0B2E8A">฿</text>' };
    POSES.hotel = { eyes: 'happy', mouth: 'smile', L: tb.L, R: tb.R, hat: mHotelHat,
      back: '<rect x="66" y="209" width="68" height="8" rx="4" fill="#E8A800"/><path d="M74 210 a26 25 0 0 1 52 0z" fill="#FFC629" stroke="#E8A800" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="96" y="181" width="8" height="6" rx="2" fill="#E8A800"/><path d="M82 202 a20 18 0 0 1 11 -13" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".75"/>',
      front: '<path d="M164 160 l6 -8 M176 150 l1 -10 M186 162 l9 -4" stroke="#FFC629" stroke-width="3" stroke-linecap="round" fill="none"/>' };
    POSES.chef = { eyes: 'happy', mouth: 'open', L: mArm('M46 172 Q24 184 34 196') + mHand(34, 196), R: mRaiseR(), hat: mChefHat,
      back: '<rect x="4" y="204" width="7" height="6" rx="2" fill="#6F8CC9"/><rect x="59" y="204" width="7" height="6" rx="2" fill="#6F8CC9"/>' +
        '<path d="M10 200 H60 V214 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6z" fill="#9DB9EC" stroke="#0B2E8A" stroke-width="2"/><rect x="7" y="196" width="56" height="7" rx="3.5" fill="#D9E6FA" stroke="#6F8CC9" stroke-width="2"/>' +
        '<path d="M24 190 q-5 -6 0 -11 t0 -11 M38 190 q-5 -6 0 -11 t0 -11 M52 190 q-5 -6 0 -11 t0 -11" fill="none" stroke="#9DB9EC" stroke-width="3" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M188 124 V74" stroke="#6F8CC9" stroke-width="8" stroke-linecap="round"/><path d="M188 124 V74" stroke="#D9E6FA" stroke-width="4.5" stroke-linecap="round"/>' +
        '<circle cx="188" cy="64" r="13" fill="#D9E6FA" stroke="#6F8CC9" stroke-width="2.5"/><ellipse cx="188" cy="66" rx="8" ry="5" fill="#9DB9EC"/>' };
    POSES.market = { eyes: 'happy', mouth: 'open', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      back: '<g transform="translate(176 96) rotate(-24)"><rect x="-13" y="-8" width="13" height="16" rx="3" fill="#FFC629" stroke="#E8A800" stroke-width="2"/>' +
        '<polygon points="0,-9 28,-23 28,23 0,9" fill="#FF6B8A" stroke="#C62F43" stroke-width="2.5" stroke-linejoin="round"/><rect x="26" y="-25" width="6" height="50" rx="3" fill="#C62F43"/>' +
        '<path d="M40 -12 q8 12 0 24" fill="none" stroke="#FFC629" stroke-width="3" stroke-linecap="round"/></g>' };
    POSES.fish = { eyes: 'happy', mouth: 'open', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(), hat: mBucketHat,
      back: '<g transform="translate(188 100) rotate(-80)"><polygon points="-14,0 -31,-11 -31,11" fill="#1688D9" stroke="#1655FF" stroke-width="2" stroke-linejoin="round"/>' +
        '<ellipse cx="0" cy="0" rx="19" ry="11" fill="#3EB7F7" stroke="#1655FF" stroke-width="2.5"/><ellipse cx="2" cy="4" rx="12" ry="4" fill="#E3F3FE"/>' +
        '<circle cx="10" cy="-3" r="3" fill="#0B2E8A"/><path d="M-2 -10 q4 -8 10 -6" fill="none" stroke="#1655FF" stroke-width="2.5" stroke-linecap="round"/></g>' +
        '<circle cx="168" cy="62" r="3.5" fill="#2FD0FF"/><circle cx="204" cy="72" r="3" fill="#2FD0FF"/><circle cx="174" cy="48" r="2.5" fill="#3EB7F7"/>' };
    POSES.farm = { eyes: 'happy', mouth: 'smile', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(), hat: mStrawHat,
      back: '<path d="M188 108 V82" stroke="#0C8A5E" stroke-width="3.5" stroke-linecap="round"/>' +
        '<ellipse cx="177" cy="84" rx="12" ry="6" transform="rotate(-28 177 84)" fill="#3BD3A6" stroke="#0C8A5E" stroke-width="2"/>' +
        '<ellipse cx="199" cy="76" rx="12" ry="6" transform="rotate(28 199 76)" fill="#3BD3A6" stroke="#0C8A5E" stroke-width="2"/>' +
        '<ellipse cx="188" cy="68" rx="5" ry="9" fill="#3BD3A6" stroke="#0C8A5E" stroke-width="2"/>' +
        '<path d="M175 108 H201 L197 126 H179Z" fill="#C97B3D" stroke="#8A4F1F" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="188" cy="108" rx="13" ry="3.5" fill="#8A4F1F"/>' };
    POSES.robot = { eyes: 'happy', mouth: 'smile', L: mArm('M46 172 Q30 192 38 208') + mHand(38, 208), R: mRaiseR(),
      back: '<g transform="translate(188 92)"><path d="M0 -15 V-25" stroke="#6F8CC9" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-28" r="4" fill="#FFC629" stroke="#E8A800" stroke-width="1.5"/>' +
        '<rect x="-22" y="-6" width="5" height="12" rx="2" fill="#9DB9EC"/><rect x="17" y="-6" width="5" height="12" rx="2" fill="#9DB9EC"/>' +
        '<rect x="-18" y="-15" width="36" height="30" rx="9" fill="#FFFFFF" stroke="#3EB7F7" stroke-width="2.5"/><rect x="-13" y="-10" width="26" height="15" rx="6" fill="#071F63"/>' +
        '<circle cx="-5" cy="-2.5" r="3.2" fill="#2FD0FF"/><circle cx="5" cy="-2.5" r="3.2" fill="#2FD0FF"/><path d="M-5 9 H5" stroke="#9DB9EC" stroke-width="2.5" stroke-linecap="round"/>' +
        '<rect x="-7" y="15" width="14" height="22" rx="4" fill="#BFD3F5" stroke="#6F8CC9" stroke-width="2"/></g>' };

    POSE_LABEL.auto = 'น้อง NICC ถือประแจ แผนกช่างยนต์'; POSE_LABEL.ev = 'น้อง NICC ถือหัวชาร์จ ยานยนต์ไฟฟ้า';
    POSE_LABEL.electric = 'น้อง NICC สวมหมวกนิรภัยถือสายฟ้า แผนกช่างไฟ'; POSE_LABEL.machine = 'น้อง NICC ถือเฟือง แผนกช่างกลโรงงาน';
    POSE_LABEL.build = 'น้อง NICC สวมหมวกนิรภัยถือแบบก่อสร้าง'; POSE_LABEL.it = 'น้อง NICC ถือแล็ปท็อป แผนกเทคโนโลยีสารสนเทศ';
    POSE_LABEL.account = 'น้อง NICC ถือเครื่องคิดเลข แผนกการบัญชี'; POSE_LABEL.hotel = 'น้อง NICC ใส่หมวกพนักงานโรงแรมข้างกระดิ่งบริการ';
    POSE_LABEL.chef = 'น้อง NICC สวมหมวกเชฟถือทัพพีข้างหม้อ'; POSE_LABEL.market = 'น้อง NICC ถือโทรโข่ง แผนกการตลาด';
    POSE_LABEL.fish = 'น้อง NICC ถือปลา แผนกเพาะเลี้ยงสัตว์น้ำ'; POSE_LABEL.farm = 'น้อง NICC สวมหมวกฟางถือต้นกล้า';
    POSE_LABEL.robot = 'น้อง NICC ถือหุ่นยนต์ตัวเล็ก แผนกเมคคาทรอนิกส์';
  })();

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
    // หมวก: pose ที่กำหนด hat ใช้หมวกอาชีพ ไม่งั้นใช้หมวกรับปริญญา
    if (P.hat && !isHead) {
      s += P.hat;
    } else {
      s += '<polygon points="30,42 100,68 170,42 170,47 100,73 30,47" fill="#071F63"/>';
      s += '<path d="M64 50 v16 c0 7 16 10 36 10 s36 -3 36 -10 V50 z" fill="#0B2E8A"/>';
      s += '<polygon points="100,16 170,42 100,68 30,42" fill="url(#mgBlue)" stroke="#071F63" stroke-width="1.5" stroke-linejoin="round"/>';
      s += '<circle cx="100" cy="42" r="8" fill="none" stroke="#FFC629" stroke-width="4" stroke-dasharray="3.1 3.1"/><circle cx="100" cy="42" r="6" fill="#FFC629"/><circle cx="100" cy="42" r="2.3" fill="#0B2E8A"/>';
      s += '<path d="M100 42 L156 49 V68" fill="none" stroke="#FFC629" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M152 66 h8 l2.5 13 h-13z" fill="#FFC629"/>';
    }
    if (!isHead) {
      s += P.L || '';
      s += P.R || '';
      s += P.front || '';
      if (opts.confetti) s += mConfetti();
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
    setupKiosk();
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
    var img = imgSrc(r.image_url);
    var poster = img
      ? '<button type="button" class="poster" data-action="img-view" data-id="' + esc(r.id) + '" aria-label="ดูภาพประกาศ ' + esc(r.title) + ' ขนาดใหญ่">' + icon('admission', 'xl') +
        '<img src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="poster-hint">' + icon('search', 'sm') + 'แตะเพื่อขยาย</span></button>'
      : '';
    return '<article class="card">' + poster + '<div class="card-body"><div class="meta-row">' +
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
  /* โหมดคำถามปกติ: ข้ามคำถามแบบ "ตัดทิ้ง" (ใช้ได้เฉพาะในโหมดจั่วการ์ด) */
  function classicQs() { return (D().careerQuestions || []).filter(function (q) { return q.mode !== 'avoid'; }); }
  function renderCareerClassic() {
    var box = $('#career-body');
    if (!box) return;
    var Q = classicQs(), c = state.career;
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
    var Q = classicQs(), progs = D().programs, c = state.career, scores = {}, reasons = {}, answered = 0;
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

  /* ============================================================
   * NICC Card Quest v2 — แนะแนวแบบเกมการ์ดตามหลัก Holland (RIASEC)
   * ------------------------------------------------------------
   * หลักการให้คะแนน (ปรับค่าได้ที่ค่าคงที่ด้านล่าง)
   *   1) จับคู่โดยตรง   : การ์ด → programs/departments × weight (ตามชีต CareerQuestions)
   *   2) ความสอดคล้อง RIASEC: โปรไฟล์ความสนใจของผู้เล่น เทียบกับรหัส Holland 3 ตัวของแต่ละสาขา
   *   3) คะแนนรวม = 55% (1) + 45% (2)  แสดงเป็น "ความสอดคล้อง %" (สูงสุด 98%)
   *   4) ตัวกรองระดับ    : ผู้เล่นเลือก ปวช. (จบ ม.3) หรือ ปวส. (จบ ม.6/ปวช.) → แปลงสาขาให้ตรงระดับ
   *   5) โหมดเลือก 2 ใบ  : ใบแรก ×1, ใบสอง ×0.6   โหมดตัดทิ้ง: ลบคะแนน ×0.6
   * ฟิลด์ที่ใช้ได้ใน options_json (ไม่ใส่ก็ได้ ระบบมีค่าสำรอง):
   *   [..options..]  หรือ  { "stage":"ชื่อด่าน", "mode":"pick|avoid", "pick":2, "options":[..] }
   *   option: label, title, desc, image_url, theme, pose, programs[], departments[], weight, riasec{R,I,A,S,E,C: 0-3}
   * ============================================================ */
  var QUEST_MAX_ROUNDS = 12;    // จำนวนรอบสูงสุดต่อเกม
  var QUEST_PICK_DELAY = 700;   // ms ค้างให้เห็นการ์ดที่เลือกก่อนไปรอบถัดไป
  var QUEST_THINK_MS = 2600;    // ms หน้าประมวลผล
  var QUEST_ALTS = 3;           // จำนวนสาขารองที่แสดง
  var QUEST_SECOND = 0.6;       // น้ำหนักการ์ดใบที่ 2 (โหมดเลือกหลายใบ)
  var QUEST_AVOID = 0.6;        // น้ำหนักลบของการ์ดที่ตัดทิ้ง
  var QUEST_W_DIRECT = 0.55, QUEST_W_FIT = 0.45;

  var QUEST_THEMES = [
    { key: 'blue',   pose: 'learning' },
    { key: 'sky',    pose: 'assistant' },
    { key: 'gold',   pose: 'career' },
    { key: 'mint',   pose: 'success' },
    { key: 'rose',   pose: 'welcome' },
    { key: 'violet', pose: 'thinking' }
  ];
  var QUEST_LETTERS = ['R', 'I', 'A', 'S', 'E', 'C'];
  var QUEST_TYPES = {
    R: { name: 'ลงมือปฏิบัติ', short: 'นักลงมือ', theme: 'blue', desc: 'ชอบลงมือทำ ใช้เครื่องมือ และเห็นผลงานเป็นชิ้นเป็นอัน' },
    I: { name: 'ค้นคว้า วิเคราะห์', short: 'นักค้นหา', theme: 'violet', desc: 'ชอบสงสัย หาเหตุผล และแก้ปัญหาด้วยข้อมูลและระบบ' },
    A: { name: 'สร้างสรรค์', short: 'นักสร้างสรรค์', theme: 'rose', desc: 'ชอบคิดต่าง ใส่ไอเดียและความสวยงามลงในงาน' },
    S: { name: 'ดูแลผู้คน', short: 'นักดูแล', theme: 'mint', desc: 'ชอบช่วยเหลือ ดูแล และทำงานร่วมกับผู้คน' },
    E: { name: 'นำและโน้มน้าว', short: 'นักขับเคลื่อน', theme: 'gold', desc: 'ชอบเป็นผู้นำ วางแผน และขับเคลื่อนให้งานสำเร็จ' },
    C: { name: 'เป็นระบบ ละเอียด', short: 'นักจัดระบบ', theme: 'sky', desc: 'ชอบความเป็นระเบียบ ละเอียด และทำตามขั้นตอน' }
  };
  /* รหัส Holland (เรียงจากเด่นสุด) ของแต่ละสาขา — จับจากชื่อสาขา/แผนก; ใส่ชื่อคอลัมน์ holland ในชีต Programs เพื่อกำหนดเองได้ */
  var QUEST_HOLLAND = [
    [/บริการยานยนต์/, 'RES'], [/ยานยนต์ไฟฟ้า/, 'RIC'], [/ช่างยนต์|เครื่องกล|จักรกล/, 'RIC'],
    [/กลโรงงาน|การผลิต/, 'RCI'], [/ไฟฟ้า|ช่างไฟ/, 'RIC'], [/ก่อสร้าง/, 'RCE'],
    [/สารสนเทศ|คอมพิวเตอร์/, 'ICR'], [/เมคคาทรอนิกส์|หุ่นยนต์/, 'IRC'], [/บัญชี/, 'CEI'],
    [/โรงแรม/, 'SEC'], [/อาหาร|โภชนาการ/, 'RAE'], [/การตลาด/, 'EAS'],
    [/สัตว์น้ำ|ประมง/, 'RIE'], [/เกษตร/, 'RIE']
  ];
  var QUEST_POSE_RULES = [
    [/ยานยนต์ไฟฟ้า|รถยนต์ไฟฟ้า|รถไฟฟ้า|EV/, 'ev'],
    [/ช่างยนต์|ยานยนต์|เครื่องยนต์|จักรกลหนัก|เครื่องกล|ซ่อมรถ|รถ/, 'auto'],
    [/ไฟฟ้า|ช่างไฟ|วงจร|ไฟดับ/, 'electric'],
    [/กลโรงงาน|เทคนิคการผลิต|กลึง|เชื่อม|เครื่องมือกล|ช่างกล|เครื่องจักร/, 'machine'],
    [/ก่อสร้าง|ช่างปูน|อาคาร|บ้าน/, 'build'],
    [/สารสนเทศ|คอมพิวเตอร์|โปรแกรม|ไอที|เว็บ|ดิจิทัล/, 'it'],
    [/บัญชี|การเงิน|ตัวเลข|เอกสาร/, 'account'],
    [/โรงแรม|ต้อนรับ|ท่องเที่ยว|รีสอร์ท|แขก/, 'hotel'],
    [/อาหาร|โภชนาการ|ทำอาหาร|ครัว|เชฟ|ขนม/, 'chef'],
    [/การตลาด|ขาย|ร้านค้า|ธุรกิจ/, 'market'],
    [/สัตว์น้ำ|ประมง|ปลา|กุ้ง/, 'fish'],
    [/เกษตร|พืช|ฟาร์ม|ธรรมชาติ/, 'farm'],
    [/เมคคาทรอนิกส์|หุ่นยนต์|อัตโนมัติ/, 'robot']
  ];
  var QUEST_CHEERS = [
    'ใบนี้น่าสนใจมาก! น้องนิคจดไว้แล้ว', 'เลือกได้ใจจริงๆ ไปต่อกัน!', 'เริ่มเห็นตัวตนของคุณแล้วนะ', 'ว้าว ตรงกับที่น้องนิคเดาเลย!'
  ];
  var QUEST_CHEERS_AVOID = [
    'โอเค ตัดใบนี้ออก! การรู้ว่าไม่ชอบก็สำคัญ', 'ตัดสินใจได้เด็ดขาดมาก', 'ข้อมูลนี้ช่วยให้ผลแม่นขึ้นเยอะเลย'
  ];
  var QUEST_TIPS = [
    'ผลนี้มาจากความสนใจที่คุณเลือก ยังไม่ได้วัดความสามารถหรือผลการเรียน',
    'ลองเข้าชมโรงฝึกงานหรือกิจกรรมเปิดบ้านของสาขาที่ได้ เพื่อดูของจริงก่อนตัดสินใจ',
    'คุยกับครูแนะแนว ผู้ปกครอง หรือรุ่นพี่ที่เรียนสาขานั้น แล้วเทียบกับผลที่ได้'
  ];

  function freshQuest(mode, step, level) {
    return { mode: mode || 'quest', step: step || 'intro', level: level || '', round: 0, picks: [], lock: false, pickTimer: 0, thinkTimer: 0 };
  }
  function questState() { if (!state.quest) state.quest = freshQuest(); return state.quest; }
  function questClearTimers() {
    var s = state.quest;
    if (!s) return;
    clearTimeout(s.pickTimer); clearTimeout(s.thinkTimer);
    s.pickTimer = 0; s.thinkTimer = 0; s.lock = false;
  }
  function qArr(x) { return Array.isArray(x) ? x.map(String) : []; }
  function qPicks(s, qi) { var a = s.picks[qi]; return Array.isArray(a) ? a : []; }
  function questDeck() {
    return (D().careerQuestions || []).filter(function (q) { return q && Array.isArray(q.options) && q.options.length; }).slice(0, QUEST_MAX_ROUNDS);
  }
  function qAvoid(q) { return q.mode === 'avoid'; }
  function qNeed(q) {
    var n = Math.floor(Number(q.pick)) || 1;
    return Math.max(1, Math.min(n, 3, Math.max(1, q.options.length - 1)));
  }
  function qFactor(q, order) { return qAvoid(q) ? -QUEST_AVOID : (order === 0 ? 1 : QUEST_SECOND); }
  function qWeight(o) { return Number(o.weight) > 0 ? Number(o.weight) : 1; }
  function qLvl(p) { var t = String((p && p.level) || ''); return /ปวช/.test(t) ? 'ปวช.' : (/ปวส/.test(t) ? 'ปวส.' : ''); }
  function qLevels() {
    var seen = {}, out = [];
    (D().programs || []).forEach(function (p) { var l = qLvl(p); if (l && !seen[l]) { seen[l] = 1; out.push(l); } });
    return out;
  }
  function qDeptName(p) { var d = deptById(p && p.department_id); return d ? d.name : ''; }

  function themeIndex(key) {
    for (var i = 0; i < QUEST_THEMES.length; i++) if (QUEST_THEMES[i].key === key) return i;
    return -1;
  }
  function qZero() { return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }; }
  function qCode(p) {
    if (!p) return '';
    var c = String(p.holland || '').toUpperCase().replace(/[^RIASEC]/g, '');
    if (c) return c.slice(0, 3);
    var text = String(p.name || '') + ' ' + qDeptName(p);
    for (var i = 0; i < QUEST_HOLLAND.length; i++) if (QUEST_HOLLAND[i][0].test(text)) return QUEST_HOLLAND[i][1];
    return '';
  }
  function qCodeVec(code) {
    var v = qZero(), w = [3, 2, 1];
    code.split('').forEach(function (ch, i) { if (v[ch] !== undefined) v[ch] = w[i]; });
    return v;
  }
  function qCos(a, b) {
    var d = 0, na = 0, nb = 0;
    QUEST_LETTERS.forEach(function (L) { d += a[L] * b[L]; na += a[L] * a[L]; nb += b[L] * b[L]; });
    return (na && nb) ? d / Math.sqrt(na * nb) : 0;
  }
  function qHits(o) {
    var hit = {}, progs = D().programs || [];
    qArr(o.programs).forEach(function (id) { var p = programById(id); if (p) hit[p.id] = 1; });
    qArr(o.departments).forEach(function (did) { progs.forEach(function (p) { if (String(p.department_id) === did) hit[p.id] = 1; }); });
    return Object.keys(hit);
  }
  /* แปลงสาขาที่การ์ดชี้ไป ให้เป็นสาขาในระดับที่ผู้เล่นเลือก (เช่น ช่างยนต์ ปวช. → เทคนิคเครื่องกล ปวส. ของแผนกเดียวกัน) */
  function qTargets(o, level) {
    var progs = D().programs || [], out = {};
    qHits(o).forEach(function (id) {
      var p = programById(id);
      if (!p) return;
      var lv = qLvl(p);
      if (!level || !lv || lv === level) { out[p.id] = 1; return; }
      var same = progs.filter(function (x) { return x.department_id === p.department_id && qLvl(x) === level; });
      var named = same.filter(function (x) { return x.name === p.name; });
      (named.length ? named : same).forEach(function (x) { out[x.id] = 1; });
    });
    return Object.keys(out);
  }
  /* เวกเตอร์ความสนใจของการ์ด: ใช้ riasec ในการ์ด ถ้าไม่มีให้เฉลี่ยจากรหัส Holland ของสาขาที่การ์ดชี้ไป */
  function qOptVec(o) {
    var v = qZero(), tags = o && o.riasec, any = false;
    if (tags && typeof tags === 'object') {
      QUEST_LETTERS.forEach(function (L) { var n = Number(tags[L]); if (n > 0) { v[L] = Math.min(n, 3); any = true; } });
    }
    if (any) return v;
    var cnt = 0;
    qHits(o).forEach(function (id) {
      var c = qCode(programById(id));
      if (!c) return;
      var cv = qCodeVec(c);
      QUEST_LETTERS.forEach(function (L) { v[L] += cv[L]; });
      cnt++;
    });
    if (cnt) QUEST_LETTERS.forEach(function (L) { v[L] = v[L] / cnt; });
    return v;
  }
  function questProfile() {
    var deck = questDeck(), s = questState(), vec = qZero();
    deck.forEach(function (q, qi) {
      qPicks(s, qi).forEach(function (idx, order) {
        var o = q.options[idx];
        if (!o) return;
        var f = qFactor(q, order), ov = qOptVec(o);
        if (f < 0) f = f * 0.5;
        QUEST_LETTERS.forEach(function (L) { vec[L] += f * ov[L]; });
      });
    });
    QUEST_LETTERS.forEach(function (L) { if (vec[L] < 0) vec[L] = 0; });
    var order = QUEST_LETTERS.slice().sort(function (a, b) { return vec[b] - vec[a] || QUEST_LETTERS.indexOf(a) - QUEST_LETTERS.indexOf(b); });
    var sum = 0;
    QUEST_LETTERS.forEach(function (L) { sum += vec[L]; });
    return { vec: vec, order: order, max: vec[order[0]] || 0, sum: sum, top: order.filter(function (L) { return vec[L] > 0; }).slice(0, 3) };
  }

  /* ---------- คำนวณผล ---------- */
  function questScore() {
    var deck = questDeck(), s = questState(), level = s.level, progs = D().programs || [];
    var direct = {}, rounds = {}, why = {}, dumped = {}, ideal = 0, answered = 0;
    deck.forEach(function (q, qi) {
      var picks = qPicks(s, qi);
      if (picks.length) answered++;
      if (!qAvoid(q)) {
        var mw = 0, i;
        q.options.forEach(function (o) { mw = Math.max(mw, qWeight(o)); });
        for (i = 0; i < qNeed(q); i++) ideal += mw * qFactor(q, i);
      }
      picks.forEach(function (idx, order) {
        var o = q.options[idx];
        if (!o) return;
        var f = qFactor(q, order), w = qWeight(o), label = o.title || o.label;
        qTargets(o, level).forEach(function (id) {
          direct[id] = (direct[id] || 0) + f * w;
          if (f > 0) { rounds[id] = (rounds[id] || 0) + 1; (why[id] = why[id] || []).push(label); }
          else { (dumped[id] = dumped[id] || []).push(label); }
        });
      });
    });
    var profile = questProfile(), ids = Object.keys(direct).filter(function (id) { return direct[id] > 0; });
    if (!ids.length) {   // ข้อมูลการ์ดไม่ได้ผูกสาขา → ใช้ความสอดคล้อง RIASEC อย่างเดียว
      ids = progs.filter(function (p) { var l = qLvl(p); return qCode(p) && (!level || !l || l === level); }).map(function (p) { return p.id; });
    }
    var ranked = ids.map(function (id) {
      var p = programById(id), code = qCode(p);
      var fit = (profile.sum && code) ? qCos(profile.vec, qCodeVec(code)) : 0;
      var dir = ideal ? Math.max(0, Math.min(1, (direct[id] || 0) / (0.7 * ideal))) : 0;
      var pct = Math.min(98, Math.round(100 * (QUEST_W_DIRECT * dir + QUEST_W_FIT * fit)));
      return { p: p, pct: pct, direct: direct[id] || 0, fit: fit, code: code, rounds: rounds[id] || 0, why: uniq(why[id] || []), dumped: uniq(dumped[id] || []) };
    }).filter(function (r) { return r.p; }).sort(function (a, b) {
      return b.pct - a.pct || b.direct - a.direct || String(a.p.name).localeCompare(String(b.p.name));
    });
    return { ranked: ranked, profile: profile, answered: answered, total: deck.length, level: level };
  }

  /* ---------- ธีม / ท่าทางของการ์ด ---------- */
  function questOptTheme(o, idx) {   // คืน [ดัชนีธีม, ล็อกสีหรือไม่]
    var k = themeIndex(String((o && o.theme) || '').toLowerCase());
    if (k >= 0) return [k, true];
    var v = qOptVec(o), best = '', max = 0;
    QUEST_LETTERS.forEach(function (L) { if (v[L] > max) { max = v[L]; best = L; } });
    if (o && o.riasec && best) return [themeIndex(QUEST_TYPES[best].theme), true];
    var text = String((o && o.title) || '') + ' ' + String((o && o.label) || '');
    var i, rules = [[/ไฟฟ้า|อิเล็ก|วงจร/, 'gold'], [/คอมพิวเตอร์|โปรแกรม|ดิจิทัล|ไอที|เทคโนโลยี/, 'sky'], [/บัญชี|ตัวเลข|เอกสาร|ธุรกิจ|ขาย/, 'mint'], [/ซ่อม|เครื่องยนต์|เครื่องจักร|ช่างกล|เชื่อม/, 'blue'], [/ออกแบบ|ศิลป|สร้างสรรค์|อาหาร|โรงแรม/, 'rose'], [/วิทยาศาสตร์|วิเคราะห์|ทดลอง/, 'violet']];
    for (i = 0; i < rules.length; i++) if (rules[i][0].test(text)) return [themeIndex(rules[i][1]), false];
    return [idx % QUEST_THEMES.length, false];
  }
  function questRoundThemes(q) {   // การ์ดที่สีไม่ล็อก จะเลี่ยงสีซ้ำกันในรอบเดียวกัน
    var used = {}, L = QUEST_THEMES.length, info = q.options.map(function (o, i) { return questOptTheme(o, i); });
    info.forEach(function (x) { if (x[1]) used[x[0]] = 1; });
    return info.map(function (x) {
      var t = x[0], n = 0;
      if (!x[1]) { while (used[t] && n < L) { t = (t + 1) % L; n++; } used[t] = 1; }
      return t;
    });
  }
  function questPoseFor(text) {
    for (var i = 0; i < QUEST_POSE_RULES.length; i++) if (QUEST_POSE_RULES[i][0].test(text)) return QUEST_POSE_RULES[i][1];
    return '';
  }
  function questProgPose(p) { return questPoseFor(String((p && p.name) || '') + ' ' + qDeptName(p)); }
  function questCardPose(o, t) {
    if (o.pose && POSES[o.pose]) return o.pose;
    var k = questPoseFor(String(o.title || '') + ' ' + String(o.label || ''));
    if (k) return k;
    var cnt = {}, best = '', n = 0, tot = 0;
    qHits(o).forEach(function (id) {
      var kk = questProgPose(programById(id));
      if (!kk) return;
      cnt[kk] = (cnt[kk] || 0) + 1; tot++;
      if (cnt[kk] > n) { n = cnt[kk]; best = kk; }
    });
    return (best && n * 2 >= tot) ? best : QUEST_THEMES[t].pose;
  }
  function questLinked(o) {
    var names = [];
    qArr(o.programs).forEach(function (id) { var p = programById(id); if (p && p.name) names.push(p.name + (p.level ? ' (' + p.level + ')' : '')); });
    qArr(o.departments).forEach(function (id) { var d = deptById(id); if (d && d.name) names.push(d.name); });
    names = uniq(names).slice(0, 2);
    return names.length ? 'แนวทาง: ' + names.join(' • ') : '';
  }
  function questStages(deck) {
    var names = [], idx = [];
    deck.forEach(function (q) {
      var nm = q.stage || '';
      if (!names.length || names[names.length - 1] !== nm) names.push(nm);
      idx.push(names.length - 1);
    });
    return { names: names, idx: idx };
  }

  /* ---------- Render ---------- */
  function questSwitchBar(toQuest) {
    return '<div class="quest-switch">' + (toQuest
      ? '<button type="button" class="btn btn-accent btn-sm" data-action="quest-mode">' + icon('chat', 'sm') + 'สลับไปเล่นโหมดจั่วการ์ด</button>'
      : '') + '</div>';
  }
  function questBadgeHtml(q, rank) {
    if (qAvoid(q)) return icon('close', 'md');
    return qNeed(q) > 1 ? '<b class="qc-rank">' + (rank + 1) + '</b>' : icon('check', 'md');
  }
  function questMeterHtml() {
    var pf = questProfile();
    return QUEST_LETTERS.map(function (L) {
      var T = QUEST_TYPES[L], pct = pf.max ? Math.round(pf.vec[L] / pf.max * 100) : 0;
      return '<span class="qm t-' + T.theme + (pf.top[0] === L && pf.max ? ' is-top' : '') + '"><b>' + L + '</b><span class="qm-name">' + esc(T.short.replace('นัก', '')) + '</span><i style="--v:' + pct + '%"></i></span>';
    }).join('');
  }
  function questIntroHtml(n, deck) {
    var st = questStages(deck), levels = qLevels(), mins = Math.max(2, Math.round(n * 0.4)), btns;
    if (levels.length > 1) {
      btns = '<button type="button" class="btn btn-accent btn-lg" data-action="quest-start" data-level="ปวช.">' + icon('forward', 'sm') + 'เริ่มเลย: กำลังจบ ม.3 (ปวช.)</button>' +
        '<button type="button" class="btn btn-accent btn-lg" data-action="quest-start" data-level="ปวส.">' + icon('forward', 'sm') + 'เริ่มเลย: จบ ม.6 / ปวช. (ปวส.)</button>';
    } else {
      btns = '<button type="button" class="btn btn-accent btn-lg" data-action="quest-start" data-level="' + esc(levels[0] || '') + '">' + icon('forward', 'sm') + 'เริ่มจั่วการ์ด</button>';
    }
    return '<section class="quest quest-intro" aria-labelledby="qh">' +
      '<div class="qi-art"><div class="qi-deck" aria-hidden="true"><i class="t-sky"></i><i class="t-gold"></i><i class="t-blue"></i></div>' + mascot('career', 170, { float: true, deco: true }) + '</div>' +
      '<div class="qi-text"><span class="qbadge">NICC Card Quest</span>' +
      '<h2 id="qh" tabindex="-1">จั่วการ์ด ค้นหาสาขาที่ใช่</h2>' +
      '<p>ผจญภัย ' + st.names.length + ' ด่าน รวม ' + n + ' รอบ ใช้เวลาประมาณ ' + mins + ' นาที น้องนิคจะวิเคราะห์ความสนใจของคุณตามหลัก Holland (RIASEC) แล้วจับคู่กับสาขาของวิทยาลัย</p>' +
      '<ul class="qi-points"><li>เลือกการ์ดที่ใช่</li><li>ตัดการ์ดที่ไม่ใช่</li><li>ลองสถานการณ์จริง</li></ul>' +
      '<div class="btn-row">' + btns + '<button type="button" class="btn btn-ghost" data-action="quest-classic">ตอบแบบคำถามปกติ</button></div></div></section>';
  }
  function questCardHtml(q, o, i, t, rank) {
    var T = QUEST_THEMES[t], picked = rank >= 0, title = o.title || o.label || ('การ์ดใบที่ ' + (i + 1));
    var desc = o.desc || o.description || ((o.title && o.label && o.title !== o.label) ? o.label : questLinked(o));
    var img = safeUrl(o.image_url || o.image);
    return '<button type="button" class="qcard t-' + T.key + (picked ? ' is-picked' : '') + '" role="checkbox" aria-checked="' + (picked ? 'true' : 'false') + '" data-action="quest-pick" data-idx="' + i + '" style="--i:' + i + '">' +
      '<span class="qc-frame">' +
      '<span class="qc-art">' + mascot(questCardPose(o, t), 104, { deco: true }) +
      (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') +
      '<span class="qc-tag">NICC</span></span>' +
      '<span class="qc-body"><span class="qc-title">' + esc(title) + '</span>' + (desc ? '<span class="qc-desc">' + esc(desc) + '</span>' : '') + '</span>' +
      '<span class="qc-check" aria-hidden="true">' + (picked ? questBadgeHtml(q, rank) : '') + '</span></span></button>';
  }
  function questHintText(q) {
    var n = qNeed(q);
    if (qAvoid(q)) return 'ตัดทิ้ง ' + n + ' ใบที่ “ไม่ใช่” คุณที่สุด';
    return n > 1 ? 'เลือก ' + n + ' ใบที่ใช่ที่สุด — ใบแรกคือใบโปรด' : 'แตะการ์ดที่ใช่ตัวคุณที่สุด 1 ใบ';
  }
  function questPickHtml(deck) {
    var s = questState(), n = deck.length, q = deck[s.round], cur = qPicks(s, s.round), need = qNeed(q);
    var pct = Math.round(((s.round + (cur.length >= need ? 1 : 0)) / n) * 100), themes = questRoundThemes(q), st = questStages(deck);
    var stageNo = st.idx[s.round], stageName = st.names[stageNo], pips = '', i;
    for (i = 0; i < n; i++) pips += '<i class="' + (i < s.round ? 'done' : (i === s.round ? 'now' : '')) + '"></i>';
    var chip = (st.names.length > 1 || stageName)
      ? '<span class="q-stage' + (qAvoid(q) ? ' is-avoid' : '') + '">ด่านที่ ' + (stageNo + 1) + '/' + st.names.length + (stageName ? ' • ' + esc(stageName) : '') + '</span>' : '';
    return '<section class="quest quest-pick" aria-labelledby="qh">' +
      '<div class="q-top">' + chip + '<b class="q-round">รอบที่ ' + (s.round + 1) + ' จาก ' + n + '</b><span class="q-pips" aria-hidden="true">' + pips + '</span>' + sampleBadge(q) + '</div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="q-meter" id="qmeter" aria-label="โปรไฟล์ความสนใจของคุณ ณ ตอนนี้">' + questMeterHtml() + '</div>' +
      '<h2 id="qh" tabindex="-1">' + esc(q.question) + '</h2>' +
      '<div class="q-coach"><span class="qco-face">' + mascot('head', 44, { deco: true }) + '</span><p class="qco-say" id="qsay">' + esc(questHintText(q)) + '</p></div>' +
      '<div class="qgrid' + (qAvoid(q) ? ' is-avoid' : '') + (cur.length ? ' has-pick' : '') + (cur.length >= need ? ' is-done' : '') + '" id="qgrid" role="group" aria-labelledby="qh">' +
      q.options.map(function (o, idx) { return questCardHtml(q, o, idx, themes[idx], cur.indexOf(idx)); }).join('') + '</div>' +
      '<div class="q-foot">' +
      (s.round > 0 ? '<button type="button" class="btn btn-ghost" data-action="quest-prev">' + icon('back', 'sm') + 'ย้อนกลับ</button>' : '<span></span>') +
      '<button type="button" class="btn btn-quiet q-reset" data-action="quest-restart">เริ่มใหม่</button></div></section>';
  }
  function questThinkHtml(n) {
    return '<section class="quest quest-think" role="status" aria-live="polite">' + mascot('thinking', 150, { float: true, deco: true }) +
      '<h2>น้องนิคกำลังวิเคราะห์ให้คุณ…</h2>' +
      '<ul class="qsteps"><li style="--d:0s">รวมคะแนนจากการ์ดทั้ง ' + n + ' รอบ</li><li style="--d:.8s">เทียบกับรหัสความสนใจ (RIASEC) ของแต่ละสาขา</li><li style="--d:1.6s">จัดอันดับและเตรียมการ์ดผลลัพธ์</li></ul>' +
      '<span class="qdots" aria-hidden="true"><i></i><i></i><i></i></span></section>';
  }
  function questBandText(pct) { return pct >= 80 ? 'ตรงมาก' : pct >= 65 ? 'ตรง' : pct >= 50 ? 'พอไปได้' : 'ลองพิจารณา'; }
  function questConfidence(r) {
    var a = r.ranked[0], b = r.ranked[1];
    if (!b) return { k: 'high', t: 'ผลชี้ไปที่สาขานี้ค่อนข้างชัดเจน' };
    var gap = a.pct - b.pct;
    if (gap >= 8) return { k: 'high', t: 'ผลชี้ไปที่สาขานี้ค่อนข้างชัดเจน (นำสาขารองอยู่ ' + gap + ' คะแนน)' };
    if (gap >= 3) return { k: 'mid', t: 'สาขานี้นำอยู่เล็กน้อย ควรดู “' + b.p.name + '” ประกอบด้วย' };
    return { k: 'low', t: 'สาขานี้กับ “' + b.p.name + '” คะแนนสูสีกันมาก แนะนำให้ลองเรียนรู้ทั้งสองสาขา (เข้าชมหรือลองทำจริง) ก่อนตัดสินใจ' };
  }
  function questPersonaHtml(r) {
    var pf = r.profile, top = pf.top;
    if (!top.length) return '';
    var title = QUEST_TYPES[top[0]].short + (top[1] ? ' × ' + QUEST_TYPES[top[1]].short : '');
    var clear = pf.sum && (pf.vec[top[0]] / pf.sum >= 0.3);
    var bars = pf.order.map(function (L) {
      var T = QUEST_TYPES[L], w = pf.max ? Math.round(pf.vec[L] / pf.max * 100) : 0;
      return '<div class="qbar t-' + T.theme + '"><span class="qb-l"><b>' + L + '</b> ' + esc(T.name) + '</span><span class="qb-track"><i style="width:' + w + '%"></i></span><span class="qb-v">' + w + '</span></div>';
    }).join('');
    return '<article class="qpersona"><div class="qp-art">' + mascot('assistant', 120, { float: true, deco: true }) + '</div>' +
      '<div class="qp-body"><span class="qbadge">ไทป์ความสนใจของคุณ</span><h3>' + esc(title) + '</h3>' +
      '<div class="qp-code" aria-label="รหัสความสนใจ">' + top.join(' · ') + '</div>' +
      '<p>' + esc(QUEST_TYPES[top[0]].desc) + (top[1] ? ' และ' + esc(QUEST_TYPES[top[1]].desc.replace(/^ชอบ/, 'ชอบ')) : '') + '</p>' +
      '<p class="qp-note">โปรไฟล์ของคุณ' + (clear ? 'ค่อนข้างชัดเจน' : 'หลากหลาย ผสมผสานหลายด้าน') + '</p>' +
      '<div class="qbars" role="img" aria-label="คะแนนความสนใจ 6 ด้าน">' + bars + '</div></div></article>';
  }
  function questResultHtml() {
    var r = questScore(), deck = questDeck();
    if (!r.ranked.length) {
      return '<section class="quest quest-result" aria-labelledby="qh"><div class="q-empty">' + mascot('empty', 120, { deco: true }) +
        '<h2 id="qh" tabindex="-1">ยังไม่พบสาขาที่ผูกกับการ์ดที่เลือก</h2><p>ข้อมูลการจับคู่อาจยังไม่ครบ ลองเล่นอีกครั้ง ดูหลักสูตรทั้งหมด หรือสอบถามน้องนิคได้เลย</p>' +
        '<div class="btn-row" style="justify-content:center">' +
        '<button type="button" class="btn btn-accent" data-action="quest-replay">' + icon('back', 'sm') + 'เล่นใหม่</button>' +
        navBtn('programs', 'ดูหลักสูตรทั้งหมด', 'btn-ghost', 'programs') + '</div></div></section>';
    }
    var top = r.ranked[0], p = top.p, dept = deptById(p.department_id), pose = questProgPose(p) || 'success';
    var T = QUEST_THEMES[0], dIdx = (D().departments || []).indexOf(dept);
    T = QUEST_THEMES[dIdx >= 0 ? dIdx % QUEST_THEMES.length : 0];
    var img = safeUrl(dept && dept.image_url), conf = questConfidence(r);
    var ask = 'อยากรู้เรื่องสาขา ' + p.name + (p.level ? ' (' + p.level + ')' : '') + ' เรียนอะไรบ้าง จบแล้วทำงานอะไรได้ และสมัครอย่างไร';
    var userTop = r.profile.top, match = (top.code || '').split('').filter(function (L) { return userTop.indexOf(L) >= 0; });
    var reasons = [];
    if (match.length) reasons.push('รหัสความสนใจของสาขา (' + top.code.split('').join('·') + ') ตรงกับไทป์ของคุณด้าน ' + match.map(function (L) { return QUEST_TYPES[L].name; }).join(' และ '));
    if (top.rounds) reasons.push('มีการ์ดที่คุณเลือกชี้มาสาขานี้ ' + top.rounds + ' ใบ เช่น “' + top.why.slice(0, 3).map(esc).join('” “') + '”');
    var warn = top.dumped.length ? '<div class="q-warn">' + icon('warning', 'sm') + '<span><b>ข้อควรคิด:</b> คุณตัดการ์ด “' + top.dumped.slice(0, 2).map(esc).join('” “') + '” ซึ่งเกี่ยวข้องกับสาขานี้ ลองทบทวนก่อนตัดสินใจ</span></div>' : '';
    var hero = '<article class="qhero t-' + T.key + '"><div class="qh-frame">' +
      '<div class="qh-art">' + mascot(pose, 150, { deco: true, confetti: true }) + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '<span class="qc-tag">อันดับ 1</span></div>' +
      '<div class="qh-body"><span class="qbadge qbadge-gold">สาขาที่แนะนำสำหรับคุณ</span>' +
      '<div class="meta-row">' + (dept ? '<span class="badge">' + esc(dept.name) + '</span>' : '') + (p.level ? '<span class="badge badge-muted">' + esc(p.level) + '</span>' : '') + sampleBadge(p) + '</div>' +
      '<div class="qh-title"><h2 id="qh" tabindex="-1">' + esc(p.name) + '</h2>' +
      '<div class="qring" style="--p:' + top.pct + '" role="img" aria-label="ความสอดคล้อง ' + top.pct + ' เปอร์เซ็นต์"><b>' + top.pct + '%</b><small>' + questBandText(top.pct) + '</small></div></div>' +
      (p.description ? '<p class="qh-desc">' + esc(p.description) + '</p>' : '') +
      '<div class="reason"><b>ทำไมจึงแนะนำ:</b><ul>' + reasons.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '<div class="q-conf is-' + conf.k + '">' + icon(conf.k === 'low' ? 'warning' : 'success', 'sm') + '<span>' + esc(conf.t) + '</span></div>' + warn +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-action="program" data-id="' + esc(p.id) + '">' + icon('programs', 'sm') + 'ดูหลักสูตร</button>' +
      '<button type="button" class="btn btn-accent" data-action="ask-about" data-text="' + esc(ask) + '">' + icon('chat', 'sm') + 'ถามน้องนิคเรื่องสาขานี้</button>' +
      '<button type="button" class="btn btn-ghost" data-action="quest-replay">' + icon('back', 'sm') + 'เล่นใหม่</button></div></div></div></article>';
    var rest = r.ranked.slice(1, 1 + QUEST_ALTS), alts = '';
    if (rest.length) {
      alts = '<h3 class="q-sub">สาขารองที่น่าสนใจ</h3><div class="qminis">' + rest.map(function (x) {
        var d = deptById(x.p.department_id), di = (D().departments || []).indexOf(d), t = QUEST_THEMES[di >= 0 ? di % QUEST_THEMES.length : 0];
        return '<article class="qmini t-' + t.key + '"><span class="qm-ico">' + mascot(questProgPose(x.p) || 'welcome', 64, { deco: true }) + '</span><div class="qm-body">' +
          '<div class="meta-row">' + (d ? '<span class="badge">' + esc(d.name) + '</span>' : '') + (x.p.level ? '<span class="badge badge-muted">' + esc(x.p.level) + '</span>' : '') + '</div><h4>' + esc(x.p.name) + '</h4>' +
          '<div class="qm-pct"><span class="qb-track"><i style="width:' + x.pct + '%"></i></span><b>' + x.pct + '%</b></div></div>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="program" data-id="' + esc(x.p.id) + '">ดูหลักสูตร' + icon('forward', 'sm') + '</button></article>';
      }).join('') + '</div>';
    }
    var tips = '<div class="q-tips"><h3>ก่อนตัดสินใจ</h3><ol>' + QUEST_TIPS.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
    return '<section class="quest quest-result" aria-labelledby="qh">' + questPersonaHtml(r) + hero + alts + tips +
      '<p class="q-note">ตอบ ' + r.answered + ' จาก ' + r.total + ' รอบ' + (r.level ? ' • ระดับ ' + esc(r.level) : '') + ' • ผลเป็นข้อเสนอแนะเบื้องต้นจากความสนใจ ไม่ใช่การประเมินความสามารถ</p></section>';
  }

  /* ---------- ตัวควบคุมหลัก (แทนชื่อเดิม renderCareerBody; ของเดิมคือ renderCareerClassic) ---------- */
  function renderCareerBody() {
    var box = $('#career-body');
    if (!box) return;
    var s = questState(), deck = questDeck();
    if (s.mode !== 'quest' || !deck.length) {
      renderCareerClassic();
      if (deck.length) box.insertAdjacentHTML('afterbegin', questSwitchBar(true));
      return;
    }
    if (s.round >= deck.length || s.round < 0) { s.round = 0; s.picks = []; }
    if (s.step === 'processing' && !s.thinkTimer) questThink();
    if (s.step === 'result' && !s.picks.length) s.step = 'intro';
    box.innerHTML = s.step === 'pick' ? questPickHtml(deck)
      : s.step === 'processing' ? questThinkHtml(deck.length)
      : s.step === 'result' ? questResultHtml()
      : questIntroHtml(deck.length, deck);
  }
  function questFocus(scrollTop) {
    var h = $('#qh'), box = $('#career-body');
    try { if (h) h.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    if (scrollTop && box) {
      var top = box.getBoundingClientRect().top;
      if (top < 0) { try { window.scrollTo(0, window.pageYOffset + top - 80); } catch (e) { /* ignore */ } }
    }
  }
  function questShow(scrollTop) {
    if (state.page !== 'career') return;
    renderCareerBody();
    questFocus(scrollTop);
  }
  function questThink() {
    var s = questState();
    clearTimeout(s.thinkTimer);
    s.thinkTimer = setTimeout(function () {
      if (state.quest !== s) return;
      s.thinkTimer = 0;
      if (s.step === 'processing') { s.step = 'result'; questShow(true); }
    }, QUEST_THINK_MS);
  }
  function questStart(level) {
    questClearTimers();
    state.quest = freshQuest('quest', 'pick', level);
    questShow(true);
  }
  /* อัปเดตการ์ด/มิเตอร์/คำพูดน้องนิคทันทีที่แตะ โดยไม่วาดหน้าใหม่ (ลื่นบน iPad) */
  function questPaint(q, cur, cheer) {
    var grid = $('#qgrid'), need = qNeed(q);
    if (grid) {
      grid.classList.toggle('has-pick', cur.length > 0);
      grid.classList.toggle('is-done', cur.length >= need);
      $$('.qcard', grid).forEach(function (c, i) {
        var rank = cur.indexOf(i), on = rank >= 0, chk = c.querySelector('.qc-check');
        c.classList.toggle('is-picked', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
        if (chk) chk.innerHTML = on ? questBadgeHtml(q, rank) : '';
      });
    }
    var m = $('#qmeter'); if (m) m.innerHTML = questMeterHtml();
    var say = $('#qsay');
    if (say) say.textContent = cheer ? cheer : (cur.length ? 'เลือกแล้ว ' + cur.length + ' จาก ' + need + ' ใบ' : questHintText(q));
  }
  function questPick(idx) {
    var s = questState(), q = questDeck()[s.round];
    if (s.step !== 'pick' || s.lock || !q || !q.options[idx]) return;
    var need = qNeed(q), cur = s.picks[s.round] = qPicks(s, s.round), pos = cur.indexOf(idx), cheer = '';
    if (pos >= 0) { cur.splice(pos, 1); }
    else {
      if (cur.length >= need) cur.shift();
      cur.push(idx);
      var pool = qAvoid(q) ? QUEST_CHEERS_AVOID : QUEST_CHEERS;
      cheer = cur.length >= need ? pool[(s.round + idx) % pool.length] : '';
    }
    s.picks.length = s.round + 1;
    questPaint(q, cur, cheer);
    clearTimeout(s.pickTimer);
    if (cur.length >= need) {
      s.lock = true;
      s.pickTimer = setTimeout(function () {
        if (state.quest !== s) return;
        s.pickTimer = 0; s.lock = false;
        if (s.round + 1 >= questDeck().length) { s.step = 'processing'; questThink(); } else { s.round++; }
        questShow(true);
      }, QUEST_PICK_DELAY);
    }
  }
  function questPrev() {
    var s = questState();
    if (s.step !== 'pick' || s.round <= 0) return;
    clearTimeout(s.pickTimer); s.pickTimer = 0; s.lock = false;
    s.round--;
    s.picks.length = s.round + 1;
    questShow(false);
  }
  function questRestart(step) {
    var lv = (step === 'pick' && state.quest) ? state.quest.level : '';
    questClearTimers();
    state.quest = freshQuest('quest', step || 'intro', lv);
    questShow(true);
  }

  /* ---------- Kiosk: รีเซ็ตเกม/หน้าเว็บเมื่อระบบสั่งหรือไม่มีการใช้งาน ----------
   * ทางที่ระบบภายนอกสั่งรีเซ็ตได้:
   *   1) document.dispatchEvent(new CustomEvent('nicc:kiosk-reset'))   → รีเซ็ตทุกอย่างและกลับหน้าหลัก
   *   2) window.NICCKiosk.reset()                                      → เหมือนข้อ 1
   *   3) window.NICCKiosk.resetQuest()                                 → รีเซ็ตเฉพาะเกม
   * ตั้งเวลาไม่มีการใช้งานอัตโนมัติ (ไม่บังคับ): ชีต Settings คีย์ kiosk_idle_seconds (≥ 15) หรือ window.NICC_KIOSK_IDLE_SEC
   */
  var kiosk = { bound: false, timer: 0 };
  function resetQuest() {
    questClearTimers();
    state.quest = freshQuest();
    if (state.page === 'career') renderCareerBody();
  }
  function kioskReset() {
    questClearTimers();
    state.quest = freshQuest();
    state.career = { i: 0, answers: [], done: false };
    state.programs = { q: '', dept: '', level: '' };
    state.newsCat = '';
    state.chat = { messages: [], busy: false, sessionId: makeSession(), prefill: '' };
    closeModal(); abortListening(); stopSpeaking();
    navigate('home', {}, { push: false });
  }
  function kioskSeconds() {
    var v = Number(window.NICC_KIOSK_IDLE_SEC || (D().settings || {}).kiosk_idle_seconds);
    return v >= 15 ? Math.min(v, 3600) : 0;
  }
  function kioskArm() {
    clearTimeout(kiosk.timer);
    var sec = kioskSeconds();
    if (sec) kiosk.timer = setTimeout(kioskIdle, sec * 1000);
  }
  function kioskIdle() {
    var untouched = state.page === 'home' && !state.chat.messages.length && questState().step === 'intro' && !$('.modal');
    if (!untouched) {
      try { document.dispatchEvent(new CustomEvent('nicc:kiosk-reset', { detail: { reason: 'idle' } })); } catch (e) { kioskReset(); }
    }
    kioskArm();
  }
  function setupKiosk() {
    if (!kiosk.bound) {
      kiosk.bound = true;
      document.addEventListener('nicc:kiosk-reset', kioskReset);
      ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, kioskArm, { passive: true }); });
      window.addEventListener('pageshow', function (e) { if (e.persisted) resetQuest(); });   // กลับมาจาก bfcache
      window.NICCKiosk = { reset: kioskReset, resetQuest: resetQuest };
    }
    kioskArm();
  }

  /* ---------- สมัครเรียน: ภาพประกาศ + ตัวอย่างเอกสาร ---------- */
  /* ลิงก์ Google Drive / Docs → ลิงก์ฝังดูในหน้าเว็บ (preview) และลิงก์ดาวน์โหลด */
  function driveInfo(url) {
    var u = safeUrl(url), m;
    if (!u) return null;
    m = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(u) || /drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/.exec(u);
    if (m) return { embed: 'https://drive.google.com/file/d/' + m[1] + '/preview', download: 'https://drive.google.com/uc?export=download&id=' + m[1] };
    m = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]+)/.exec(u);
    if (m) {
      var base = 'https://docs.google.com/' + m[1] + '/d/' + m[2];
      return { embed: base + (m[1] === 'presentation' ? '/embed' : '/preview'), download: base + '/export?format=pdf' };
    }
    return null;
  }
  function sampleLinks(url) {
    var u = safeUrl(url), d = driveInfo(u);
    if (!u) return { open: '', embed: '', download: '' };
    if (d) return { open: u, embed: d.embed, download: d.download };
    var pdf = /\.pdf(?:[?#]|$)/i.test(u);
    return { open: u, embed: pdf ? u : '', download: /\.(pdf|docx?|xlsx?|pptx?)(?:[?#]|$)/i.test(u) ? u : '' };
  }
  function zoomViewerHtml(url, title) {
    return '<div class="zoom-box" id="zoom-box"><img class="zoom-img" src="' + esc(url) + '" alt="' + esc(title || '') + '" referrerpolicy="no-referrer"></div>' +
      '<div class="zoom-bar"><button type="button" class="btn btn-ghost btn-sm" data-action="img-zoom" aria-pressed="false">' + icon('search', 'sm') + 'ขยาย / ย่อภาพ</button><span class="small muted">แตะปุ่มเพื่อขยาย แล้วเลื่อนดูรายละเอียด</span></div>';
  }
  function openRoundImage(id) {
    var r = null;
    D().admissions.forEach(function (x) { if (String(x.id) === String(id)) r = x; });
    var img = r && imgSrc(r.image_url);
    if (!img) return;
    var apply = safeUrl(r.application_url);
    openModal('<div class="meta-row">' + (r.level ? '<span class="badge">' + esc(r.level) + '</span>' : '') +
      (r.academic_year ? '<span class="badge badge-muted">ปีการศึกษา ' + esc(r.academic_year) + '</span>' : '') + sampleBadge(r) + '</div>' +
      '<h2 id="modal-title" style="margin-top:8px">' + esc(r.title) + '</h2>' + zoomViewerHtml(img, r.title) +
      '<div class="btn-row" style="margin-top:16px">' + (apply ? '<a class="btn btn-primary" href="' + esc(apply) + '" target="_blank" rel="noopener noreferrer">สมัครเรียนรอบนี้' + icon('external', 'sm') + '</a>' : '') +
      '<a class="btn btn-ghost" href="' + esc(img) + '" target="_blank" rel="noopener noreferrer">เปิดภาพเต็ม' + icon('external', 'sm') + '</a></div>');
  }
  function docById(id) {
    var out = null;
    D().admissionDocs.forEach(function (x) { if (String(x.id) === String(id)) out = x; });
    return out;
  }
  function docHasSample(i) { return !!(safeUrl(i.image_url) || safeUrl(i.sample_url) || String(i.description || '').trim()); }
  function openDoc(id) {
    var i = docById(id);
    if (!i) return;
    var img = imgSrc(i.image_url), L = sampleLinks(i.sample_url), btns = '';
    var ask = 'ขอคำแนะนำการเตรียมเอกสาร ' + i.item + (i.level ? ' (ระดับ ' + i.level + ')' : '') + ' สำหรับสมัครเรียน';
    if (L.open) btns += '<a class="btn btn-primary" href="' + esc(L.open) + '" target="_blank" rel="noopener noreferrer">เปิดไฟล์ตัวอย่าง' + icon('external', 'sm') + '</a>';
    if (L.download) btns += '<a class="btn btn-ghost" href="' + esc(L.download) + '" target="_blank" rel="noopener noreferrer">ดาวน์โหลด' + icon('upload', 'sm') + '</a>';
    btns += '<button type="button" class="btn btn-accent" data-action="ask-about" data-text="' + esc(ask) + '">' + icon('chat', 'sm') + 'ถามน้อง NICC</button>';
    openModal('<div class="meta-row"><span class="badge">' + esc(i.level || 'ทั่วไป') + '</span><span class="badge badge-muted">เอกสารสมัครเรียน</span>' + sampleBadge(i) + '</div>' +
      '<h2 id="modal-title" style="margin-top:8px">' + esc(i.item) + '</h2>' +
      (i.description ? rich(i.description) : '') +
      (img ? '<h3>ภาพตัวอย่างเอกสาร</h3>' + zoomViewerHtml(img, 'ตัวอย่าง ' + i.item) : '') +
      (L.embed ? '<h3>ไฟล์ตัวอย่าง</h3><iframe class="doc-frame" src="' + esc(L.embed) + '" title="ตัวอย่าง ' + esc(i.item) + '" loading="lazy" referrerpolicy="no-referrer" allow="fullscreen"></iframe>' +
        '<p class="small muted">หากไฟล์ไม่แสดง ให้กด “เปิดไฟล์ตัวอย่าง”</p>' : '') +
      (!img && !L.open && !i.description ? '<p class="muted">ยังไม่มีตัวอย่างสำหรับเอกสารนี้ โปรดสอบถามเจ้าหน้าที่</p>' : '') +
      '<div class="btn-row" style="margin-top:16px">' + btns + '</div>');
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
          items.map(function (i) {
            var im = imgSrc(i.image_url), has = docHasSample(i), view = (im || safeUrl(i.sample_url)) ? 'ดูตัวอย่าง' : 'ดูรายละเอียด';
            return '<li class="doc-row">' + (im
              ? '<button type="button" class="doc-thumb" data-action="doc-sample" data-id="' + esc(i.id) + '" aria-label="ดูตัวอย่าง ' + esc(i.item) + '"><img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></button>'
              : icon('success', 'sm')) +
              '<span class="doc-main"><span>' + esc(i.item) + ' ' + sampleBadge(i) + '</span>' + (i.description ? '<small class="doc-desc">' + esc(String(i.description).split(/\r?\n/)[0]) + '</small>' : '') + '</span>' +
              (has ? '<button type="button" class="btn btn-ghost btn-sm doc-btn" data-action="doc-sample" data-id="' + esc(i.id) + '">' + icon('search', 'sm') + view + '</button>' : '') + '</li>';
          }).join('') + '</ul></div>';
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
    sendRobotEmotion(m.reaction || 'idle');
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
      case 'img-view': openRoundImage(el.getAttribute('data-id')); break;
      case 'doc-sample': openDoc(el.getAttribute('data-id')); break;
      case 'img-zoom':
        var zb = $('#zoom-box');
        if (zb) { var zoomed = zb.classList.toggle('is-zoom'); el.setAttribute('aria-pressed', zoomed ? 'true' : 'false'); }
        break;
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
        if (state.career.i >= classicQs().length - 1) state.career.done = true; else state.career.i++;
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
      /* ---- NICC Card Quest ---- */
      case 'quest-start': questStart(el.getAttribute('data-level') || ''); break;
      case 'quest-pick': questPick(Number(el.getAttribute('data-idx'))); break;
      case 'quest-prev': questPrev(); break;
      case 'quest-restart': questRestart('intro'); break;
      case 'quest-replay': questRestart('pick'); break;
      case 'quest-classic': questClearTimers(); questState().mode = 'classic'; renderCareerBody(); break;
      case 'quest-mode': questClearTimers(); state.quest = freshQuest('quest', 'intro'); renderCareerBody(); break;
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
