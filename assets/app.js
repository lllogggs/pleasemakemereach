<!-- app.js -->
<script>
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ===== 라우트(언어 드롭다운 동적 생성) =====
  const LANG_ROUTES = [
    { code: 'ko', label: '한국어',  path: '/',     flag: 'kr' },
    { code: 'en', label: 'English', path: '/en/',  flag: 'us' },
    { code: 'ja', label: '日本語',   path: '/ja/',  flag: 'jp' },
    { code: 'th', label: 'ภาษาไทย', path: '/th/',  flag: 'th' }
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
        <img src="https://flagcdn.com/w40/${l.flag}.png" alt="${l.code.toUpperCase()} Flag" width="24" height="16"> ${l.label}
      </a>
    `).join('');
  }

  // ===== 설정 상수 =====
  const EXPAND_ENDPOINT = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';
  const LOG_ENDPOINT    = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';

  const AFF_AFFIX = 'Allianceid=6624731&SID=225753893&trip_sub1=&trip_sub3=D4136351';

  const widgetSrcModal = {
    ko:{ hotel:"https://kr.trip.com/partners/ad/S4477545?Allianceid=6624731&SID=225753893&trip_sub1=hotelsearch_b",
         flight:"https://kr.trip.com/partners/ad/S4477048?Allianceid=6624731&SID=225753893&trip_sub1=flightsearch_b" },
    en:{ hotel:"https://www.trip.com/partners/ad/S4479596?Allianceid=6624731&SID=225753893&trip_sub1=hotelsearch_b",
         flight:"https://www.trip.com/partners/ad/S4479617?Allianceid=6624731&SID=225753893&trip_sub1=flightsearch_b" },
    ja:{ hotel:"https://www.trip.com/partners/ad/S4479596?Allianceid=6624731&SID=225753893&trip_sub1=hotelsearch_b",
         flight:"https://www.trip.com/partners/ad/S4479617?Allianceid=6624731&SID=225753893&trip_sub1=flightsearch_b" },
    th:{ hotel:"https://www.trip.com/partners/ad/S4479596?Allianceid=6624731&SID=225753893&trip_sub1=hotelsearch_b",
         flight:"https://www.trip.com/partners/ad/S4479617?Allianceid=6624731&SID=225753893&trip_sub1=flightsearch_b" }
  };

  const langDetails = {
    ko:{ flag:'kr', text:'한국어',  privacy:'/privacy_ko.html', code:'KR' },
    en:{ flag:'us', text:'English', privacy:'/privacy_en.html', code:'EN' },
    ja:{ flag:'jp', text:'日本語',   privacy:'/privacy_ja.html', code:'JP' },
    th:{ flag:'th', text:'ภาษาไทย', privacy:'/privacy_en.html', code:'TH' } // 임시 EN 정책
  };

  // ===== 언어 판별 & 적용 =====
  let currentLang = window.PAGE_LANG || detectLangByPath();

  function detectLangByPath(){
    const seg = (location.pathname.split('/')[1] || '').toLowerCase();
    if (seg === 'en') return 'en';
    if (seg === 'ja') return 'ja';
    if (seg === 'th') return 'th';
    return 'ko';
  }

  // ===== translations fallback (단축링크 관련 키) =====
  const FALLBACK_TEXT = {
    ko: {
      shortlinkTitle: "단축링크는 변환되지 않아요",
      shortlinkBody:
        "단축링크를 먼저 열어 주세요.<br>" +
        "주소창의 전체 주소를 복사해 붙여넣으면 국가별 최저가 링크를 만들어 드려요.<br>" +
        "<span class=\"sl-example\">예: kr.trip.com/hotels… / kr.trip.com/flights…</span>",
      shortlinkOpenFull: "단축링크 열어서 전체링크 확인하기"
    },
    en: {
      shortlinkTitle: "Short links can’t be converted",
      shortlinkBody:
        "Please open the short link first.<br>" +
        "Copy the full URL from the address bar and paste it here to build country-price links.<br>" +
        "<span class=\"sl-example\">e.g. kr.trip.com/hotels… / kr.trip.com/flights…</span>",
      shortlinkOpenFull: "Open short link to get full URL"
    },
    ja: {
      shortlinkTitle: "短縮リンクは変換できません",
      shortlinkBody:
        "まず短縮リンクを開いてください。<br>" +
        "アドレスバーのフルURLをコピーして貼り付けると、国別の最安値リンクを作成できます。<br>" +
        "<span class=\"sl-example\">例: kr.trip.com/hotels… / kr.trip.com/flights…</span>",
      shortlinkOpenFull: "短縮リンクを開いてフルURLを確認"
    },
    th: {
      shortlinkTitle: "ไม่สามารถแปลงลิงก์แบบย่อได้",
      shortlinkBody:
        "โปรดเปิดลิงก์แบบย่อก่อน<br>" +
        "คัดลอก URL แบบเต็มจากแถบที่อยู่และวางที่นี่ เพื่อสร้างลิงก์เทียบราคาตามประเทศ<br>" +
        "<span class=\"sl-example\">เช่น kr.trip.com/hotels… / kr.trip.com/flights…</span>",
      shortlinkOpenFull: "เปิดลิงก์แบบย่อเพื่อดู URL เต็ม"
    }
  };
  const TL = (key) =>
    (window.TRANSLATIONS?.[currentLang]?.[key]) ??
    (FALLBACK_TEXT[currentLang]?.[key]) ??
    (FALLBACK_TEXT.en?.[key] ?? key);

  // 페이지 언어 → 기본 통화 맵(확장)
  const languageToCurrencyMap = {
    ko:'KRW', ja:'JPY', en:'USD', th:'THB',
    es:'EUR', fr:'EUR', de:'EUR', nl:'EUR', pt:'EUR',
    it:'EUR', pl:'EUR', sv:'EUR', fi:'EUR', da:'EUR',
    vi:'VND', id:'IDR', ms:'MYR', zh:'TWD', hi:'INR',
    ru:'RUB', ar:'SAR'
  };

  // Trip.com 국가 도메인 리스트
  const domains = [
    { ko:'한국',     en:'Korea',        ja:'韓国',      th:'เกาหลี',        code:'kr', flag:'kr' },
    { ko:'미국',     en:'USA',          ja:'アメリカ',  th:'สหรัฐฯ',        code:'us', flag:'us' },
    { ko:'일본',     en:'Japan',        ja:'日本',      th:'ญี่ปุ่น',        code:'jp', flag:'jp' },
    { ko:'스페인',   en:'Spain',        ja:'スペイン',  th:'สเปน',          code:'es', flag:'es' },
    { ko:'프랑스',   en:'France',       ja:'フランス',  th:'ฝรั่งเศส',       code:'fr', flag:'fr' },
    { ko:'베트남',   en:'Vietnam',      ja:'ベトナム',  th:'เวียดนาม',      code:'vn', flag:'vn' },
    { ko:'독일',     en:'Germany',      ja:'ドイツ',    th:'เยอรมนี',       code:'de', flag:'de' },
    { ko:'캐나다',   en:'Canada',       ja:'カナダ',    th:'แคนาดา',        code:'ca', flag:'ca' },
    { ko:'호주',     en:'Australia',    ja:'オーストラリア', th:'ออสเตรเลีย', code:'au', flag:'au' },
    { ko:'네덜란드', en:'Netherlands',  ja:'オランダ',  th:'เนเธอร์แลนด์',  code:'nl', flag:'nl' },
    { ko:'싱가포르', en:'Singapore',    ja:'シンガポール', th:'สิงคโปร์',   code:'sg', flag:'sg' },
    { ko:'인도네시아',en:'Indonesia',   ja:'インドネシア', th:'อินโดนีเซีย', code:'id', flag:'id' },
    { ko:'말레이시아',en:'Malaysia',    ja:'マレーシア', th:'มาเลเซีย',     code:'my', flag:'my' },
    { ko:'대만',     en:'Taiwan',       ja:'台湾',      th:'ไต้หวัน',       code:'tw', flag:'tw' },
    { ko:'인도',     en:'India',        ja:'インド',    th:'อินเดีย',       code:'in', flag:'in' },
    { ko:'멕시코',   en:'Mexico',       ja:'メキシコ',  th:'เม็กซิโก',       code:'mx', flag:'mx' },
    { ko:'영국',     en:'U.K.',         ja:'イギリス',  th:'สหราชอาณาจักร', code:'uk', flag:'gb' },
    { ko:'러시아',   en:'Russia',       ja:'ロシア',    th:'รัสเซีย',       code:'ru', flag:'ru' },
    { ko:'아르헨티나',en:'Argentina',   ja:'アルゼンチン', th:'อาร์เจนตินา', code:'ar', flag:'ar' },
    { ko:'포르투갈', en:'Portugal',     ja:'ポルトガル', th:'โปรตุเกส',    code:'pt', flag:'pt' },
    { ko:'사우디',   en:'Saudi Arabia', ja:'サウジアラビア', th:'ซาอุฯ',  code:'sa', flag:'sa' },
    { ko:'태국',     en:'Thailand',     ja:'タイ',      th:'ไทย',           code:'th', flag:'th' }
  ];

  // ===== IATA → 도시 맵 (GitHub Actions로 생성된 JSON) =====
  let IATA_CITY_MAP = null;
  async function loadIataCityMap(){
    if (IATA_CITY_MAP) return IATA_CITY_MAP;
    try{
      const res = await fetch('/data/iata-city.json', { cache:'force-cache' });
      if (res.ok) {
        IATA_CITY_MAP = await res.json();
      } else {
        IATA_CITY_MAP = {};
      }
    }catch(_){ IATA_CITY_MAP = {}; }
    return IATA_CITY_MAP;
  }

  function cityFromIata(iata){
    if (!iata) return '';
    const m = IATA_CITY_MAP?.[iata.toLowerCase()];
    return (m && (m.city || m.municipality)) || '';
  }

  // ===== 언어별 버튼 텍스트 (호텔 CTA) =====
  function hotelCtaText(city){
    if (currentLang === 'ko') return `🏨 "${city}" 숙소도 한번에 찾기`;
    if (currentLang === 'ja') return `🏨 「${city}」の宿を探す`;
    if (currentLang === 'th') return `🏨 ค้นหาที่พักใน “${city}”`;
    // en
    return `🏨 Find hotels in "${city}"`;
  }

  // ===== 언어 적용 =====
  function applyTranslations(lang){
    const T = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    $$('[data-lang]').forEach(el => {
      const key = el.getAttribute('data-lang');
      if (T[key] != null) el.innerHTML = T[key];
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
      langFlag.src = `https://flagcdn.com/w40/${langDetails[lang].flag}.png`;
      langFlag.alt = `${langDetails[lang].text} Flag`;
      langFlag.width = 24; langFlag.height = 24;
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

  // ===== 리소스 힌트(Preconnect / DNS-Prefetch) =====
  function addResourceHints(){
    const head = document.head;
    const origins = [
      'https://flagcdn.com',
      'https://www.trip.com',
      'https://kr.trip.com',
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

  // ===== URL 로깅 (POST + GET 픽셀) =====
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

  // ===== 단축링크 안내 카드 =====
  function renderShortlinkNotice(rawUrl, container){
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'info-card';

    const h = document.createElement('h2');
    h.textContent = TL('shortlinkTitle');

    const p = document.createElement('p');
    p.innerHTML = TL('shortlinkBody'); // 줄바꿈/작은글씨 span 반영

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '12px';
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';

    const openBtn = document.createElement('a');
    openBtn.className = 'external-link-btn';
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.textContent = TL('shortlinkOpenFull');
    try { openBtn.href = rawUrl; } catch { openBtn.href = '#'; }

    btnRow.appendChild(openBtn);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(btnRow);
    container.appendChild(card);
  }

  // ===== 항공 → 호텔 CTA 버튼 렌더 (한 줄) =====
  function renderHotelCTAButton(cityName, hotelUrl, hostEl){
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.justifyContent = 'center';
    wrap.style.margin = '8px 0 16px';

    const a = document.createElement('a');
    a.className = 'external-link-btn';
    a.href = hotelUrl;
    a.target = '_blank';
    a.rel = 'noopener sponsored nofollow';
    a.textContent = hotelCtaText(cityName);

    wrap.appendChild(a);
    hostEl.appendChild(wrap);
  }

  // 항공 검색 링크 → 호텔 리스트 URL 생성(도시명 + 체크인/아웃)
  function buildHotelUrlFromFlight(searchParams, cityName, baseCurr){
    const host = (currentLang === 'ko') ? 'kr.trip.com' : 'www.trip.com';
    const ddate = (searchParams.get('ddate') || '').trim();
    const rdate = (searchParams.get('rdate') || '').trim();
    const triptype = (searchParams.get('triptype') || 'ow').toLowerCase();

    // Trip.com 호텔 파라미터는 / 로도 잘 동작하는 케이스가 많음
    const ci = ddate ? ddate.replace(/-/g,'/') : '';
    const co = (triptype === 'rt' && rdate) ? rdate.replace(/-/g,'/') : ci;

    const sp = new URLSearchParams();
    if (cityName) sp.set('cityName', cityName);
    if (ci)       sp.set('checkin',  ci);
    if (co)       sp.set('checkout', co);
    if (baseCurr) sp.set('curr', baseCurr);
    sp.set('searchBoxArg','t');

    return `https://${host}/hotels/list?${sp.toString()}`;
  }

  // ===== 메인 기능 =====
  let linkClickCount = 0;
  let mobilePopupShown = false;
  let blankClickCount = 0;

  window.generateLinks = async function(){
    const input = ($('#inputUrl')?.value || '').trim();

    // 카테고리 판별(대략)
    let category = 'Other';
    if (input.includes('/hotels/')) category = 'Hotel';
    else if (input.includes('/flights/')) category = 'Flight';
    else if (input.includes('/packages/')) category = 'Package';
    else if (input.includes('/things-to-do/')) category = 'Activity';
    else if (input.includes('/airport-transfers/')) category = 'Airport Pickup';

    // GA 이벤트
    if (input && typeof gtag === 'function') {
      gtag('event','submit_url',{ submitted_link: input, link_category: category });
    }
    // 원본 입력 URL 로깅
    if (input) logSubmittedUrl(input, category);

    // 빈 입력 → 각 언어 기본 홈
    if (!input) {
      const defaultAff =
        (currentLang === 'ko') ? 'https://kr.trip.com/?curr=KRW&' + AFF_AFFIX :
        (currentLang === 'ja') ? 'https://www.trip.com/?curr=JPY&' + AFF_AFFIX :
        (currentLang === 'th') ? 'https://www.trip.com/?curr=THB&' + AFF_AFFIX :
                                 'https://www.trip.com/?curr=USD&' + AFF_AFFIX;
      redirectWithModal(defaultAff, 800);
      return;
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

    // Trip.com 링크가 아니면 에러
    if (!input.includes('trip.com')) {
      resultsDiv.innerHTML = `<p style="color:red; text-align:center;">${T.invalidLink || 'Invalid link.'}</p>`;
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      return;
    }

    // ★ /w/ 단축링크면 변환 시도하지 않고 안내만 표시
    if (isTripShortLink(input)) {
      renderShortlinkNotice(input, resultsDiv);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      return;
    }

    try{
      // 정상 URL만 파싱/정제
      const url = new URL(input);
      let pathname = url.pathname;
      const originalParams = new URLSearchParams(url.search);
      let essentialParams = new URLSearchParams();

      // ★ 이번 세션 기준 통화(baseCurr) 결정: 입력 curr > 페이지 언어 기본 > USD
      const baseCurr = ((originalParams.get('curr') || '').toUpperCase()) ||
                       (languageToCurrencyMap[currentLang] || 'USD');

      // ===== 항공 링크면: 상단에 호텔 CTA 버튼 하나만 =====
      if (pathname.includes('/flights')) {
        // 모바일 경로 보정
        if (pathname.startsWith('/m/')) {
          pathname = '/flights/showfarefirst';
        }
        // 도착지 IATA → 도시
        await loadIataCityMap();
        const acity = (originalParams.get('acity') || originalParams.get('acitycode') || '').toUpperCase();
        const cityName = cityFromIata(acity) || acity || 'City';
        const hotelUrl = buildHotelUrlFromFlight(originalParams, cityName, baseCurr);
        renderHotelCTAButton(cityName, hotelUrl, resultsDiv);

        // 이어서 결과 그리드는 기존 로직으로 계속 렌더
      }

      // ===== 아래부터는 국가별 링크 생성 로직 =====
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
          if (originalParams.has('dcitycode')) essentialParams.set('dcity',   originalParams.get('dcitycode'));
          if (originalParams.has('acitycode')) essentialParams.set('acity',   originalParams.get('acitycode'));
          if (originalParams.has('ddate'))     essentialParams.set('ddate',   originalParams.get('ddate'));
          if (originalParams.has('adate'))     essentialParams.set('rdate',   originalParams.get('adate'));
          if (originalParams.has('adult'))     essentialParams.set('quantity',originalParams.get('adult'));
          const triptype = originalParams.get('triptype');
          if (triptype === '1' || triptype === 'rt') essentialParams.set('triptype','rt');
          else { essentialParams.set('triptype','ow'); essentialParams.delete('rdate'); }
          const classtype = originalParams.get('classtype');
          if      (classtype === '1' || classtype === 'c') essentialParams.set('class','c');
          else if (classtype === '2' || classtype === 'f') essentialParams.set('class','f');
          else                                             essentialParams.set('class','y');
          essentialParams.set('lowpricesource','searchform');
          essentialParams.set('searchboxarg','t');
          essentialParams.set('nonstoponly','off');
        } else {
          const blacklist = ['gclid','msclkid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','Allianceid','SID','trip_sub1','trip_sub3'];
          essentialParams = new URLSearchParams(originalParams);
          blacklist.forEach(p => essentialParams.delete(p));
        }

      } else {
        const whitelist = ['hotelId','hotelid','cityId','checkIn','checkOut','adults','children','rooms','nights','crn','ages','travelpurpose','adult','curr'];
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

        // 모든 버튼 동일 통화로 강제
        if (baseCurr) {
          p.set('curr', baseCurr);
          if (p.has('crn')) p.set('crn', baseCurr); // 일부 호텔 파라미터
        }

        // 로케일 계열 제거(도메인 리다이렉트 최소화)
        ['locale','lang','lc','language'].forEach(k => p.delete(k));

        const param = p.toString();
        const cleanPath = basePath + (param ? '?' + param : '');
        const finalAffix = (param ? '&' : '?') + AFF_AFFIX;
        const fullUrl = `https://${dom.code}.trip.com${cleanPath}${finalAffix}`;

        const a = document.createElement('a');
        a.href = fullUrl;
        a.target = '_blank';
        a.rel = 'noopener nofollow sponsored';
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
        a.innerHTML = `<img class="flag" src="https://flagcdn.com/h40/${dom.flag}.png" alt="${label} flag" width="24" height="16" loading="lazy" decoding="async"> ${label}`;
        grid.appendChild(a);
      });

      resultsDiv.appendChild(grid);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton());

      // 안전 속성 재점검(중복 적용 OK)
      hardenExternalLinks();

    } catch (e){
      resultsDiv.innerHTML = `<p style="color:red; text-align:center;">${T.parseError || 'Parse error.'}</p>`;
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      console.error('URL Parsing Error:', e);
    }
  };

  // ===== 스니펫 억제: UI에는 영향 없음 =====
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

  // ===== 검색 전용 ‘상단 한 줄 소개’ 삽입(보이지 않음) =====
  function injectMetaIntro(){
    const INTRO = {
      ko: '트립닷컴 국가별 할인코드 적용링크 | N만원 절약하고 여행가자 | 최대 21개국 사이트에서 최저가 검색 가능',
      en: 'Trip.com country-specific discount links | Save more and travel now | Compare the lowest prices across up to 21 country sites',
      ja: 'Trip.com 国別割引コード適用リンク｜お得に旅へ｜最大21か国サイトで最安値を比較',
      th: 'ลิงก์ส่วนลด Trip.com แยกตามประเทศ | ประหยัดทันที | เปรียบเทียบราคาถูกสุดได้สูงสุด 21 ประเทศ'
    };
    const txt = INTRO[currentLang];
    if (!txt) return;

    const container = $('.container') || document.body;
    const header = $('.header');
    const p = document.createElement('p');
    p.className = 'meta-intro';
    p.textContent = txt;
    // 화면에는 숨김(크롤러는 읽음)
    p.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    // header 내부는 nosnippet 처리되어 있으니 그 "앞"에 삽입
    if (header && header.parentNode) header.parentNode.insertBefore(p, header);
    else container.insertBefore(p, container.firstChild);
  }

  // ===== 외부 링크 보안 속성 일괄 보강 =====
  function hardenExternalLinks(){
    $$('a[target="_blank"]').forEach(a => {
      try{
        const u = new URL(a.href, location.href);
        const isExternal = u.hostname && u.hostname !== location.hostname;
        if (!isExternal) return;
        const relSet = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        relSet.add('noopener'); relSet.add('noreferrer');
        // trip.com 계열은 제휴 성격 표시 + 크롤링 영향 최소화
        if (u.hostname === 'trip.com' || /\.trip\.com$/.test(u.hostname)) {
          relSet.add('sponsored');
          relSet.add('nofollow');
          // 제휴 추적 고려해 noreferrer 제거
          relSet.delete('noreferrer');
        }
        a.setAttribute('rel', Array.from(relSet).join(' '));
      }catch(_){}
    });
  }

  // ===== 초기화 =====
  document.addEventListener('DOMContentLoaded', () => {
    addResourceHints();          // 리소스 힌트
    renderLangDropdown();
    applyTranslations(currentLang);
    document.documentElement.lang = currentLang;

    injectMetaIntro();           // 검색용 한줄 소개(시각적 비노출)
    applyNoSnippet();            // 스니펫 억제
    hardenExternalLinks();       // 외부 링크 보강

    // 언어 드롭다운 동작
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

    // 윈도우 리사이즈 시 언어 버튼 텍스트 토글
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateLanguageButtonDisplay, 150);
    });

    // 검색 모달(숨김 유지)
    const showWidgetButton = $('#show-widget-button');
    const modal = $('#search-modal');
    const modalClose = modal?.querySelector('.modal-close');
    if (showWidgetButton) showWidgetButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    if (modalClose)      modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal)           modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // 탭 전환
    const tabButtons = $$('.tab-button');
    const tabContents = $$('.tab-content');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const target = $('#' + button.dataset.tab + '-tab-content');
        tabContents.forEach(c => c.classList.toggle('active', c === target));
      });
    });

    // url 파라미터로 미리 채우기
    const params = new URLSearchParams(window.location.search);
    const urlToProcess = params.get('url');
    if (urlToProcess) {
      const inputEl = $('#inputUrl');
      if (inputEl) inputEl.value = urlToProcess;
      history.replaceState({}, '', window.location.pathname);
    }

    // 모바일 안내 모달 닫기
    const mobileModal = $('#mobile-notice-modal');
    if (mobileModal) {
      const mobileClose = mobileModal.querySelector('.modal-close');
      if (mobileClose) mobileClose.addEventListener('click', () => { mobileModal.style.display = 'none'; });
      mobileModal.addEventListener('click', (e) => { if (e.target === mobileModal) mobileModal.style.display = 'none'; });
    }

    // 입력창 비어있을 때 반복 클릭 → 기본 홈 리디렉트 이 Easter egg 유지
    const inputEl2 = $('#inputUrl');
    if (inputEl2) {
      inputEl2.addEventListener('click', () => {
        if (!inputEl2.value.trim()) {
          blankClickCount++;
          if (blankClickCount >= 3) {
            blankClickCount = 0;
            const defaultAff =
              (currentLang === 'ko') ? 'https://kr.trip.com/?curr=KRW&' + AFF_AFFIX :
              (currentLang === 'ja') ? 'https://www.trip.com/?curr=JPY&' + AFF_AFFIX :
              (currentLang === 'th') ? 'https://www.trip.com/?curr=THB&' + AFF_AFFIX :
                                       'https://www.trip.com/?curr=USD&' + AFF_AFFIX;
            redirectWithModal(defaultAff, 800);
          }
        } else {
          blankClickCount = 0;
        }
      });
    }

    // 입력창 X(지우기) 버튼 토글/동작
    const clearBtn = $('.clear-btn');
    const inputEl = $('#inputUrl');
    if (clearBtn && inputEl) {
      const sync = () => clearBtn.classList.toggle('show', !!inputEl.value.trim());
      ['input','focus','blur'].forEach(ev => inputEl.addEventListener(ev, sync));
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        inputEl.value = '';
        sync();
        inputEl.focus();
        const results = $('#results');
        if (results) { results.style.display = 'none'; results.innerHTML = ''; }
      });
      sync();
    }
  });
})();
</script>
