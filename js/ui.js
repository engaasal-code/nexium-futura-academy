/* ================= UI shell, icons, auth, footer, public pages ================= */
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  calPlus: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5V21.5M8 7h8M8 11h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.8.1 4.9 1.8 5.5 5.1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  wallet: '<rect x="2.5" y="6" width="19" height="14" rx="2"/><path d="M2.5 10h19M16.5 15h2"/><path d="M5 6l10-3.5L17 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-5.6A8 8 0 1 1 21 12z"/>',
  file: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7.5 5-3 5 3-1.5-7.5"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8.5 3 8.5H3S6 15 6 8M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 7 9-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', video: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>', shield: '<path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z"/><path d="m9 12 2 2 4-4"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>', layers: '<path d="m12 2.5 9.5 5-9.5 5-9.5-5z"/><path d="m2.5 12.5 9.5 5 9.5-5M2.5 17l9.5 5 9.5-5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/>', lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  phone: '<path d="M5 3.5h3.5l2 5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5 5 2V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  page: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5"/>', link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.2c-.5-1-1.6-1.7-3-1.7-1.8 0-3 .9-3 2.2 0 3.3 6.2 1.6 6.2 4.8 0 1.4-1.3 2.3-3.2 2.3-1.5 0-2.7-.7-3.2-1.8M12 6v1.5M12 16.8v1.5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19M6 15h4"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  send: '<path d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4z"/>', door: '<path d="M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5M3 12h11M10 8l4 4-4 4"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;
const BRAND_IC = {
  facebook: '<path fill="currentColor" d="M14 8.5V6.8c0-.8.5-1 1-1h2.3V2.1L14.2 2C10.9 2 10 4.3 10 6.4v2.1H7.5v3.8H10V22h4v-9.7h3l.5-3.8z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/>',
  x: '<path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/>',
  tiktok: '<path fill="currentColor" d="M16.6 2h-3.4v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9a6.3 6.3 0 1 0 5.5 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.6a4.5 4.5 0 0 1-4.4-4.6z"/>',
  youtube: '<path fill="currentColor" d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15.1V8.9l5.2 3.1z"/>',
  linkedin: '<path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.8h4V21H3zM9.5 9.8h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/>',
  whatsapp: '<path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/>',
  google: '<path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/>',
  yahoo: '<path fill="#6001D2" d="M2 6.5h4.2l2.5 6.3 2.5-6.3h4.1L9.1 20.5H5l1.7-4zM17.4 3.5h4.4L18 12.6h-4z"/><circle cx="16.3" cy="16" r="2.3" fill="#6001D2"/>',
};
const AUTH_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" role="img" aria-label="طالب بيذاكر أونلاين"> <defs> <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9BC45"/><stop offset="1" stop-color="#D4A12A"/></linearGradient> <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B3C93"/><stop offset="1" stop-color="#122F7A"/></linearGradient> <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E3B8"/><stop offset="1" stop-color="#E5CF93"/></linearGradient> </defs> <!-- soft background shapes --> <circle cx="300" cy="175" r="150" fill="#FFFFFF" opacity=".07"/> <circle cx="300" cy="175" r="105" fill="#FFFFFF" opacity=".06"/> <!-- floating icons --> <g opacity=".95"> <g transform="translate(70 70)"><rect width="58" height="44" rx="12" fill="#FFFFFF"/><path d="M14 32 l8-8 7 6 13-14" fill="none" stroke="#1F9D6B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g> <g transform="translate(420 58)"><circle r="26" cx="26" cy="26" fill="url(#g1)"/><path d="M26 13 l4 9 10 1-7.5 6.8 2.2 9.7L26 34.5l-8.7 5 2.2-9.7L12 23l10-1z" fill="#0B2463"/></g> <g transform="translate(445 165)"><rect width="56" height="40" rx="12" fill="#FFFFFF"/><circle cx="16" cy="20" r="3.5" fill="#0B2463"/><circle cx="28" cy="20" r="3.5" fill="#0B2463"/><circle cx="40" cy="20" r="3.5" fill="#0B2463"/><path d="M12 40 l-2 10 12-10z" fill="#FFFFFF"/></g> <g transform="translate(40 190)"><path d="M0 18 L34 2 L68 18 L34 34 Z" fill="url(#g1)"/><path d="M14 25 v12 c0 6 40 6 40 0 v-12" fill="#E9BC45"/><path d="M68 18 v18" stroke="#E9BC45" stroke-width="3"/><circle cx="68" cy="38" r="4" fill="#E9BC45"/></g> </g> <!-- desk --> <rect x="60" y="300" width="420" height="16" rx="8" fill="url(#desk)"/> <rect x="95" y="316" width="12" height="60" rx="4" fill="#C9A85A"/> <rect x="433" y="316" width="12" height="60" rx="4" fill="#C9A85A"/> <!-- books --> <rect x="96" y="284" width="88" height="16" rx="3" fill="#D64545"/> <rect x="104" y="268" width="80" height="16" rx="3" fill="#2F6FDB"/> <rect x="100" y="252" width="76" height="16" rx="3" fill="url(#g1)"/> <rect x="108" y="256" width="40" height="3" rx="1.5" fill="#FFFFFF" opacity=".7"/> <!-- plant --> <rect x="430" y="270" width="30" height="30" rx="6" fill="#FFFFFF"/> <path d="M445 270 C440 245 425 238 418 236 C430 246 436 256 445 270 Z" fill="#1F9D6B"/> <path d="M445 270 C452 242 466 236 474 233 C462 246 455 258 445 270 Z" fill="#26B47D"/> <path d="M445 270 C444 250 447 236 452 226 C452 242 449 256 445 270 Z" fill="#1F9D6B"/> <!-- laptop --> <path d="M236 300 L404 300 L418 306 L222 306 Z" fill="#C9D3EE"/> <rect x="246" y="168" width="148" height="132" rx="10" fill="#E8EDF8"/> <rect x="254" y="176" width="132" height="104" rx="6" fill="url(#scr)"/> <!-- teacher on screen --> <circle cx="320" cy="214" r="17" fill="#C68642"/> <path d="M302 210 c0-16 36-16 36 0 c0-12-8-20-18-20 s-18 8-18 20z" fill="#2B2B2B"/> <path d="M292 280 c2-22 14-34 28-34 s26 12 28 34z" fill="#E9BC45"/> <rect x="262" y="184" width="30" height="8" rx="4" fill="#D64545"/> <circle cx="267" cy="188" r="2" fill="#FFFFFF"/> <rect x="352" y="252" width="28" height="22" rx="4" fill="#0B2463" stroke="#FFFFFF" stroke-opacity=".5"/> <circle cx="366" cy="261" r="4.5" fill="#F1C27D"/> <path d="M358 274 c1-6 4-8 8-8 s7 2 8 8z" fill="#2F6FDB"/> <circle cx="320" cy="290" r="3" fill="#0B2463"/> <!-- student --> <path d="M120 300 C122 250 150 222 186 222 C222 222 246 250 248 300 Z" fill="#0B2463"/> <path d="M168 222 h36 v18 c0 8-36 8-36 0z" fill="#F1C27D"/> <circle cx="186" cy="188" r="34" fill="#F1C27D"/> <path d="M152 186 c-2-30 18-44 36-44 c22 0 38 14 36 40 c-6-14-20-22-36-22 c-14 0-28 10-36 26z" fill="#3A2A20"/> <!-- headphones --> <path d="M150 190 c0-30 16-50 36-50 s36 20 36 50" fill="none" stroke="#E9BC45" stroke-width="6" stroke-linecap="round"/> <rect x="142" y="182" width="14" height="26" rx="7" fill="#E9BC45"/> <rect x="216" y="182" width="14" height="26" rx="7" fill="#E9BC45"/> <path d="M223 206 q2 14 -12 18" fill="none" stroke="#E9BC45" stroke-width="3" stroke-linecap="round"/> <circle cx="209" cy="225" r="3.5" fill="#E9BC45"/> <!-- face --> <circle cx="198" cy="190" r="3" fill="#2B2B2B"/> <path d="M196 205 q8 5 14 0" fill="none" stroke="#B5651D" stroke-width="2.5" stroke-linecap="round"/> <!-- arm on desk --> <path d="M206 262 C228 272 250 284 262 298 L246 302 C232 292 214 284 200 278 Z" fill="#122F7A"/> <ellipse cx="258" cy="298" rx="12" ry="7" fill="#F1C27D"/> <!-- pencil --> <rect x="190" y="292" width="40" height="5" rx="2.5" fill="url(#g1)" transform="rotate(-8 210 294)"/> <!-- wifi waves --> <g transform="translate(320 120)" fill="none" stroke="#FFFFFF" stroke-linecap="round" opacity=".85"> <path d="M-30 0 a42 42 0 0 1 60 0" stroke-width="5"/> <path d="M-18 12 a26 26 0 0 1 36 0" stroke-width="5"/> <circle cx="0" cy="24" r="4" fill="#FFFFFF" stroke="none"/> </g> </svg> `;
const bicon = (n, sz = 18) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}">${BRAND_IC[n] || ''}</svg>`;

