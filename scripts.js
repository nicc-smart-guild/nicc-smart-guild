<script>
(function () {
  'use strict';

  // กัน Boot ซ้ำ หากไฟล์นี้ถูกโหลดมากกว่าหนึ่งครั้ง
  if (window.__NICC_APP__) {
    return;
  }
  window.__NICC_APP__ = true;

  /* ==========================================================
   * 1. CONSTANTS & STATE
   * ========================================================== */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PAGES = ['home', 'chat', 'programs', 'career', 'admissions', 'parent', 'news', 'about', 'contact', 'more'];
  const BOTTOM_NAV_KEYS = ['home', 'chat', 'programs', 'news', 'more'];
  const MAX_MESSAGES = 100;
  const AI_TIMEOUT_MS = 45000;
  const BOOT_TIMEOUT_MS = 40000;

  // คีย์ใน Settings ที่ใช้เก็บ URL ภาพมาสคอตแต่ละท่า (ไม่มี = ใช้ mascotImageUrl)
  const MASCOT_KEYS = {
    head: 'mascotHeadUrl',
    wave: 'mascotWaveUrl',
    point: 'mascotPointUrl',
    tablet: 'mascotTabletUrl',
    idea: 'mascotIdeaUrl',
    cheer: 'mascotCheerUrl'
  };

  const PHOTO_KEYS = {
    campus: 'campusImageUrl',
    parent: 'parentImageUrl'
  };

  const CONTACT_ICONS = {
    phone: 'i-contact',
    email: 'i-mail',
    address: 'i-map',
    hours: 'i-calendar',
    facebook: 'i-globe',
    line: 'i-globe',
    website: 'i-globe'
  };

  const state = {
    loading: false,
    booted: false,
    page: '',
    navStack: [],
    settings: {},
    sources: {},
    config: {},
    programs: [],
    news: [],
    contacts: [],
    programQuery: '',
    programCategory: '',
    busy: false,
    requestId: 0,
    lastQuestion: '',
    sessionId: '',
    sheetTrigger: null,
    toastTimer: 0,
    career: { questions: [], types: [], index: 0, answers: {}, busy: false, result: null, cardBlob: null, cardUrl: '' }
  };

  /* ==========================================================
   * 2. DOM & DATA HELPERS (ไม่ใช้ innerHTML กับข้อมูลภายนอก)
   * ========================================================== */

  function byId(id) {
    return document.getElementById(id);
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function toText(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  function clearNode(node) {
    if (!node) {
      return;
    }
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    node.removeAttribute('aria-busy');
  }

  function el(tag, options, children) {
    const node = document.createElement(tag);
    const opts = options || {};
    if (opts.className) {
      node.className = opts.className;
    }
    if (opts.text !== undefined) {
      node.textContent = opts.text;
    }
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (name) {
        node.setAttribute(name, opts.attrs[name]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) {
        node.appendChild(child);
      }
    });
    return node;
  }

  // ไอคอนจาก SVG sprite ของ NICC (SvgIcons.html)
  function svgUse(symbolId, className) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    const use = document.createElementNS(SVG_NS, 'use');
    svg.setAttribute('class', className || 'ic');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', '#' + symbolId);
    svg.appendChild(use);
    return svg;
  }

  // รับเฉพาะ https เพราะหน้าเว็บเป็น https (กัน mixed content และ javascript:)
  function httpsUrl(value) {
    const text = toText(value);
    return /^https:\/\//i.test(text) ? text : '';
  }

  function safeContactHref(value) {
    const href = toText(value);
    if (/^tel:\+?[0-9]{5,15}$/.test(href)) {
      return href;
    }
    if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) {
      return href;
    }
    return httpsUrl(href);
  }

  function pad(number) {
    return number < 10 ? '0' + number : String(number);
  }

  function nowTime() {
    const now = new Date();
    return pad(now.getHours()) + ':' + pad(now.getMinutes());
  }

  function isMock(sourceKey) {
    return state.sources[sourceKey] === 'mock';
  }

  function isDesktop() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  /* ==========================================================
   * 3. SERVER BRIDGE (google.script.run)
   * ========================================================== */

  function callServer(functionName, args, onSuccess, onFailure) {
    try {
      const runner = google.script.run
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onFailure);
      runner[functionName].apply(runner, args);
    } catch (error) {
      onFailure(error);
    }
  }

  /* ==========================================================
   * 4. NORMALIZERS (ตรวจโครงสร้างข้อมูลก่อน render)
   * ========================================================== */

  function normalizeProgram(raw, index) {
    if (!isObject(raw) || !toText(raw.name)) {
      return null;
    }
    return {
      id: toText(raw.id) || 'p' + index,
      name: toText(raw.name),
      category: toText(raw.category),
      level: toText(raw.level),
      description: toText(raw.description),
      careers: Array.isArray(raw.careers) ? raw.careers.map(toText).filter(Boolean) : [],
      imageUrl: httpsUrl(raw.imageUrl),
      duration: toText(raw.duration),
      popular: raw.popular === true
    };
  }

  function normalizeNews(raw, index) {
    if (!isObject(raw) || !toText(raw.title)) {
      return null;
    }
    return {
      id: toText(raw.id) || 'n' + index,
      title: toText(raw.title),
      dateText: toText(raw.dateText),
      category: toText(raw.category),
      summary: toText(raw.summary),
      imageUrl: httpsUrl(raw.imageUrl),
      linkUrl: httpsUrl(raw.linkUrl)
    };
  }

  function normalizeContact(raw, index) {
    if (!isObject(raw) || !toText(raw.type) || !toText(raw.value)) {
      return null;
    }
    return {
      id: toText(raw.id) || 'c' + index,
      type: toText(raw.type).toLowerCase(),
      label: toText(raw.label),
      value: toText(raw.value),
      note: toText(raw.note),
      href: safeContactHref(raw.href)
    };
  }

  function normalizeCareerQuestion(raw, index) {
    if (!isObject(raw) || !toText(raw.text) || !toText(raw.type)) {
      return null;
    }
    return { id: toText(raw.id) || 'q' + index, type: toText(raw.type), text: toText(raw.text) };
  }

  function normalizeCareerType(raw) {
    if (!isObject(raw) || !toText(raw.code)) {
      return null;
    }
    return { code: toText(raw.code), nameTh: toText(raw.nameTh), title: toText(raw.title) };
  }

  function toList(value, normalizer) {
    return (Array.isArray(value) ? value : []).map(normalizer).filter(Boolean);
  }

  /* ==========================================================
   * 5. BRAND ASSETS (มาสคอต โลโก้ ภาพถ่าย จาก Settings)
   * ========================================================== */

  function applyMascots(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-mascot]').forEach(function (slot) {
      const img = slot.querySelector('.mascot-img');
      if (!img) {
        return;
      }
      const pose = slot.getAttribute('data-mascot');
      const url = httpsUrl(state.settings[MASCOT_KEYS[pose]]) || httpsUrl(state.settings.mascotImageUrl);
      if (!url || img.getAttribute('src') === url) {
        return;
      }
      img.onload = function () {
        img.hidden = false;
      };
      img.onerror = function () {
        img.hidden = true;
        img.removeAttribute('src');
      };
      img.src = url;
    });
  }

  function applyPhotos() {
    document.querySelectorAll('[data-photo]').forEach(function (slot) {
      const img = slot.querySelector('img');
      const url = httpsUrl(state.settings[PHOTO_KEYS[slot.getAttribute('data-photo')]]);
      if (!img || !url) {
        return;
      }
      img.onload = function () {
        img.hidden = false;
      };
      img.onerror = function () {
        img.hidden = true;
      };
      img.src = url;
    });
  }

  function applyBrand() {
    const img = byId('brandImg');
    const fallback = byId('brandFallback');
    const url = httpsUrl(state.settings.logoUrl);
    if (!img || !fallback || !url) {
      return;
    }
    img.onload = function () {
      img.hidden = false;
      fallback.hidden = true;
    };
    img.onerror = function () {
      img.hidden = true;
      fallback.hidden = false;
    };
    img.src = url;
  }

  // ผูกข้อความจาก Settings กับ [data-bind] (ไม่มีค่า = คงข้อความเริ่มต้นไว้ หรือซ่อนถ้ามี data-hide-empty)
  function applyBindings() {
    document.querySelectorAll('[data-bind]').forEach(function (node) {
      const value = toText(state.settings[node.getAttribute('data-bind')]);
      const hideWhenEmpty = node.hasAttribute('data-hide-empty');
      if (value) {
        node.textContent = value;
        if (hideWhenEmpty) {
          node.hidden = false;
        }
      } else if (hideWhenEmpty) {
        node.hidden = true;
      }
    });
  }

  function applySourceStatus() {
    const values = Object.keys(state.sources).map(function (key) {
      return state.sources[key];
    });
    const mockCount = values.filter(function (value) {
      return value === 'mock';
    }).length;

    const banner = byId('demoBanner');
    if (banner) {
      banner.hidden = mockCount === 0;
    }

    const version = byId('appVersion');
    if (version && toText(state.config.version)) {
      version.textContent = 'v' + toText(state.config.version);
    }

    const source = byId('dataSource');
    if (source) {
      if (mockCount === 0) {
        source.textContent = '· ข้อมูลจาก Google Sheets';
      } else if (mockCount === values.length) {
        source.textContent = '· ข้อมูลตัวอย่างทั้งหมด';
      } else {
        source.textContent = '· บางส่วนเป็นข้อมูลตัวอย่าง';
      }
    }
  }

  /* ==========================================================
   * 6. STATES (Loading / Empty / Error) จาก <template> ใน Index.html
   * ========================================================== */

  function cloneTemplate(templateId) {
    const template = byId(templateId);
    return template && template.content ? template.content.cloneNode(true) : null;
  }

  function showLoading(container) {
    if (!container) {
      return;
    }
    clearNode(container);
    const fragment = cloneTemplate('tplLoading');
    if (fragment) {
      container.appendChild(fragment);
      container.setAttribute('aria-busy', 'true');
    }
  }

  function renderState(container, kind, config) {
    if (!container) {
      return;
    }
    clearNode(container);
    const fragment = cloneTemplate(kind === 'error' ? 'tplError' : 'tplEmpty');
    if (!fragment) {
      return;
    }
    const node = fragment.firstElementChild;
    const options = config || {};

    function setSlot(slot, value) {
      const target = node.querySelector('[data-slot="' + slot + '"]');
      if (target && value !== undefined) {
        target.textContent = value;
      }
    }

    setSlot('title', options.title);
    setSlot('text', options.text);

    const action = node.querySelector('[data-slot="action"]');
    if (action) {
      if (options.actionLabel) {
        action.textContent = options.actionLabel;
        action.hidden = false;
        Object.keys(options.actionAttrs || {}).forEach(function (name) {
          action.setAttribute(name, options.actionAttrs[name]);
        });
      } else if (kind === 'error') {
        action.setAttribute('data-action', 'retry-bootstrap');
      } else {
        action.hidden = true;
      }
    }

    node.style.gridColumn = '1 / -1';
    applyMascots(node);
    container.appendChild(node);
  }

  function setSplash(visible) {
    const splash = byId('splash');
    if (splash) {
      splash.hidden = !visible;
    }
  }

  function setGlobalError(visible, message) {
    const box = byId('globalError');
    const text = byId('globalErrorText');
    if (text && message) {
      text.textContent = message;
    }
    if (box) {
      box.hidden = !visible;
    }
  }

  function showToast(message) {
    const toast = byId('toast');
    if (!toast) {
      return;
    }
    window.clearTimeout(state.toastTimer);
    toast.hidden = true;
    toast.textContent = message;
    void toast.offsetWidth;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3500);
  }

  /* ==========================================================
   * 7. ROUTING & NAVIGATION
   * ========================================================== */

  function updateNav(page) {
    const bottomActive = BOTTOM_NAV_KEYS.indexOf(page) >= 0 ? page : 'more';
    document.querySelectorAll('[data-nav]').forEach(function (button) {
      const key = button.getAttribute('data-nav');
      const inBottomNav = Boolean(button.closest('#bottomNav'));
      const active = inBottomNav ? key === bottomActive : key === page;
      if (active) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  function updateTopbar(page) {
    const section = document.querySelector('.page[data-page="' + page + '"]');
    const back = byId('backBtn');
    const title = byId('topbarTitle');
    const compact = page !== 'home' && !isDesktop();
    if (back) {
      back.hidden = !compact;
    }
    if (title) {
      title.hidden = !compact;
      title.textContent = section ? section.getAttribute('data-title') || '' : '';
    }
  }

  function showPage(name, options) {
    const opts = options || {};
    const target = PAGES.indexOf(name) >= 0 ? name : 'home';
    closeSheet();

    if (state.page === target) {
      return;
    }

    if (target === 'home') {
      state.navStack = [];
    } else if (state.page && !opts.fromBack) {
      state.navStack.push(state.page);
      if (state.navStack.length > 20) {
        state.navStack.shift();
      }
    }
    state.page = target;

    let activeSection = null;
    document.querySelectorAll('.page[data-page]').forEach(function (section) {
      const isActive = section.getAttribute('data-page') === target;
      section.hidden = !isActive;
      if (isActive) {
        activeSection = section;
      }
    });

    const app = byId('app');
    if (app) {
      app.setAttribute('data-current-page', target);
    }
    updateNav(target);
    updateTopbar(target);

    if (target === 'chat') {
      scrollChatToEnd();
    } else {
      window.scrollTo(0, 0);
    }

    if (activeSection && !opts.silent) {
      activeSection.setAttribute('tabindex', '-1');
      activeSection.focus({ preventScroll: true });
    }
  }

  function goBack() {
    showPage(state.navStack.pop() || 'home', { fromBack: true });
  }

  function watchViewport() {
    const query = window.matchMedia('(min-width: 1024px)');
    const refresh = function () {
      if (state.page) {
        updateTopbar(state.page);
      }
    };
    if (query.addEventListener) {
      query.addEventListener('change', refresh);
    } else if (query.addListener) {
      query.addListener(refresh);
    }
  }

  function openExternal(url, missingMessage) {
    const safe = httpsUrl(url);
    if (!safe) {
      showToast(missingMessage);
      return;
    }
    window.open(safe, '_blank', 'noopener,noreferrer');
  }

  /* ==========================================================
   * 8. DETAIL SHEET
   * ========================================================== */

  function openSheet() {
    const sheet = byId('detailSheet');
    const backdrop = byId('sheetBackdrop');
    if (!sheet || !backdrop) {
      return;
    }
    state.sheetTrigger = document.activeElement;
    backdrop.hidden = false;
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    const close = byId('sheetClose');
    if (close) {
      close.focus();
    }
  }

  function closeSheet() {
    const sheet = byId('detailSheet');
    const backdrop = byId('sheetBackdrop');
    if (!sheet || sheet.hidden) {
      return;
    }
    sheet.hidden = true;
    if (backdrop) {
      backdrop.hidden = true;
    }
    document.body.style.overflow = '';
    if (state.sheetTrigger && document.body.contains(state.sheetTrigger)) {
      state.sheetTrigger.focus();
    }
    state.sheetTrigger = null;
  }

  function badge(text, extraClass) {
    return el('span', { className: 'badge' + (extraClass ? ' ' + extraClass : ''), text: text });
  }

  function openProgramSheet(programId) {
    const program = state.programs.find(function (item) {
      return item.id === programId;
    });
    const body = byId('sheetBody');
    if (!program || !body) {
      return;
    }
    clearNode(body);

    const meta = el('div', { className: 'card-meta' });
    if (isMock('programs')) {
      meta.appendChild(badge('ตัวอย่าง'));
    }
    if (program.popular) {
      meta.appendChild(badge('ยอดนิยม', 'badge-popular'));
    }
    if (program.level) {
      meta.appendChild(badge(program.level));
    }
    if (program.category) {
      meta.appendChild(el('span', { text: program.category }));
    }

    body.appendChild(el('h3', { text: program.name }));
    body.appendChild(meta);
    body.appendChild(el('p', { text: program.description || 'ยังไม่มีรายละเอียดหลักสูตรนี้ในระบบ' }));
    if (program.duration) {
      body.appendChild(el('p', { text: 'ระยะเวลาเรียน: ' + program.duration }));
    }
    if (program.careers.length) {
      body.appendChild(el('strong', { text: 'เส้นทางอาชีพ' }));
      const careers = el('div', { className: 'card-meta' });
      program.careers.forEach(function (career) {
        careers.appendChild(badge(career));
      });
      body.appendChild(careers);
    }
    body.appendChild(el('button', {
      className: 'btn btn-primary btn-block',
      text: 'ถามน้อง NICC เรื่องสาขานี้',
      attrs: { type: 'button', 'data-prompt': 'อยากทราบรายละเอียดสาขา' + program.name }
    }));
    body.appendChild(el('button', {
      className: 'btn btn-outline btn-block',
      text: 'ดูขั้นตอนสมัครเรียน',
      attrs: { type: 'button', 'data-route': 'admissions' }
    }));
    openSheet();
  }

  function openNewsSheet(newsId) {
    const item = state.news.find(function (entry) {
      return entry.id === newsId;
    });
    const body = byId('sheetBody');
    if (!item || !body) {
      return;
    }
    clearNode(body);

    const meta = el('div', { className: 'card-meta' });
    if (isMock('news')) {
      meta.appendChild(badge('ตัวอย่าง'));
    }
    if (item.category) {
      meta.appendChild(badge(item.category));
    }
    if (item.dateText) {
      meta.appendChild(el('span', { text: item.dateText }));
    }

    body.appendChild(el('h3', { text: item.title }));
    body.appendChild(meta);
    body.appendChild(el('p', { text: item.summary || 'ยังไม่มีรายละเอียดข่าวนี้ในระบบ' }));
    if (item.linkUrl) {
      body.appendChild(el('a', {
        className: 'btn btn-primary btn-block',
        text: 'อ่านรายละเอียดเพิ่มเติม',
        attrs: { href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer' }
      }));
    }
    openSheet();
  }

  /* ==========================================================
   * 9. CARD BUILDERS
   * ========================================================== */

  function fillImagePlaceholder(box, iconId) {
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.appendChild(svgUse(iconId, 'ic ic-lg'));
  }

  function buildCardImage(url, iconId) {
    const box = el('div', { className: 'card-img' });
    if (!url) {
      fillImagePlaceholder(box, iconId);
      return box;
    }
    const img = el('img', { attrs: { alt: '', loading: 'lazy', decoding: 'async' } });
    img.onerror = function () {
      img.remove();
      fillImagePlaceholder(box, iconId);
    };
    img.src = url;
    box.appendChild(img);
    return box;
  }

  function buildProgramCard(program) {
    const meta = el('div', { className: 'card-meta' });
    if (isMock('programs')) {
      meta.appendChild(badge('ตัวอย่าง'));
    }
    if (program.popular) {
      meta.appendChild(badge('ยอดนิยม', 'badge-popular'));
    }
    if (program.level) {
      meta.appendChild(badge(program.level));
    }
    if (program.category) {
      meta.appendChild(el('span', { text: program.category }));
    }

    const body = el('div', { className: 'card-body' }, [
      el('div', { className: 'card-title', text: program.name }),
      program.description ? el('p', { className: 'card-text', text: program.description }) : null,
      meta
    ]);

    return el('button', {
      className: 'program-card',
      attrs: { type: 'button', 'data-program-id': program.id }
    }, [buildCardImage(program.imageUrl, 'i-programs'), body]);
  }

  function buildNewsCard(item) {
    const meta = el('div', { className: 'card-meta' });
    if (isMock('news')) {
      meta.appendChild(badge('ตัวอย่าง'));
    }
    if (item.category) {
      meta.appendChild(badge(item.category));
    }
    if (item.dateText) {
      meta.appendChild(el('span', { text: item.dateText }));
    }

    const body = el('div', { className: 'card-body' }, [
      el('div', { className: 'card-title', text: item.title }),
      item.summary ? el('p', { className: 'card-text', text: item.summary }) : null,
      meta
    ]);

    return el('button', {
      className: 'news-card',
      attrs: { type: 'button', 'data-news-id': item.id }
    }, [buildCardImage(item.imageUrl, 'i-news'), body]);
  }

  function buildContactCard(contact) {
    const iconBox = el('div', { className: 'card-ico' }, [
      svgUse(CONTACT_ICONS[contact.type] || 'i-info', 'ic')
    ]);
    const body = el('div', { className: 'card-body' }, [
      el('div', { className: 'card-title', text: contact.label || contact.type }),
      el('p', { className: 'card-text', text: contact.value }),
      contact.note ? el('div', { className: 'card-meta', text: contact.note }) : null
    ]);

    if (!contact.href) {
      return el('div', { className: 'contact-card' }, [iconBox, body]);
    }
    const attrs = { href: contact.href };
    if (/^https:/i.test(contact.href)) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
    }
    return el('a', { className: 'contact-card', attrs: attrs }, [iconBox, body]);
  }

  /* ==========================================================
   * 10. PAGE RENDERERS
   * ========================================================== */

  function renderHomePrograms() {
    const container = byId('homePrograms');
    if (!container) {
      return;
    }
    const heading = container.previousElementSibling;
    const featured = state.programs.filter(function (program) {
      return program.popular;
    }).slice(0, 6);

    clearNode(container);
    container.hidden = featured.length === 0;
    if (heading) {
      heading.hidden = featured.length === 0;
    }
    featured.forEach(function (program) {
      container.appendChild(buildProgramCard(program));
    });
  }

  function renderHomeNews() {
    const container = byId('homeNews');
    if (!container) {
      return;
    }
    clearNode(container);
    if (!state.news.length) {
      renderState(container, 'empty', {
        title: 'ยังไม่มีข่าวสาร',
        text: 'เมื่อวิทยาลัยเพิ่มข่าวหรือกิจกรรม จะแสดงที่นี่ครับ'
      });
      return;
    }
    state.news.slice(0, 3).forEach(function (item) {
      container.appendChild(buildNewsCard(item));
    });
  }

  function renderNewsPage() {
    const container = byId('newsList');
    if (!container) {
      return;
    }
    clearNode(container);
    if (!state.news.length) {
      renderState(container, 'empty', {
        title: 'ยังไม่มีข่าวสารและกิจกรรม',
        text: 'ลองกลับมาดูใหม่ภายหลัง หรือถามน้อง NICC ได้ครับ',
        actionLabel: 'ถามน้อง NICC',
        actionAttrs: { 'data-route': 'chat' }
      });
      return;
    }
    state.news.forEach(function (item) {
      container.appendChild(buildNewsCard(item));
    });
  }

  function renderProgramChips() {
    const container = byId('programChips');
    if (!container) {
      return;
    }
    clearNode(container);

    const categories = [];
    state.programs.forEach(function (program) {
      if (program.category && categories.indexOf(program.category) < 0) {
        categories.push(program.category);
      }
    });
    container.hidden = categories.length === 0;
    if (!categories.length) {
      return;
    }

    ['' ].concat(categories).forEach(function (category) {
      const active = state.programCategory === category;
      container.appendChild(el('button', {
        className: 'chip' + (active ? ' is-active' : ''),
        text: category || 'ทั้งหมด',
        attrs: { type: 'button', 'data-chip': category, 'aria-pressed': String(active) }
      }));
    });
  }

  function filterPrograms() {
    const query = state.programQuery.trim().toLowerCase();
    return state.programs.filter(function (program) {
      if (state.programCategory && program.category !== state.programCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [program.name, program.category, program.level, program.description]
        .concat(program.careers)
        .join(' ')
        .toLowerCase();
      return haystack.indexOf(query) >= 0;
    });
  }

  function renderPrograms() {
    const container = byId('programList');
    if (!container) {
      return;
    }
    clearNode(container);

    if (!state.programs.length) {
      renderState(container, 'empty', {
        title: 'ยังไม่มีข้อมูลหลักสูตร',
        text: 'วิทยาลัยยังไม่ได้เพิ่มหลักสูตรในระบบ ลองสอบถามน้อง NICC หรือติดต่อวิทยาลัยครับ',
        actionLabel: 'ถามน้อง NICC',
        actionAttrs: { 'data-route': 'chat' }
      });
      return;
    }

    const results = filterPrograms();
    const filtered = Boolean(state.programQuery.trim() || state.programCategory);

    if (!results.length) {
      renderState(container, 'empty', {
        title: 'ไม่พบหลักสูตรที่ค้นหา',
        text: 'ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูทั้งหมด',
        actionLabel: 'ล้างตัวกรอง',
        actionAttrs: { 'data-clear-filters': '' }
      });
      return;
    }

    if (filtered) {
      const summary = el('div', { className: 'section-head' }, [
        el('span', { className: 'caption', text: 'พบ ' + results.length + ' หลักสูตร' }),
        el('button', {
          className: 'link-btn',
          text: 'ล้างตัวกรอง',
          attrs: { type: 'button', 'data-clear-filters': '' }
        })
      ]);
      summary.style.gridColumn = '1 / -1';
      container.appendChild(summary);
    }
    results.forEach(function (program) {
      container.appendChild(buildProgramCard(program));
    });
  }

  function renderContacts() {
    const container = byId('contactList');
    const callButton = byId('callBtn');
    if (!container) {
      return;
    }
    clearNode(container);
    if (callButton) {
      callButton.hidden = true;
    }

    // ข้อมูลติดต่อตัวอย่างไม่ถูกแสดง เพื่อกันผู้ใช้โทรหรือติดต่อผิดที่
    if (isMock('contacts')) {
      renderState(container, 'empty', {
        title: 'ยังไม่มีข้อมูลช่องทางติดต่อ',
        text: 'ระบบยังไม่ได้เชื่อมข้อมูลติดต่อจริงของวิทยาลัย (ขณะนี้เป็นโหมดข้อมูลตัวอย่าง)',
        actionLabel: 'ถามน้อง NICC',
        actionAttrs: { 'data-route': 'chat' }
      });
      return;
    }
    if (!state.contacts.length) {
      renderState(container, 'empty', {
        title: 'ยังไม่มีช่องทางติดต่อ',
        text: 'วิทยาลัยยังไม่ได้เพิ่มช่องทางติดต่อในระบบ'
      });
      return;
    }

    state.contacts.forEach(function (contact) {
      container.appendChild(buildContactCard(contact));
    });

    const phone = state.contacts.find(function (contact) {
      return contact.type === 'phone' && /^tel:/.test(contact.href);
    });
    if (phone && callButton) {
      callButton.href = phone.href;
      callButton.hidden = false;
    }
  }

  function renderMap() {
    const card = byId('mapCard');
    const box = byId('mapBox');
    const button = byId('mapBtn');
    if (!card || !box || !button) {
      return;
    }
    card.hidden = true;
    button.hidden = true;
    clearNode(box);

    if (isMock('settings')) {
      return;
    }

    const lat = parseFloat(state.settings.mapLat);
    const lng = parseFloat(state.settings.mapLng);
    const validPoint = isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const customUrl = httpsUrl(state.settings.mapUrl);

    if (validPoint) {
      box.appendChild(el('iframe', {
        attrs: {
          title: 'แผนที่วิทยาลัย',
          loading: 'lazy',
          referrerpolicy: 'no-referrer-when-downgrade',
          src: 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=15&output=embed'
        }
      }));
      card.hidden = false;
    }

    const link = customUrl || (validPoint
      ? 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng
      : '');
    if (link) {
      button.href = link;
      button.hidden = false;
    }
  }

  function renderCareerUnavailable() {
    const result = byId('careerResult');
    const flow = byId('careerFlow');
    if (flow) {
      flow.hidden = true;
    }
    if (!result) {
      return;
    }
    result.hidden = false;
    renderState(result, 'empty', {
      title: 'แบบประเมินยังไม่เปิดให้ใช้งาน',
      text: 'ระบบยังไม่มีชุดคำถามแนะแนวจากวิทยาลัย ระหว่างนี้ให้น้อง NICC ช่วยแนะนำสาขาจากความสนใจของคุณได้ครับ',
      actionLabel: 'ปรึกษาน้อง NICC',
      actionAttrs: { 'data-prompt': 'อยากให้ช่วยแนะนำสาขาที่เหมาะกับความสนใจของฉัน' }
    });
  }

  /* ==========================================================
   * CAREER MATCH (Holland RIASEC) + SHARE CARD
   * ========================================================== */

  const CAREER_OPTIONS = [
    { value: 2, label: 'ชอบมาก' },
    { value: 1, label: 'พอใช้' },
    { value: 0, label: 'ไม่ค่อยชอบ' }
  ];
  const FIT_LABELS = { high: 'เข้ากันมาก', good: 'เข้ากันดี', explore: 'น่าลองดู' };
  const CARD_FONT = '"Noto Sans Thai", "Sarabun", sans-serif';

  function setCareerView(view) {
    const views = { careerIntro: 'intro', careerFlow: 'flow', careerResult: 'result' };
    Object.keys(views).forEach(function (id) {
      const node = byId(id);
      if (node) {
        node.hidden = views[id] !== view;
      }
    });
  }

  function startCareer() {
    const career = state.career;
    if (!career.questions.length || !career.types.length) {
      renderCareerUnavailable();
      return;
    }
    career.index = 0;
    career.answers = {};
    career.busy = false;
    career.result = null;
    setCareerView('flow');
    renderCareerQuestion();
  }

  function renderCareerQuestion() {
    const career = state.career;
    const total = career.questions.length;
    const question = career.questions[career.index];
    const bar = byId('careerBar');
    const progress = byId('careerProgress');
    const title = byId('careerQuestion');
    const options = byId('careerOptions');
    if (!question || !bar || !progress || !title || !options) {
      return;
    }

    bar.style.width = Math.round(career.index / total * 100) + '%';
    progress.textContent = 'ข้อ ' + (career.index + 1) + ' จาก ' + total;
    title.textContent = question.text;

    clearNode(options);
    CAREER_OPTIONS.forEach(function (option) {
      const selected = career.answers[question.id] === option.value;
      options.appendChild(el('button', {
        className: 'option' + (selected ? ' is-selected' : ''),
        text: option.label,
        attrs: { type: 'button', 'data-career-answer': String(option.value) }
      }));
    });
    options.appendChild(el('button', {
      className: 'btn btn-outline',
      text: career.index > 0 ? 'ย้อนกลับ' : 'ยกเลิก',
      attrs: { type: 'button', 'data-action': 'career-back' }
    }));
  }

  function answerCareer(value) {
    const career = state.career;
    const question = career.questions[career.index];
    const valid = CAREER_OPTIONS.some(function (option) {
      return option.value === value;
    });
    if (career.busy || !question || !valid) {
      return;
    }
    career.answers[question.id] = value;
    if (career.index < career.questions.length - 1) {
      career.index += 1;
      renderCareerQuestion();
    } else {
      submitCareer();
    }
  }

  function handleCareerBack() {
    const career = state.career;
    if (career.busy) {
      return;
    }
    if (career.index > 0) {
      career.index -= 1;
      renderCareerQuestion();
    } else {
      setCareerView('intro');
    }
  }

  function submitCareer() {
    const career = state.career;
    const options = byId('careerOptions');
    const bar = byId('careerBar');
    if (career.busy || !options) {
      return;
    }
    career.busy = true;
    if (bar) {
      bar.style.width = '100%';
    }
    showLoading(options);

    const answers = career.questions.map(function (question) {
      return { id: question.id, value: career.answers[question.id] };
    });

    callServer('getCareerResult', [answers], function (response) {
      career.busy = false;
      showCareerResult(response);
    }, function (error) {
      career.busy = false;
      console.error('[NICC] getCareerResult failed', error);
      renderState(options, 'error', {
        title: 'ประเมินผลไม่สำเร็จ',
        text: 'เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง',
        actionLabel: 'ลองอีกครั้ง',
        actionAttrs: { 'data-action': 'career-retry' }
      });
    });
  }

  function showCareerResult(response) {
    const valid = isObject(response) && response.ok === true &&
      Array.isArray(response.top) && response.top.length > 0 && Array.isArray(response.scores);
    if (!valid) {
      showToast(isObject(response) && response.message ? toText(response.message) : 'ประเมินผลไม่สำเร็จ กรุณาลองอีกครั้ง');
      renderCareerQuestion();
      return;
    }
    state.career.result = response;
    setCareerView('result');
    buildCareerResult(response);
    makeShareCard(response);
    window.scrollTo(0, 0);
  }

  function buildCareerResult(result) {
    const box = byId('careerResult');
    if (!box) {
      return;
    }
    clearNode(box);
    const sampleData = isMock('career') || isMock('programs');

    box.appendChild(el('div', { className: 'career-card-preview', attrs: { id: 'careerCardPreview' } }, [
      el('div', { className: 'spinner', attrs: { role: 'status', 'aria-label': 'กำลังสร้างการ์ด' } })
    ]));

    box.appendChild(el('h3', { text: 'สไตล์ของคุณ: ' + result.styleTitle }));
    const codes = el('div', { className: 'card-meta' });
    result.top.forEach(function (item) {
      codes.appendChild(badge(item.code + ' ' + item.nameTh, 'badge-popular'));
    });
    box.appendChild(codes);
    box.appendChild(el('p', { text: result.top[0].description }));

    box.appendChild(el('strong', { text: 'ระดับความสนใจ' }));
    result.scores.forEach(function (score) {
      const fill = el('i');
      fill.style.width = Math.max(0, Math.min(100, Number(score.pct) || 0)) + '%';
      box.appendChild(el('div', { className: 'score-row' }, [
        el('div', { className: 'caption' }, [
          el('span', { text: toText(score.nameTh) }),
          el('span', { text: (Number(score.pct) || 0) + '%' })
        ]),
        el('div', { className: 'progress' }, [fill])
      ]));
    });

    box.appendChild(el('strong', { text: 'สาขาที่น่าสนใจ' }));
    const list = el('div', { className: 'stack' });
    (Array.isArray(result.programs) ? result.programs : []).forEach(function (match) {
      const program = state.programs.find(function (item) {
        return item.id === toText(match.id);
      });
      if (!program) {
        return;
      }
      const card = buildProgramCard(program);
      const meta = card.querySelector('.card-meta');
      if (meta) {
        meta.insertBefore(badge(FIT_LABELS[match.fit] || FIT_LABELS.explore, 'badge-popular'), meta.firstChild);
      }
      list.appendChild(card);
    });
    if (list.childNodes.length) {
      box.appendChild(list);
    } else {
      box.appendChild(el('p', {
        className: 'caption',
        text: 'ยังไม่มีสาขาที่จับคู่กับผลนี้ได้ในตอนนี้ ลองให้น้อง NICC หรือครูแนะแนวช่วยแนะนำครับ'
      }));
    }

    box.appendChild(el('p', {
      className: 'caption',
      text: 'เป็นคำแนะนำเบื้องต้นจากความสนใจของคุณ ไม่ใช่ผลทดสอบวิชาชีพ ควรปรึกษาครูแนะแนวประกอบการตัดสินใจ' +
        (sampleData ? ' (ผลนี้ใช้ชุดคำถามและข้อมูลสาขาตัวอย่าง)' : '')
    }));

    box.appendChild(el('div', { className: 'btn-stack' }, [
      el('button', { className: 'btn btn-primary btn-block', text: 'แชร์การ์ดผลแนะแนว', attrs: { type: 'button', 'data-action': 'career-share' } }),
      el('button', { className: 'btn btn-outline btn-block', text: 'บันทึกการ์ดเป็นรูปภาพ', attrs: { type: 'button', 'data-action': 'career-save' } }),
      el('button', {
        className: 'btn btn-secondary btn-block',
        text: 'ให้น้อง NICC อธิบายผล',
        attrs: {
          type: 'button',
          'data-prompt': 'ผลแนะแนวของฉันคือรหัส ' + result.hollandCode + ' สไตล์' + result.styleTitle + ' ช่วยอธิบายและแนะนำสาขาที่เหมาะกับฉัน'
        }
      }),
      el('button', { className: 'btn btn-outline btn-block', text: 'ทำแบบประเมินใหม่', attrs: { type: 'button', 'data-action': 'career-restart' } })
    ]));
  }

  /* ---------- Share card (วาดด้วย Canvas ไม่ใช้ไลบรารี) ---------- */

  function ensureCardFonts() {
    if (!document.fonts || !document.fonts.load) {
      return Promise.resolve();
    }
    return Promise.all([
      document.fonts.load('800 40px "Noto Sans Thai"', 'สไตล์ก'),
      document.fonts.load('600 32px "Noto Sans Thai"', 'สไตล์ก')
    ]).catch(function () {
      return null;
    });
  }

  // โหลดมาสคอตแบบ CORS เท่านั้น ถ้าโฮสต์ไม่อนุญาตจะข้ามไป (การ์ดยังสร้างได้)
  function loadCardMascot() {
    const url = httpsUrl(state.settings.mascotCheerUrl) || httpsUrl(state.settings.mascotImageUrl);
    return new Promise(function (resolve) {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = url;
    });
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitCardText(ctx, text, maxWidth) {
    let value = text;
    if (ctx.measureText(value).width <= maxWidth) {
      return value;
    }
    while (value.length > 1 && ctx.measureText(value + '…').width > maxWidth) {
      value = value.slice(0, -1);
    }
    return value + '…';
  }

  function wrapCardText(ctx, text, maxWidth, maxLines) {
    const tokens = (typeof Intl !== 'undefined' && Intl.Segmenter)
      ? Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), function (part) {
        return part.segment;
      })
      : Array.from(text);
    const lines = [];
    let line = '';
    tokens.forEach(function (token) {
      if (ctx.measureText(line + token).width > maxWidth && line) {
        lines.push(line.trim());
        line = token;
      } else {
        line += token;
      }
    });
    if (line.trim()) {
      lines.push(line.trim());
    }
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = fitCardText(ctx, kept[maxLines - 1], maxWidth);
      return kept;
    }
    return lines;
  }

  function drawShareCard(result, mascot) {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const sampleData = isMock('career') || isMock('programs');
    const collegeName = toText(state.settings.collegeName) || 'NICC';

    const background = ctx.createLinearGradient(0, 0, 0, H);
    background.addColorStop(0, '#CFE9FF');
    background.addColorStop(1, '#F2F7FD');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);

    const header = ctx.createLinearGradient(0, 0, W, 260);
    header.addColorStop(0, '#1565FF');
    header.addColorStop(1, '#0B2E8A');
    ctx.fillStyle = header;
    ctx.fillRect(0, 0, W, 270);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 64px ' + CARD_FONT;
    ctx.fillText('NICC Smart PR', 60, 105);
    ctx.fillStyle = '#CFE9FF';
    ctx.font = '600 32px ' + CARD_FONT;
    ctx.fillText(fitCardText(ctx, collegeName, 600), 60, 160);
    ctx.fillStyle = '#FFC629';
    ctx.font = '700 40px ' + CARD_FONT;
    ctx.fillText('ผลแนะแนวอาชีพ', 60, 225);

    ctx.save();
    ctx.shadowColor = 'rgba(11, 46, 138, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF';
    roundedRect(ctx, 50, 300, 980, 900, 40);
    ctx.fill();
    ctx.restore();

    if (mascot && mascot.naturalWidth) {
      const size = 320;
      const ratio = Math.min(size / mascot.naturalWidth, size / mascot.naturalHeight);
      const w = mascot.naturalWidth * ratio;
      const h = mascot.naturalHeight * ratio;
      ctx.drawImage(mascot, 690 + (size - w) / 2, 100 + (size - h), w, h);
    }

    ctx.fillStyle = '#5B6B8C';
    ctx.font = '600 32px ' + CARD_FONT;
    ctx.fillText('สไตล์ของฉัน', 100, 385);

    ctx.fillStyle = '#0B2E8A';
    ctx.font = '800 68px ' + CARD_FONT;
    let y = 465;
    wrapCardText(ctx, result.styleTitle, 880, 2).forEach(function (line) {
      ctx.fillText(line, 100, y);
      y += 80;
    });

    y += 4;
    ctx.textAlign = 'center';
    result.hollandCode.split('').forEach(function (letter, index) {
      const cx = 130 + index * 76;
      ctx.fillStyle = '#FFC629';
      ctx.beginPath();
      ctx.arc(cx, y + 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0B2E8A';
      ctx.font = '800 36px ' + CARD_FONT;
      ctx.fillText(letter, cx, y + 43);
    });
    ctx.textAlign = 'left';
    y += 90;

    ctx.fillStyle = '#0B2E8A';
    ctx.font = '700 34px ' + CARD_FONT;
    ctx.fillText('ระดับความสนใจ', 100, y + 30);
    y += 60;
    ctx.font = '600 30px ' + CARD_FONT;
    result.scores.slice(0, 3).forEach(function (score) {
      const pct = Math.max(0, Math.min(100, Number(score.pct) || 0));
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'left';
      ctx.fillText(fitCardText(ctx, toText(score.nameTh), 240), 100, y + 28);
      ctx.fillStyle = '#E8F2FF';
      roundedRect(ctx, 360, y + 6, 500, 26, 13);
      ctx.fill();
      if (pct > 0) {
        const fill = ctx.createLinearGradient(360, 0, 860, 0);
        fill.addColorStop(0, '#3EB7FF');
        fill.addColorStop(1, '#1565FF');
        ctx.fillStyle = fill;
        roundedRect(ctx, 360, y + 6, Math.max(26, 500 * pct / 100), 26, 13);
        ctx.fill();
      }
      ctx.fillStyle = '#5B6B8C';
      ctx.textAlign = 'right';
      ctx.fillText(pct + '%', 980, y + 28);
      y += 56;
    });
    ctx.textAlign = 'left';

    y += 18;
    ctx.fillStyle = '#0B2E8A';
    ctx.font = '700 34px ' + CARD_FONT;
    ctx.fillText('สาขาที่น่าสนใจ', 100, y + 30);
    y += 64;
    ctx.font = '600 36px ' + CARD_FONT;
    const programs = (Array.isArray(result.programs) ? result.programs : []).slice(0, 3);
    if (programs.length) {
      programs.forEach(function (program) {
        ctx.fillStyle = '#1E293B';
        ctx.fillText(fitCardText(ctx, '• ' + toText(program.name), 860), 100, y + 30);
        y += 54;
      });
    } else {
      ctx.fillStyle = '#5B6B8C';
      ctx.font = '600 30px ' + CARD_FONT;
      ctx.fillText('ปรึกษาครูแนะแนวเพื่อดูสาขาที่เหมาะกับคุณ', 100, y + 30);
    }

    ctx.fillStyle = '#5B6B8C';
    ctx.font = '600 24px ' + CARD_FONT;
    ctx.fillText('เป็นคำแนะนำเบื้องต้น ไม่ใช่ผลทดสอบวิชาชีพ', 100, 1160);
    if (sampleData) {
      ctx.fillText('(ผลจากชุดคำถามและข้อมูลสาขาตัวอย่าง)', 100, 1190);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0B2E8A';
    ctx.font = '700 34px ' + CARD_FONT;
    ctx.fillText('ลองทำแบบประเมินกับน้อง NICC', W / 2, 1268);
    ctx.fillStyle = '#5B6B8C';
    ctx.font = '600 28px ' + CARD_FONT;
    ctx.fillText(fitCardText(ctx, toText(state.settings.tagline), 900), W / 2, 1312);
    return canvas;
  }

  function makeShareCard(result) {
    Promise.all([ensureCardFonts(), loadCardMascot()]).then(function (parts) {
      const canvas = drawShareCard(result, parts[1]);
      return new Promise(function (resolve) {
        canvas.toBlob(resolve, 'image/png');
      });
    }).then(function (blob) {
      if (state.career.result !== result) {
        return;
      }
      if (!blob) {
        throw new Error('toBlob returned null');
      }
      if (state.career.cardUrl) {
        URL.revokeObjectURL(state.career.cardUrl);
      }
      state.career.cardBlob = blob;
      state.career.cardUrl = URL.createObjectURL(blob);
      const preview = byId('careerCardPreview');
      if (preview) {
        clearNode(preview);
        preview.appendChild(el('img', { attrs: { src: state.career.cardUrl, alt: 'การ์ดผลแนะแนวของคุณ' } }));
      }
    }).catch(function (error) {
      console.error('[NICC] share card failed', error);
      state.career.cardBlob = null;
      const preview = byId('careerCardPreview');
      if (preview && state.career.result === result) {
        clearNode(preview);
        preview.appendChild(el('p', { className: 'caption', text: 'สร้างการ์ดไม่สำเร็จ แต่ผลแนะแนวด้านล่างยังใช้ได้ตามปกติ' }));
      }
    });
  }

  function saveCareerCard() {
    if (!state.career.cardUrl) {
      showToast('การ์ดยังไม่พร้อม กรุณารอสักครู่');
      return;
    }
    const link = document.createElement('a');
    link.href = state.career.cardUrl;
    link.download = 'nicc-career-card.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('หากไม่เริ่มดาวน์โหลด ให้กดค้างที่รูปการ์ดแล้วเลือกบันทึกรูปภาพ');
  }

  function shareCareerCard() {
    const blob = state.career.cardBlob;
    if (!blob) {
      showToast('การ์ดยังไม่พร้อม กรุณารอสักครู่');
      return;
    }
    const file = new File([blob], 'nicc-career-card.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'ผลแนะแนวอาชีพ NICC Smart PR' }).catch(function (error) {
        if (!error || error.name !== 'AbortError') {
          saveCareerCard();
        }
      });
    } else {
      saveCareerCard();
    }
  }

  function renderAll() {
    safeRender('home programs', renderHomePrograms, byId('homePrograms'));
    safeRender('home news', renderHomeNews, byId('homeNews'));
    safeRender('program chips', renderProgramChips, null);
    safeRender('programs', renderPrograms, byId('programList'));
    safeRender('news', renderNewsPage, byId('newsList'));
    safeRender('contacts', renderContacts, byId('contactList'));
    safeRender('map', renderMap, null);
  }

  function safeRender(label, renderer, container) {
    try {
      renderer();
    } catch (error) {
      console.error('[NICC] render ' + label, error);
      renderState(container, 'error', {
        title: 'แสดงข้อมูลไม่สำเร็จ',
        text: 'กรุณาลองใหม่อีกครั้ง'
      });
    }
  }

  function showAllLoading() {
    ['homePrograms', 'homeNews', 'programList', 'newsList', 'contactList'].forEach(function (id) {
      showLoading(byId(id));
    });
  }

  /* ==========================================================
   * 11. BOOTSTRAP (getBootstrap)
   * ========================================================== */

  function loadBootstrap() {
    if (state.loading) {
      return;
    }
    state.loading = true;
    setGlobalError(false);
    setSplash(true);
    showAllLoading();

    let finished = false;
    const timer = window.setTimeout(function () {
      finish(function () {
        failBootstrap(null, true);
      });
    }, BOOT_TIMEOUT_MS);

    function finish(handler) {
      if (finished) {
        return;
      }
      finished = true;
      window.clearTimeout(timer);
      state.loading = false;
      handler();
    }

    callServer('getBootstrap', [], function (response) {
      finish(function () {
        onBootstrap(response);
      });
    }, function (error) {
      finish(function () {
        failBootstrap(error, false);
      });
    });
  }

  function onBootstrap(response) {
    if (!isObject(response) || response.ok !== true || !isObject(response.settings)) {
      failBootstrap(isObject(response) ? response.error : null, false);
      return;
    }

    state.settings = response.settings;
    state.sources = isObject(response.sources) ? response.sources : {};
    state.config = isObject(response.config) ? response.config : {};
    state.programs = toList(response.programs, normalizeProgram);
    state.news = toList(response.news, normalizeNews);
    state.contacts = toList(response.contacts, normalizeContact);
    const career = isObject(response.career) ? response.career : {};
    state.career.questions = toList(career.questions, normalizeCareerQuestion);
    state.career.types = toList(career.types, normalizeCareerType);

    const suggestions = Array.isArray(response.suggestions)
      ? response.suggestions.map(toText).filter(Boolean)
      : [];

    applyBindings();
    applyBrand();
    applyPhotos();
    applyMascots(document);
    applySourceStatus();
    renderAll();
    renderSuggestions(suggestions);

    setSplash(false);
    state.booted = true;

    if (!state.page) {
      const app = byId('app');
      showPage(app ? app.getAttribute('data-initial-page') : 'home', { silent: true });
    }

    const warnings = Array.isArray(response.warnings) ? response.warnings.map(toText).filter(Boolean) : [];
    if (warnings.length) {
      console.warn('[NICC] warnings', warnings);
      showToast(warnings[0]);
    }
  }

  function failBootstrap(error, timedOut) {
    console.error('[NICC] bootstrap failed', error);
    let message = 'เชื่อมต่อข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง';
    if (timedOut) {
      message = 'การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองอีกครั้ง';
    } else if (typeof error === 'string' && error) {
      message = error;
    }
    setSplash(false);
    setGlobalError(true, message);
  }

  /* ==========================================================
   * 12. AI CHATBOT (askAI)
   * ========================================================== */

  function createSessionId() {
    return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadSessionId() {
    try {
      const saved = window.sessionStorage.getItem('nicc_session');
      if (saved) {
        return saved;
      }
      const fresh = createSessionId();
      window.sessionStorage.setItem('nicc_session', fresh);
      return fresh;
    } catch (error) {
      return createSessionId();
    }
  }

  function scrollChatToEnd() {
    const log = byId('chatLog');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }

  function createAvatar() {
    const slot = el('figure', {
      className: 'mascot-slot mascot-avatar',
      attrs: { 'data-mascot': 'head' }
    });
    const img = el('img', { className: 'mascot-img', attrs: { alt: '', decoding: 'async' } });
    img.hidden = true;
    slot.appendChild(img);
    slot.appendChild(svgUse('mascot-silhouette', 'mascot-ph'));
    applyMascots(slot);
    return slot;
  }

  function buildRelatedList(related) {
    const list = el('div', { className: 'related-list' });
    related.forEach(function (brief) {
      const full = isObject(brief) ? state.programs.find(function (program) {
        return program.id === toText(brief.id);
      }) : null;
      if (full) {
        list.appendChild(buildProgramCard(full));
      }
    });
    return list.childNodes.length ? list : null;
  }

  function appendMessage(role, text, options) {
    const log = byId('chatLog');
    if (!log) {
      return null;
    }
    const opts = options || {};
    const wrap = el('div', { className: 'bubble-wrap' });

    wrap.appendChild(el('div', { className: 'bubble', text: text }));
    if (opts.note) {
      wrap.appendChild(el('span', { className: 'msg-time', text: opts.note }));
    }
    if (Array.isArray(opts.related) && opts.related.length) {
      const related = buildRelatedList(opts.related);
      if (related) {
        wrap.appendChild(related);
      }
    }
    if (opts.retry) {
      wrap.appendChild(el('button', {
        className: 'chip',
        text: 'ลองส่งอีกครั้ง',
        attrs: { type: 'button', 'data-retry-chat': '' }
      }));
    }
    wrap.appendChild(el('span', { className: 'msg-time', text: opts.time || nowTime() }));

    const message = el('div', { className: 'msg msg-' + role });
    if (role === 'bot') {
      message.appendChild(createAvatar());
    }
    message.appendChild(wrap);
    log.appendChild(message);

    while (log.children.length > MAX_MESSAGES) {
      log.removeChild(log.firstChild);
    }
    scrollChatToEnd();
    return message;
  }

  function appendTyping() {
    const log = byId('chatLog');
    if (!log) {
      return null;
    }
    const typing = el('span', {
      className: 'typing',
      attrs: { role: 'status', 'aria-label': 'น้อง NICC กำลังพิมพ์' }
    }, [el('i'), el('i'), el('i')]);
    const message = el('div', { className: 'msg msg-bot' }, [
      createAvatar(),
      el('div', { className: 'bubble-wrap' }, [el('div', { className: 'bubble' }, [typing])])
    ]);
    log.appendChild(message);
    scrollChatToEnd();
    return message;
  }

  function setChatBusy(isBusy) {
    const send = byId('chatSend');
    const log = byId('chatLog');
    if (send) {
      send.disabled = isBusy;
    }
    if (log) {
      log.setAttribute('aria-busy', String(isBusy));
    }
  }

  function renderSuggestions(items) {
    const container = byId('chatSuggestions');
    if (!container) {
      return;
    }
    clearNode(container);
    container.hidden = items.length === 0;
    items.forEach(function (text) {
      container.appendChild(el('button', {
        className: 'chip chip-prompt',
        text: text,
        attrs: { type: 'button', 'data-suggest': text }
      }));
    });
  }

  function showChatError(message) {
    appendMessage('bot', message || 'ขออภัยครับ ตอนนี้เชื่อมต่อระบบไม่ได้ ลองใหม่อีกครั้ง หรือติดต่อวิทยาลัยโดยตรงนะครับ', {
      retry: true
    });
  }

  function handleAiResponse(response) {
    if (!isObject(response) || typeof response.answer !== 'string' || !response.answer.trim()) {
      showChatError();
      return;
    }
    const retryable = response.ok === false && response.code !== 'EMPTY';
    appendMessage('bot', response.answer, {
      related: Array.isArray(response.related) ? response.related : [],
      note: response.source === 'gemini' ? 'คำตอบจาก AI โปรดตรวจสอบกับวิทยาลัยอีกครั้ง' : '',
      time: toText(response.time) || nowTime(),
      retry: retryable
    });
    if (Array.isArray(response.suggestions) && response.suggestions.length) {
      renderSuggestions(response.suggestions.map(toText).filter(Boolean));
    }
  }

  function sendMessage(rawText, options) {
    const question = toText(rawText);
    const isRetry = Boolean(options && options.retry);
    if (!question) {
      return;
    }
    if (state.busy) {
      showToast('น้อง NICC กำลังตอบคำถามก่อนหน้า รอสักครู่นะครับ');
      return;
    }

    state.busy = true;
    state.lastQuestion = question;
    setChatBusy(true);
    if (!isRetry) {
      appendMessage('user', question);
    }
    const typing = appendTyping();
    const requestId = ++state.requestId;
    let settled = false;

    function settle(handler) {
      if (settled || requestId !== state.requestId) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      if (typing && typing.parentNode) {
        typing.parentNode.removeChild(typing);
      }
      state.busy = false;
      setChatBusy(false);
      handler();
    }

    const timer = window.setTimeout(function () {
      settle(function () {
        showChatError('น้อง NICC ตอบช้ากว่าปกติครับ ลองส่งอีกครั้งนะครับ');
      });
    }, AI_TIMEOUT_MS);

    callServer('askAI', [question, state.sessionId], function (response) {
      settle(function () {
        handleAiResponse(response);
      });
    }, function (error) {
      settle(function () {
        console.error('[NICC] askAI failed', error);
        showChatError();
      });
    });
  }

  function askFromAnywhere(prompt) {
    closeSheet();
    showPage('chat');
    sendMessage(prompt);
  }

  /* ==========================================================
   * 13. EVENTS (Event Delegation - ผูกครั้งเดียว)
   * ========================================================== */

  const CLICK_SELECTOR = [
    '#backBtn',
    '#sheetClose',
    '[data-prompt]',
    '[data-route]',
    '[data-action]',
    '[data-program-id]',
    '[data-news-id]',
    '[data-chip]',
    '[data-suggest]',
    '[data-retry-chat]',
    '[data-clear-filters]',
    '[data-career-answer]'
  ].join(',');

  function handleAction(button) {
    const action = button.getAttribute('data-action');
    if (action === 'apply') {
      openExternal(state.settings.admissionsUrl, 'ยังไม่ได้ตั้งค่าลิงก์สมัครเรียน สอบถามน้อง NICC หรือติดต่อวิทยาลัยได้ครับ');
    } else if (action === 'apply-status') {
      openExternal(state.settings.admissionsStatusUrl, 'ยังไม่ได้ตั้งค่าลิงก์ตรวจสอบสถานะ สอบถามน้อง NICC หรือติดต่อวิทยาลัยได้ครับ');
    } else if (action === 'career-start' || action === 'career-restart') {
      startCareer();
    } else if (action === 'career-back') {
      handleCareerBack();
    } else if (action === 'career-retry') {
      submitCareer();
    } else if (action === 'career-share') {
      shareCareerCard();
    } else if (action === 'career-save') {
      saveCareerCard();
    } else if (action === 'coming-soon') {
      showToast((button.getAttribute('data-label') || 'ฟังก์ชันนี้') + ' ยังไม่เปิดให้ใช้งานครับ');
    } else if (action === 'retry-bootstrap') {
      loadBootstrap();
    }
  }

  function clearProgramFilters() {
    state.programQuery = '';
    state.programCategory = '';
    const input = byId('programSearch');
    if (input) {
      input.value = '';
    }
    renderProgramChips();
    renderPrograms();
  }

  function onDocumentClick(event) {
    if (event.target && event.target.id === 'sheetBackdrop') {
      closeSheet();
      return;
    }
    const target = event.target.closest(CLICK_SELECTOR);
    if (!target) {
      return;
    }

    if (target.id === 'backBtn') {
      goBack();
    } else if (target.id === 'sheetClose') {
      closeSheet();
    } else if (target.hasAttribute('data-prompt')) {
      askFromAnywhere(target.getAttribute('data-prompt'));
    } else if (target.hasAttribute('data-suggest')) {
      sendMessage(target.getAttribute('data-suggest'));
    } else if (target.hasAttribute('data-retry-chat')) {
      target.remove();
      sendMessage(state.lastQuestion, { retry: true });
    } else if (target.hasAttribute('data-program-id')) {
      openProgramSheet(target.getAttribute('data-program-id'));
    } else if (target.hasAttribute('data-news-id')) {
      openNewsSheet(target.getAttribute('data-news-id'));
    } else if (target.hasAttribute('data-chip')) {
      state.programCategory = target.getAttribute('data-chip');
      renderProgramChips();
      renderPrograms();
    } else if (target.hasAttribute('data-career-answer')) {
      answerCareer(Number(target.getAttribute('data-career-answer')));
    } else if (target.hasAttribute('data-clear-filters')) {
      clearProgramFilters();
    } else if (target.hasAttribute('data-action')) {
      handleAction(target);
    } else if (target.hasAttribute('data-route')) {
      showPage(target.getAttribute('data-route'));
    }
  }

  function onDocumentKeydown(event) {
    if (event.key === 'Escape') {
      closeSheet();
    }
  }

  function onChatSubmit(event) {
    event.preventDefault();
    const input = byId('chatInput');
    if (!input || state.busy || !toText(input.value)) {
      return;
    }
    const text = input.value;
    input.value = '';
    sendMessage(text);
  }

  function onHomeSearch(event) {
    event.preventDefault();
    const input = byId('homeSearch');
    state.programQuery = input ? toText(input.value) : '';
    state.programCategory = '';
    const programInput = byId('programSearch');
    if (programInput) {
      programInput.value = state.programQuery;
    }
    renderProgramChips();
    renderPrograms();
    showPage('programs');
  }

  function onProgramSearchInput(event) {
    state.programQuery = event.target.value;
    renderPrograms();
  }

  function bindEvents() {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    const chatForm = byId('chatForm');
    if (chatForm) {
      chatForm.addEventListener('submit', onChatSubmit);
    }
    const homeForm = byId('homeSearchForm');
    if (homeForm) {
      homeForm.addEventListener('submit', onHomeSearch);
    }
    const programForm = byId('programSearchForm');
    if (programForm) {
      programForm.addEventListener('submit', function (event) {
        event.preventDefault();
      });
    }
    const programInput = byId('programSearch');
    if (programInput) {
      programInput.addEventListener('input', onProgramSearchInput);
    }
  }

  /* ==========================================================
   * 14. INIT
   * ========================================================== */

  function init() {
    state.sessionId = loadSessionId();
    bindEvents();
    watchViewport();
    appendMessage(
      'bot',
      'สวัสดีครับ! น้อง NICC พร้อมช่วยตอบเรื่องหลักสูตร การสมัครเรียน และแนะแนวอาชีพ เลือกคำถามด้านล่างหรือพิมพ์ถามได้เลยครับ'
    );
    loadBootstrap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
