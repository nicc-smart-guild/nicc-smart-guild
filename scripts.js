/* ==========================================================
 * NICC Smart PR - Styles.html
 * CSS ล้วน (ไม่มีแท็กครอบ) - Index.html ครอบให้แล้ว
 * Mobile-first: 320-767 / Tablet 768-1023 / Desktop 1024+
 * ========================================================== */

/* ==========================================================
 * 1. DESIGN TOKENS
 * ========================================================== */

:root {
  /* Brand colors */
  --navy: #0B2E8A;
  --blue: #1565FF;
  --sky: #3EB7FF;
  --yellow: #FFC629;
  --white: #FFFFFF;
  --bg: #F2F7FD;
  --text: #1E293B;

  /* Support colors */
  --muted: #5B6B8C;
  --line: #DCE8F7;
  --card: #FFFFFF;
  --tint: #E8F2FF;
  --ok: #16A34A;
  --danger: #C23B3B;
  --warn-bg: #FFF4D1;
  --warn-text: #5C4300;

  /* Gradients */
  --grad-blue: linear-gradient(135deg, #1565FF 0%, #0B2E8A 100%);
  --grad-hero: linear-gradient(160deg, #CFE9FF 0%, #EAF4FF 55%, #F2F7FD 100%);

  /* Shadows (tinted blue, soft) */
  --shadow-sm: 0 2px 8px rgba(11, 46, 138, 0.08);
  --shadow-md: 0 8px 24px rgba(11, 46, 138, 0.12);
  --shadow-lg: 0 16px 40px rgba(11, 46, 138, 0.20);

  /* Spacing scale */
  --s1: 4px;
  --s2: 8px;
  --s3: 12px;
  --s4: 16px;
  --s5: 20px;
  --s6: 24px;
  --s8: 32px;

  /* Radius scale */
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 24px;
  --r-pill: 999px;

  /* Typography */
  --font-ui: 'Noto Sans Thai', 'Sarabun', system-ui, sans-serif;
  --font-text: 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif;

  /* Layout */
  --topbar-h: 60px;
  --nav-h: 64px;
  --safe-b: env(safe-area-inset-bottom, 0px);
  --content-w: 1120px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* ==========================================================
 * 2. BASE / RESET
 * ========================================================== */

*,
*::before,
*::after {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
p,
ul,
ol,
figure {
  margin: 0;
}

ul,
ol {
  padding: 0;
  list-style: none;
}

img,
svg {
  display: block;
  max-width: 100%;
}

button,
input {
  font: inherit;
  color: inherit;
}

button {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

a {
  color: var(--blue);
  text-decoration: none;
}

h2,
h3,
strong,
b {
  color: var(--navy);
  font-weight: 700;
}

p,
.card-text {
  font-family: var(--font-text);
}

:focus-visible {
  outline: 3px solid var(--sky);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.caption {
  color: var(--muted);
  font-size: 12px;
}

/* ==========================================================
 * 3. APP SHELL
 * ========================================================== */

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.view {
  flex: 1;
  width: 100%;
  max-width: var(--content-w);
  margin: 0 auto;
  padding: var(--s4) var(--s4) calc(var(--nav-h) + var(--safe-b) + 88px);
}

.page {
  display: grid;
  gap: var(--s4);
  align-content: start;
}

.page:not([hidden]) {
  animation: pageIn 0.25s var(--ease);
}

.stack {
  display: grid;
  gap: var(--s3);
}

/* Chat page: ล็อกความสูงหน้าจอเพื่อให้ช่องพิมพ์อยู่เหนือ Bottom Nav เสมอ */
#app[data-current-page="chat"] {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

#app[data-current-page="chat"] .view {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: calc(var(--nav-h) + var(--safe-b) + var(--s2));
}

#app[data-current-page="chat"] .fab-ai {
  display: none;
}

/* ==========================================================
 * 4. ICON SYSTEM (Custom SVG sprite - สีควบคุมผ่าน CSS)
 *    sprite ควรใช้ currentColor เป็นเส้นหลัก และ var(--ic-accent) / var(--ic-fill) เป็นสีเสริม
 * ========================================================== */

.ic {
  --ic-accent: var(--yellow);
  --ic-fill: var(--sky);
  flex: none;
  width: 24px;
  height: 24px;
  color: var(--navy);
}

.ic-sm {
  width: 18px;
  height: 18px;
}

.ic-lg {
  width: 32px;
  height: 32px;
}

.ic-xl {
  width: 44px;
  height: 44px;
}

.btn-primary .ic,
.btn-icon-round .ic,
.banner .ic {
  --ic-accent: var(--yellow);
  --ic-fill: var(--white);
  color: var(--white);
}

/* ==========================================================
 * 5. MASCOT SLOTS (รองรับ PNG/WebP โปร่งใส)
 * ========================================================== */

.mascot-slot {
  position: relative;
  flex: none;
  width: 120px;
  aspect-ratio: 1 / 1;
}

.mascot-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}

.mascot-ph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--sky);
  opacity: 0.6;
}

.mascot-img:not([hidden]) ~ .mascot-ph {
  display: none;
}

.mascot-xs {
  width: 36px;
}

.mascot-avatar {
  width: 48px;
  padding: 2px;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid var(--sky);
  overflow: hidden;
}

.mascot-fab {
  width: 100%;
}

.mascot-sm {
  width: 96px;
}

.mascot-md {
  width: 140px;
}

.mascot-hero {
  width: 170px;
  aspect-ratio: 4 / 5;
}

.photo-slot {
  position: relative;
  overflow: hidden;
  background: var(--tint);
}

.photo-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ==========================================================
 * 6. BUTTONS
 * ========================================================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s2);
  min-height: 48px;
  padding: 0 var(--s5);
  border: 2px solid transparent;
  border-radius: var(--r-pill);
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  transition: transform 0.15s var(--ease), box-shadow 0.2s, background 0.2s;
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--grad-blue);
  color: var(--white);
  box-shadow: 0 6px 16px rgba(21, 101, 255, 0.35);
}

