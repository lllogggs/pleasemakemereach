(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ===== 라우트(언어 드롭다운 동적 생성) =====
  const LANG_ROUTES = [
    { code: 'ko', label: '한국어',  path: '/',     flag: 'kr' },
    { code: 'en', label: 'English', path: '/en/',  flag: 'us' },
    { code: 'ja', label: '日本語',   path: '/ja/',  flag: 'jp' },
    { code: 'th', label: 'ภาษาไทย', path: '/th/',  flag: 'th' }
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

  // ===== 설정 상수 (원본값으로 복구 확인) =====
  const EXPAND_ENDPOINT = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';
  const LOG_ENDPOINT    = 'https://script.google.com/macros/s/AKfycbybPrPuhvyYv58Efa9fWLZYIK9cjrQyAM-e2xh4cRC_X0vYlYhb5bgP4LMkDKbjwZHx/exec';

  const AFF_AFFIX = 'Allianceid=6624731&SID=225753893&trip_sub1=&trip_sub3=D4136351';

  function getAffiliateHomeUrl(lang = currentLang) {
    const base =
      (lang === 'ko') ? 'https://kr.trip.com/?curr=KRW' :
      (lang === 'ja') ? 'https://www.trip.com/?curr=JPY' :
      (lang === 'th') ? 'https://www.trip.com/?curr=THB' :
                        'https://www.trip.com/?curr=USD';
    return appendAffiliate(base);
  }

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
    ko:{ flag:'kr', text:'한국어',  privacy:'/privacy_ko.html', code:'KR' },
    en:{ flag:'us', text:'English', privacy:'/privacy_en.html', code:'EN' },
    ja:{ flag:'jp', text:'日本語',   privacy:'/privacy_ja.html', code:'JP' },
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

  // ===== translations fallback (단축링크 안내 강화) =====
  // 이 3개 키는 항상 FALLBACK를 우선 사용(외부 TRANSLATIONS가 있어도 무시)
  const FORCE_FALLBACK_KEYS = new Set(['shortlinkTitle','shortlinkBody','shortlinkOpenFull']);
  const FALLBACK_TEXT = {
    ko: {
      shortlinkTitle: "단축링크는 변환되지 않아요",
      shortlinkBody:
        "삼성인터넷 / Chrome 같은 <strong>웹브라우저</strong>에서 단축링크를 열어, 확장된 전체 주소를 확인해 주세요.<ul>" +
        "<li>1) 단축링크를 <strong>브라우저 주소창</strong>에 붙여넣어 여세요.</li>" +
        "<li>2) 페이지가 열리면 주소창의 <strong>전체 URL</strong>을 복사하세요.</li>" +
        "<li>3) 이곳 입력창에 붙여넣고 <strong>‘최저가 링크 찾기’</strong>를 누르세요.</li></ul>" +
        '<span class="sl-example">예: https://kr.trip.com/hotels/… 또는 https://kr.trip.com/flights/…</span>',
      shortlinkOpenFull: "브라우저에서 단축링크 열기",
        redirectingToSearch: "트립닷컴에서 검색합니다...",
        cityNameIdNotFound: "여행하고자 하는 도시를 입력해주세요",
   },
    en: {
      shortlinkTitle: "Short links can’t be converted",
      shortlinkBody:
        "Open the short link in a <strong>web browser</strong> (Safari / Samsung Internet / Chrome), then copy the expanded full URL and paste it here.<ul>" +
        "<li>1) Paste the short link into the <strong>browser address bar</strong>.</li>" +
        "<li>2) When the page loads, copy the <strong>full URL</strong> in the address bar.</li>" +
        "<li>3) Paste it here and click <strong>Find lowest-price links</strong>.</li></ul>" +
        '<span class="sl-example">e.g. https://kr.trip.com/hotels/… or https://kr.trip.com/flights/…</span>',
      shortlinkOpenFull: "Open short link in browser",
        redirectingToSearch: "Searching on Trip.com...",
        cityNameIdNotFound: "City ID for the search term not found. (Please search using a city name registered in the City ID Map.)",
   },
    ja: {
      shortlinkTitle: "短縮リンクは変換できません",
      shortlinkBody:
        "Safari / Samsung Internet / Chrome などの<strong>Webブラウザ</strong>で短縮リンクを開き、展開されたフルURLをコピーしてこちらに貼り付けてください。<ul>" +
        "<li>1) 短縮リンクを<strong>ブラウザのアドレスバー</strong>に貼り付けて開く。</li>" +
        "<li>2) ページが表示されたら、アドレスバーの<strong>フルURL</strong>をコピー。</li>" +
        "<li>3) ここに貼り付けて<strong>最安値リンクを探す</strong>をクリック。</li></ul>" +
        '<span class="sl-example">例: https://kr.trip.com/hotels/… または https://kr.trip.com/flights/…</span>',
      shortlinkOpenFull: "ブラウザで短縮リンクを開く",
        cityNameIdNotFound: "都市IDが見つかりません。（City IDマップに登録된 도시 이름으로 검색해 주세요。）",
   },
    th: {
      shortlinkTitle: "ไม่สามารถแปลงลิงก์แบบย่อได้",
      shortlinkBody:
        "เปิดลิงก์แบบย่อใน<strong>เว็บเบราว์เซอร์</strong> (Safari / Samsung Internet / Chrome) แล้วคัดลอก URL แบบเต็มที่ขยายแล้วมาวางที่นี่<ul>" +
        "<li>1) วางลิงก์แบบย่อใน<strong>แถบที่อยู่ของเบราว์เซอร์</strong></li>" +
        "<li>2) เมื่อหน้าโหลดแล้ว ให้คัดลอก<strong>URL แบบเต็ม</strong>ในแถบที่อยู่</li>" +
        "<li>3) วางที่นี่แล้วกด<strong>ค้นหาลิงก์ราคาถูกที่สุด</strong></li></ul>" +
        '<span class="sl-example">เช่น https://kr.trip.com/hotels/… หรือ https://kr.trip.com/flights/…</span>',
      shortlinkOpenFull: "เปิดลิงก์แบบย่อในเบราว์เซอร์",
        cityNameIdNotFound: "ไม่พบ ID เมือง (โปรดค้นหาโดยใช้ชื่อเมืองที่ลงทะเบียนในแผนที่ City ID)",
   }
  };
  const TL = (key) => {
    const fallback = (FALLBACK_TEXT[currentLang]?.[key]) ?? (FALLBACK_TEXT.en?.[key] ?? key);
    if (FORCE_FALLBACK_KEYS.has(key)) return fallback;
    return (window.TRANSLATIONS?.[currentLang]?.[key]) ?? fallback;
  };

  // 페이지 언어 → 기본 통화 맵(확장)
  const languageToCurrencyMap = {
    ko:'KRW', ja:'JPY', en:'USD', th:'THB',
    es:'EUR', fr:'EUR', de:'EUR', nl:'EUR', pt:'EUR',
    it:'EUR', pl:'EUR', sv:'EUR', fi:'EUR', da:'EUR',
    vi:'VND', id:'IDR', ms:'MYR', zh:'TWD', hi:'INR',
    ru:'RUB', ar:'SAR'
  };

  // Trip.com 국가 도메인 리스트 (태국 flag 포함)
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

  // ===== 항공 → 호텔 CTA 라벨(일반 문구) =====
  function hotelCtaLabel(){
    if (currentLang === 'ko') return '숙소도 한번에 찾기';
    if (currentLang === 'ja') return '宿もまとめて検索';
    if (currentLang === 'th') return 'ค้นหาโรงแรมพร้อมกัน';
    return 'Find hotels for these dates';
  }

  // ===== 제휴 파라미터 부착 =====
  function appendAffiliate(urlStr){
    try{
      const u = new URL(urlStr, location.origin);
      const sp = u.searchParams;
      if (!sp.has('Allianceid') && !sp.has('SID')) {
        AFF_AFFIX.split('&').forEach(kv => {
          const [k, v=''] = kv.split('=');
          if (!sp.has(k)) sp.set(k, v);
        });
        u.search = sp.toString();
      }
      return u.toString();
    }catch(_){
      return urlStr + (urlStr.includes('?') ? '&' : '?') + AFF_AFFIX;
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
    return appendAffiliate(raw);
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

  // ===== 리소스 힌트 =====
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
    card.className = 'info-card';

    const h = document.createElement('h2');
    h.textContent = TL('shortlinkTitle');

    const p = document.createElement('p');
    p.innerHTML = TL('shortlinkBody');

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '12px';
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';

    const openBtn = document.createElement('a');
    openBtn.className = 'external-link-btn';
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

    btnRow.appendChild(openBtn);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(btnRow);
    container.appendChild(card);
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

  // ===== 메인 기능 =====
  let linkClickCount = 0;
  let mobilePopupShown = false;
  let blankClickCount = 0;

  async function generateLinks(){
    const input = ($('#inputUrl')?.value || '').trim();
    const lowerInput = input.toLowerCase();

    // 카테고리 판별(대략)
    let category = 'Other';
     const isUrl = isLikelyUrl(input);
     if (isUrl) {
       if (input.includes('/hotels/')) category = 'Hotel';
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
          const host = (currentLang === 'ko') ? 'kr.trip.com' : 'www.trip.com';
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
          const blacklist = ['gclid','msclkid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','Allianceid','SID','trip_sub1','trip_sub3'];
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
        if (u.hostname === 'trip.com' || /\.trip\.com$/.test(u.hostname)) {
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
          generateLinks(); // 링크 생성/검색 함수 호출
        }
      });
      
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
  });
// ===== 이벤트 리스너 부착 =====
const generateBtn = $('#generate-btn');
if (generateBtn) {
    generateBtn.addEventListener('click', generateLinks);
}

const inputUrl = $('#inputUrl');
if (inputUrl) {
    inputUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateLinks();
    });
}

  }) ();