/* ---------- الوضع الليلي ---------- */
const isDark = () => document.documentElement.dataset.theme === 'dark';
function applyTheme(t) { if (t === 'dark') document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0A1222' : '#0B2463'; }
function toggleTheme() { const t = isDark() ? 'light' : 'dark'; try { localStorage.setItem('nexium_theme', t); } catch (e) {} applyTheme(t); APP.menuOpen = false; if (!document.getElementById('ann')) render(); }
try { applyTheme(localStorage.getItem('nexium_theme') || 'light'); } catch (e) {}
const themeBtn = () => `<button class="iconbtn theme-btn" onclick="toggleTheme()" title="${isDark() ? L('الوضع النهاري', 'Light mode') : L('الوضع الليلي', 'Dark mode')}" aria-label="${isDark() ? L('الوضع النهاري', 'Light mode') : L('الوضع الليلي', 'Dark mode')}">${icon(isDark() ? 'sun' : 'moon')}</button>`;

/* ---------- app state ---------- */
const APP = { portal: 'student', view: 'home', params: {}, user: null, adminRole: null, menuOpen: false, publicPage: null };
const SESS_KEY = 'nexium_session_v1';
function saveSession() { try { localStorage.setItem(SESS_KEY, JSON.stringify({ s: IS_LIVE ? {} : (APP.sessions || {}), lang: LANG })); } catch (e) {} }
function loadSession() { try { const v = JSON.parse(localStorage.getItem(SESS_KEY) || '{}'); APP.sessions = v.s || {}; if (v.lang) LANG = v.lang; } catch (e) { APP.sessions = {}; } }
function currentUser() {
  const id = APP.sessions[APP.portal]; if (!id) return null;
  if (APP.portal === 'student') return stuById(id); if (APP.portal === 'teacher') return tchById(id); return D.staff.find(s => s.id === id);
}
function can(perm) {
  if (APP.portal === 'teacher') return !!D.perms.teacher[perm];
  if (APP.portal === 'admin') return !!(D.perms[APP.adminRole] || {})[perm];
  return false;
}

/* ---------- modal / toast ---------- */
function modal(title, body, foot = '', opts = {}) {
  closeModal();
  const el = document.createElement('div'); el.className = 'ov'; el.id = 'ov';
  el.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog"><div class="modal-h"><h3>${title}</h3><button class="x-btn" onclick="closeModal()" aria-label="close">×</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  el.addEventListener('mousedown', e => { if (e.target === el) closeModal(); });
  document.body.appendChild(el); if (opts.mount) opts.mount(el);
}
function closeModal() { const o = $('#ov'); if (o) o.remove(); }
function toast(msg, kind = '') {
  let c = $('.toasts'); if (!c) { c = document.createElement('div'); c.className = 'toasts'; document.body.appendChild(c); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; c.appendChild(t); setTimeout(() => t.remove(), 3400);
}
function confirmBox(msg, onYes, yesLabel) {
  window.__cy = onYes;
  modal(L('تأكيد', 'Confirm'), `<p style="margin:0">${msg}</p>`, `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn bad" onclick="closeModal();window.__cy()">${yesLabel || L('تأكيد', 'Confirm')}</button>`);
}
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const emptyBox = (msg, ic = 'cal') => `<div class="empty">${icon(ic)}<div>${msg}</div></div>`;
const lockedBtn = (label) => `<span class="lock" title="${L('غير مسموح بالصلاحيات الحالية', 'Not allowed by current permissions')}">${icon('lock')} ${label}</span>`;
const statusPill = st => ({
  booked: `<span class="pill navy">${L('محجوزة', 'Scheduled')}</span>`, done: `<span class="pill ok">${L('تمت', 'Done')}</span>`, absent: `<span class="pill bad">${L('غياب', 'Absent')}</span>`,
  cancelled: `<span class="pill gray">${L('ملغاة', 'Cancelled')}</span>`, open: `<span class="pill gold">${L('متاح', 'Open')}</span>`,
  paid: `<span class="pill ok">${L('مدفوع', 'Paid')}</span>`, partial: `<span class="pill warn">${L('مدفوع جزئياً', 'Partial')}</span>`, pending: `<span class="pill info">${L('بانتظار التأكيد', 'Pending')}</span>`,
  withdrawn: `<span class="pill bad">${L('منسحب', 'Withdrawn')}</span>`, published: `<span class="pill ok">● ${L('منشور', 'Published')}</span>`, draft: `<span class="pill gray">● ${L('مسودة', 'Draft')}</span>`,
  sent: `<span class="pill ok">${L('أُرسل', 'Sent')}</span>`, scheduled: `<span class="pill info">${L('مجدول', 'Scheduled')}</span>`,
}[st] || st);

/* ---------- navigation ---------- */
function go(view, params = {}) { APP.view = view; APP.params = params; APP.menuOpen = false; render(); window.scrollTo(0, 0); }
function setLang(l) { LANG = l; saveSession(); render(); }
function logout() { delete APP.sessions[APP.portal]; saveSession(); APP.view = 'home'; APP.showAuth = false; render(); }
function switchPortal(p) { location.hash = p === 'student' ? '' : p; if (p === 'student') onHash(); }
function onHash() {
  const h = (location.hash || '').replace('#', '');
  APP.publicPage = null;
  if (h === 'teacher' || h === 'admin') { if (APP.portal !== h) { APP.portal = h; APP.view = 'home'; } }
  else if (h.startsWith('page-')) { APP.publicPage = h.slice(5); }
  else { if (APP.portal !== 'student') { APP.portal = 'student'; APP.view = 'home'; } }
  render();
}
function openPage(slug) { location.hash = 'page-' + slug; }

/* ---------- logo ---------- */
const brandHTML = (sub) => `<div class="brand" onclick="${APP.portal === 'student' ? "go('home')" : "go('home')"}"><img src="${LOGO_EMBLEM}" alt="NEXIUM"><div class="bt"><b>NEXIUM</b><i>FUTURA ACADEMY</i>${sub ? `<span class="tiny muted" style="letter-spacing:0;margin-top:3px">${sub}</span>` : ''}</div></div>`;

/* ---------- header / sidebar ---------- */
function headerHTML(u) {
  const portalLbl = { student: '', teacher: L('بوابة المدرس', 'Teacher portal'), admin: L('لوحة الإدارة', 'Admin panel') }[APP.portal];
  const unread = APP.portal === 'student' ? D.emails.filter(e => e.to === u.email && e.status === 'sent' && !e.read).length : 0;
  const sub = APP.portal === 'student' ? `${u.name} · ${gradeName(u.grade)}` : APP.portal === 'teacher' ? L('مدرس', 'Teacher') : roleName(APP.adminRole);
  const name = APP.portal === 'teacher' ? tName(u) : (APP.portal === 'student' ? u.parent : u.name);
  const country = APP.portal === 'student' ? countryBy(u.country) : null;
  return `<header class="hdr"><div class="hdr-in">
    <button class="iconbtn menu-btn" onclick="APP.menuOpen=!APP.menuOpen;render()">${icon('menu')}</button>
    ${brandHTML(portalLbl)}
    <div class="contact hide-m">${icon('phone')} ${L('واتساب', 'WhatsApp')} <span class="num">${esc(D.social.whatsapp)}</span><br>${icon('mail')} <span class="num">${esc(D.social.email)}</span></div>
    <div class="sp"></div>
    <div class="tools">
      ${APP.portal === 'student' ? `<span class="sim hide-m" title="${L('في النسخة الحقيقية الدولة بتتحدد من الـ IP تلقائياً', 'In production the country is detected from IP')}">${icon('globe')} ${country.flag} ${L(country.ar, country.en)} · ${country.cur}</span>` : ''}
      ${themeBtn()}<button class="iconbtn lang" onclick="setLang('${LANG === 'ar' ? 'en' : 'ar'}')" title="Language">${LANG === 'ar' ? 'EN' : 'ع'}</button>
      ${APP.portal === 'student' ? `<button class="iconbtn" onclick="S_inbox()" title="${L('الإيميلات والتنبيهات', 'Emails & alerts')}">${icon('bell')}${unread ? `<span class="dot">${unread}</span>` : ''}</button>
      <button class="iconbtn hide-xs" onclick="go('chat')" title="${L('الرسائل', 'Messages')}">${icon('chat')}</button>` : ''}
      <div class="me" onclick="go('${APP.portal === 'admin' ? 'overview' : 'settings'}')"><span class="av" style="background:${safeColor(u.color)}">${esc(initials(name))}</span><div class="tx"><div class="nm">${esc(name)}</div><div class="rl">${esc(sub)}</div></div></div>
      <button class="btn sm ghost hdr-out" onclick="logout()" title="${L('تسجيل الخروج', 'Log out')}">${icon('logout')}<span class="hide-m">${L('خروج', 'Log out')}</span></button>
    </div></div></header>`;
}
function sideHTML(items, tag) {
  return `${APP.menuOpen ? '<div class="side-ov" onclick="APP.menuOpen=false;render()"></div>' : ''}<aside class="side ${APP.menuOpen ? 'open' : ''}">${tag ? `<div class="portal-tag">${tag}</div>` : ''}${items.map(it => it.grp ? `<div class="grp">${it.grp}</div>` :
    `<a class="it ${APP.view === it.v ? 'on' : ''}" onclick="go('${it.v}')">${icon(it.i)}<span>${it.t}</span>${it.b ? `<span class="bdg">${it.b}</span>` : ''}</a>`).join('')}
    <div class="grp"></div><a class="it" onclick="toggleTheme()">${icon(isDark() ? 'sun' : 'moon')}<span>${isDark() ? L('الوضع النهاري', 'Light mode') : L('الوضع الليلي', 'Dark mode')}</span></a><a class="it" onclick="changePassword()">${icon('lock')}<span>${L('تغيير كلمة المرور', 'Change password')}</span></a><a class="it" onclick="logout()">${icon('logout')}<span>${L('تسجيل الخروج', 'Log out')}</span></a></aside>`;
}
/* ---------- change password (all portals) ---------- */
function changePassword() {
  APP.menuOpen = false; const s = document.querySelector('.side'); if (s) s.classList.remove('open');
  modal(L('تغيير كلمة المرور', 'Change password'), `<div class="field"><label>${L('كلمة المرور الجديدة', 'New password')}</label><input class="input" type="password" id="cp_new" dir="ltr" autocomplete="new-password" placeholder="${L('8 أحرف على الأقل – حروف وأرقام', '8+ characters – letters and numbers')}"></div>
    <div class="field"><label>${L('تأكيد كلمة المرور', 'Confirm password')}</label><input class="input" type="password" id="cp_new2" dir="ltr" onkeydown="if(event.key==='Enter')savePassword()"></div>
    <div class="tiny muted">${L('استخدم حروف وأرقام ورموز عشان تبقى أقوى.', 'Mix letters, numbers and symbols for a stronger password.')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="savePassword()">${L('حفظ', 'Save')}</button>`);
  setTimeout(() => $('#cp_new')?.focus(), 50);
}
async function savePassword() {
  const p = val('cp_new'), p2 = val('cp_new2');
  if (pwProblem(p)) return toast(pwProblem(p), 'bad');
  if (p !== p2) return toast(L('كلمتين المرور مش متطابقين', 'Passwords do not match'), 'bad');
  if (IS_LIVE) { const { error } = await LIVE.sb.auth.updateUser({ password: p }); if (error) return toast(liveErr(error.message), 'bad'); }
  else { const u = currentUser(); if (u) { u.pass = p; save(); } }
  closeModal(); toast(L('تم تغيير كلمة المرور ✓', 'Password changed ✓'), 'ok');
}
/* ---------- logos & images uploaded by the admin ---------- */
const payBadge = (m, dark) => safeImg(m.logo) ? `<span class="pay-logo" title="${esc(L(m.ar, m.en))}"><img src="${esc(safeImg(m.logo))}" alt="${esc(L(m.ar, m.en))}"></span>` : `<span class="pill" style="background:#fff;color:var(--navy);${dark ? 'border:1px solid var(--line)' : ''}">${icon(m.id === 'bank' ? 'card' : 'wallet')} ${L(m.ar, m.en)}</span>`;
function fileToDataURL(file, max = 160, type = 'image/png', q = 0.85) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error(L('اختار ملف صورة (PNG / JPG / SVG)', 'Choose an image file (PNG / JPG / SVG)')));
    const fr = new FileReader(); fr.onerror = () => rej(new Error('read')); fr.onload = () => {
      const img = new Image(); img.onerror = () => rej(new Error(L('الصورة مش مقروءة', 'Unreadable image')));
      img.onload = () => { const r = Math.min(1, max / Math.max(img.width || max, img.height || max)); const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round((img.width || max) * r)); c.height = Math.max(1, Math.round((img.height || max) * r));
        const x = c.getContext('2d'); if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL(type, q)); };
      img.src = fr.result; }; fr.readAsDataURL(file);
  });
}
const waNum = () => { let d = String(D.social.whatsapp || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = '2' + d; return d; };
const waBtn = () => `<a class="wa" href="https://wa.me/${waNum()}" target="_blank" rel="noopener">${bicon('whatsapp', 22)}<span>${L('تواصل معنا', 'Chat with us')}</span></a>`;

/* ---------- footer ---------- */
function footerHTML() {
  const pages = D.pages.filter(p => p.status === 'published' && p.footer);
  const soc = ['facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin'].filter(k => D.social[k]);
  const methods = D.methods.filter(m => m.on);
  const waLink = 'https://wa.me/' + waNum();
  return `<footer style="background:var(--navy-deep);color:#C9D3EE;margin-top:40px;border-radius:40px 40px 0 0">
    <div style="max-width:1150px;margin:0 auto;padding:40px 24px 18px;display:grid;grid-template-columns:1.1fr 1.3fr 1fr;gap:30px" class="foot-grid">
      <div><h3 style="color:var(--gold-2);margin-bottom:14px">${L('روابط مهمة', 'Useful links')}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px">${pages.map(p => `<a style="color:#E4E9F6;text-decoration:none;cursor:pointer;font-size:13.5px" onclick="openPage('${p.slug}')">• ${esc(p.title[LANG] || p.title.ar)}</a>`).join('') || `<span class="small">${L('لا توجد صفحات منشورة', 'No published pages')}</span>`}</div></div>
      <div style="text-align:center"><img src="${LOGO_FULL}" alt="NEXIUM FUTURA ACADEMY" style="width:110px;border-radius:14px;background:#fff;padding:4px"><p style="font-size:13.5px;line-height:1.8;margin:12px auto 0;max-width:420px">${esc(D.footerAbout[LANG] || '')}</p></div>
      <div><h3 style="color:var(--gold-2);margin-bottom:14px">${L('طرق الدفع', 'Payment methods')}</h3><div class="chips">${methods.map(m => payBadge(m)).join('')}</div>${typeof HOME === 'function' && safeImg(HOME().payLogos) ? `<div class="pay-logos"><img src="${esc(safeImg(HOME().payLogos))}" alt="${L('وسائل الدفع', 'Payment methods')}" loading="lazy"></div>` : ''}
        <h3 style="color:var(--gold-2);margin:18px 0 10px">${L('الدعم', 'Support')}</h3><div class="small">${L('من السبت للخميس 9 ص – 11 م', 'Sat–Thu 9 AM – 11 PM')}</div></div>
    </div>
    <div style="border-top:1px dashed rgba(255,255,255,.2);border-bottom:1px dashed rgba(255,255,255,.2);padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px">
      <div class="row" style="justify-content:center">
        <a href="${waLink}" target="_blank" rel="noopener" class="btn sm ghost" style="color:#fff;border-color:rgba(255,255,255,.35)">${bicon('whatsapp', 15)} ${L('واتساب', 'WhatsApp')} <span class="num">${esc(D.social.whatsapp)}</span></a>
        <span class="btn sm ghost" style="color:#fff;border-color:rgba(255,255,255,.35);cursor:default">${icon('phone')} <span class="num">${esc(D.social.phone)}</span></span>
        <a href="${esc(safeUrl('mailto:' + D.social.email, { allowMail: true }))}" class="btn sm ghost" style="color:#fff;border-color:rgba(255,255,255,.35)">${icon('mail')} ${esc(D.social.email)}</a>
      </div>
      <div class="row" style="justify-content:center;gap:8px">${soc.filter(k => safeUrl(D.social[k])).map(k => { const lg = safeImg((D.social.logos || {})[k]); return `<a href="${esc(safeUrl(D.social[k]))}" target="_blank" rel="noopener noreferrer" title="${k}" class="soc-ic ${lg ? 'has-logo' : ''}">${lg ? `<img src="${esc(lg)}" alt="${k}">` : bicon(k, 17)}</a>`; }).join('')}</div>
    </div>
    <div style="text-align:center;padding:14px;font-size:12.5px">${L('جميع الحقوق محفوظة', 'All rights reserved')} © NEXIUM FUTURA ACADEMY <span class="num">${new Date().getFullYear()}</span></div>
  </footer><style>@media(max-width:860px){.foot-grid{grid-template-columns:1fr!important;text-align:center}}</style>`;
}

/* ---------- public page view ---------- */
function renderPublicPage(slug) {
  const p = D.pages.find(x => x.slug === slug);
  const ok = p && (p.status === 'published' || APP.sessions.admin);
  return `<div style="background:var(--surface);border-bottom:1px solid var(--line)"><div class="hdr-in" style="max-width:1150px;margin:0 auto">${brandHTML()}<div class="sp" style="flex:1"></div>
    ${themeBtn()}<button class="iconbtn lang" onclick="setLang('${LANG === 'ar' ? 'en' : 'ar'}')">${LANG === 'ar' ? 'EN' : 'ع'}</button>
    <button class="btn ghost sm" onclick="history.length>1?history.back():switchPortal('student')">${L('رجوع', 'Back')}</button></div></div>
    <div style="max-width:880px;margin:30px auto;padding:0 18px">
    ${ok ? `${p.status !== 'published' ? `<div class="notice warn" style="margin-bottom:14px">${L('معاينة: الصفحة دي مسودة ولسه مش ظاهرة للزوار', 'Preview: this page is a draft and is hidden from visitors')}</div>` : ''}
      <div class="card" style="padding:30px"><div class="crumbs">${L('الرئيسية', 'Home')} › ${esc(p.title[LANG] || p.title.ar)}</div><h1 style="margin-bottom:16px">${esc(p.title[LANG] || p.title.ar)}</h1><div class="page-body">${cleanHTML(p.body[LANG] || p.body.ar)}</div></div>`
      : `<div class="card">${emptyBox(L('الصفحة غير موجودة أو غير منشورة', 'Page not found or not published'), 'page')}</div>`}
    </div>${footerHTML()}${waBtn()}<style>.page-body h2{margin:18px 0 8px}.page-body h3{margin:16px 0 6px}.page-body p,.page-body li{line-height:1.9}</style>`;
}

/* ---------- auth ---------- */
const AUTH = { mode: 'login', err: '', form: {}, bad: [] };
const fv = k => esc(AUTH.form[k] || '');
const fBad = k => AUTH.bad.includes(k) ? 'bad-field' : '';
// keeps what the visitor typed when the form re-draws, and returns which required fields are missing
function authKeep() {
  ['r_parent', 'r_name', 'r_email', 'r_phone', 'r_country', 'r_stage', 'r_grade', 'r_pass', 'l_email'].forEach(k => { const e = document.getElementById(k); if (e) AUTH.form[k] = e.value; });
  const labels = { r_parent: L('اسم ولي الأمر', 'Parent name'), r_name: L('اسم الطالب', 'Student name'), r_email: L('البريد الإلكتروني', 'Email'), r_phone: L('رقم الموبايل', 'Mobile number'), r_pass: L('كلمة المرور', 'Password') };
  AUTH.bad = Object.keys(labels).filter(k => document.getElementById(k) && !String(AUTH.form[k] || '').trim());
  if (document.getElementById('r_phone') && AUTH.form.r_phone && AUTH.form.r_phone.replace(/\D/g, '').length < 8) AUTH.bad.push('r_phone');
  if (document.getElementById('r_pass') && AUTH.form.r_pass && pwProblem(AUTH.form.r_pass)) AUTH.bad.push('r_pass');
  if (document.getElementById('r_email') && AUTH.form.r_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(AUTH.form.r_email.trim())) AUTH.bad.push('r_email');
  AUTH.bad = [...new Set(AUTH.bad)];
  return AUTH.bad.map(k => labels[k]);
}
function authMissingMsg(list) { return L('من فضلك راجع الخانات المعلّمة بالأحمر: ', 'Please check the fields marked in red: ') + list.join('، '); }
function authHTML() {
  const P = APP.portal;
  if (P === 'student' && !APP.showAuth && typeof landingHTML === 'function') return landingHTML();
  const art = `<div class="art"><div><img src="${LOGO_FULL}" style="width:120px;border-radius:16px;background:#fff;padding:4px" alt="logo">
    <h1>${P === 'student' ? L('تعليم بلا حدود،<br><em>لكل المراحل والمواد</em>', 'Learning without limits,<br><em>every stage, every subject</em>') : P === 'teacher' ? L('بوابة <em>المدرس</em>', 'Teacher <em>portal</em>') : L('لوحة <em>الإدارة</em>', 'Admin <em>panel</em>')}</h1>
    <p>${P === 'student' ? L('حصص مباشرة مع أفضل المدرسين من KG حتى الثانوية، ومتابعة كاملة لولي الأمر: الحضور، الواجبات، التقييم والشهادات.', 'Live sessions with top teachers from KG to secondary, and full parent follow-up: attendance, homework, evaluation and certificates.') : P === 'teacher' ? L('نظّم مواعيدك، سجّل الحضور، صحّح الواجبات وقيّم طلابك من مكان واحد.', 'Manage your times, attendance, homework and evaluations in one place.') : L('تحكم كامل في الصلاحيات، المدرسين، الطلاب، المدفوعات وصافي الربح.', 'Full control over permissions, teachers, students, payments and net profit.')}</p>
    <div class="art-img">${D.social && safeImg(D.social.authImage) ? `<img src="${esc(safeImg(D.social.authImage))}" alt="">` : AUTH_ART}</div>
    ${P === 'student' ? `<div class="feats"><div><b>${L('4 مراحل', '4 stages')}</b>${L('KG · ابتدائي · إعدادي · ثانوي', 'KG · Primary · Prep · Secondary')}</div><div><b>${L('بدون تعارض', 'No clashes')}</b>${L('احجز من المواعيد المتاحة فقط', 'Book only free times')}</div><div><b>${L('تقارير لولي الأمر', 'Parent reports')}</b>${L('حضور · تفاعل · واجب · التزام', 'Attendance · engagement · homework')}</div><div><b>${L('بعملة بلدك', 'Your currency')}</b>${L('ريال · جنيه · درهم · دينار', 'SAR · EGP · AED · KWD')}</div></div>` : ''}</div>
    <div class="small" style="opacity:.7;position:relative;z-index:1">© NEXIUM FUTURA ACADEMY</div></div>`;
  let form = '';
  if (P === 'student' && AUTH.mode === 'register') {
    form = `<h2 style="text-align:center">${L('إنشاء حساب جديد', 'Create an account')}</h2><p class="muted small" style="text-align:center;margin:4px 0 10px">${L('بيانات ولي الأمر والطالب', 'Parent and student details')}</p>
      ${socialProviders().length ? `<div class="social">${socialProviders().map(socialBtn).join('')}</div><div class="or">${L('أو بالإيميل', 'or with email')}</div>` : ''}
      <div class="form-grid"><div class="field"><label class="req">${L('اسم ولي الأمر', 'Parent name')}</label><input class="input ${fBad('r_parent')}" id="r_parent" value="${fv('r_parent')}"></div><div class="field"><label class="req">${L('اسم الطالب', 'Student name')}</label><input class="input ${fBad('r_name')}" id="r_name" value="${fv('r_name')}"></div></div>
      <div class="field"><label class="req">${L('البريد الإلكتروني', 'Email')}</label><input class="input ${fBad('r_email')}" id="r_email" type="email" dir="ltr" value="${fv('r_email')}"></div>
      <div class="form-grid"><div class="field"><label class="req">${L('رقم الموبايل', 'Mobile number')}</label><input class="input ${fBad('r_phone')}" id="r_phone" dir="ltr" placeholder="05xxxxxxxx" value="${fv('r_phone')}"></div>
      <div class="field"><label class="req">${L('الدولة', 'Country')}</label><select class="input" id="r_country">${D.countries.map(c => `<option value="${c.code}" ${c.code === (AUTH.form.r_country || VISITOR_COUNTRY) ? 'selected' : ''}>${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select></div></div>
      <div class="form-grid"><div class="field"><label class="req">${L('المرحلة', 'Stage')}</label><select class="input" id="r_stage" onchange="document.getElementById('r_grade').innerHTML=gradeOpts(this.value)">${STAGES.filter(s => s.id !== 'summer').map(s => `<option value="${s.id}" ${s.id === (AUTH.form.r_stage || 'kg') ? 'selected' : ''}>${L(s.ar, s.en)}</option>`).join('')}</select></div>
      <div class="field"><label class="req">${L('الصف', 'Grade')}</label><select class="input" id="r_grade">${gradeOpts(AUTH.form.r_stage || 'kg', AUTH.form.r_grade)}</select></div></div>
      <div class="field"><label class="req">${L('كلمة المرور', 'Password')}</label><input class="input ${fBad('r_pass')}" id="r_pass" type="password" dir="ltr" autocomplete="new-password" placeholder="${L('8 أحرف على الأقل – حروف وأرقام', '8+ characters – letters and numbers')}" value="${fv('r_pass')}"></div>
      ${AUTH.err ? `<div class="notice bad" style="margin-bottom:10px">${AUTH.err}</div>` : ''}
      <button class="btn gold block" onclick="A_register()">${L('إنشاء الحساب', 'Create account')}</button>
      <p class="small" style="text-align:center;margin-top:12px">${L('عندك حساب؟', 'Have an account?')} <button class="btn link" onclick="AUTH.mode='login';AUTH.err='';render()">${L('سجّل دخول', 'Log in')}</button></p>`;
  } else {
    const demo = P === 'student' ? D.students.filter(s => s.active).slice(0, 3).map(s => `<button class="btn sm ghost" onclick="A_demoLogin('${s.id}')">${esc(s.name)}</button>`).join('')
      : P === 'teacher' ? D.teachers.slice(0, 4).map(t => `<button class="btn sm ghost" onclick="A_demoLogin('${t.id}')">${esc(tName(t))}</button>`).join('')
        : D.staff.map(a => `<button class="btn sm ghost" onclick="A_demoLogin('${a.id}')">${roleName(a.role)}</button>`).join('');
    form = `<h2 style="text-align:center">${P === 'student' ? L('تسجيل الدخول', 'Log in') : P === 'teacher' ? L('دخول المدرس', 'Teacher login') : L('دخول الإدارة', 'Admin login')}</h2>
      ${P === 'student' && socialProviders().length ? `<div class="social">${socialProviders().map(socialBtn).join('')}</div><div class="or">${L('أو', 'or')}</div>` : '<div style="height:16px"></div>'}
      <div class="field"><label>${L('البريد الإلكتروني', 'Email')}</label><input class="input" id="l_email" dir="ltr" type="email" value="${fv('l_email')}"></div>
      <div class="field"><label>${L('كلمة المرور', 'Password')}</label><input class="input" id="l_pass" dir="ltr" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')A_login()"></div>
      ${AUTH.err ? `<div class="notice bad" style="margin-bottom:10px">${AUTH.err}</div>` : ''}
      <button class="btn block" onclick="A_login()">${L('دخول', 'Log in')}</button>
      ${IS_LIVE ? `<div class="row between small" style="margin-top:10px"><button class="btn link" onclick="liveForgot()">${L('نسيت كلمة المرور؟', 'Forgot password?')}</button>${P !== 'student' ? `<button class="btn link" onclick="liveActivate()">${L('تفعيل الحساب لأول مرة', 'First-time activation')}</button>` : ''}</div>` : ''}
      ${IS_LIVE && LIVE.profile && portalForRole(LIVE.profile.role) !== P ? `<div class="notice info" style="margin-top:12px">${L('إنت داخل بحساب', 'You are signed in as')} <b>${roleName(LIVE.profile.role) || L('طالب', 'student')}</b>. <button class="btn link" onclick="switchPortal('${portalForRole(LIVE.profile.role)}')">${L('افتح بوابتك', 'Open your portal')}</button> · <button class="btn link" onclick="logout()">${L('خروج', 'Log out')}</button></div>` : ''}
      ${P === 'student' ? `<p class="small" style="text-align:center;margin-top:12px">${L('مستخدم جديد؟', 'New here?')} <button class="btn link" onclick="AUTH.mode='register';AUTH.err='';render()">${L('أنشئ حساب', 'Create an account')}</button></p>` : ''}
      ${IS_LIVE ? '' : `<div class="demo-box"><b>${L('دخول سريع للتجربة', 'Quick demo login')}</b> <span class="muted">(${L('كلمة المرور لكل الحسابات: 123456', 'password for all: 123456')})</span><div class="row">${demo}</div></div>`}`;
  }
  const portals = `<div class="portal-switch"><span class="small muted">${L('روابط منفصلة:', 'Separate links:')}</span>
    <button class="btn sm ${P === 'student' ? '' : 'ghost'}" onclick="switchPortal('student')">${L('الطالب / ولي الأمر', 'Student / parent')}</button>
    <button class="btn sm ${P === 'teacher' ? '' : 'ghost'}" onclick="switchPortal('teacher')">${L('المدرس', 'Teacher')} <span class="num tiny">#teacher</span></button>
    <button class="btn sm ${P === 'admin' ? '' : 'ghost'}" onclick="switchPortal('admin')">${L('الإدارة', 'Admin')} <span class="num tiny">#admin</span></button></div>`;
  return `<div class="auth">${art}<div class="frm"><div class="box"><div class="row between" style="margin-bottom:6px">${P === 'student' ? `<button class="btn sm ghost" onclick="APP.showAuth=false;render();window.scrollTo(0,0)">${LANG === 'ar' ? '→' : '←'} ${L('الصفحة الرئيسية', 'Home page')}</button>` : '<span></span>'}<div class="row" style="gap:6px">${themeBtn()}<button class="btn sm ghost" onclick="setLang('${LANG === 'ar' ? 'en' : 'ar'}')">${icon('globe')} ${LANG === 'ar' ? 'English' : 'العربية'}</button></div></div>
    <img src="${LOGO_FULL}" class="logo-full" alt="logo">${form}${portals}</div></div></div>${P === 'student' ? footerHTML() : ''}${waBtn()}`;
}
const socialProviders = () => IS_LIVE ? (typeof SOCIAL_LOGIN !== 'undefined' ? SOCIAL_LOGIN : []) : ['google', 'facebook', 'apple'];
const PROVIDER_NAME = { google: 'Google', facebook: 'Facebook', apple: 'Apple' };
const socialBtn = p => p === 'apple' ? `<button class="apple-btn" onclick="A_social('apple')">Apple</button>` : `<button onclick="A_social('${p}')">${bicon(p, 16)} ${PROVIDER_NAME[p] || p}</button>`;
const gradeOpts = (st, sel) => (STAGES.find(s => s.id === st) || { grades: [] }).grades.map(g => `<option value="${g}" ${g === sel ? 'selected' : ''}>${gradeName(g)}</option>`).join('');
function A_login() {
  authKeep(); AUTH.bad = [];
  const em = val('l_email').toLowerCase(), pw = val('l_pass');
  let u = null;
  if (APP.portal === 'student') u = D.students.find(s => s.email.toLowerCase() === em && s.pass === pw);
  else if (APP.portal === 'teacher') u = D.teachers.find(t => t.email.toLowerCase() === em && (t.pass || '123456') === pw);
  else u = D.staff.find(a => a.email.toLowerCase() === em && (a.pass || '123456') === pw);
  if (!u) { AUTH.err = L('البريد أو كلمة المرور غير صحيحة', 'Wrong email or password'); return render(); }
  if (u.active === false) { AUTH.err = L('الحساب موقوف – تواصل مع الإدارة', 'Account suspended – contact admin'); return render(); }
  A_demoLogin(u.id);
}
function A_demoLogin(id) {
  APP.sessions[APP.portal] = id; AUTH.err = '';
  if (APP.portal === 'admin') APP.adminRole = D.staff.find(a => a.id === id).role;
  saveSession(); APP.view = APP.portal === 'admin' ? 'overview' : 'home'; render();
}
function A_social(p) {
  const nm = PROVIDER_NAME[p] || p;
  modal(L('الدخول عن طريق ', 'Continue with ') + nm, `<div class="notice info" style="margin-bottom:12px">${L('في النسخة الحقيقية هتفتح نافذة ' + nm + ' للموافقة. رقم الموبايل إجباري، فهنطلبه بعد الدخول.', 'In production a ' + nm + ' window opens. A mobile number is required, so we ask for it after sign-in.')}</div>
    <div class="field"><label class="req">${L('اسم ولي الأمر', 'Parent name')}</label><input class="input" id="so_parent" value="${p === 'google' ? 'Khaled Mostafa' : ''}"></div>
    <div class="field"><label class="req">${L('اسم الطالب', 'Student name')}</label><input class="input" id="so_name"></div>
    <div class="field"><label class="req">${L('البريد', 'Email')} (${nm})</label><input class="input" id="so_email" dir="ltr" value="new.parent@${p === 'google' ? 'gmail' : p === 'apple' ? 'icloud' : 'outlook'}.com"></div>
    <div class="field"><label class="req">${L('رقم الموبايل', 'Mobile number')}</label><input class="input" id="so_phone" dir="ltr"></div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="A_socialDone('${p}')">${L('متابعة', 'Continue')}</button>`);
}
function A_socialDone(p) {
  const parent = val('so_parent'), name = val('so_name'), email = val('so_email'), phone = val('so_phone');
  if (!parent || !name || !email || phone.replace(/\D/g, '').length < 8) return toast(L('أكمل البيانات ورقم الموبايل صحيح', 'Fill all fields with a valid mobile'), 'bad');
  const ex = D.students.find(s => s.email.toLowerCase() === email.toLowerCase());
  const s = ex || { id: uid('s'), name, parent, email, phone, country: VISITOR_COUNTRY, stage: 'pri', grade: 'G1', pass: '', confirmed: true, provider: p, active: true, joined: new Date().toISOString() };
  if (!ex) D.students.push(s); save(); closeModal(); A_demoLogin(s.id); toast(L('تم الدخول بنجاح', 'Signed in'), 'ok');
}
function A_register() {
  const miss = authKeep(); if (miss.length) { AUTH.err = authMissingMsg(miss); return render(); }
  const f = { parent: val('r_parent'), name: val('r_name'), email: val('r_email'), phone: val('r_phone'), country: val('r_country'), stage: val('r_stage'), grade: val('r_grade'), pass: val('r_pass') };
  if (!f.parent || !f.name || !f.email || !f.phone || !f.pass) AUTH.err = L('كل الحقول المعلّمة بـ * مطلوبة', 'All * fields are required');
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) AUTH.err = L('البريد الإلكتروني غير صحيح', 'Invalid email');
  else if (f.phone.replace(/\D/g, '').length < 8) AUTH.err = L('رقم الموبايل غير صحيح', 'Invalid mobile number');
  else if (pwProblem(f.pass)) AUTH.err = pwProblem(f.pass);
  else if (D.students.some(s => s.email.toLowerCase() === f.email.toLowerCase())) AUTH.err = L('البريد مسجّل بالفعل', 'Email already registered');
  else {
    const s = { id: uid('s'), ...f, confirmed: false, provider: 'email', active: true, joined: new Date().toISOString() };
    D.students.push(s);
    D.emails.push({ id: uid('em'), to: s.email, type: 'confirm', subject: 'أكّد بريدك الإلكتروني – NEXIUM FUTURA ACADEMY', body: `مرحباً ${s.parent}،\nاضغط على الرابط لتأكيد حسابك وتفعيل الحجز.`, at: new Date().toISOString(), status: 'sent' });
    save(); AUTH.mode = 'login'; A_demoLogin(s.id); toast(L('تم إنشاء الحساب – أرسلنا رسالة تأكيد لبريدك', 'Account created – confirmation email sent'), 'ok'); return;
  }
  render();
}

/* ---------- small chart helpers ---------- */
function donut(parts, center, sub) {
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1; let acc = 0;
  const grad = parts.map(p => { const s = acc / tot * 360; acc += p.v; return `${p.c} ${s}deg ${acc / tot * 360}deg`; }).join(',');
  return `<div class="row" style="gap:22px;align-items:center"><div class="donut" style="background:conic-gradient(${grad || '#eee 0 360deg'})"><span>${center}<small>${sub || ''}</small></span></div>
    <div class="legend">${parts.map(p => `<div><i style="background:${p.c}"></i>${esc(p.l)} — <b class="num">${p.v}</b> <span class="muted small">(${Math.round(p.v / tot * 100)}%)</span></div>`).join('')}</div></div>`;
}
const PAL = ['#0B2463', '#D4A12A', '#1F9D6B', '#D64545', '#2F6FDB', '#7B3FA0', '#C2410C', '#66708A'];
function hbars(rows, fmt) {
  const max = Math.max(1, ...rows.map(r => Math.abs(r.v)));
  return `<div class="hbars">${rows.map(r => `<div class="hb"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(r.l)}">${esc(r.l)}</span><div class="bar ${r.cls || ''}"><i style="width:${Math.abs(r.v) / max * 100}%;${r.v < 0 ? 'background:var(--bad)' : ''}"></i></div><b class="${r.v < 0 ? 'neg' : ''}" style="text-align:end;font-size:12.5px">${fmt ? fmt(r.v) : r.v}</b></div>`).join('')}</div>`;
}
function monthCal(year, month, eventsByDay, opts = {}) {
  const first = new Date(year, month, 1); const startWd = first.getDay(); const days = new Date(year, month + 1, 0).getDate();
  const names = LANG === 'ar' ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let h = names.map(n => `<div class="dn">${n}</div>`).join('');
  const todayK = ymd(new Date());
  const cells = Math.ceil((startWd + days) / 7) * 7;
  for (let i = 0; i < cells; i++) {
    const d = new Date(year, month, 1 - startWd + i); const k = ymd(d); const out = d.getMonth() !== month;
    const evs = eventsByDay[k] || [];
    h += `<div class="c ${out ? 'out' : ''} ${k === todayK ? 'today' : ''}" ${opts.onDay ? `ondblclick="${opts.onDay}('${k}')"` : ''}><span class="n num">${d.getDate()}</span>${evs.slice(0, 4).map(e => `<span class="ev ${e.cls}" onclick="${e.on || ''}" title="${esc(e.title || e.t)}">${esc(e.t)}</span>`).join('')}${evs.length > 4 ? `<span class="tiny muted">+${evs.length - 4}</span>` : ''}</div>`;
  }
  return `<div class="mcal">${h}</div>`;
}
const calState = k => ({ TCAL: typeof TCAL !== 'undefined' ? TCAL : null, SCAL: typeof SCAL !== 'undefined' ? SCAL : null, ACAL: typeof ACAL !== 'undefined' ? ACAL : null })[k];
function calNav(stateKey, label) {
  return `<div class="row between" style="margin-bottom:12px"><div class="row"><button class="btn sm ghost" onclick="${stateKey}.m--;if(${stateKey}.m<0){${stateKey}.m=11;${stateKey}.y--};render()">‹</button><button class="btn sm ghost" onclick="${stateKey}.m++;if(${stateKey}.m>11){${stateKey}.m=0;${stateKey}.y++};render()">›</button><button class="btn sm gold" onclick="${stateKey}.y=new Date().getFullYear();${stateKey}.m=new Date().getMonth();render()">${L('اليوم', 'Today')}</button></div>
    <h2>${new Date(calState(stateKey).y, calState(stateKey).m, 1).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</h2><span class="small muted">${label || ''}</span></div>`;
}