.btn-secondary {
  background: var(--yellow);
  color: var(--navy);
  box-shadow: 0 6px 16px rgba(255, 198, 41, 0.4);
}

.btn-outline {
  background: var(--white);
  border-color: var(--blue);
  color: var(--blue);
}

.btn-sm {
  min-height: 40px;
  padding: 0 var(--s4);
  font-size: 14px;
}

.btn-block {
  width: 100%;
}

.btn-stack {
  display: grid;
  gap: var(--s3);
}

.btn[disabled],
.btn-send[disabled] {
  background: var(--line);
  color: var(--muted);
  box-shadow: none;
  cursor: not-allowed;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--tint);
  transition: background 0.2s, transform 0.15s;
}

.icon-btn:active {
  transform: scale(0.94);
}

.btn-icon-round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--grad-blue);
  box-shadow: 0 4px 10px rgba(21, 101, 255, 0.35);
  transition: transform 0.15s var(--ease);
}

.btn-icon-round:active {
  transform: scale(0.92);
}

.link-btn {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: var(--blue);
  font-size: 14px;
  font-weight: 600;
}

.link-btn::after {
  content: "";
  width: 7px;
  height: 7px;
  margin-left: 6px;
  border: solid currentColor;
  border-width: 2px 2px 0 0;
  transform: rotate(45deg);
}

/* ==========================================================
 * 7. TOPBAR + DESKTOP NAV
 * ========================================================== */

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  padding-top: env(safe-area-inset-top, 0px);
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.topbar-inner {
  display: flex;
  align-items: center;
  gap: var(--s3);
  max-width: var(--content-w);
  height: var(--topbar-h);
  margin: 0 auto;
  padding: 0 var(--s4);
}

