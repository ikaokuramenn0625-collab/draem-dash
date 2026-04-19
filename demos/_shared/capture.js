// Shared capture widget — waitlist + pre-order + referral tracking.
// Loaded by every generated demo. Mount with: renderCapture({demoId, title, priceYen?})

(function(){
  // ---- Configuration ----
  // Set via window.__CAPTURE_ENDPOINT before including this script, OR edit default.
  //   Formspree:   "https://formspree.io/f/xxxxxxx"
  //   formsubmit:  "https://formsubmit.co/ajax/your@email.com"
  //   CF Worker:   "https://waitlist.your-worker.workers.dev/submit"
  // If empty/null, submissions are stored locally and shown in toast (for MVP / pre-launch).
  const ENDPOINT = window.__CAPTURE_ENDPOINT || '';

  // Stripe Payment Links per demo. Loaded from _shared/stripe_links.json at startup.
  // Update via: python3 ~/draem_local/ops/automation/demo_factory/monetize.py --set <id> <url>
  let STRIPE_LINKS = Object.assign({}, window.__STRIPE_LINKS || {});
  async function loadStripeLinks(){
    try {
      const r = await fetch('../_shared/stripe_links.json?_=' + Date.now(), {cache:'no-store'});
      if(r.ok) STRIPE_LINKS = Object.assign(STRIPE_LINKS, await r.json());
    } catch(e){ /* ok */ }
  }

  const LS_KEY = 'draem_capture_submissions';

  function getSubs(){ try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e){ return []; } }
  function addSub(s){ const a = getSubs(); a.push(s); localStorage.setItem(LS_KEY, JSON.stringify(a)); }

  function getReferral(){
    const u = new URL(location.href);
    return {
      src:  u.searchParams.get('utm_source')   || document.referrer || 'direct',
      med:  u.searchParams.get('utm_medium')   || '',
      cmp:  u.searchParams.get('utm_campaign') || '',
      ref:  u.searchParams.get('ref')          || '',
    };
  }

  async function submit(payload){
    if(!ENDPOINT){
      addSub(payload);
      return { ok: true, mode: 'local' };
    }
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if(r.ok){
        addSub({...payload, _remote: true});
        return { ok: true, mode: 'remote' };
      }
      addSub(payload);
      return { ok: false, mode: 'local_fallback', status: r.status };
    } catch(e){
      addSub(payload);
      return { ok: false, mode: 'local_fallback', error: String(e) };
    }
  }

  function cssOnce(){
    if(document.getElementById('_capture_css')) return;
    const s = document.createElement('style');
    s.id = '_capture_css';
    s.textContent = `
      .cap-w{margin:1.2rem 0 .6rem;padding:1rem;background:linear-gradient(135deg,rgba(196,160,89,.08),rgba(196,160,89,.02));border:1px solid rgba(196,160,89,.25);border-radius:12px}
      .cap-h{font-size:.8rem;color:#C4A059;font-weight:700;margin-bottom:.4rem;letter-spacing:.05em}
      .cap-sub{font-size:.7rem;color:#A89585;margin-bottom:.7rem;line-height:1.5}
      .cap-row{display:flex;gap:.4rem}
      .cap-row input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:.55rem .7rem;color:#E8DDD0;font-family:inherit;font-size:.82rem}
      .cap-row button{background:#C4A059;color:#0D0906;border:0;padding:.55rem 1rem;border-radius:6px;font-weight:700;cursor:pointer;font-size:.82rem;font-family:inherit;white-space:nowrap}
      .cap-row button:hover{background:#DFC07A}
      .cap-row button:disabled{opacity:.55;cursor:not-allowed}
      .cap-note{font-size:.65rem;color:#6D5A4A;margin-top:.5rem;line-height:1.5}
      .cap-ok{background:rgba(92,184,112,.1);border:1px solid rgba(92,184,112,.35);color:#5CB870;padding:.55rem .8rem;border-radius:6px;font-size:.78rem;margin-top:.5rem}
      .cap-split{display:grid;grid-template-columns:1fr;gap:.5rem;margin-top:.6rem}
      @media(min-width:520px){.cap-split{grid-template-columns:1fr 1fr}}
      .cap-tier{padding:.7rem;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.03)}
      .cap-tier-l{font-size:.6rem;color:#A89585;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.2rem}
      .cap-tier-p{font-size:1.1rem;color:#DFC07A;font-weight:700;margin-bottom:.3rem;font-family:Georgia,serif}
      .cap-tier-d{font-size:.68rem;color:#A89585;line-height:1.5;margin-bottom:.55rem;min-height:2.5rem}
      .cap-tier a,.cap-tier button{display:block;width:100%;text-align:center;text-decoration:none;padding:.45rem;border-radius:5px;font-size:.72rem;font-weight:700;border:0;cursor:pointer;font-family:inherit}
      .cap-tier-free a{background:rgba(255,255,255,.08);color:#E8DDD0}
      .cap-tier-paid a{background:#C4A059;color:#0D0906}
      .cap-tier-paid a.na{background:rgba(255,255,255,.06);color:#6D5A4A;cursor:not-allowed;pointer-events:none}
      .cap-ref{font-size:.55rem;color:#6D5A4A;margin-top:.4rem}
    `;
    document.head.appendChild(s);
  }

  window.renderCapture = async function(opts){
    cssOnce();
    const { demoId, title, priceYen = 500, earlyFeatures = '早期アクセス + 今後の全アップデート' } = opts;
    await loadStripeLinks();
    const ref = getReferral();
    const stripeUrl = STRIPE_LINKS[demoId];

    const mount = document.createElement('div');
    mount.className = 'cap-w';
    mount.innerHTML = `
      <div class="cap-h">✉️ リリース時に通知する</div>
      <div class="cap-sub">「本格運用版」が出たら一番に知らせます。リリース時期と価格は登録者にだけ先にお知らせ。</div>
      <form class="cap-form" novalidate>
        <div class="cap-row">
          <input type="email" name="email" placeholder="you@example.com" required autocomplete="email">
          <button type="submit">通知を受け取る</button>
        </div>
        <div class="cap-note">登録は無料・いつでも解除可能。広告配信や転売はしません。</div>
      </form>
      <div class="cap-ok" style="display:none"></div>
      <div class="cap-split">
        <div class="cap-tier cap-tier-free">
          <div class="cap-tier-l">Free</div>
          <div class="cap-tier-p">¥0</div>
          <div class="cap-tier-d">このデモ版。基本機能だけ、広告なし。</div>
          <a href="#" onclick="event.preventDefault();alert('今そのデモに触っています ✓')">試す</a>
        </div>
        <div class="cap-tier cap-tier-paid">
          <div class="cap-tier-l">Early Access</div>
          <div class="cap-tier-p">¥${priceYen.toLocaleString()}</div>
          <div class="cap-tier-d">${earlyFeatures}</div>
          ${stripeUrl
            ? `<a href="${stripeUrl}" target="_blank">先行予約</a>`
            : `<a class="na" title="Stripeリンク未設定">準備中</a>`}
        </div>
      </div>
      <div class="cap-ref">via: ${ref.src}${ref.cmp ? ' · '+ref.cmp : ''}${ref.ref ? ' · ref:'+ref.ref : ''}</div>
    `;

    // Find insertion point — after .vp if present, else append to body
    const target = document.querySelector('.vp') || document.body;
    target.parentNode.insertBefore(mount, target.nextSibling);

    const form = mount.querySelector('.cap-form');
    const okBox = mount.querySelector('.cap-ok');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = form.email.value.trim();
      if(!email || !/.+@.+\..+/.test(email)){ form.email.focus(); return; }
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = '送信中...';
      const payload = {
        demo_id: demoId,
        demo_title: title,
        email,
        submitted_at: new Date().toISOString(),
        ua: navigator.userAgent.slice(0, 120),
        ...ref,
      };
      const res = await submit(payload);
      btn.disabled = false; btn.textContent = '通知を受け取る';
      form.style.display = 'none';
      okBox.style.display = 'block';
      okBox.innerHTML = res.mode === 'remote'
        ? '✓ 登録完了 — リリース時にメールでお知らせします'
        : res.mode === 'local'
          ? '✓ 登録を受け付けました（リリース時に通知）'
          : '✓ 登録を受け付けました（後ほど通知）';
    });
  };

  // ---- Page-view tracking ----
  (function trackView(){
    const views = JSON.parse(localStorage.getItem('draem_capture_views') || '{}');
    const demoId = (location.pathname.match(/demo-\d+/) || ['unknown'])[0];
    views[demoId] = (views[demoId] || 0) + 1;
    localStorage.setItem('draem_capture_views', JSON.stringify(views));
  })();
})();
