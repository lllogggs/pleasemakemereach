const popupTexts = {
  ko: {
    logo: "🌐 트립닷닷",
    title: "사용법",
    button: "확인했어요",
    steps: [
      "Trip.com에서 <strong>원하는 호텔/항공 상품 선택</strong>",
      "해당 상품 주소창 <strong>링크 복사</strong>",
      "트립닷닷 입력창에 <strong>링크 붙여넣기</strong>",
      "‘<strong>최저가 링크 찾기</strong>’ 클릭"
    ]
  },
  ja: {
    logo: "🌐 Tripdotdot",
    title: "使い方",
    button: "OK",
    steps: [
      "Trip.comで<strong>宿泊/航空ページを開く</strong>",
      "そのページのURLを<strong>コピーする</strong>",
      "Tripdotdotの入力欄に<strong>貼り付ける</strong>",
      "「<strong>最安値リンクを探す</strong>」をクリック"
    ]
  },
  th: {
    logo: "🌐 Tripdotdot",
    title: "วิธีใช้",
    button: "เข้าใจแล้ว",
    steps: [
      "ใน Trip.com <strong>เปิดหน้าโรงแรม/ตั๋วเครื่องบิน</strong>",
      "<strong>คัดลอกลิงก์ (URL)</strong> ของหน้านั้น",
      "ที่ Tripdotdot <strong>วางลิงก์</strong>",
      "กด “<strong>ค้นหาลิงก์ราคาต่ำสุด</strong>”"
    ]
  },
  en: {
    logo: "🌐 Tripdotdot",
    title: "How to use",
    button: "Got it",
    steps: [
      "On Trip.com, <strong>choose your hotel/flight</strong>",
      "<strong>Copy the link</strong> from the address bar",
      "In Tripdotdot, <strong>paste the link</strong>",
      "Click “<strong>Find lowest price</strong>”"
    ]
  }
};

function getCurrentLang() {
  const p = location.pathname;
  if (p.startsWith("/ja/")) return "ja";
  if (p.startsWith("/th/")) return "th";
  if (p.startsWith("/en/")) return "en";
  return "ko";
}

function renderAdGuidePopup() {
  const lang = getCurrentLang();
  const t = popupTexts[lang] || popupTexts.ko;

  const popup = document.getElementById("ad-guide-popup");
  if (!popup) return;

  popup.querySelector(".ad-guide-logo").textContent = t.logo;
  popup.querySelector(".ad-guide-title").textContent = t.title;
  popup.querySelector("#ad-guide-close").textContent = t.button;

  const list = document.getElementById("ad-guide-list");
  list.innerHTML = "";
  t.steps.forEach((txt, idx) => {
    const li = document.createElement("li");
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = (idx + 1).toString();
    li.appendChild(num);

    const textSpan = document.createElement("span");
    textSpan.className = "step-text";
    textSpan.innerHTML = txt;
    li.appendChild(textSpan);

    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  renderAdGuidePopup();

  const params = new URLSearchParams(location.search);
  const fromGoogle =
    params.get("utm_source") === "google" ||
    params.get("utm_medium") === "cpc";

  if (fromGoogle && !localStorage.getItem("seenAdGuide")) {
    setTimeout(() => {
      const popup = document.getElementById("ad-guide-popup");
      if (popup) popup.style.display = "block";
      localStorage.setItem("seenAdGuide", "true");
    }, 800);
  }

  const popup = document.getElementById("ad-guide-popup");
  if (popup) {
    const closeBtn = popup.querySelector("#ad-guide-close");
    const overlay = popup.querySelector(".ad-guide-overlay");
    
    if (closeBtn) closeBtn.onclick = () => popup.style.display = "none";
    if (overlay) overlay.onclick = () => popup.style.display = "none";
  }
});