.topbar-inner:has(.topbar-title:not([hidden])) .brand {
  display: none;
}

.topbar-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 44px;
}

.brand-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.brand-fallback {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
}

.brand-fallback .mascot-slot {
  width: 40px;
}

.brand-word {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-word b {
  color: var(--navy);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brand-word i {
  color: var(--yellow);
  font-size: 13px;
  font-weight: 800;
  text-shadow: 0 1px 0 rgba(11, 46, 138, 0.25);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--s2);
  margin-left: auto;
}

.topbar-ai span {
  display: none;
}

.desktop-nav {
  display: none;
}

.desktop-nav button {
  position: relative;
  min-height: 44px;
  padding: 0 var(--s3);
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.2s;
}

.desktop-nav button[aria-current="page"],
.desktop-nav button.is-active {
  color: var(--navy);
}

.desktop-nav button[aria-current="page"]::after,
.desktop-nav button.is-active::after {
  content: "";
  position: absolute;
  left: var(--s3);
  right: var(--s3);
  bottom: 4px;
  height: 3px;
  border-radius: var(--r-pill);
  background: var(--yellow);
}

/* ==========================================================
 * 8. GLOBAL STATES (Demo banner / Splash / Error / Toast)
 * ========================================================== */

.demo-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--s2);
  padding: var(--s2) var(--s4);
  background: var(--warn-bg);
  border-bottom: 1px solid var(--yellow);
  color: var(--warn-text);
  font-size: 13px;
  line-height: 1.5;
}

.demo-banner .ic {
  margin-top: 2px;
  color: var(--warn-text);
}

.demo-banner strong {
  color: var(--warn-text);
}

.splash,
.global-error {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s4);
  padding: var(--s6);
  background: var(--grad-hero);
  text-align: center;
}

.global-error {
  z-index: 190;
}

.splash p,
.global-error p {
  color: var(--muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid var(--line);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-h) + var(--safe-b) + 92px);
  z-index: 100;
  max-width: calc(100% - 32px);
  padding: var(--s3) var(--s5);
  border-radius: var(--r-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 14px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  transform: translateX(-50%);
  animation: toastIn 0.25s var(--ease);
}

/* ==========================================================
 * 9. COMPONENTS: SEARCH / CHIPS / CARDS
 * ========================================================== */

.searchbar {
  display: flex;
  align-items: center;
  gap: var(--s2);
  min-height: 52px;
  padding: 0 var(--s2) 0 var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--white);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.searchbar:focus-within {
  border-color: var(--sky);
  box-shadow: 0 0 0 4px rgba(62, 183, 255, 0.25);
}

.searchbar input,
.chat-input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 16px;
}

.searchbar input::placeholder,
.chat-input input::placeholder {
  color: var(--muted);
}

.chips {
  display: flex;
  gap: var(--s2);
  padding: var(--s1) 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: none;
  min-height: 38px;
  padding: 0 var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--white);
  color: var(--navy);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, transform 0.15s;
}

.chip:active {
  transform: scale(0.96);
}

.chip.is-active,
.chip[aria-pressed="true"],
.chip-prompt {
  border-color: transparent;
  background: var(--grad-blue);
  color: var(--white);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 10px;
  border-radius: var(--r-pill);
  background: var(--tint);
  color: var(--blue);
  font-size: 12px;
  font-weight: 600;
}

.badge-popular {
  background: var(--yellow);
  color: var(--navy);
}

.card {
  display: grid;
  gap: var(--s3);
  padding: var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  box-shadow: var(--shadow-sm);
}

.note-card {
  border-left: 4px solid var(--yellow);
  white-space: pre-line;
}

/* Item cards: โครงสร้างที่ Scripts ต้องสร้าง
 * .program-card / .news-card / .contact-card > .card-img + .card-body(.card-title .card-text .card-meta) */
