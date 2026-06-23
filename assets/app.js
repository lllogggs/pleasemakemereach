(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ===== 라우트(언어 드롭다운 동적 생성) =====
  const LANG_ROUTES = [
    { code: 'ko', label: '한국어',  path: '/',     flagEmoji: 'KR' }
  ];
  function pathForLang(code){
    const r = LANG_ROUTES.find(x => x.code === code);
    return r ? r.path : '/';
  }
  function renderLangDropdown() {
    const dropdown = $('#language-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = LANG_ROUTES.map(l => `
      <a href="${l.path}" class="lang-option" data-lang-code="${l.code}">
        <span class="lang-option__flag" aria-hidden="true">${l.flagEmoji}</span> ${l.label}
      </a>
    `).join('');
  }

  // ===== 설정 상수 (원본값으로 복구 확인) =====
  const EXPAND_ENDPOINT = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';
  const LOG_ENDPOINT    = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';

  const DEFAULT_AFF_AFFIX = 'Allianceid=8792540&SID=320640825&promo_referer=4084_9836_1&trip_sub1=&trip_sub3=D18139361';
  const AFFILIATE_AFFIX_MAP = {
    ko: {
      desktop: 'Allianceid=8792540&SID=320640825&promo_referer=4084_9836_1&trip_sub1=&trip_sub3=D18139361',
      mobile: 'Allianceid=8792540&SID=320640825&promo_referer=4084_9836_1&trip_sub1=&trip_sub3=D18139361'
    }
  };

  const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  function getAffiliateAffix(lang = currentLang, deviceIsMobile = isMobileDevice()) {
    const affixByLang = AFFILIATE_AFFIX_MAP[lang];
    if (!affixByLang) return DEFAULT_AFF_AFFIX;
    return (deviceIsMobile ? affixByLang.mobile : affixByLang.desktop) || DEFAULT_AFF_AFFIX;
  }


  function getAffiliateHomeUrl(lang = currentLang) {
    const base = 'https://kr.trip.com/?curr=KRW';
    return appendAffiliate(base, lang);
  }

  const widgetSrcModal = {
    ko:{ hotel:"https://kr.trip.com/partners/ad/S4477545?Allianceid=8792540&SID=320640825&promo_referer=4084_9836_1&trip_sub1=hotelsearch_b",
         flight:"https://kr.trip.com/partners/ad/S4477048?Allianceid=8792540&SID=320640825&promo_referer=4084_9836_1&trip_sub1=flightsearch_b" }
  };

  const langDetails = {
    ko:{ flagEmoji:'KR', text:'한국어',  privacy:'/privacy_ko.html', code:'KR' }
  };

  // ===== 언어 판별 & 적용 =====
  let currentLang = window.PAGE_LANG || detectLangByPath();

  function detectLangByPath(){
    return 'ko';
  }

  // ===== translations fallback (단축링크 안내 강화) =====
  // 이 단축링크 관련 키는 항상 FALLBACK를 우선 사용(외부 TRANSLATIONS가 있어도 무시)
  const FORCE_FALLBACK_KEYS = new Set([
    'shortlinkTitle','shortlinkLead','shortlinkSteps','shortlinkOpenFull','shortlinkLabel'
  ]);
  const FALLBACK_TEXT = {
    ko: {
      shortlinkLabel: "예약 URL 안내",
      shortlinkTitle: "단축링크는 안 돼요",
      shortlinkLead: "트립닷닷은 <strong>단축 링크</strong>를 인식할 수 없어요.<br>검색 후 생성된 <strong>전체 주소(URL)</strong>를 그대로 붙여주세요.",
      shortlinkSteps:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('ko')}\" target=\"_blank\" rel=\"noopener noreferrer\">예약 사이트 열기</a></li>` +
        "<li>원하는 숙소/상품을 검색</li>" +
        "<li>주소창의 전체 URL을 복사</li>" +
        "<li>위 입력창에 붙여넣기</li></ol>" +
        '<p class=\"shortlink-card__example\">예: https://booking.example/hotels/... 또는 https://booking.example/flights/...</p>',
      shortlinkBody:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('ko')}\" target=\"_blank\" rel=\"noopener noreferrer\">예약 사이트 열기</a></li>` +
        "<li>원하는 숙소/상품을 검색</li>" +
        "<li>주소창의 전체 URL을 복사</li>" +
        "<li>위 입력창에 붙여넣기</li></ol>" +
        '<p class=\"shortlink-card__example\">예: https://booking.example/hotels/... 또는 https://booking.example/flights/...</p>',
      shortlinkOpenFull: "제휴 예약 사이트에서 다시 검색하기",
        redirectingToSearch: "제휴 예약 사이트에서 검색합니다...",
        cityNameIdNotFound: "여행하고자 하는 도시를 입력해주세요",
   },
    en: {
      shortlinkLabel: "Booking URL tips",
      shortlinkTitle: "Short links aren’t supported",
      shortlinkLead: "Tripdotdot can’t read shortened URLs. Please paste the <strong>full address-bar URL</strong> from your booking site search.",
      shortlinkSteps:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('en')}\" target=\"_blank\" rel=\"noopener noreferrer\">Open booking site</a></li>` +
        "<li>Search for the hotel/product you want</li>" +
        "<li>Copy the entire URL from the address bar</li>" +
        "<li>Paste it here to get country links</li></ol>" +
        '<p class=\"shortlink-card__example\">e.g., https://booking.example/hotels/... or https://booking.example/flights/...</p>',
      shortlinkBody:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('en')}\" target=\"_blank\" rel=\"noopener noreferrer\">Open booking site</a></li>` +
        "<li>Search for the hotel/product you want</li>" +
        "<li>Copy the entire URL from the address bar</li>" +
        "<li>Paste it here to get country links</li></ol>" +
        '<p class=\"shortlink-card__example\">e.g., https://booking.example/hotels/... or https://booking.example/flights/...</p>',
      shortlinkOpenFull: "Go to the booking site and search again",
        redirectingToSearch: "Searching on the booking site...",
        cityNameIdNotFound: "City ID for the search term not found. (Please search using a city name registered in the City ID Map.)",
   },
    th: {
      shortlinkLabel: "เคล็ดลับ URL การจอง",
      shortlinkTitle: "ไม่รองรับลิงก์แบบย่อ",
      shortlinkLead: "Tripdotdot อ่านลิงก์แบบย่อไม่ได้ กรุณาวาง<strong>URL แบบเต็มจากแถบที่อยู่</strong>หลังจากค้นหาบนเว็บไซต์จอง",
      shortlinkSteps:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('th')}\" target=\"_blank\" rel=\"noopener noreferrer\">เปิดเว็บไซต์จอง</a></li>` +
        "<li>ค้นหาโรงแรม/สินค้าที่ต้องการ</li>" +
        "<li>คัดลอก URL แบบเต็มจากแถบที่อยู่</li>" +
        "<li>นำมาวางที่นี่เพื่อรับลิงก์ประเทศต่างๆ</li></ol>" +
        '<p class=\"shortlink-card__example\">เช่น https://booking.example/hotels/... หรือ https://booking.example/flights/...</p>',
      shortlinkBody:
        `<ol class=\"shortlink-steps\">` +
        `<li><a href=\"${getAffiliateHomeUrl('th')}\" target=\"_blank\" rel=\"noopener noreferrer\">เปิดเว็บไซต์จอง</a></li>` +
        "<li>ค้นหาโรงแรม/สินค้าที่ต้องการ</li>" +
        "<li>คัดลอก URL แบบเต็มจากแถบที่อยู่</li>" +
        "<li>นำมาวางที่นี่เพื่อรับลิงก์ประเทศต่างๆ</li></ol>" +
        '<p class=\"shortlink-card__example\">เช่น https://booking.example/hotels/... หรือ https://booking.example/flights/...</p>',
      shortlinkOpenFull: "เปิดลิงก์ย่อในเบราว์เซอร์",
        redirectingToSearch: "กำลังค้นหาบนเว็บไซต์จอง...",
        cityNameIdNotFound: "ไม่พบรหัสเมืองสำหรับคำค้นหา (โปรดค้นหาด้วยชื่อเมืองที่มีใน City ID Map)",
   }
  };
  const TL = (key) => {
    const fallback = (FALLBACK_TEXT[currentLang]?.[key]) ?? (FALLBACK_TEXT.en?.[key] ?? key);
    if (FORCE_FALLBACK_KEYS.has(key)) return fallback;
    return (window.TRANSLATIONS?.[currentLang]?.[key]) ?? fallback;
  };

  // 페이지 언어 → 기본 통화 맵(확장)
  const languageToCurrencyMap = {
    ko:'KRW'
  };

  const AGODA_AFFILIATE_CID = '1941957';
  const AGODA_AFFILIATE_PCS = '1';
  const agodaMarkets = [
    { ko:'한국', en:'Korea', th:'เกาหลี', locale:'ko-kr', country:'KR', currency:'KRW', flag:'kr' },
    { ko:'미국', en:'USA', th:'สหรัฐฯ', locale:'en-us', country:'US', currency:'USD', flag:'us' },
    { ko:'일본', en:'Japan', th:'ญี่ปุ่น', locale:'ja-jp', country:'JP', currency:'JPY', flag:'jp' },
    { ko:'태국', en:'Thailand', th:'ไทย', locale:'th-th', country:'TH', currency:'THB', flag:'th' },
    { ko:'싱가포르', en:'Singapore', th:'สิงคโปร์', locale:'en-sg', country:'SG', currency:'SGD', flag:'sg' },
    { ko:'말레이시아', en:'Malaysia', th:'มาเลเซีย', locale:'ms-my', country:'MY', currency:'MYR', flag:'my' },
    { ko:'인도네시아', en:'Indonesia', th:'อินโดนีเซีย', locale:'id-id', country:'ID', currency:'IDR', flag:'id' },
    { ko:'대만', en:'Taiwan', th:'ไต้หวัน', locale:'zh-tw', country:'TW', currency:'TWD', flag:'tw' },
    { ko:'홍콩', en:'Hong Kong', th:'ฮ่องกง', locale:'zh-hk', country:'HK', currency:'HKD', flag:'hk' },
    { ko:'호주', en:'Australia', th:'ออสเตรเลีย', locale:'en-au', country:'AU', currency:'AUD', flag:'au' },
    { ko:'영국', en:'U.K.', th:'สหราชอาณาจักร', locale:'en-gb', country:'GB', currency:'GBP', flag:'gb' },
    { ko:'베트남', en:'Vietnam', th:'เวียดนาม', locale:'vi-vn', country:'VN', currency:'VND', flag:'vn' },
    { ko:'필리핀', en:'Philippines', th:'ฟิลิปปินส์', locale:'en-ph', country:'PH', currency:'PHP', flag:'ph' },
    { ko:'인도', en:'India', th:'อินเดีย', locale:'en-in', country:'IN', currency:'INR', flag:'in' },
    { ko:'캐나다', en:'Canada', th:'แคนาดา', locale:'en-ca', country:'CA', currency:'CAD', flag:'ca' },
    { ko:'프랑스', en:'France', th:'ฝรั่งเศส', locale:'fr-fr', country:'FR', currency:'EUR', flag:'fr' },
    { ko:'독일', en:'Germany', th:'เยอรมนี', locale:'de-de', country:'DE', currency:'EUR', flag:'de' },
    { ko:'스페인', en:'Spain', th:'สเปน', locale:'es-es', country:'ES', currency:'EUR', flag:'es' }
  ];

  // booking site 국가 도메인 리스트 (태국 flag 포함)
  const domains = [
    { ko:'한국',     en:'Korea',        ja:'韓国',      th:'เกาหลี',        code:'kr', flag:'kr' },
    { ko:'미국',     en:'USA',          ja:'アメリカ',  th:'สหรัฐฯ',        code:'us', flag:'us' },
    { ko:'일본',     en:'Japan',        ja:'日本',      th:'ญี่ปุ่น',        code:'jp', flag:'jp' },
    { ko:'스페인',   en:'Spain',        ja:'スペイン',  th:'สเปน',          code:'es', flag:'es' },
    { ko:'프랑스',   en:'France',       ja:'フランス',  th:'ฝรั่งเศส',       code:'fr', flag:'fr' },
    { ko:'베트남',   en:'Vietnam',      ja:'ベトナム',  th:'เวียดนาม',      code:'vn', flag:'vn' },
    { ko:'독일',     en:'Germany',      ja:'ドイツ',    th:'เยอรมนี',       code:'de', flag:'de' },
    { ko:'캐나다',   en:'Canada',       ja:'カナダ',    th:'แคนาดา',        code:'ca', flag:'ca' },
    { ko:'호주',     en:'Australia',    ja:'オーストラリア', th:'ออสเตรเลีย', code:'au', flag:'au' },
    { ko:'네덜란드', en:'Netherlands',  ja:'オランダ',  th:'เนเธอร์แลนด์',  code:'nl', flag:'nl' },
    { ko:'싱가포르', en:'Singapore',    ja:'シンガポール', th:'สิงคโปร์',   code:'sg', flag:'sg' },
    { ko:'인도네시아',en:'Indonesia',   ja:'インドネシア', th:'อินโดนีเซีย', code:'id', flag:'id' },
    { ko:'말레이시아',en:'Malaysia',    ja:'マレーシア', th:'มาเลเซีย',     code:'my', flag:'my' },
    { ko:'대만',     en:'Taiwan',       ja:'台湾',      th:'ไต้หวัน',       code:'tw', flag:'tw' },
    { ko:'인도',     en:'India',        ja:'インド',    th:'อินเดีย',       code:'in', flag:'in' },
    { ko:'멕시코',   en:'Mexico',       ja:'メキシコ',  th:'เม็กซิโก',       code:'mx', flag:'mx' },
    { ko:'영국',     en:'U.K.',         ja:'イギリス',  th:'สหราชอาณาจักร', code:'uk', flag:'gb' },
    { ko:'러시아',   en:'Russia',       ja:'ロシア',    th:'รัสเซีย',       code:'ru', flag:'ru' },
    { ko:'아르헨티나',en:'Argentina',   ja:'アルゼンチン', th:'อาร์เจนตินา', code:'ar', flag:'ar' },
    { ko:'포르투갈', en:'Portugal',     ja:'ポルトガル', th:'โปรตุเกส',    code:'pt', flag:'pt' },
    { ko:'사우디',   en:'Saudi Arabia', ja:'サウジアラビア', th:'ซาอุฯ',  code:'sa', flag:'sa' },
    { ko:'태국',     en:'Thailand',     ja:'タイ',      th:'ไทย',           code:'th', flag:'th' }
  ];

  // ===== IATA → City 맵 로드 (한 번만) =====
  let _iataCityMap = null;
  async function loadIataMapOnce(){
    if (_iataCityMap) return _iataCityMap;
    try{
      const res = await fetch('/data/iata-city.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('iata-city.json fetch failed: ' + res.status);
      _iataCityMap = await res.json();
    }catch(e){
      console.warn('IATA map load failed:', e);
      _iataCityMap = {};
    }
    return _iataCityMap;
  }

// ----------------------------------------------------
// ★ City ID Map 로드 함수 (파일 경로 '/public/data/city-id-map.json'으로 확정)
// ----------------------------------------------------
  let _cityIdMap = null;
  async function loadCityIdMapOnce(){
    if (_cityIdMap) return _cityIdMap;
    try{
      // 고객님께서 확인해주신 경로 '/public/data/city-id-map.json' 사용
      const res = await fetch('/public/data/city-id-map.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('city-id-map.json fetch failed: ' + res.status);
      _cityIdMap = await res.json();
    }catch(e){
      console.warn('City ID map load failed:', e);
      _cityIdMap = {};
    }
    return _cityIdMap;
  }
// ----------------------------------------------------


  // ===== 유틸: /w/ 세그먼트 제거 =====
  function stripWSegments(pathname){
    // 모든 '/w/' 세그먼트를 안전하게 제거 (예: /hotels/w/detail → /hotels/detail)
    return pathname.replace(/\/w\/+/gi, '/');
  }

  // ===== 날짜 포맷 변환 YYYY-MM-DD → YYYY/MM/DD =====
  function ymdToSlash(ymd){
    if (!ymd) return '';
    return ymd.replaceAll('-', '/');
  }

  // ===== 최근 본 링크 관리 =====
  const HISTORY_KEY = 'tripdotdot_history_v1';
  const HISTORY_LIMIT = 10;

  function safeDecodeURIComponent(str){
    if (!str) return '';
    try{
      return decodeURIComponent(str.replace(/\+/g, ' '));
    }catch(_){
      return str;
    }
  }

  function formatHistoryDate(ymd){
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const m = parts[1]?.padStart(2,'0');
      const d = parts[2]?.padStart(2,'0');
      return `${m}/${d}`;
    }
    return ymd;
  }

  function formatHistoryRange(start, end){
    const s = formatHistoryDate(start);
    const e = formatHistoryDate(end);
    if (s && e) return `${s}~${e}`;
    return s || e || '';
  }

  function hotelCityLabel(city){
    if (!city) return '';
    const suffix = TL('historyHotelSuffix') || 'Hotel';
    return `${city} ${suffix}`.trim();
  }

  function cityNameFromCode(code, map){
    if (!code) return '';
    const lower = code.toLowerCase();
    const entry = map?.[lower];
    return (entry && entry.city) ? entry.city : code.toUpperCase();
  }

  async function resolveHotelCityName(params){
    const nameParam = params.get('cityName') || params.get('cityname');
    if (nameParam) {
      const decoded = safeDecodeURIComponent(nameParam).trim();
      if (decoded) return decoded;
    }

    const hCity = params.get('hCity') || params.get('hcity');
    if (hCity) {
      const decoded = safeDecodeURIComponent(hCity).trim();
      if (decoded) return decoded;
    }

    const cityId = params.get('city') || params.get('cityId');
    if (cityId) {
      const map = await loadCityIdMapOnce();
      const mapped = map?.[cityId];
      if (mapped?.city) return mapped.city;
    }

    return '';
  }

  function summarizeHotelName(pathname, params){
    const candidate = params.get('hotelname') || params.get('hotelName') || params.get('name');
    if (candidate) {
      const decoded = safeDecodeURIComponent(candidate).trim();
      if (decoded) return decoded;
    }

    const segments = pathname.split('/').filter(Boolean);
    const hotelIdx = segments.indexOf('hotels');
    if (hotelIdx >= 0) {
      const raw = (segments[hotelIdx+1] === 'detail') ? segments[hotelIdx+2] : segments[hotelIdx+1];
      if (raw) {
        const cleaned = safeDecodeURIComponent(raw).replace(/[-_]+/g,' ').trim();
        if (cleaned) return cleaned;
      }
    }

    return '';
  }

  function nextHotelFallbackLabel(existingItems){
    const hotelCount = existingItems.filter(i => i && (i.type === 'hotel' || i.emoji === '🏨')).length + 1;
    const template = TL('historyHotelNumbered') || TL('historyHotelFallback');
    return String(template).replace('{n}', hotelCount);
  }

  function loadHistoryItems(){
    try{
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    }catch(e){
      console.warn('History load failed', e);
      return [];
    }
  }

  function persistHistory(items){
    try{
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
    }catch(e){
      console.warn('History save failed', e);
    }
  }

  function renderHistory(){
    const list = $('#history-list');
    const empty = $('#history-empty');
    if (!list || !empty) return;

    const entries = loadHistoryItems();
    list.innerHTML = '';

    if (!entries.length){
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    entries.forEach(entry => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-item';
      btn.setAttribute('role','listitem');
      btn.addEventListener('click', () => {
        const inputEl = $('#inputUrl');
        if (inputEl) {
          inputEl.value = entry.url;
          window.generateLinks();
          inputEl.focus();
        }
      });

      const emoji = document.createElement('span');
      emoji.className = 'history-emoji';
      emoji.textContent = entry.emoji || '🔗';

      const textWrap = document.createElement('div');
      textWrap.className = 'history-text';

      const title = document.createElement('p');
      title.className = 'history-title';
      title.textContent = entry.title || entry.url;
      textWrap.appendChild(title);

      if (entry.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'history-subtitle';
        subtitle.textContent = entry.subtitle;
        textWrap.appendChild(subtitle);
      }

      btn.appendChild(emoji);
      btn.appendChild(textWrap);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'history-remove';
      removeBtn.setAttribute('aria-label', TL('historyRemove'));
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        removeHistoryItem(entry.url);
      });

      btn.appendChild(removeBtn);
      list.appendChild(btn);
    });
  }

  function removeHistoryItem(url){
    const filtered = loadHistoryItems().filter(i => i.url !== url);
    persistHistory(filtered);
    renderHistory();
  }

  async function addHistoryFromUrl(input, urlObj, category){
    if (!urlObj) return;

    const params = new URLSearchParams(urlObj.search);
    const pathname = stripWSegments(urlObj.pathname);
    const base = { url: input, ts: Date.now() };
    const existingItems = loadHistoryItems().filter(i => i.url !== input);
    let entry = { ...base, emoji:'🔗', title: input, subtitle:'' };

    if (pathname.includes('/flights') || category === 'Flight') {
      const map = await loadIataMapOnce();
      const dcity = params.get('dcity') || params.get('dcitycode');
      const acity = params.get('acity') || params.get('acitycode');
      const departDate = params.get('ddate') || '';
      const returnDate = params.get('rdate') || params.get('adate') || '';

      const depName = cityNameFromCode(dcity, map) || TL('historyUnknownCity');
      const arrName = cityNameFromCode(acity, map) || TL('historyUnknownCity');
      const subtitle = returnDate ? formatHistoryRange(departDate, returnDate) : formatHistoryDate(departDate);

      entry = {
        ...base,
        type:'flight',
        emoji:'✈️',
        title: `${depName} - ${arrName}`,
        subtitle: subtitle || TL('historyFlightFallback')
      };
    } else if (pathname.includes('/packages/') || category === 'Package') {
      const map = await loadIataMapOnce();
      const arrivalCode = params.get('aCity') || params.get('acity') || params.get('hCity') || params.get('hcity');
      const arrivalName = cityNameFromCode(arrivalCode, map) || TL('historyUnknownCity');
      const departDate = params.get('dDate') || params.get('iDate') || '';
      const returnDate = params.get('rDate') || params.get('oDate') || '';
      const subtitle = formatHistoryRange(departDate, returnDate);

      entry = {
        ...base,
        type:'package',
        emoji:'🏨✈️',
        title: arrivalName,
        subtitle: subtitle || TL('historyPackageFallback')
      };
    } else if (pathname.includes('/hotels') || category === 'Hotel') {
      const checkin = params.get('checkin') || params.get('checkIn');
      const checkout = params.get('checkout') || params.get('checkOut');
      const fallbackName = nextHotelFallbackLabel(existingItems);
      const cityName = await resolveHotelCityName(params);
      const hotelName = cityName ? hotelCityLabel(cityName) : (summarizeHotelName(pathname, params) || fallbackName);

      entry = {
        ...base,
        type:'hotel',
        emoji:'🏨',
        title: hotelName,
        subtitle: formatHistoryRange(checkin, checkout) || ''
      };
    }

    existingItems.unshift(entry);
    persistHistory(existingItems);
    renderHistory();
  }

  // ===== 항공 → 호텔 CTA 라벨(일반 문구) =====
  function hotelCtaLabel(){
    if (currentLang === 'ko') return '숙소도 한번에 찾기';
    if (currentLang === 'ja') return '宿もまとめて検索';
    if (currentLang === 'th') return 'ค้นหาโรงแรมพร้อมกัน';
    return 'Find hotels for these dates';
  }

  // ===== 제휴 파라미터 부착 =====
  function appendAffiliate(urlStr, lang = currentLang){
    const affix = getAffiliateAffix(lang);
    try{
      const u = new URL(urlStr, location.origin);
      const sp = u.searchParams;
      if (!sp.has('Allianceid') && !sp.has('SID')) {
        affix.split('&').forEach(kv => {
          const [k, v=''] = kv.split('=');
          if (!sp.has(k)) sp.set(k, v);
        });
        u.search = sp.toString();
      }
      return u.toString();
    }catch(_){
      return urlStr + (urlStr.includes('?') ? '&' : '?') + affix;
    }
  }

  // ===== 호텔 검색 URL(검색어 기반) + 제휴코드 자동 =====
  // cityId와 cityName을 사용하여 검색 URL을 구성합니다.
  function buildHotelSearchUrl(baseHost, cityId, searchCityName, checkin, checkout, curr){
    const params = new URLSearchParams();
    if (cityId) params.set('city', cityId); 
    if (searchCityName) params.set('cityName', searchCityName);
    if (checkin)  params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
    if (curr)     params.set('curr', curr);
    // searchBoxArg='t' 파라미터는 요청에 따라 제거된 상태를 유지합니다.
    const raw = `https://${baseHost}/hotels/list?${params.toString()}`;
    return appendAffiliate(raw, currentLang);
  }

  function applyTranslations(lang){
    const T = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    $$('[data-lang]').forEach(el => {
      const key = el.getAttribute('data-lang');
      const val = (key in (T||{})) ? (FORCE_FALLBACK_KEYS.has(key) ? TL(key) : T[key]) : TL(key);
      if (val != null) el.innerHTML = val;
    });
    const input = $('#inputUrl');
    if (input && T.placeholder) input.placeholder = T.placeholder;

    const pl = $('#privacy-link');
    if (pl && langDetails[lang]) pl.href = langDetails[lang].privacy;

    updateLanguageButtonDisplay();

    const hotelWidget = $('#hotel-widget-modal');
    const flightWidget = $('#flight-widget-modal');
    if (hotelWidget && flightWidget){
      hotelWidget.setAttribute('loading','lazy');
      flightWidget.setAttribute('loading','lazy');
      hotelWidget.src = widgetSrcModal[lang].hotel;
      flightWidget.src = widgetSrcModal[lang].flight;
    }

    const langFlag = $('#lang-flag');
    if (langFlag) {
      langFlag.textContent = langDetails[lang].flagEmoji || '';
      langFlag.setAttribute('aria-label', `${langDetails[lang].text} flag`);
    }
  }

  function goLang(newLang){
    const qs = window.location.search || '';
    window.location.href = pathForLang(newLang) + qs;
  }

  function updateLanguageButtonDisplay(){
    const el = $('#lang-text');
    if (!el) return;
    const codeOrText = (window.innerWidth <= 600) ? langDetails[currentLang].code : langDetails[currentLang].text;
    el.textContent = codeOrText;
  }

  // ===== 리소스 힌트 =====
  function addResourceHints(){
    const head = document.head;
    const origins = [
      'https://flagcdn.com',
      'https://booking.example',
      'https://booking.example',
      'https://www.googletagmanager.com',
      'https://www.clarity.ms'
    ];
    origins.forEach(o => {
      try{
        const u = new URL(o);
        const pre = document.createElement('link');
        pre.rel = 'preconnect';
        pre.href = o;
        pre.crossOrigin = 'anonymous';
        head.appendChild(pre);

        const dns = document.createElement('link');
        dns.rel = 'dns-prefetch';
        dns.href = '//' + u.host;
        head.appendChild(dns);
      }catch(_){}
    });
  }

  // ===== URL 로깅 =====
  function logSubmittedUrl(rawUrl, category){
    const payload = {
      url: rawUrl,
      pageLang: currentLang,
      category,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || ''
    };

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(LOG_ENDPOINT, blob);
      } else {
        fetch(LOG_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (_) {}

    try {
      const qs = new URLSearchParams({
        url: payload.url,
        pageLang: payload.pageLang,
        category: payload.category,
        referrer: payload.referrer,
        userAgent: payload.userAgent,
        t: String(Date.now())
      }).toString();
      const img = new Image(1, 1);
      img.src = `${LOG_ENDPOINT}?${qs}`;
      (window.__logPixels = window.__logPixels || []).push(img);
    } catch (_) {}
  }

  // ===== 축약링크 감지 =====
  function isTripShortLink(raw){
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./,'');
      return (host === 'trip.com' || host.endsWith('.trip.com')) && /^\/w\/[^/]+/i.test(u.pathname);
    } catch { return false; }
  }

  function isTripDomain(raw){
    if (!raw) return false;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./,'');
      // 정확한 도메인 일치 확인 (예: "trip.com" 또는 "*.trip.com" 만 허용)
      return /^([^.]+\.)*trip\.com$/i.test(host);
    } catch (_){
      return false;
    }
  }

  function isAgodaDomain(raw){
    if (!raw) return false;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const host = url.hostname.replace(/^www\./,'');
      return host === 'agoda.com' || host.endsWith('.agoda.com');
    } catch (_){
      return false;
    }
  }

  function withAgodaLocalePath(pathname, locale){
    const cleanPath = (pathname || '/').replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i, '') || '/';
    if (/^\/(?:partners|affiliate)(?:\/|$)/i.test(cleanPath)) return cleanPath;
    if (cleanPath === '/') return `/${locale}/`;
    return `/${locale}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
  }

  function buildAgodaMarketUrl(raw, market){
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    u.protocol = 'https:';
    u.hostname = 'www.agoda.com';
    u.pathname = withAgodaLocalePath(u.pathname, market.locale);

    const p = u.searchParams;
    [
      'currencyId',
      'languageId',
      'realLanguageId',
      'storefrontId',
      'trafficGroupId',
      'trafficSubGroupId'
    ].forEach(k => p.delete(k));

    p.set('currency', market.currency);
    p.set('currencyCode', market.currency);
    p.set('priceCur', market.currency);
    p.set('locale', market.locale);
    p.set('hl', market.locale);
    p.set('htmlLanguage', market.locale);
    p.set('cultureInfoName', market.locale);
    p.set('origin', market.country);

    if (AGODA_AFFILIATE_CID) {
      p.set('cid', AGODA_AFFILIATE_CID);
      p.set('pcs', AGODA_AFFILIATE_PCS);
    }

    return u.toString();
  }

  function sortAgodaMarketsForCurrentLang(){
    const preferred = currentLang === 'ko' ? 'KR' : currentLang === 'th' ? 'TH' : 'US';
    const market = agodaMarkets.find(m => m.country === preferred);
    return market ? [market, ...agodaMarkets.filter(m => m.country !== preferred)] : [...agodaMarkets];
  }

  function renderAgodaCountryCurrencyLinks(rawUrl, container){
    const T = (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) || {};
    container.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'results-title';
    title.innerHTML = T.agodaResultsTitle || 'Agoda country and currency links';
    container.appendChild(title);

    const note = document.createElement('p');
    note.className = 'agoda-results-note';
    note.textContent = T.agodaResultsLead || 'Open the same Agoda stay with different country and currency settings, then compare the final checkout price.';
    container.appendChild(note);

    const grid = document.createElement('div');
    grid.className = 'link-list-grid agoda-link-grid';

    sortAgodaMarketsForCurrentLang().forEach(market => {
      const label = market[currentLang] || market.en;
      const a = document.createElement('a');
      a.href = buildAgodaMarketUrl(rawUrl, market);
      a.target = '_blank';
      a.rel = 'noopener nofollow sponsored';
      a.addEventListener('click', () => {
        countryClickCount++;
        a.classList.toggle('clicked');
      });

      const imgHtml = `<img class="flag" src="https://flagcdn.com/h40/${market.flag}.png"
        alt="${label} flag" width="24" height="16" loading="lazy" decoding="async">`;
      a.innerHTML = `${imgHtml}<span class="agoda-market-label"><strong>${label}</strong><small>${market.currency}</small></span>`;
      grid.appendChild(a);
    });

    container.appendChild(grid);
  }

  // ===== /w/ 포함 "풀링크" 정규화: /w/ 제거 또는 target/url/redirect 추출 =====
  function normalizeTripShortUrl(raw){
    try{
      const u = new URL(raw, location.origin);
      const host = u.hostname.replace(/^www\./,'');
      const isTrip = (host === 'trip.com' || host.endsWith('.trip.com'));

      // 1) target / url / redirect 쿼리에 최종 목적지가 들어온 경우
      const t = u.searchParams.get('target') || u.searchParams.get('url') || u.searchParams.get('redirect');
      if (t) {
        try{
          const decoded = decodeURIComponent(t);
          const tu = new URL(decoded);
          const th = tu.hostname.replace(/^www\./,'');
          if (th === 'trip.com' || th.endsWith('.trip.com')) {
            // 최종 목적지 경로에 내장된 /w/ 세그먼트 제거
            tu.pathname = stripWSegments(tu.pathname);
            return tu.toString();
          }
        }catch(_){}
        // decode 실패 시에도 직접 사용 시도
        try{
          const tu2 = new URL(t);
          const th2 = tu2.hostname.replace(/^www\./,'');
          if (th2 === 'trip.com' || th2.endsWith('.trip.com')) {
            tu2.pathname = stripWSegments(tu2.pathname);
            return tu2.toString();
          }
        }catch(_){}
      }

      // 2) 경로가 /w/로 시작하는 경우 → /w/ 제거
      if (/^\/w\//i.test(u.pathname)) {
        u.pathname = u.pathname.replace(/^\/w\//i, '/');
      }

      // 3) (신규) 경로 내부에 /w/ 세그먼트가 포함된 확장 링크 → 모두 제거
      if (isTrip && /\/w\//i.test(u.pathname)) {
        u.pathname = stripWSegments(u.pathname);
      }

      return u.toString();
    }catch(_){
      return raw;
    }
  }

  // ===== 리디렉트 토스트 =====
  let isRedirecting = false;
  function redirectWithModal(affUrl, delayMs=800){
    if (isRedirecting) return;
    isRedirecting = true;
    const modal = $('#redirect-modal');
    if (modal) modal.style.display = 'flex';
    setTimeout(() => {
      if (modal) modal.style.display = 'none';
      window.open(affUrl, '_blank', 'noopener');
      isRedirecting = false;
    }, delayMs);
  }

  function renderRedirectGuideCard(container, tripUrl, options={}){
    if (!container) return;
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'redirect-guide-card';
    if (options.className) {
      card.classList.add(options.className);
    }

    const header = document.createElement('div');
    header.className = 'redirect-guide-card__header';

    const icon = document.createElement('span');
    icon.className = 'redirect-guide-card__icon';
    icon.textContent = options.icon || '🔗';

    const title = document.createElement('div');
    title.className = 'redirect-guide-card__title';
    title.textContent = options.titleText || TL('redirecting');

    header.appendChild(icon);
    header.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'redirect-guide-card__body';
    desc.innerHTML = options.guideHtml || TL('redirectGuide') || '';

    card.appendChild(header);
    card.appendChild(desc);

    if (options.showCta !== false) {
      const link = document.createElement('a');
      link.className = 'redirect-guide-card__cta';
      link.href = tripUrl || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = options.ctaLabel || TL('searchModeCta') || TL('redirectingToSearch') || TL('searchPrompt');
      card.appendChild(link);
    }

    container.appendChild(card);
  }

  function renderSearchModeCard(container, affiliateHome){
    renderRedirectGuideCard(container, affiliateHome, {
      icon: '🔍',
      titleText: TL('searchModeTitle') || TL('redirecting'),
      guideHtml: TL('searchModeGuide') || TL('redirectGuide'),
      ctaLabel: TL('searchModeCta') || TL('redirectingToSearch') || TL('searchPrompt'),
      className: 'redirect-guide-card--search-mode'
    });
  }

  // ===== 단축링크 안내 카드 =====
  function renderShortlinkNotice(rawUrl, container){
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'shortlink-card';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'shortlink-card__eyebrow';
    eyebrow.textContent = TL('shortlinkLabel') || 'Booking URL tips';
    card.appendChild(eyebrow);

    const header = document.createElement('div');
    header.className = 'shortlink-card__header';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'shortlink-card__icon';
    iconWrap.textContent = '🚫';

    const titles = document.createElement('div');
    titles.className = 'shortlink-card__titles';

    const h = document.createElement('h3');
    h.className = 'shortlink-card__title';
    h.textContent = TL('shortlinkTitle');
    titles.appendChild(h);

    const leadText = TL('shortlinkLead') || '';
    if (leadText) {
      const lead = document.createElement('p');
      lead.className = 'shortlink-card__lead';
      lead.innerHTML = leadText;
      titles.appendChild(lead);
    }

    header.appendChild(iconWrap);
    header.appendChild(titles);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'shortlink-card__body';
    body.innerHTML = TL('shortlinkSteps') || TL('shortlinkBody') || '';
    card.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'shortlink-card__actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'main-button shortlink-card__cta';
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.textContent = TL('shortlinkOpenFull');

    let cleanedUrl = rawUrl;
    try { cleanedUrl = normalizeTripShortUrl(rawUrl); } catch(_) {}
    try {
      openBtn.href = getAffiliateHomeUrl();
    } catch {
      openBtn.href = cleanedUrl || '#';
    }

    actions.appendChild(openBtn);
    card.appendChild(actions);
    container.appendChild(card);
  }

  function renderUnsupportedDomainCard(rawUrl, container){
    const T = (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) || {};
    renderRedirectGuideCard(container, getAffiliateHomeUrl(), {
      icon: '🚫',
      titleText: T.unsupportedDomainTitle || 'Supported booking links only',
      guideHtml: T.unsupportedDomainBody || '',
      ctaLabel: T.unsupportedDomainCta || TL('searchModeCta') || 'Open booking site',
      className: 'redirect-guide-card--unsupported',
      showCta: false,
    });

    const desc = container.querySelector('.redirect-guide-card__body');
    if (desc) {
      desc.classList.add('unsupported-domain-body');

      const noteWrap = document.createElement('div');
      noteWrap.className = 'unsupported-domain__notes';

      const logic = document.createElement('p');
      logic.className = 'redirect-guide-card__note unsupported-domain__logic';
      logic.innerHTML = T.unsupportedDomainLogic || 'We only convert supported booking domains (e.g., booking.example, booking.example).';
      noteWrap.appendChild(logic);

      if (rawUrl) {
        try {
          const host = new URL(rawUrl).hostname.replace(/^www\./, '');
          const hostNote = document.createElement('p');
          hostNote.className = 'redirect-guide-card__note unsupported-domain__detected';

          const hostLabel = document.createElement('span');
          hostLabel.className = 'unsupported-domain__label';
          hostLabel.textContent = `${T.unsupportedDomainDetected || 'Detected domain'}: `;
          const hostValue = document.createElement('span');
          hostValue.className = 'unsupported-domain__domain';
          hostValue.textContent = host;

          hostNote.appendChild(hostLabel);
          hostNote.appendChild(hostValue);
          noteWrap.appendChild(hostNote);
        } catch (_) {}
      }

      desc.appendChild(noteWrap);
    }

    const card = container.querySelector('.redirect-guide-card');
    if (card) {
      const actions = document.createElement('div');
      actions.className = 'redirect-guide-card__actions';

      const tripBtn = document.createElement('a');
      tripBtn.className = 'redirect-guide-card__cta';
      tripBtn.href = getAffiliateHomeUrl();
      tripBtn.target = '_blank';
      tripBtn.rel = 'noopener noreferrer';
      tripBtn.textContent = T.unsupportedDomainCta || TL('searchModeCta') || 'Open booking site';
      actions.appendChild(tripBtn);

      card.appendChild(actions);
    }
  }

  // ===== 입력창 우측 X 버튼 =====
  function attachInputClearButton(){
    const input = $('#inputUrl');
    if (!input) return;

    if (input.parentElement && input.parentElement.classList.contains('input-wrapper') &&
        input.parentElement.querySelector('.clear-btn')) {
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'input-wrapper';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const a11y = { ko:'입력 지우기', en:'Clear input', ja:'入力をクリア', th:'ล้างข้อความ' };

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'clear-btn';
    btn.setAttribute('aria-label', a11y[currentLang] || 'Clear');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    wrap.appendChild(btn);

    const toggle = () => {
      const show = (input.value || '').trim().length > 0;
      btn.classList.toggle('show', show);
    };

    input.addEventListener('input', toggle);
    input.addEventListener('focus', toggle);
    input.addEventListener('blur', () => { if (!input.value.trim()) btn.classList.remove('show'); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        e.preventDefault();
      }
    });

    btn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.focus();
    });

    toggle();
  }

  // ===== 태국 국기 찌그러짐 방지용 스타일 주입 =====
  function injectStyleFixes(){
    const css = `
      .link-list-grid a img.flag.th-flag{
        width:24px !important;
        height:18px !important;
        object-fit:contain;
        border-radius:2px;
        image-rendering:auto;
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-flag-fix','th');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function isLikelyUrl(input){
    if (!input) return false;
    const lower = input.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return true;
    if (lower.includes('trip.com')) return true;
    try {
      // 공백이 없는 일반 텍스트 + 도메인 패턴까지 감지
      const parsed = new URL(lower.startsWith('http') ? lower : `https://${lower}`);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  }

  function isHotelUrl(input) {
    if (!input) return false;
    const url = input.toLowerCase();
    return (
      url.includes('/hotels/') ||
      url.includes('hotelid=') ||
      url.includes('/hotels/detail') ||
      url.includes('/hotels/') ||
      url.includes('hoteluniquekey')
    );
  }

  let countryClickCount = 0;
  let hotelConversionFired = false;  // 호텔 전환은 1회만

  function checkHighQualityConversion() {
    const inputValue = document.getElementById('inputUrl').value;

    // 조건: URL 입력 + 국가 버튼 3번 이상 클릭
    if (inputValue.length > 5 && countryClickCount >= 3) {
      gtag('event', 'high_quality_conversion', {
        event_category: 'engaged_user',
        event_label: 'hq_conversion',
        value: 1
      });
    }
  }

  function checkHighQualityConversionHotel() {
    if (hotelConversionFired) return;

    const inputEl = document.getElementById('inputUrl');
    const inputValue = inputEl ? inputEl.value.trim() : '';

    // 조건: 호텔 링크 + 국가 버튼 2회 이상 + gtag 존재
    if (isHotelUrl(inputValue) &&
        countryClickCount >= 2 &&
        typeof gtag === 'function') {

      gtag('event', 'hq_conversion_hotel', {
        event_category: 'engaged_user',
        event_label: 'hotel_hq_conversion',
        value: 1
      });

      hotelConversionFired = true; // 중복 방지
    }
  }

  // ===== 메인 기능 =====
  let linkClickCount = 0;
  let mobilePopupShown = false;
  let blankClickCount = 0;

  window.generateLinks = async function(){
   const input = ($('#inputUrl')?.value || '').trim();
   const lowerInput = input.toLowerCase();

    countryClickCount = 0;
    hotelConversionFired = false;

    // 카테고리 판별(대략)
    let category = 'Other';
     const isUrl = isLikelyUrl(input);
     if (isUrl) {
      if (lowerInput.includes('agoda.com')) category = 'Agoda';
       else if (input.includes('/hotels/')) category = 'Hotel';
      else if (input.includes('/flights/')) category = 'Flight';
      else if (input.includes('/packages/')) category = 'Package';
      else if (input.includes('/things-to-do/')) category = 'Activity';
      else if (input.includes('/airport-transfers/')) category = 'Airport Pickup';
    } else if (input) {
      category = 'SearchTerm';
    }

    if (input && typeof gtag === 'function') {
      gtag('event','submit_url',{ submitted_link: input, link_category: category });
    }
     if (input) logSubmittedUrl(input, category);

     if (!input) {
       const defaultAff = getAffiliateHomeUrl();
       redirectWithModal(defaultAff, 800);
       return;
     }

     if (isUrl && lowerInput.includes('booknew')) {
       alert(TL('booknewWarning'));
     }

    const resultsDiv = $('#results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'block';
    linkClickCount = 0;
    mobilePopupShown = false;

   const T = (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) || {};

    function createKakaoButton(isError=false){
      const a = document.createElement('a');
      a.href = 'https://open.kakao.com/o/sKGmxMDh';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'kakao-chat-btn';
      a.textContent = isError ? (T.kakaoTalkError || 'Report an Error') : (T.kakaoTalk || 'KakaoTalk');
      return a;
    }

    const isTrip = isTripDomain(input);
    const isAgoda = isAgodaDomain(input);

    if (isUrl && isAgoda) {
      try {
        await addHistoryFromUrl(input, new URL(input.startsWith('http') ? input : `https://${input}`), 'Agoda');
      } catch (_) {}
      renderAgodaCountryCurrencyLinks(input, resultsDiv);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton());
      hardenExternalLinks();
      return;
    }

    if (isUrl && !isTrip) {
      renderUnsupportedDomainCard(input, resultsDiv);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      return;
    }

    // ===============================================
    // 검색어 모드: 팝업 대신 하단 카드로 안내
    // ===============================================
    if (!isUrl) {
      const affiliateHome = getAffiliateHomeUrl();
      renderSearchModeCard(resultsDiv, affiliateHome);
      return;
    }
    // ===============================================


    // ★ /w/ 단축링크 처리: 정규화 시도 없이 무조건 안내 노출
    if (isTripShortLink(input)) {
      renderShortlinkNotice(input, resultsDiv);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      return;
    }

   try{
     // 정상 URL만 파싱/정제
     const url = new URL(input);
     await addHistoryFromUrl(input, url, category);
     // (중요) 확장 링크 경로 내부의 /w/ 세그먼트 제거
     let pathname = stripWSegments(url.pathname);

      const originalParams = new URLSearchParams(url.search);
      let essentialParams = new URLSearchParams();

      // 이번 세션 기준 통화
      const baseCurr = ((originalParams.get('curr') || '').toUpperCase()) ||
                       (languageToCurrencyMap[currentLang] || 'USD');

      // 항공 링크면 상단 호텔 CTA
      const isFlight = pathname.includes('/flights');
      if (isFlight) {
        const ac = (originalParams.get('acity') || originalParams.get('acitycode') || '').toUpperCase();
        const ddate = originalParams.get('ddate') || '';
        const rdate = originalParams.get('rdate') || originalParams.get('adate') || '';

        if (ac) {
          const map = await loadIataMapOnce();
          const entry = map[ac.toLowerCase()];
          const cityName = (entry && entry.city) ? entry.city : ac; // 실패시 IATA 그대로
          const checkin  = ymdToSlash(ddate);
          const checkout = ymdToSlash(rdate);
          const host = (currentLang === 'ko') ? 'booking.example' : 'booking.example';
          // 항공편에서 호텔 검색 CTA를 위한 URL 생성 (여기서는 cityId가 없으므로 null 처리)
          const hotelUrl = buildHotelSearchUrl(host, null, cityName, checkin, checkout, baseCurr); // null 처리
          // ... (나머지 CTA 로직)
          
          const ctaWrap = document.createElement('div');
          ctaWrap.style.textAlign = 'center';
          ctaWrap.style.margin = '0 0 12px';
          const cta = document.createElement('a');
          cta.href = hotelUrl;
          cta.target = '_blank';
          cta.rel = 'noopener nofollow sponsored';
          cta.className = 'external-link-btn';
          cta.textContent = hotelCtaLabel();
          ctaWrap.appendChild(cta);
          resultsDiv.appendChild(ctaWrap);
        }
      }

      if (pathname.includes('/packages/')) {
        if (pathname.startsWith('/m/')) pathname = pathname.replace('/m/','/');
        const whitelist = [
          'dCity','aCity','hCity','tripWay','room','rooms','adult','child','infants',
          'cAges','iAges','dDate','rDate','iDate','oDate','locale','curr'
        ];
        whitelist.forEach(p => {
          if (originalParams.has(p)) originalParams.getAll(p).forEach(v => essentialParams.append(p, v));
        });

      } else if (pathname.includes('/flights')) {
        if (pathname.startsWith('/m/')) {
          pathname = '/flights/showfarefirst';
          if (originalParams.has('dcitycode')) essentialParams.set('dcity',   originalParams.get('dcitycode'));
          if (originalParams.has('acitycode')) essentialParams.set('acity',   originalParams.get('acitycode'));
          if (originalParams.has('ddate'))     essentialParams.set('ddate',   originalParams.get('ddate'));
          if (originalParams.has('adate'))     essentialParams.set('rdate',   originalParams.get('adate'));
          if (originalParams.has('adult'))     essentialParams.set('quantity',originalParams.get('adult'));
          const triptype = originalParams.get('triptype');
          if (triptype === '1' || triptype === 'rt') essentialParams.set('triptype','rt');
          else { essentialParams.set('triptype','ow'); essentialParams.delete('rdate'); }
          const classtype = originalParams.get('classtype');
          if      (classtype === '1' || classtype === 'c') essentialParams.set('class','c');
          else if (classtype === '2' || classtype === 'f') essentialParams.set('class','f');
          else                                             essentialParams.set('class','y');
          essentialParams.set('lowpricesource','searchform');
          essentialParams.set('nonstoponly','off');
        } else {
          const blacklist = ['gclid','msclkid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','Allianceid','SID','promo_referer','trip_sub1','trip_sub3'];
          essentialParams = new URLSearchParams(originalParams);
          blacklist.forEach(p => essentialParams.delete(p));
        }

      } else {
        // ★ 수정된 부분: 호텔/일반 URL 처리의 whitelist에 checkin/checkout 추가
        const whitelist = ['hotelId','hotelid','cityId','checkIn','checkOut','adults','children','rooms','nights','crn','ages','travelpurpose','adult','curr', 'city', 'cityName', 'countryId', 'checkin', 'checkout']; // checkin, checkout 추가
        whitelist.forEach(p => {
          if (originalParams.has(p)) originalParams.getAll(p).forEach(v => essentialParams.append(p, v));
        });
        if (pathname.startsWith('/m/')) pathname = pathname.replace('/m/','/');
      }

      const basePath = pathname;

      // 결과 타이틀
      const title = document.createElement('p');
      title.className = 'results-title';
      title.innerHTML = T.resultsTitle || 'Results';
      resultsDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'link-list-grid';

      // 언어별 우선도
      let sortedDomains = [...domains];
      if (currentLang === 'ja') {
        const jp = sortedDomains.find(d => d.code === 'jp');
        if (jp) sortedDomains = [jp, ...sortedDomains.filter(d => d.code !== 'jp')];
      } else if (currentLang === 'en') {
        const us = sortedDomains.find(d => d.code === 'us');
        if (us) sortedDomains = [us, ...sortedDomains.filter(d => d.code !== 'us')];
      } else if (currentLang === 'th') {
        const th = sortedDomains.find(d => d.code === 'th');
        if (th) sortedDomains = [th, ...sortedDomains.filter(d => d.code !== 'th')];
      }

      // 버튼 렌더
      sortedDomains.forEach(dom => {
        const p = new URLSearchParams(essentialParams);

        // 통화 강제
        if (baseCurr) {
          p.set('curr', baseCurr);
          if (p.has('crn')) p.set('crn', baseCurr);
        }

        // 로케일 제거
        ['locale','lang','lc','language'].forEach(k => p.delete(k));

        const param = p.toString();
        const cleanPath = basePath + (param ? '?' + param : '');
        const finalAffix = (param ? '&' : '?') + getAffiliateAffix();
        const fullUrl = `https://${dom.code}.trip.com${cleanPath}${finalAffix}`;

        const a = document.createElement('a');
        a.href = fullUrl;
        a.target = '_blank';
        a.rel = 'noopener nofollow sponsored';
        a.addEventListener('click', () => {
          countryClickCount++;
          checkHighQualityConversionHotel(); // 호텔 전환 체크
        });
        a.onclick = () => {
          a.classList.toggle('clicked');
          linkClickCount++;
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile && linkClickCount >= 4 && !mobilePopupShown) {
            const mobileModal = $('#mobile-notice-modal');
            if (mobileModal) { mobileModal.style.display = 'flex'; mobilePopupShown = true; }
          }
        };
        const label = (dom[currentLang] || dom.en);

        // 태국만 24x18 고정(왜곡 방지)
        const isThai = dom.code === 'th';
        const imgHtml = isThai
          ? `<img class="flag th-flag" src="https://flagcdn.com/24x18/${dom.flag}.png"
                   alt="${label} flag"
                   loading="lazy" decoding="async">`
          : `<img class="flag" src="https://flagcdn.com/h40/${dom.flag}.png"
                   alt="${label} flag"
                   width="24" height="16"
                   loading="lazy" decoding="async">`;

        a.innerHTML = `${imgHtml} ${label}`;
        grid.appendChild(a);
      });

      resultsDiv.appendChild(grid);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton());

      hardenExternalLinks();
      checkHighQualityConversion();

    } catch (e){
      const T = (window.TRANSLATIONS && window.TRANSLATIONS[currentLang]) || {};
      const resultsDiv = $('#results');
      if (resultsDiv) {
        resultsDiv.innerHTML = `<p style="color:red; text-align:center;">${T.parseError || 'Parse error.'}</p>`;
        if (currentLang === 'ko') resultsDiv.appendChild((() => {
          const a = document.createElement('a');
          a.href = 'https://open.kakao.com/o/sKGmxMDh';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'kakao-chat-btn';
          a.textContent = T.kakaoTalkError || 'Report an Error';
          return a;
        })());
      }
      console.error('URL Parsing Error:', e);
    }
  };

  // ===== 스니펫 억제 =====
  function applyNoSnippet(){
    const selectors = [
      '.header',
      '.input-section',
      '#results',
      '.info-card',
      'footer',
      '#redirect-modal',
      '#search-modal',
      '#mobile-notice-modal'
    ];
    selectors.forEach(sel => {
      $$(sel).forEach(el => {
        if (el && !el.hasAttribute('data-nosnippet')) {
          el.setAttribute('data-nosnippet', '');
        }
      });
    });
  }

  // ===== 검색 전용 ‘상단 한 줄 소개’(시각 비노출) =====
  function injectMetaIntro(){
    const INTRO = {
      ko: '국가별 할인코드 적용링크 | N만원 절약하고 여행가자 | 최대 21개국 사이트에서 최저가 검색 가능',
      en: 'booking site country-specific discount links | Save more and travel now | Compare the lowest prices across up to 21 country sites',
      ja: 'booking site 国別割引コード適用リンク｜お得に旅へ｜最大21か国サイトで最安値を比較',
      th: 'ลิงก์ส่วนลด booking site แยกตามประเทศ | ประหยัดทันที | เปรียบเทียบราคาถูกสุดได้สูงสุด 21 ประเทศ'
    };
    const txt = INTRO[currentLang];
    if (!txt) return;

    const container = $('.container') || document.body;
    const header = $('.header');
    const p = document.createElement('p');
    p.className = 'meta-intro';
    p.textContent = txt;
    p.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    if (header && header.parentNode) header.parentNode.insertBefore(p, header);
    else container.insertBefore(p, container.firstChild);
  }

  // ===== 외부 링크 보안 =====
  function hardenExternalLinks(){
    $$('a[target="_blank"]').forEach(a => {
      try{
        const u = new URL(a.href, location.href);
        const isExternal = u.hostname && u.hostname !== location.hostname;
        if (!isExternal) return;
        const relSet = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        relSet.add('noopener'); relSet.add('noreferrer');
        if (
          u.hostname === 'trip.com' ||
          /\.trip\.com$/.test(u.hostname) ||
          u.hostname === 'agoda.com' ||
          /\.agoda\.com$/.test(u.hostname)
        ) {
          relSet.add('sponsored');
          relSet.add('nofollow');
          relSet.delete('noreferrer'); // 제휴 추적 유지
        }
        a.setAttribute('rel', Array.from(relSet).join(' '));
      }catch(_){}
    });
  }

  // ===== 초기화 =====
  document.addEventListener('DOMContentLoaded', () => {
    addResourceHints();
    renderLangDropdown();
    applyTranslations(currentLang);
    document.documentElement.lang = currentLang;

    injectStyleFixes();          // 🔧 태국 국기 픽스
    injectMetaIntro();
    applyNoSnippet();
    hardenExternalLinks();
    renderHistory();

    const langSelector = $('.language-selector');
    const langButton = $('#language-button');
    const langDropdown = $('#language-dropdown');
    if (langButton && langDropdown){
      langButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
        langButton.setAttribute('aria-expanded', langDropdown.classList.contains('show') ? 'true':'false');
      });
      window.addEventListener('click', (e) => {
        if (!langSelector.contains(e.target)) {
          langDropdown.classList.remove('show');
          langButton.setAttribute('aria-expanded','false');
        }
      });
    }

    $$('.lang-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const newLang = option.getAttribute('data-lang-code');
        goLang(newLang);
      });
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateLanguageButtonDisplay, 150);
    });

    const showWidgetButton = $('#show-widget-button');
    const modal = $('#search-modal');
    const modalClose = modal?.querySelector('.modal-close');
    if (showWidgetButton) showWidgetButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    if (modalClose)      modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal)           modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });


    const tabButtons = $$('.tab-button');
    const tabContents = $$('.tab-content');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const target = $('#' + button.dataset.tab + '-tab-content');
        tabContents.forEach(c => c.classList.toggle('active', c === target));
      });
    });

    const params = new URLSearchParams(window.location.search);
    const urlToProcess = params.get('url');
    if (urlToProcess) {
      const inputEl = $('#inputUrl');
      if (inputEl) inputEl.value = urlToProcess;
      history.replaceState({}, '', window.location.pathname);
    }

    attachInputClearButton();

    const historyClearBtn = $('#history-clear');
    if (historyClearBtn) historyClearBtn.addEventListener('click', () => { persistHistory([]); renderHistory(); });

    const mobileModal = $('#mobile-notice-modal');
    if (mobileModal) {
      const mobileClose = mobileModal.querySelector('.modal-close');
      if (mobileClose) mobileClose.addEventListener('click', () => { mobileModal.style.display = 'none'; });
      mobileModal.addEventListener('click', (e) => { if (e.target === mobileModal) mobileModal.style.display = 'none'; });
    }

    const inputEl2 = $('#inputUrl');
    if (inputEl2) {
      // Enter 키 감지 로직
      inputEl2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault(); // 기본 동작 (페이지 새로고침 등) 방지
          window.generateLinks(); // 링크 생성/검색 함수 호출
        }
      });
      
      inputEl2.addEventListener('click', () => {
        if (!inputEl2.value.trim()) {
          blankClickCount++;
          if (blankClickCount >= 3) {
            blankClickCount = 0;
            const defaultAff =
              (currentLang === 'ko') ? getAffiliateHomeUrl('ko') :
              (currentLang === 'ja') ? getAffiliateHomeUrl('ja') :
              (currentLang === 'th') ? getAffiliateHomeUrl('th') :
                                       getAffiliateHomeUrl('en');
            redirectWithModal(defaultAff, 800);
          }
        } else {
          blankClickCount = 0;
        }
      });
    }
  });
})();
