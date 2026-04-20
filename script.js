  // --- NAVIGATION ---
  function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const el = document.getElementById('nav-' + id);
    if (el) el.classList.add('active');

    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const section = document.getElementById(id);
        const top = section.offsetTop - 64;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }, 100);
    }
    return false;
  }

  function toggleMenu() {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  }

  function closeMenu() {
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('mobile-menu').classList.remove('open');
  }

  // --- NEWS FILTER ---
  function filterNews(tag, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.news-item').forEach(item => {
      item.style.display = (tag === 'all' || item.dataset.tag === tag) ? 'block' : 'none';
    });
  }

  function toggleNews(el) {
    const detail = el.querySelector('.news-detail');
    detail.classList.toggle('open');
  }

  // --- ESTIMATE ---

  // 都道府県の代表座標（Haversine距離計算用）
  const PREF_COORDS = {
    '北海道':[43.064,141.347],'青森県':[40.824,140.740],'岩手県':[39.704,141.153],
    '宮城県':[38.269,140.872],'秋田県':[39.719,140.102],'山形県':[38.240,140.363],
    '福島県':[37.750,140.468],'茨城県':[36.342,140.447],'栃木県':[36.566,139.884],
    '群馬県':[36.391,139.061],'埼玉県':[35.857,139.649],'千葉県':[35.605,140.123],
    '東京都':[35.690,139.692],'神奈川県':[35.448,139.643],'新潟県':[37.902,139.024],
    '富山県':[36.695,137.211],'石川県':[36.595,136.626],'福井県':[36.065,136.222],
    '山梨県':[35.664,138.569],'長野県':[36.651,138.181],'岐阜県':[35.391,136.722],
    '静岡県':[34.977,138.383],'愛知県':[35.180,136.907],'三重県':[34.730,136.509],
    '滋賀県':[35.005,135.869],'京都府':[35.021,135.756],'大阪府':[34.686,135.520],
    '兵庫県':[34.691,135.183],'奈良県':[34.685,135.833],'和歌山県':[34.226,135.168],
    '鳥取県':[35.504,134.238],'島根県':[35.472,133.051],'岡山県':[34.662,133.935],
    '広島県':[34.397,132.460],'山口県':[34.186,131.471],'徳島県':[34.066,134.559],
    '香川県':[34.340,134.043],'愛媛県':[33.842,132.766],'高知県':[33.560,133.531],
    '福岡県':[33.606,130.418],'佐賀県':[33.249,130.299],'長崎県':[32.745,129.874],
    '熊本県':[32.790,130.742],'大分県':[33.238,131.613],'宮崎県':[31.911,131.424],
    '鹿児島県':[31.560,130.558],'沖縄県':[26.212,127.681]
  };

  function haversineKm(c1, c2) {
    const R = 6371;
    const dLat = (c2[0] - c1[0]) * Math.PI / 180;
    const dLon = (c2[1] - c1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(c1[0]*Math.PI/180) * Math.cos(c2[0]*Math.PI/180) *
              Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getDistanceSurcharge(km) {
    if (km <= 30)  return { charge: 0,      label: '同一エリア（〜30km）' };
    if (km <= 80)  return { charge: 10000,  label: '近距離（30〜80km）' };
    if (km <= 150) return { charge: 25000,  label: '中距離（80〜150km）' };
    if (km <= 300) return { charge: 45000,  label: '遠距離（150〜300km）' };
    return             { charge: 70000,  label: '長距離（300km超）' };
  }

  // 郵便番号 → 都道府県・市区町村 自動入力
  async function lookupZip(prefix) {
    const raw = document.getElementById(prefix + '-zip').value.replace(/-/g, '').trim();
    if (raw.length !== 7 || isNaN(raw)) {
      alert('郵便番号を7桁の数字で入力してください（例：8100001）');
      return;
    }
    const btn = document.querySelector(`#${prefix}-zip + button`) ||
                document.querySelector(`[onclick="lookupZip('${prefix}')"]`);
    if (btn) { btn.textContent = '検索中…'; btn.disabled = true; }
    try {
      const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${raw}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const r    = data.results[0];
        const pref = r.address1;
        const city = r.address2 + r.address3;
        const sel  = document.getElementById(prefix + '-pref');
        for (let opt of sel.options) {
          if (opt.value === pref || opt.text === pref) { sel.value = opt.value || pref; break; }
        }
        // optionのvalueが空の場合（<option>都道府県名</option>形式）
        sel.value = pref;
        document.getElementById(prefix + '-city').value = city;
      } else {
        alert('該当する住所が見つかりませんでした。都道府県・市区町村を直接選択してください。');
      }
    } catch(e) {
      alert('通信エラーが発生しました。都道府県・市区町村を直接選択してください。');
    } finally {
      if (btn) { btn.textContent = '自動入力'; btn.disabled = false; }
    }
  }

  function calcEstimate() {
    const fromPref = document.getElementById('from-pref').value;
    const fromCity = document.getElementById('from-city').value.trim();
    const toPref   = document.getElementById('to-pref').value;
    const toCity   = document.getElementById('to-city').value.trim();
    const room     = document.getElementById('room-type').value;
    const time     = document.getElementById('move-time').value;

    if (!fromPref || !fromCity || !toPref || !toCity || !room) {
      alert('引越し元・先の都道府県と市区町村、間取りは必須です');
      return;
    }

    // 基本料金（間取り）
    const baseMap = { '1R': 19800, '1K': 24800, '1DK': 34800, '1LDK': 44800, '2K': 49800 };
    let base = baseMap[room] || 29800;

    // 時間帯割引
    if (time === 'any') base = Math.round(base * 0.92);

    // 距離料金
    const c1 = PREF_COORDS[fromPref];
    const c2 = PREF_COORDS[toPref];
    let distInfo = { charge: 0, label: '同一エリア', km: 0 };
    if (c1 && c2) {
      const km = Math.round(haversineKm(c1, c2));
      distInfo = { ...getDistanceSurcharge(km), km };
    }

    // 家具・オプション料金
    const checks = document.querySelectorAll('.furniture-opt:checked');
    let optTotal = 0;
    const optDetails = [];
    checks.forEach(cb => {
      const val = parseInt(cb.value);
      const lbl = cb.parentElement.textContent.replace(/\+¥[\d,]+/, '').trim();
      optTotal += val;
      optDetails.push({ lbl, val });
    });

    const total = base + distInfo.charge + optTotal;

    // 内訳表示
    let bdHTML = `
      <div class="breakdown-row"><span>基本料金（${room}）${time==='any'?' ※おまかせ割引適用':''}</span><span>¥${base.toLocaleString()}</span></div>
      <div class="breakdown-row"><span>距離料金（${distInfo.label}${distInfo.km ? ' 約'+distInfo.km+'km' : ''}）</span><span>¥${distInfo.charge.toLocaleString()}</span></div>
    `;
    optDetails.forEach(o => {
      bdHTML += `<div class="breakdown-row"><span>${o.lbl}</span><span>¥${o.val.toLocaleString()}</span></div>`;
    });

    document.getElementById('result-breakdown').innerHTML = bdHTML;
    document.getElementById('result-price').textContent = '¥' + total.toLocaleString() + '〜';
    const el = document.getElementById('estimate-result');
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // --- FORMAL REQUEST ---
  function showFormalRequest() {
    const formalEl = document.getElementById('formal-request');
    const summaryEl = document.getElementById('estimate-summary');

    // 見積もり情報を収集
    const fromPref  = document.getElementById('from-pref').value;
    const fromCity  = document.getElementById('from-city').value.trim();
    const toPref    = document.getElementById('to-pref').value;
    const toCity    = document.getElementById('to-city').value.trim();
    const room      = document.getElementById('room-type').value;
    const moveDate  = document.getElementById('move-date').value;
    const price     = document.getElementById('result-price').textContent;
    const moveTime  = document.getElementById('move-time');
    const timeLabel = moveTime.options[moveTime.selectedIndex].text;

    // 日付の表示用フォーマット
    const dateDisp = moveDate
      ? new Date(moveDate).toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric' })
      : null;

    // サマリーHTML
    let summaryHTML = `
      <div class="estimate-sum-row"><span>引越し元</span><span>${fromPref} ${fromCity}</span></div>
      <div class="estimate-sum-row"><span>引越し先</span><span>${toPref} ${toCity}</span></div>
      <div class="estimate-sum-row"><span>間取り</span><span>${room}</span></div>
      <div class="estimate-sum-row"><span>時間帯</span><span>${timeLabel}</span></div>
      ${dateDisp ? `<div class="estimate-sum-row"><span>希望日</span><span>${dateDisp}</span></div>` : ''}
      <div class="estimate-sum-row"><span>概算金額</span><span class="sum-price">${price}</span></div>
    `;

    // 選択されたオプションを収集
    const checks = document.querySelectorAll('.furniture-opt:checked');
    if (checks.length > 0) {
      const optLabels = Array.from(checks).map(cb =>
        cb.parentElement.textContent.replace(/\+¥[\d,]+/, '').trim()
      ).join('、');
      summaryHTML += `<div class="estimate-sum-row"><span>オプション</span><span>${optLabels}</span></div>`;
    }

    summaryEl.innerHTML = summaryHTML;

    // 希望日が未入力なら正式依頼フォームで必須化
    const dateGroup = document.getElementById('f-date-group');
    const fDate     = document.getElementById('f-date');
    if (!moveDate) {
      dateGroup.style.display = 'block';
      fDate.required = true;
    } else {
      dateGroup.style.display = 'none';
      fDate.required = false;
      fDate.value = moveDate;
    }

    // フォームをリセット（再表示時）
    document.getElementById('formal-form-body').style.display = 'block';
    document.getElementById('formal-success').classList.remove('show');

    // フォームを表示してスクロール
    formalEl.classList.add('show');
    setTimeout(() => {
      formalEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function submitFormalRequest() {
    const name  = document.getElementById('f-name').value.trim();
    const tel   = document.getElementById('f-tel').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const dateGroup = document.getElementById('f-date-group');
    const fDate = document.getElementById('f-date').value;

    if (!name)  { alert('お名前を入力してください'); return; }
    if (!tel)   { alert('電話番号を入力してください'); return; }
    if (!email) { alert('メールアドレスを入力してください'); return; }
    if (dateGroup.style.display !== 'none' && !fDate) {
      alert('引越し希望日を入力してください'); return;
    }

    document.getElementById('formal-form-body').style.display = 'none';
    document.getElementById('formal-success').classList.add('show');
    document.getElementById('formal-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // --- REVIEWS ---
  // 口コミデータは reviews.js で管理しています。
  // 新しい口コミを追加する場合は reviews.js を編集してください。

  const REVIEWS_PER_PAGE = 5;
  let currentReviewPage = 1;
  let currentSort = 'top';   // 'top' | 'latest'
  let currentFilter = null;  // null | 1 | 2 | 3 | 4 | 5

  // '2024年11月' → 202411 (比較用数値)
  function parseDateValue(dateStr) {
    const m = dateStr.match(/(\d+)年(\d+)月/);
    return m ? parseInt(m[1]) * 100 + parseInt(m[2]) : 0;
  }

  // フィルター + ソートを適用した一覧を返す
  function getDisplayReviews() {
    let list = [...allReviews];
    if (currentFilter !== null) {
      list = list.filter(r => r.rating === currentFilter);
    }
    if (currentSort === 'top') {
      list.sort((a, b) => b.rating - a.rating || parseDateValue(b.date) - parseDateValue(a.date));
    } else {
      list.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
    }
    return list;
  }

  function starsHtml(rating) {
    return '<span style="color:#F5821F">' + '★'.repeat(rating) + '</span>' + '<span style="color:#D8E4EF">' + '★'.repeat(5 - rating) + '</span>';
  }

  // 総合評価を動的に計算して、ホーム・レビューページ両方に反映
  function renderOverallRating() {
    if (!allReviews || allReviews.length === 0) return;
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    const pct = (avg / 5) * 100;
    const avgText   = avg.toFixed(1);
    const countText = allReviews.length + '件の評価';

    // レビューページ
    const scoreEl = document.getElementById('overall-score');
    const fillEl  = document.getElementById('overall-stars-fill');
    const countEl = document.getElementById('overall-count');
    if (scoreEl) scoreEl.textContent = avgText;
    if (fillEl)  fillEl.style.width  = pct + '%';
    if (countEl) countEl.textContent = countText;

    // ホームプレビュー
    const homeScoreEl = document.getElementById('home-overall-score');
    const homeFillEl  = document.getElementById('home-stars-fill');
    const homeCountEl = document.getElementById('home-overall-count');
    if (homeScoreEl) homeScoreEl.textContent = avgText;
    if (homeFillEl)  homeFillEl.style.width  = pct + '%';
    if (homeCountEl) homeCountEl.textContent = countText;
  }

  // ホームのプレビューカード（評価高い順・上位3件）を自動描画
  function renderHomeReviews() {
    const container = document.getElementById('home-reviews-container');
    if (!container) return;
    const top3 = [...allReviews]
      .sort((a, b) => b.rating - a.rating || parseDateValue(b.date) - parseDateValue(a.date))
      .slice(0, 3);
    container.innerHTML = top3.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${r.name[0]}</div>
          <div class="review-meta">
            <div class="review-name">${r.name}</div>
            <div class="review-date">${r.date}</div>
          </div>
          <div class="review-rating-stars">${starsHtml(r.rating)}</div>
        </div>
        <span class="review-plan-badge">${r.plan}</span>
        <div class="review-comment">${r.comment}</div>
      </div>
    `).join('');
  }

  // 星別バーを描画
  function renderStarBreakdown() {
    const el = document.getElementById('star-breakdown');
    if (!el) return;
    const counts = [0, 0, 0, 0, 0, 0]; // index 1-5
    allReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating]++; });
    const max = Math.max(...counts.slice(1), 1);

    let html = '';
    for (let star = 5; star >= 1; star--) {
      const count = counts[star];
      const pct   = (count / max) * 100;
      const isActive = currentFilter === star;
      html += `
        <div class="star-bar-row${isActive ? ' active' : ''}" onclick="setStarFilter(${star})" role="button" tabindex="0">
          <span class="star-bar-label">${star}★</span>
          <div class="star-bar-track">
            <div class="star-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="star-bar-count">${count}件</span>
        </div>
      `;
    }
    el.innerHTML = html;
  }

  // フィルターバッジを更新
  function renderFilterInfo() {
    const el = document.getElementById('review-filter-info');
    if (!el) return;
    if (currentFilter !== null) {
      el.innerHTML = `<span class="review-filter-badge">${currentFilter}★のみ表示 <button class="filter-clear-btn" onclick="setStarFilter(${currentFilter})">✕ 解除</button></span>`;
    } else {
      el.innerHTML = '';
    }
  }

  // 並び替え変更
  function setSort(mode) {
    currentSort = mode;
    currentReviewPage = 1;
    document.querySelectorAll('.review-sort-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.review-sort-btn[data-sort="${mode}"]`);
    if (btn) btn.classList.add('active');
    renderReviews(1);
  }

  // 星フィルター切り替え（同じ星を再クリックで解除）
  function setStarFilter(star) {
    currentFilter = (currentFilter === star) ? null : star;
    currentReviewPage = 1;
    renderStarBreakdown();
    renderFilterInfo();
    renderReviews(1);
  }

  function renderReviews(page) {
    const list  = getDisplayReviews();
    const start = (page - 1) * REVIEWS_PER_PAGE;
    const pageData = list.slice(start, start + REVIEWS_PER_PAGE);
    const container = document.getElementById('reviews-container');
    if (!container) return;

    if (pageData.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:2.5rem;color:var(--text-muted)">該当するレビューがありません</p>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    container.innerHTML = pageData.map(r => `
      <div class="review-card" style="margin-bottom:1rem">
        <div class="review-header">
          <div class="review-avatar">${r.name[0]}</div>
          <div class="review-meta">
            <div class="review-name">${r.name}</div>
            <div class="review-date">${r.date}</div>
          </div>
          <div class="review-rating-stars">${starsHtml(r.rating)}</div>
        </div>
        <span class="review-plan-badge">${r.plan}</span>
        <div class="review-comment">${r.comment}</div>
      </div>
    `).join('');
    renderPagination(page, list.length);
  }

  function renderPagination(current, totalItems) {
    const total = Math.ceil(totalItems / REVIEWS_PER_PAGE);
    const el = document.getElementById('pagination');
    if (!el) return;
    let html = '';
    if (current > 1) html += `<button class="page-btn page-btn-arrow" onclick="goToReviewPage(${current - 1})">← 前へ</button>`;
    for (let i = 1; i <= total; i++) {
      html += `<button class="page-btn${i === current ? ' active' : ''}" onclick="goToReviewPage(${i})">${i}</button>`;
    }
    if (current < total) html += `<button class="page-btn page-btn-arrow" onclick="goToReviewPage(${current + 1})">次へ →</button>`;
    el.innerHTML = html;
  }

  function goToReviewPage(page) {
    currentReviewPage = page;
    renderReviews(page);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const section = document.getElementById('reviews');
        window.scrollTo({ top: section.offsetTop - 64, behavior: 'smooth' });
      });
    });
  }

  // 初期化
  document.addEventListener('DOMContentLoaded', () => {
    renderOverallRating();    // ホーム・レビューページ両方の総合スコアを計算
    renderHomeReviews();      // ホームのプレビューカード上位3件を描画
    renderStarBreakdown();    // レビューページの星別バーを描画
    renderFilterInfo();
    renderReviews(1);
  });

  // --- FAQ ---
  function toggleFaq(el) {
    el.classList.toggle('open');
  }

  // --- CONTACT ---
  function submitContact() {
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const msg = document.getElementById('c-message').value.trim();
    if (!name || !email || !msg) {
      alert('必須項目をご入力ください');
      return;
    }
    document.getElementById('contact-form-body').style.display = 'none';
    document.getElementById('form-success').classList.add('show');
  }