.program-card,
.news-card,
.contact-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--s3);
  align-items: center;
  width: 100%;
  padding: var(--s2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  box-shadow: var(--shadow-sm);
  color: inherit;
  text-align: left;
  transition: transform 0.2s var(--ease), box-shadow 0.2s;
}

.contact-card {
  grid-template-columns: 44px minmax(0, 1fr);
  padding: var(--s3) var(--s4);
}

.program-card:active,
.news-card:active {
  transform: scale(0.985);
}

.card-img {
  position: relative;
  width: 96px;
  height: 84px;
  border-radius: var(--r-sm);
  background: var(--tint);
  overflow: hidden;
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--tint);
}

.card-body {
  min-width: 0;
}

.card-title {
  color: var(--navy);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.card-text {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s2);
  margin-top: var(--s1);
  color: var(--muted);
  font-size: 12px;
}

.hscroll {
  display: flex;
  gap: var(--s3);
  margin: 0 calc(var(--s4) * -1);
  padding: var(--s1) var(--s4) var(--s3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.hscroll::-webkit-scrollbar {
  display: none;
}

.hscroll > * {
  flex: 0 0 min(300px, 82%);
  scroll-snap-align: start;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
}

.section-head h3 {
  font-size: 18px;
}

/* ==========================================================
 * 10. HOME
 * ========================================================== */

.hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s2);
  min-height: 230px;
  padding: var(--s5) var(--s4) 0 var(--s5);
  border-radius: var(--r-lg);
  background: var(--grad-hero);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background: transparent;
}

.hero-copy {
  position: relative;
  z-index: 1;
  align-self: center;
  min-width: 0;
  padding-bottom: var(--s5);
}

.hero-hello {
  display: inline-block;
  margin-bottom: var(--s2);
  padding: 2px 14px;
  border-radius: var(--r-pill);
  background: var(--yellow);
  color: var(--navy);
  font-weight: 700;
  font-size: 13px;
}

.hero-title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.3;
}

.hero-sub {
  margin-top: var(--s2);
  color: var(--muted);
  font-size: 14px;
}

.hero-cta {
  margin-top: var(--s4);
}

.hero .mascot-hero {
  position: relative;
  z-index: 1;
  margin-right: -4px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s3);
}

.quick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s2);
  min-height: 96px;
  padding: var(--s4) var(--s2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--white);
  box-shadow: var(--shadow-sm);
  color: var(--navy);
  font-size: 13px;
  font-weight: 700;
  transition: transform 0.2s var(--ease), box-shadow 0.2s;
}

.quick:active {
  transform: scale(0.96);
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
  width: 100%;
  padding: var(--s4) var(--s4) var(--s4) var(--s5);
  border-radius: var(--r-lg);
  background: var(--grad-blue);
  box-shadow: var(--shadow-md);
  color: var(--white);
  text-align: left;
  overflow: hidden;
}

.banner-text {
  display: grid;
  gap: var(--s1);
  min-width: 0;
}

.banner-text strong {
  color: var(--white);
  font-size: 19px;
}

.banner-text small {
  color: #CFE9FF;
  font-size: 13px;
}

.banner .mascot-slot {
  margin: calc(var(--s4) * -1) 0 calc(var(--s4) * -1);
}

.cta-ask {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--tint);
}

.cta-ask > div {
  display: grid;
  gap: var(--s3);
  justify-items: start;
  min-width: 0;
}

.pillars {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s3);
}

.pillars li {
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: var(--s4) var(--s2);
  border-radius: var(--r-md);
  background: var(--white);
  border: 1px solid var(--line);
  text-align: center;
}

.pillars b {
  font-size: 14px;
}

.pillars small {
  color: var(--muted);
  font-size: 12px;
}

/* ==========================================================
 * 11. CHAT (AI Chatbot)
 * ========================================================== */

.page.page-chat {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--s2);
  min-height: 0;
}

.chat-head {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s3) var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.chat-head strong {
  display: block;
  line-height: 1.3;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ok);
}

