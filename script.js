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
  function calcEstimate() {
    const from = document.getElementById('from-pref').value;
    const to = document.getElementById('to-pref').value;
    const room = document.getElementById('room-type').value;
    const time = document.getElementById('move-time').value;
    const opt = document.getElementById('option-type').value;

    if (!from || !to || !room) {
      alert('必須項目をご入力ください');
      return;
    }

    const baseMap = { '1R': 19800, '1K': 24800, '1DK': 34800, '1LDK': 44800, '2K': 49800 };
    let price = baseMap[room] || 29800;

    if (from !== to) price += 10000;
    if (from === 'other' || to === 'other') price += 15000;
    if (time === 'any') price = Math.round(price * 0.92);

    const optMap = { none: 0, pack: 3000, assemble: 5000, both: 7500 };
    price += optMap[opt] || 0;

    const el = document.getElementById('estimate-result');
    document.getElementById('result-price').textContent = '¥' + price.toLocaleString() + '〜';
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // --- REVIEWS ---
  const allReviews = [
    { name: '田中 亜美', rating: 5, date: '2024年11月', plan: 'スタンダード', comment: '急な転勤で1週間前のご連絡にも快く対応いただきました。スタッフの方がとても丁寧で、大型冷蔵庫も傷なく運んでいただき大変満足しています。' },
    { name: '佐藤 健太', rating: 5, date: '2024年11月', plan: 'ミニプラン', comment: '料金がわかりやすく、見積もり通りの金額で安心できました。当日のスタッフの方も明るく丁寧で、引越しがスムーズに終わりました。' },
    { name: '伊藤 美咲', rating: 5, date: '2024年10月', plan: 'スタンダード', comment: '女性の一人暮らしの引越しで不安でしたが、スタッフの方が終始丁寧に対応してくださり安心できました。壁の養生もしっかりしていただき傷ゼロで完了しました。' },
    { name: '山本 さくら', rating: 4, date: '2024年10月', plan: 'スタンダード', comment: '全体的にとても満足しています。スタッフの方が明るく、部屋の養生もしっかり行っていただきました。次回も利用したいと思います。' },
    { name: '中村 大輔', rating: 5, date: '2024年9月', plan: 'ゆったりプラン', comment: '荷物が多く心配でしたが、ゆったりプランで余裕を持って対応していただきました。大型家電も丁寧に扱っていただき感謝しています。' },
    { name: '鈴木 雄太', rating: 4, date: '2024年9月', plan: 'ミニプラン', comment: 'コスパが良く、手頃な価格で引越しができました。スタッフの方もテキパキと動いてくださり、予定より早く終わって助かりました。' },
    { name: '渡辺 花子', rating: 5, date: '2024年8月', plan: 'スタンダード', comment: '梱包から設置まで丁寧にしていただきました。引越し後の家具の配置まで相談に乗っていただき、とても助かりました。' },
    { name: '小林 誠', rating: 5, date: '2024年8月', plan: 'ゆったりプラン', comment: '福岡から熊本への遠距離でしたが、問題なく対応していただきました。荷物の損傷もなく、料金も想定内でとても安心できました。' },
    { name: '加藤 由美', rating: 4, date: '2024年7月', plan: 'ミニプラン', comment: '時間通りにきていただき安心しました。スタッフの方も礼儀正しく、初めての一人暮らしの引越しでしたがスムーズに終わりました。' },
    { name: '林 拓也', rating: 5, date: '2024年7月', plan: 'スタンダード', comment: '見積もりから当日まで、丁寧なご対応ありがとうございました。急な依頼にも関わらず迅速に対応していただき、本当に助かりました。' },
  ];

  const REVIEWS_PER_PAGE = 5;
  let currentReviewPage = 1;

  function starsHtml(rating) {
    return '<span style="color:#F5821F">' + '★'.repeat(rating) + '</span>' + '<span style="color:#D8E4EF">' + '★'.repeat(5 - rating) + '</span>';
  }

  function renderReviews(page) {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    const pageData = allReviews.slice(start, start + REVIEWS_PER_PAGE);
    const container = document.getElementById('reviews-container');
    if (!container) return;
    container.innerHTML = pageData.map(r => `
      <div class="review-card" style="margin-bottom:1rem">
        <div class="review-header">
          <div class="review-avatar">${r.name[0]}</div>
          <div class="review-meta">
            <div class="review-name">${r.name} 様</div>
            <div class="review-date">${r.date}</div>
          </div>
          <div class="review-rating-stars">${starsHtml(r.rating)}</div>
        </div>
        <span class="review-plan-badge">${r.plan}</span>
        <div class="review-comment">${r.comment}</div>
      </div>
    `).join('');
    renderPagination(page);
  }

  function renderPagination(current) {
    const total = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
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
  document.addEventListener('DOMContentLoaded', () => renderReviews(1));

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