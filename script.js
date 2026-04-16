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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const section = document.getElementById(id);
          const top = section.offsetTop - 64;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
      });
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