.chat-log {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--s3);
  min-height: 0;
  padding: var(--s2) 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Message structure: .msg.msg-bot|.msg-user > (.mascot-avatar) + .bubble-wrap > .bubble + .msg-time */
.msg {
  display: flex;
  align-items: flex-end;
  gap: var(--s2);
  max-width: 90%;
  animation: msgIn 0.25s var(--ease);
}

.msg-user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.msg .mascot-avatar {
  width: 36px;
}

.bubble-wrap {
  display: grid;
  gap: var(--s1);
  min-width: 0;
}

.bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-family: var(--font-text);
  font-size: 15px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.msg-bot .bubble {
  border: 1px solid var(--line);
  border-bottom-left-radius: 6px;
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.msg-user .bubble {
  border-bottom-right-radius: 6px;
  background: var(--grad-blue);
  color: var(--white);
}

.msg-time {
  color: var(--muted);
  font-size: 11px;
}

.msg-user .msg-time {
  text-align: right;
}

.typing {
  display: inline-flex;
  gap: 5px;
  padding: 14px 16px;
}

.typing i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sky);
  animation: typing 1.2s infinite ease-in-out;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

.related-list {
  display: grid;
  gap: var(--s2);
  margin-top: var(--s1);
}

.chat-suggest {
  display: flex;
  gap: var(--s2);
  padding: var(--s1) 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.chat-suggest::-webkit-scrollbar {
  display: none;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: var(--s2);
  min-height: 56px;
  padding: 6px 8px 6px var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--white);
  box-shadow: var(--shadow-md);
}

.chat-input:focus-within {
  border-color: var(--sky);
}

.btn-send {
  width: 44px;
  height: 44px;
}

/* ==========================================================
 * 12. PAGE HEROES, PROGRAMS, CAREER, ADMISSIONS
 * ========================================================== */

.page-hero {
  display: flex;
  align-items: center;
  gap: var(--s4);
  padding: var(--s5);
  border-radius: var(--r-lg);
  background: var(--grad-hero);
  box-shadow: var(--shadow-sm);
}

.page-hero > div {
  min-width: 0;
}

.page-hero h2 {
  font-size: 21px;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.page-hero p {
  color: var(--muted);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.page-hero-icon {
  flex: none;
  width: 60px;
  height: 60px;
  padding: 12px;
  border-radius: 20px;
  background: var(--white);
  box-shadow: var(--shadow-sm);
  color: var(--navy);
  --ic-accent: var(--yellow);
  --ic-fill: var(--sky);
}

.page-hero-tall {
  justify-content: space-between;
  padding-bottom: var(--s4);
}

.hero-lead {
  display: block;
  margin-top: var(--s2);
  color: var(--blue);
  font-size: 15px;
  line-height: 1.5;
}

.menu-list {
  display: grid;
  gap: var(--s3);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--s3);
  width: 100%;
  min-height: 60px;
  padding: var(--s3) var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--white);
  box-shadow: var(--shadow-sm);
  color: var(--navy);
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  transition: transform 0.2s var(--ease), box-shadow 0.2s;
}

button.menu-item::after {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  margin-left: auto;
  border: solid var(--muted);
  border-width: 2px 2px 0 0;
  transform: rotate(45deg);
}

button.menu-item:active {
  transform: scale(0.985);
}

.menu-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--tint);
}

/* More: เมนูแบบการ์ดไอคอน */
.page[data-page="more"] .menu-list {
  grid-template-columns: repeat(2, 1fr);
}

.page[data-page="more"] .menu-item {
  flex-direction: column;
  justify-content: center;
  gap: var(--s2);
  min-height: 124px;
  padding: var(--s4) var(--s2);
  font-size: 14px;
  text-align: center;
}

.page[data-page="more"] .menu-item::after {
  display: none;
}

.page[data-page="more"] .menu-ico {
  width: 56px;
  height: 56px;
}

