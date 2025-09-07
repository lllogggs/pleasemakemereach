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
        <img src="https://flagcdn.com/w40/${l.flag}.png" alt="${l.code.toUpperCase()} Flag"> ${l.label}
      </a>
    `).join('');
  }

  // ===== 설정 상수 =====
  const EXPAND_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzhD4Ye_SW10KHvVO--d1zIqw8cK5GZ6IhbGe8JVReEioWN8Vv2Xxp2jlN7gu4oy6yI/exec';
  const LOG_ENDPOINT    = 'https://script.google.com/macros/s/AKfycbzhD4Ye_SW10KHvVO--d1zIqw8cK5GZ6IhbGe8JVReEioWN8Vv2Xxp2jlN7gu4oy6yI/exec';

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
    th:{ flag:'th', text:'ภาษาไทย', privacy:'/privacy_en.html', code:'TH' }
  };

  const languageToCurrencyMap = {
    ko:'KRW', ja:'JPY', en:'USD', th:'THB',
    es:'EUR', fr:'EUR', de:'EUR', nl:'EUR', pt:'EUR',
    vi:'VND', id:'IDR', ms:'MYR', zh:'TWD', hi:'INR', ru:'RUB', ar:'SAR'
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

  // ===== 언어 판별 & 적용 =====
  let currentLang = window.PAGE_LANG || detectLangByPath();

  function detectLangByPath(){
    const seg = (location.pathname.split('/')[1] || '').toLowerCase();
    if (seg === 'en') return 'en';
    if (seg === 'ja') return 'ja';
    if (seg === 'th') return 'th';
    return 'ko';
  }

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
      hotelWidget.src = widgetSrcModal[lang].hotel;
      flightWidget.src = widgetSrcModal[lang].flight;
    }

    const langFlag = $('#lang-flag');
    if (langFlag) {
      langFlag.src = `https://flagcdn.com/w40/${langDetails[lang].flag}.png`;
      langFlag.alt = `${langDetails[lang].text} Flag`;
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

  // ===== 축약링크 감지 & 확장(JSONP) =====
  function isTripShortLink(raw){
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./,'');
      return (host === 'trip.com' || host.endsWith('.trip.com')) && /^\/w\/[^/]+/.test(u.pathname);
    } catch { return false; }
  }

  function expandShortUrlJSONP(rawUrl, timeoutMs=3000){
    return new Promise((resolve) => {
      const cb = 'cb_expand_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
      const s = document.createElement('script');
      const url = `${EXPAND_ENDPOINT}?expand=1&url=${encodeURIComponent(rawUrl)}&callback=${cb}`;

      let done = false;
      const cleanup = () => {
        if (done) return;
        done = true;
        delete window[cb];
        s.remove();
      };

      window[cb] = (data) => {
        cleanup();
        if (data && data.ok && data.finalUrl) resolve(data.finalUrl);
        else resolve(rawUrl);
      };

      s.onerror = () => { cleanup(); resolve(rawUrl); };
      s.src = url;
      document.body.appendChild(s);

      setTimeout(() => { cleanup(); resolve(rawUrl); }, timeoutMs);
    });
  }

  async function ensureExpandedUrl(raw){
    if (isTripShortLink(raw)) {
      try {
        const expanded = await expandShortUrlJSONP(raw);
        return expanded || raw;
      } catch { return raw; }
    }
    return raw;
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
      window.open(affUrl, '_blank');
      isRedirecting = false;
    }, delayMs);
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
      a.className = 'kakao-chat-btn';
      a.textContent = isError ? (T.kakaoTalkError || 'Report an Error') : (T.kakaoTalk || 'KakaoTalk');
      return a;
    }

    if (!input.includes('trip.com')) {
      resultsDiv.innerHTML = `<p style="color:red; text-align:center;">${T.invalidLink || 'Invalid link.'}</p>`;
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      return;
    }

    try{
      // 1) 축약링크면 먼저 확장
      const sourceUrl = await ensureExpandedUrl(input);

      // 2) 이후 기존 로직으로 파싱/정제
      const url = new URL(sourceUrl);
      let pathname = url.pathname;
      const originalParams = new URLSearchParams(url.search);
      let essentialParams = new URLSearchParams();

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

      // 통화 보정
      if (!essentialParams.has('curr')) {
        let currency = languageToCurrencyMap[currentLang] || 'USD';
        if (originalParams.has('curr')) currency = (originalParams.get('curr') || '').toUpperCase();
        essentialParams.set('curr', currency);
      }

      const paramString = essentialParams.toString();
      const cleanPath = pathname + (paramString ? '?' + paramString : '');

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
        const finalAffix = (cleanPath.includes('?') ? '&' : '?') + AFF_AFFIX;
        const fullUrl = `https://${dom.code}.trip.com${cleanPath}${finalAffix}`;

        const a = document.createElement('a');
        a.href = fullUrl;
        a.target = '_blank';
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
        a.innerHTML = `<img class="flag" src="https://flagcdn.com/h40/${dom.flag}.png" alt="${label} flag"> ${label}`;
        grid.appendChild(a);
      });

      resultsDiv.appendChild(grid);
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton());

    } catch (e){
      resultsDiv.innerHTML = `<p style="color:red; text-align:center;">${T.parseError || 'Parse error.'}</p>`;
      if (currentLang === 'ko') resultsDiv.appendChild(createKakaoButton(true));
      console.error('URL Parsing Error:', e);
    }
  };

  // ===== [NEW] 구글 스니펫 억제: UI에는 영향 없음 =====
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

  // ===== 초기화 =====
  document.addEventListener('DOMContentLoaded', () => {
    renderLangDropdown();
    applyTranslations(currentLang);
    document.documentElement.lang = currentLang;

    // [NEW]
    applyNoSnippet();

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
    if (modalClose)      modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    if (modal)           modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    const tabButtons = $$('.tab-button');
    const tabContents = $$('.tab-content');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.addEventListener
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

    const mobileModal = $('#mobile-notice-modal');
    if (mobileModal) {
      const mobileClose = mobileModal.querySelector('.modal-close');
      if (mobileClose) mobileClose.addEventListener('click', () => { mobileModal.style.display = 'none'; });
      mobileModal.addEventListener('click', (e) => { if (e.target === mobileModal) mobileModal.style.display = 'none'; });
    }

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
  });
})();
