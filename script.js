  // --- EMAILJS 初期化 ---
  const EMAILJS_SERVICE_ID  = 'service_demo20260420';
  const EMAILJS_TEMPLATE_ID = 'template_pm07dxb';
  emailjs.init('Ey4aS5A4qtpGSrUTa');

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

  // --- NEWS ---
  // お知らせデータは news.js で管理しています。
  // 新しいお知らせを追加する場合は news.js を編集してください。

  const TAG_LABELS = { campaign: 'キャンペーン', info: 'お知らせ', notice: '重要' };

  function renderNews() {
    const container = document.getElementById('news-container');
    if (!container || !allNews) return;
    container.innerHTML = allNews.map(item => `
      <div class="news-item" data-tag="${item.tag}" onclick="toggleNews(this)">
        <div class="news-item-header">
          <span class="news-date">${item.date}</span>
          <span class="news-tag tag-${item.tag}">${TAG_LABELS[item.tag] || item.tag}</span>
        </div>
        <div class="news-title">${item.title}</div>
        <div class="news-excerpt">${item.excerpt}</div>
        <div class="news-detail">${item.detail}</div>
      </div>
    `).join('');
  }

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

  // 距離料金テーブル
  function getDistanceSurcharge(km) {
    if (km <= 30)  return { charge: 0,      label: '同一エリア（〜30km）' };
    if (km <= 80)  return { charge: 10000,  label: '近距離（30〜80km）' };
    if (km <= 150) return { charge: 25000,  label: '中距離（80〜150km）' };
    if (km <= 300) return { charge: 45000,  label: '遠距離（150〜300km）' };
    return             { charge: 70000,  label: '長距離（300km超）' };
  }

  // ハーバーサイン公式（緯度経度 → km）
  function calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // 郵便番号 → 緯度経度（zipcloud + Nominatim）
  // 同じ郵便番号の2回目以降はキャッシュから返す
  const _latLngCache = {};
  async function getLatLng(zip) {
    if (_latLngCache[zip]) return _latLngCache[zip];
    // zipcloud で住所取得
    const r1   = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const d1   = await r1.json();
    if (!d1.results) throw new Error('住所取得失敗');
    const addr = d1.results[0].address1 + d1.results[0].address2 + d1.results[0].address3;
    // Nominatim で緯度経度取得
    const r2   = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
    );
    const d2   = await r2.json();
    if (!d2.length) throw new Error('座標取得失敗');
    const result = { lat: parseFloat(d2[0].lat), lon: parseFloat(d2[0].lon) };
    _latLngCache[zip] = result;
    return result;
  }

  // 郵便番号 → 都道府県・市区町村 自動入力
  async function lookupZip(prefix) {
    const raw = document.getElementById(prefix + '-zip').value.replace(/-/g, '').trim();
    if (raw.length !== 7 || isNaN(raw)) {
      alert('郵便番号を7桁の数字で入力してください（例：8100001）');
      return;
    }
    const btn = document.querySelector(`[onclick="lookupZip('${prefix}')"]`);
    if (btn) { btn.textContent = '検索中…'; btn.disabled = true; }
    try {
      const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${raw}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const r    = data.results[0];
        const pref = r.address1;
        const city = r.address2 + r.address3;
        const sel  = document.getElementById(prefix + '-pref');
        sel.value  = pref;
        document.getElementById(prefix + '-city').value = city;
      } else {
        alert('該当する住所が見つかりませんでした。都道府県・市区町村を直接入力してください。');
      }
    } catch(e) {
      alert('通信エラーが発生しました。都道府県・市区町村を直接入力してください。');
    } finally {
      if (btn) { btn.textContent = '自動入力'; btn.disabled = false; }
    }
  }

  async function calcEstimate() {
    const fromPref = document.getElementById('from-pref').value;
    const fromCity = document.getElementById('from-city').value.trim();
    const toPref   = document.getElementById('to-pref').value;
    const toCity   = document.getElementById('to-city').value.trim();
    const room     = document.getElementById('room-type').value;
    const time     = document.getElementById('move-time').value;

    const fromZip = document.getElementById('from-zip').value.replace(/-/g, '').trim();
    const toZip   = document.getElementById('to-zip').value.replace(/-/g, '').trim();

    if (fromZip.length !== 7 || isNaN(fromZip)) {
      alert('引越し元の郵便番号を7桁の数字で入力してください');
      document.getElementById('from-zip').focus();
      return;
    }
    if (toZip.length !== 7 || isNaN(toZip)) {
      alert('引越し先の郵便番号を7桁の数字で入力してください');
      document.getElementById('to-zip').focus();
      return;
    }
    if (!fromPref || !fromCity || !toPref || !toCity || !room) {
      alert('都道府県・市区町村・間取りは必須です。郵便番号の「自動入力」ボタンを押して住所を入力してください');
      return;
    }

    // ボタンをローディング状態に
    const calcBtn = document.querySelector('[onclick="calcEstimate()"]');
    if (calcBtn) { calcBtn.textContent = '計算中…'; calcBtn.disabled = true; }

    try {
      // 基本料金（間取り）
      const baseMap = { '1R': 19800, '1K': 24800, '1DK': 34800, '1LDK': 44800, '2K': 49800 };
      let base = baseMap[room] || 29800;

      // 時間帯割引
      if (time === 'any') base = Math.round(base * 0.92);

      // 距離料金（郵便番号 → API計算、失敗時は都道府県座標でフォールバック）
      let distInfo = { charge: 0, label: '同一エリア（〜30km）', km: 0 };
      try {
        const [from, to] = await Promise.all([getLatLng(fromZip), getLatLng(toZip)]);
        const km = Math.round(calcDistanceKm(from.lat, from.lon, to.lat, to.lon));
        distInfo = { ...getDistanceSurcharge(km), km };
      } catch(e) {
        // API失敗時は都道府県中心座標でフォールバック
        distInfo = calcDistByPref(fromPref, toPref);
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

    } finally {
      if (calcBtn) { calcBtn.textContent = '概算を計算する'; calcBtn.disabled = false; }
    }
  }

  // 都道府県中心座標によるフォールバック計算
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
  function calcDistByPref(fromPref, toPref) {
    const c1 = PREF_COORDS[fromPref];
    const c2 = PREF_COORDS[toPref];
    if (!c1 || !c2) return { charge: 0, label: '同一エリア（〜30km）', km: 0 };
    const km = Math.round(calcDistanceKm(c1[0], c1[1], c2[0], c2[1]));
    return { ...getDistanceSurcharge(km), km };
  }

  // --- FORMAL REQUEST ---
  // submitFormalRequest() で参照するため、見積もりデータをここに保存
  let _estimateData = {};

  function showFormalRequest() {
    const formalEl = document.getElementById('formal-request');
    const summaryEl = document.getElementById('estimate-summary');

    // 見積もり情報を収集
    const fromPref  = document.getElementById('from-pref').value;
    const fromCity  = document.getElementById('from-city').value.trim();
    const fromZip   = document.getElementById('from-zip').value.replace(/-/g, '').trim();
    const toPref    = document.getElementById('to-pref').value;
    const toCity    = document.getElementById('to-city').value.trim();
    const toZip     = document.getElementById('to-zip').value.replace(/-/g, '').trim();
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
    let optLabels = 'なし';
    if (checks.length > 0) {
      optLabels = Array.from(checks).map(cb =>
        cb.parentElement.textContent.replace(/\+¥[\d,]+/, '').trim()
      ).join('、');
      summaryHTML += `<div class="estimate-sum-row"><span>オプション</span><span>${optLabels}</span></div>`;
    }

    summaryEl.innerHTML = summaryHTML;

    // 見積もりデータを保存（submitFormalRequest で使用）
    _estimateData = {
      fromPref, fromCity, fromZip,
      toPref, toCity, toZip,
      room, timeLabel, dateDisp, price, optLabels
    };

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

  async function submitFormalRequest() {
    const name  = document.getElementById('f-name').value.trim();
    const tel   = document.getElementById('f-tel').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const note  = document.getElementById('f-note').value.trim();
    const dateGroup = document.getElementById('f-date-group');
    const fDate = document.getElementById('f-date').value;

    if (!name)  { alert('お名前を入力してください'); return; }
    if (!tel)   { alert('電話番号を入力してください'); return; }
    if (!email) { alert('メールアドレスを入力してください'); return; }
    if (dateGroup.style.display !== 'none' && !fDate) {
      alert('引越し希望日を入力してください'); return;
    }

    const submitBtn = document.querySelector('[onclick="submitFormalRequest()"]');
    if (submitBtn) { submitBtn.textContent = '送信中…'; submitBtn.disabled = true; }

    // 希望日の表示用フォーマット
    const desiredDate = fDate
      ? new Date(fDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
      : (_estimateData.dateDisp || '未定');

    // メール本文（すべての見積もり情報を含む）
    const message = [
      '■ お客様情報',
      `お名前　　：${name}`,
      `電話番号　：${tel}`,
      `メール　　：${email}`,
      '',
      '■ 引越し内容',
      `引越し元　：${_estimateData.fromPref} ${_estimateData.fromCity}（〒${_estimateData.fromZip}）`,
      `引越し先　：${_estimateData.toPref} ${_estimateData.toCity}（〒${_estimateData.toZip}）`,
      `間取り　　：${_estimateData.room}`,
      `時間帯　　：${_estimateData.timeLabel}`,
      `希望日　　：${desiredDate}`,
      `オプション：${_estimateData.optLabels}`,
      `概算金額　：${_estimateData.price}`,
      '',
      '■ ご要望・備考',
      note || 'なし',
    ].join('\n');

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        form_type:  '正式見積もり依頼',
        from_name:  name,
        from_email: email,
        phone:      tel,
        subject:    `【正式見積もり依頼】${name} 様`,
        message,
      });
      document.getElementById('formal-form-body').style.display = 'none';
      document.getElementById('formal-success').classList.add('show');
      document.getElementById('formal-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(e) {
      alert('送信に失敗しました。お電話またはメールにて直接お問い合わせください。');
    } finally {
      if (submitBtn) { submitBtn.textContent = '依頼を送信する'; submitBtn.disabled = false; }
    }
  }

  // --- REVIEWS ---
  // 口コミデータは reviews.js で管理しています。
  // 新しい口コミを追加する場合は reviews.js を編集してください。

  const REVIEWS_PER_PAGE = 5;
  let currentReviewPage = 1;
  let currentSort = 'top';   // 'top' | 'latest'
  let currentFilter = null;  // null | 1 | 2 | 3 | 4 | 5

  // '2024年11月' → 20241100 / '2021年5月30日' → 20210530 (比較用数値)
  function parseDateValue(dateStr) {
    const m = dateStr.match(/(\d+)年(\d+)月(?:(\d+)日)?/);
    if (!m) return 0;
    const year  = parseInt(m[1]);
    const month = parseInt(m[2]);
    const day   = m[3] ? parseInt(m[3]) : 0;
    return year * 10000 + month * 100 + day;
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
    renderFaqPage();          // よくある質問ページを描画
    renderEstimateFaq();      // 見積もりページのミニFAQを描画
    renderNews();             // お知らせページを描画
  });

  // --- FAQ ---
  // 質問・回答データは faq.js で管理しています。
  // 質問を追加・変更する場合は faq.js を編集してください。

  function faqItemHtml(item) {
    return `
      <div class="faq-item" onclick="toggleFaq(this)">
        <div class="faq-q"><span class="faq-icon">Q</span>${item.q}</div>
        <div class="faq-a">${item.a}</div>
      </div>
    `;
  }

  // よくある質問ページ（カテゴリー別）
  function renderFaqPage() {
    const container = document.getElementById('faq-page-container');
    if (!container || !faqCategories) return;
    container.innerHTML = faqCategories.map(cat => `
      <div class="faq-category">
        <h2 class="faq-category-title">${cat.category}</h2>
        <div class="faq-list">
          ${cat.items.map(faqItemHtml).join('')}
        </div>
      </div>
    `).join('');
  }

  // 見積もりページ下部のミニFAQ
  function renderEstimateFaq() {
    const container = document.getElementById('estimate-faq-container');
    if (!container || !estimateFaqs) return;
    container.innerHTML = `<div class="faq-list">${estimateFaqs.map(faqItemHtml).join('')}</div>`;
  }

  function toggleFaq(el) {
    el.classList.toggle('open');
  }

  // --- CONTACT ---
  async function submitContact() {
    const name  = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const tel   = document.getElementById('c-tel').value.trim();
    const typeEl = document.getElementById('c-type');
    const type  = typeEl.options[typeEl.selectedIndex].text;
    const msg   = document.getElementById('c-message').value.trim();

    if (!name)  { alert('お名前を入力してください'); return; }
    if (!email) { alert('メールアドレスを入力してください'); return; }
    if (!msg)   { alert('メッセージを入力してください'); return; }

    const submitBtn = document.querySelector('[onclick="submitContact()"]');
    if (submitBtn) { submitBtn.textContent = '送信中…'; submitBtn.disabled = true; }

    const message = [
      '■ お客様情報',
      `お名前　　　　：${name}`,
      `メール　　　　：${email}`,
      `電話番号　　　：${tel || '未記入'}`,
      `お問い合わせ種別：${type}`,
      '',
      '■ メッセージ',
      msg,
    ].join('\n');

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        form_type:  'お問い合わせ',
        from_name:  name,
        from_email: email,
        phone:      tel || '未記入',
        subject:    `【お問い合わせ】${name} 様`,
        message,
      });
      document.getElementById('contact-form-body').style.display = 'none';
      document.getElementById('form-success').classList.add('show');
    } catch(e) {
      alert('送信に失敗しました。お電話またはメールにて直接お問い合わせください。');
    } finally {
      if (submitBtn) { submitBtn.textContent = '送信する'; submitBtn.disabled = false; }
    }
  }