/* Career flow: .option = ตัวเลือกคำตอบ, .is-selected = ที่เลือก */
.progress {
  height: 8px;
  border-radius: var(--r-pill);
  background: var(--tint);
  overflow: hidden;
}

.progress i {
  display: block;
  width: 0;
  height: 100%;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, var(--sky), var(--blue));
  transition: width 0.4s var(--ease);
}

.career-flow h3 {
  font-size: 18px;
  line-height: 1.45;
}

.option-list {
  display: grid;
  gap: var(--s3);
}

.option {
  min-height: 52px;
  padding: var(--s3) var(--s4);
  border: 2px solid var(--line);
  border-radius: var(--r-md);
  background: var(--white);
  color: var(--text);
  font-weight: 600;
  text-align: left;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.option:active {
  transform: scale(0.985);
}

.option.is-selected {
  border-color: var(--blue);
  background: var(--tint);
}

.career-result h3 {
  font-size: 19px;
}

/* Admissions stepper */
.steps {
  display: grid;
  gap: var(--s3);
}

.step {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--s4);
  padding: var(--s3) var(--s4);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 36px;
  width: 3px;
  height: var(--s3);
  background: var(--sky);
}

.step-no {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--grad-blue);
  color: var(--white);
  font-size: 17px;
  font-weight: 800;
}

/* ==========================================================
 * 13. PARENT / ABOUT / CONTACT / SHEET
 * ========================================================== */

.parent-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 190px;
  border-radius: var(--r-lg);
  background: var(--grad-blue);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.parent-photo {
  position: absolute;
  inset: 0;
  background: transparent;
}

.parent-hero-text {
  position: relative;
  width: 100%;
  padding: var(--s8) var(--s5) var(--s4);
  background: linear-gradient(to top, rgba(11, 46, 138, 0.9), rgba(11, 46, 138, 0));
}

.parent-hero-text h2,
.parent-hero-text p {
  color: var(--white);
}

.slogan {
  color: var(--navy);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
  text-wrap: balance;
}

.about-meta {
  text-align: center;
}

.map-card {
  padding: 0;
  overflow: hidden;
}

.map-box {
  aspect-ratio: 16 / 9;
  background: var(--tint);
}

.map-box iframe,
.map-box img {
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(11, 46, 138, 0.45);
  animation: fadeIn 0.2s;
}

.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  max-height: 86vh;
  max-height: 86dvh;
  padding: var(--s3) var(--s5) calc(var(--s6) + var(--safe-b));
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  background: var(--white);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  overscroll-behavior: contain;
  animation: sheetIn 0.3s var(--ease);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto var(--s3);
  border-radius: var(--r-pill);
  background: var(--line);
}

.sheet-close {
  position: absolute;
  top: var(--s3);
  right: var(--s3);
}

#sheetBody {
  display: grid;
  gap: var(--s3);
}

#sheetBody h2,
#sheetBody h3 {
  padding-right: 48px;
  font-size: 20px;
}

#sheetBody p {
  white-space: pre-line;
}

/* ==========================================================
 * 14. BOTTOM NAV + FLOATING AI
 * ========================================================== */

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 55;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: calc(var(--nav-h) + var(--safe-b));
  padding-bottom: var(--safe-b);
  border-radius: 20px 20px 0 0;
  background: var(--white);
  box-shadow: 0 -6px 20px rgba(11, 46, 138, 0.1);
}

.bottom-nav button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
}

.bottom-nav .ic {
  width: 26px;
  height: 26px;
  color: var(--muted);
  --ic-accent: #B7C6E0;
  --ic-fill: #D5E1F3;
}

.bottom-nav button[aria-current="page"],
.bottom-nav button.is-active {
  color: var(--navy);
}

.bottom-nav button[aria-current="page"] .ic,
.bottom-nav button.is-active .ic {
  color: var(--navy);
  --ic-accent: var(--yellow);
  --ic-fill: var(--sky);
}

.bottom-nav button[aria-current="page"]::before,
.bottom-nav button.is-active::before {
  content: "";
  position: absolute;
  top: 0;
  width: 28px;
  height: 4px;
  border-radius: 0 0 var(--r-pill) var(--r-pill);
  background: var(--yellow);
}

.fab-ai {
  position: fixed;
  right: var(--s4);
  bottom: calc(var(--nav-h) + var(--safe-b) + var(--s4));
  z-index: 60;
  width: 64px;
  height: 64px;
  padding: 6px;
  border: 3px solid var(--sky);
  border-radius: 50%;
  background: var(--white);
  box-shadow: var(--shadow-lg);
  transition: transform 0.2s var(--ease);
}

.fab-ai:active {
  transform: scale(0.94);
}

.fab-tag {
  position: absolute;
  left: 50%;
  bottom: -8px;
  padding: 0 9px;
  border-radius: var(--r-pill);
  background: var(--grad-blue);
  color: var(--white);
  font-size: 11px;
  font-weight: 800;
  line-height: 18px;
  transform: translateX(-50%);
}

/* ==========================================================
 * 15. STATES: Empty / Error / Skeleton
 * ========================================================== */

.state {
  display: grid;
  justify-items: center;
  gap: var(--s2);
  padding: var(--s8) var(--s4);
  text-align: center;
}

.state p {
  max-width: 36ch;
  color: var(--muted);
}

.state .btn {
  margin-top: var(--s2);
}

.state-error h3 {
  color: var(--danger);
}

.skeleton-list {
  display: grid;
  gap: var(--s3);
}

.skeleton-card {
  height: 96px;
  border-radius: var(--r-md);
  background: linear-gradient(90deg, #E3ECF8 25%, #F4F8FD 40%, #E3ECF8 60%);
  background-size: 300% 100%;
  animation: shimmer 1.4s infinite linear;
}

/* ==========================================================
 * 16. ANIMATIONS
 * ========================================================== */

@keyframes pageIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sheetIn {
  from {
    transform: translateY(40px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translate(-50%, 12px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* ==========================================================
 * 17. RESPONSIVE
 * ========================================================== */

/* Mobile เล็กมาก (320px) */
@media (max-width: 359px) {
  .hero-title {
    font-size: 22px;
  }

  .mascot-hero {
    width: 130px;
  }

  .quick-grid {
    gap: var(--s2);
  }

  .quick {
    font-size: 12px;
  }
}

/* ขณะพิมพ์ในแชทบนมือถือ ซ่อน Bottom Nav เพื่อให้ช่องพิมพ์เห็นชัด */
@media (max-width: 1023px) {
  #app[data-current-page="chat"]:has(#chatInput:focus) .bottom-nav {
    display: none;
  }

  #app[data-current-page="chat"]:has(#chatInput:focus) .view {
    padding-bottom: calc(var(--safe-b) + var(--s2));
  }
}

/* ข้อความบนปุ่ม AI แสดงเมื่อกว้างพอ */
@media (min-width: 480px) {
  .topbar-ai span {
    display: inline;
  }
}

/* Tablet 768-1023 */
@media (min-width: 768px) {
  .view {
    padding-left: var(--s6);
    padding-right: var(--s6);
  }

  .hscroll {
    margin: 0 calc(var(--s6) * -1);
    padding-left: var(--s6);
    padding-right: var(--s6);
  }

  .hero {
    min-height: 300px;
    padding: var(--s8) var(--s8) 0;
  }

  .hero-title {
    font-size: 34px;
  }

  .mascot-hero {
    width: 250px;
  }

  .stack {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .pillars {
    grid-template-columns: repeat(4, 1fr);
  }

  .steps {
    grid-template-columns: repeat(4, 1fr);
  }

  .step {
    flex-direction: column;
    gap: var(--s2);
    text-align: center;
  }

  .step:not(:last-child)::after {
    top: 38px;
    left: 100%;
    width: var(--s3);
    height: 3px;
  }

  .btn-stack {
    max-width: 480px;
  }

  .page[data-page="more"] .menu-list {
    grid-template-columns: repeat(3, 1fr);
  }

  .chips {
    flex-wrap: wrap;
    overflow: visible;
  }

  .sheet {
    left: 50%;
    right: auto;
    bottom: var(--s6);
    width: min(560px, calc(100% - 48px));
    border-radius: var(--r-lg);
    transform: translateX(-50%);
    animation: sheetInCenter 0.3s var(--ease);
  }

  .toast {
    bottom: calc(var(--nav-h) + var(--safe-b) + 92px);
  }
}

@keyframes sheetInCenter {
  from {
    opacity: 0;
    transform: translate(-50%, 24px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* Desktop 1024+ */
@media (min-width: 1024px) {
  .view {
    padding-top: var(--s6);
    padding-bottom: var(--s8);
  }

  .desktop-nav {
    display: flex;
    flex: 1;
    justify-content: center;
    gap: var(--s1);
  }

  .topbar-actions {
    margin-left: 0;
  }

  .mobile-only,
  .bottom-nav {
    display: none;
  }

  .topbar-title {
    display: none;
  }

  .hero {
    min-height: 380px;
    padding: 48px 56px 0;
  }

  .hero-title {
    font-size: 46px;
  }

  .hero-sub {
    font-size: 18px;
  }

  .mascot-hero {
    width: 340px;
  }

  .stack {
    grid-template-columns: repeat(3, 1fr);
  }

  .hscroll > * {
    flex-basis: 320px;
  }

  .fab-ai {
    right: var(--s6);
    bottom: var(--s6);
  }

  .toast {
    bottom: var(--s6);
  }

  .page-hero {
    padding: var(--s6) var(--s8);
  }

  .page-hero h2 {
    font-size: 26px;
  }

  .page[data-page="more"] .menu-list {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Chat บน Desktop: กรอบกลางหน้าจอ */
  #app[data-current-page="chat"] .view {
    max-width: 800px;
    padding-bottom: var(--s6);
  }

  .page[data-page="contact"] .stack,
  .page[data-page="news"] .stack {
    grid-template-columns: repeat(2, 1fr);
  }

  .menu-list {
    max-width: 720px;
  }

  .page[data-page="more"] .menu-list {
    max-width: none;
  }
}

/* Hover เฉพาะอุปกรณ์ที่มีเมาส์ */
@media (hover: hover) {
  .btn-primary:hover {
    box-shadow: 0 10px 22px rgba(21, 101, 255, 0.45);
    transform: translateY(-2px);
  }

  .btn-secondary:hover {
    box-shadow: 0 10px 22px rgba(255, 198, 41, 0.55);
    transform: translateY(-2px);
  }

  .btn-outline:hover {
    background: var(--tint);
  }

  .icon-btn:hover,
  .chip:hover {
    background: var(--tint);
  }

  .chip.is-active:hover,
  .chip-prompt:hover {
    background: var(--grad-blue);
  }

  .program-card:hover,
  .news-card:hover,
  .quick:hover,
  .menu-item:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .desktop-nav button:hover {
    color: var(--navy);
  }

  .option:hover {
    border-color: var(--sky);
  }

  .fab-ai:hover {
    transform: translateY(-3px);
  }
}

/* ==========================================================
 * 18. REDUCED MOTION
 * ========================================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ==========================================================
 * 19. CAREER MATCH RESULT + SHARE CARD PREVIEW
 * ========================================================== */

.career-card-preview {
  display: grid;
  place-items: center;
  width: 100%;
  max-width: 420px;
  min-height: 240px;
  margin: 0 auto;
  border-radius: var(--r-md);
  background: var(--tint);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.career-card-preview img {
  width: 100%;
  height: auto;
}

.score-row {
  display: grid;
  gap: var(--s1);
}

.score-row .caption {
  display: flex;
  justify-content: space-between;
}
