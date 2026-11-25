/* Peak Form / MacuDrops custom sections */
(function () {
  if (window.PFMD) return;
  window.PFMD = true;

  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Generic slider ---------- */
  function initSlider(root) {
    if (root.__pfm) return; root.__pfm = true;
    var track = root.querySelector('.pfm-track');
    if (!track) return;
    var items = Array.prototype.slice.call(track.children);
    var idx = 0;
    var dotsBox = root.querySelector('[data-pfm-dots]');
    var onChange = root.__pfmChange;
    function step() {
      if (!items[0]) return 0;
      var cs = getComputedStyle(items[0]);
      return items[0].getBoundingClientRect().width + parseFloat(cs.marginRight || 0);
    }
    function visible() {
      var view = root.querySelector('[data-pfm-view]') || root;
      var s = step(); if (!s) return 1;
      return Math.max(1, Math.floor((view.clientWidth + 2) / s));
    }
    function max() { return Math.max(0, items.length - visible()); }
    function renderDots() {
      if (!dotsBox) return;
      var n = max() + 1;
      if (dotsBox.children.length !== n) {
        dotsBox.innerHTML = '';
        for (var i = 0; i < n; i++) dotsBox.appendChild(document.createElement('span'));
      }
      qa('span', dotsBox).forEach(function (d, i) { d.classList.toggle('is-on', i === idx); });
    }
    function go(i) {
      var m = max();
      idx = i < 0 ? m : i > m ? 0 : i;
      track.style.transform = 'translateX(' + (-idx * step()) + 'px)';
      renderDots();
      if (root.__pfmChange) root.__pfmChange(idx);
    }
    root.__pfmGo = go;
    qa('[data-pfm-prev]', root).forEach(function (b) { b.addEventListener('click', function () { go(idx - 1); }); });
    qa('[data-pfm-next]', root).forEach(function (b) { b.addEventListener('click', function () { go(idx + 1); }); });
    var x0 = null, y0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    window.addEventListener('resize', function () { go(Math.min(idx, max())); });
    go(0);
    var auto = parseInt(root.getAttribute('data-pfm-auto') || '0', 10);
    if (auto > 0) {
      var t = setInterval(function () { go(idx + 1); }, auto);
      root.addEventListener('mouseenter', function () { clearInterval(t); });
    }
  }

  /* ---------- Gallery ---------- */
  function initGallery(g) {
    if (g.__pfmg) return; g.__pfmg = true;
    var thumbs = qa('.pfm-gal__thumb', g);
    var slider = g.querySelector('[data-pfm-slider]');
    slider.__pfmChange = function (i) {
      thumbs.forEach(function (t, j) { t.classList.toggle('is-on', j === i); });
      var on = thumbs[i];
      if (on && on.parentNode) {
        var p = on.parentNode;
        var l = on.offsetLeft - p.clientWidth / 2 + on.clientWidth / 2;
        p.scrollTo({ left: l, behavior: 'smooth' });
      }
    };
    initSlider(slider);
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { slider.__pfmGo(i); }); });
  }

  /* ---------- Video cards ---------- */
  function initVideos(root) {
    qa('.pfm-vcard', root).forEach(function (c) {
      if (c.__pfmv) return; c.__pfmv = true;
      var v = c.querySelector('video');
      var b = c.querySelector('.pfm-play');
      if (!v || !b) return;
      b.addEventListener('click', function () {
        qa('.pfm-vcard.is-playing video').forEach(function (o) { if (o !== v) { o.pause(); } });
        v.controls = true; v.play(); c.classList.add('is-playing');
      });
      v.addEventListener('pause', function () { if (v.ended) c.classList.remove('is-playing'); });
    });
  }

  /* ---------- On-view helpers ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      if (el.hasAttribute('data-pfm-count')) countUp(el);
      if (el.hasAttribute('data-pfm-width')) el.style.width = el.getAttribute('data-pfm-width');
      if (el.classList.contains('pfm-jr__step')) el.classList.add('is-on');
    });
  }, { threshold: 0.35 }) : null;

  function countUp(el) {
    var raw = el.getAttribute('data-pfm-count');
    var m = raw.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
    if (!m) { el.textContent = raw; return; }
    var target = parseFloat(m[2].replace(/,/g, ''));
    var dec = (m[2].split('.')[1] || '').length;
    var comma = m[2].indexOf(',') > -1;
    var t0 = null, dur = 1600;
    function fmt(n) {
      var s = n.toFixed(dec);
      if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return m[1] + s + m[3];
    }
    function f(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  function watch(root) {
    qa('[data-pfm-count],[data-pfm-width],.pfm-jr__step', root).forEach(function (el) {
      if (el.__pfmw) return; el.__pfmw = true;
      if (io) io.observe(el);
      else {
        if (el.hasAttribute('data-pfm-count')) el.textContent = el.getAttribute('data-pfm-count');
        if (el.hasAttribute('data-pfm-width')) el.style.width = el.getAttribute('data-pfm-width');
        el.classList.add('is-on');
      }
    });
  }

  /* ---------- Flip cards ---------- */
  function initFlips(root) {
    qa('.pfm-pcard', root).forEach(function (c) {
      if (c.__pfmf) return; c.__pfmf = true;
      function flip() {
        var on = c.classList.toggle('is-flipped');
        c.setAttribute('aria-expanded', on ? 'true' : 'false');
        var pm = c.querySelector('.pfm-pcard__pm');
        if (pm) pm.textContent = on ? '\u2013' : '+';
      }
      c.addEventListener('click', flip);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
  }

  /* ---------- Reviews list "show more" ---------- */
  function initMore(root) {
    qa('[data-pfm-more]', root).forEach(function (b) {
      if (b.__pfmm) return; b.__pfmm = true;
      b.addEventListener('click', function () {
        var box = b.closest('.pfm-rl');
        qa('.pfm-ritem[hidden]', box).slice(0, 5).forEach(function (r) { r.hidden = false; });
        if (!box.querySelector('.pfm-ritem[hidden]')) b.parentNode.remove();
      });
    });
  }

  /* ---------- Buy box ---------- */
  function money(cents, fmt) {
    fmt = fmt || '${{amount}}';
    cents = Math.round(cents);
    function n(c, d, ts, ds) {
      var s = (c / 100).toFixed(d).split('.');
      s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts);
      return s[0] + (s[1] ? ds + s[1] : '');
    }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) {
      if (k === 'amount_no_decimals') return n(cents, 0, ',', '.');
      if (k === 'amount_with_comma_separator') return n(cents, 2, '.', ',');
      if (k === 'amount_no_decimals_with_comma_separator') return n(cents, 0, '.', ',');
      return n(cents, 2, ',', '.');
    });
  }

  function initBuyBox(bb) {
    if (bb.__pfmb) return; bb.__pfmb = true;
    var dataEl = bb.querySelector('[data-pfm-product]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var variant = data.variants.filter(function (v) { return v.id === data.selected; })[0] || data.variants[0];
    var tiers = qa('.pfm-tier', bb);
    var sub = bb.querySelector('.pfm-sub');
    var sel = bb.querySelector('.pfm-var select');
    var atcs = qa('[data-pfm-atc]', bb);
    var sticky = bb.querySelector('.pfm-sticky');

    function vById(id) { return data.variants.filter(function (v) { return String(v.id) === String(id); })[0]; }
    function tier() {
      var on = tiers.filter(function (t) { return t.classList.contains('is-on'); })[0];
      if (!on) return { qty: 1, off: 0, el: null, v: null };
      var vid = on.getAttribute('data-variant');
      return { qty: parseInt(on.getAttribute('data-qty'), 10) || 1, off: parseFloat(on.getAttribute('data-off')) || 0, el: on, v: vid ? vById(vid) : null };
    }
    function subOn() { return sub && sub.classList.contains('is-on') && sub.style.display !== 'none'; }

    // Prices for one tier: one-time, subscription (Loop plan on that variant) and the honest compare price.
    function priceOf(el, useSub) {
      var q = parseInt(el.getAttribute('data-qty'), 10) || 1;
      var vid = el.getAttribute('data-variant');
      if (vid) {
        var v = vById(vid) || variant;
        var bottles = parseInt(el.getAttribute('data-bottles'), 10) || 1;
        var one = v.price * q;
        var subp = v.plan_price != null ? v.plan_price * q : null;
        var was = Math.max((data.unit || v.price) * bottles * q, (v.compare_at_price || 0) * q);
        var cmp = parseInt(el.getAttribute('data-compare'), 10);
        if (cmp > 0) was = cmp * q;
        return { now: useSub && subp != null ? subp : one, one: one, sub: subp, was: was, v: v, plan: v.plan || null };
      }
      var off = parseFloat(el.getAttribute('data-off')) || 0;
      var n = variant.price * q * (1 - off / 100);
      var s2 = data.plan && data.subOff ? n * (1 - data.subOff / 100) : null;
      return { now: useSub && s2 != null ? s2 : n, one: n, sub: s2, was: Math.max(variant.compare_at_price || 0, variant.price) * q, v: variant, plan: data.plan };
    }

    function render() {
      var t = tier();
      var useSub = subOn();
      tiers.forEach(function (el) {
        var p = priceOf(el, useSub);
        var nowEl = el.querySelector('.pfm-tier__now'); if (nowEl) nowEl.textContent = money(p.now, data.fmt);
        var wasEl = el.querySelector('.pfm-tier__was');
        if (wasEl) { wasEl.textContent = p.was > p.now ? money(p.was, data.fmt) : ''; }
        var sv = el.querySelector('[data-pfm-save]');
        if (sv) { var pc = p.was > p.now ? Math.round((1 - p.now / p.was) * 100) : 0; sv.textContent = pc + '%'; sv.parentNode.style.display = pc > 0 ? '' : 'none'; }
      });
      var cur = t.el ? priceOf(t.el, useSub) : { now: variant.price, was: Math.max(variant.compare_at_price || 0, variant.price), v: variant, sub: null, one: variant.price };
      var now = cur.now, was = cur.was, av = cur.v || variant;
      if (sub) {
        // Subscribe box: real % the Loop plan saves on the selected bundle; hidden if that variant has no plan.
        var hasPlan = cur.sub != null && cur.sub < cur.one;
        if (data.bundle) sub.style.display = hasPlan ? '' : 'none';
        var h = sub.querySelector('[data-pfm-subh]');
        if (h && hasPlan) h.textContent = h.getAttribute('data-pfm-subh').replace('[x]', Math.round((1 - cur.sub / cur.one) * 100));
      }
      qa('[data-pfm-subonly]', bb).forEach(function (e) { e.style.display = subOn() ? '' : 'none'; });
      bb.querySelectorAll('[data-pfm-now]').forEach(function (e) { e.textContent = money(now, data.fmt); });
      bb.querySelectorAll('[data-pfm-was]').forEach(function (e) { e.textContent = was > now ? money(was, data.fmt) : ''; });
      var b = bb.querySelector('[data-pfm-badge]');
      if (b) {
        var pct = was > now ? Math.round((1 - now / was) * 100) : 0;
        b.style.display = pct > 0 ? '' : 'none';
        b.textContent = (b.getAttribute('data-pfm-badge') || 'SAVE [x]%').replace('[x]', pct);
      }
      atcs.forEach(function (a) { a.disabled = !av.available; var s = a.querySelector('.pfm-atc__label'); if (s) s.textContent = av.available ? a.getAttribute('data-label') : a.getAttribute('data-soldout'); });
    }

    tiers.forEach(function (el) {
      el.addEventListener('click', function () {
        tiers.forEach(function (o) { o.classList.toggle('is-on', o === el); o.querySelector('input').checked = o === el; });
        var tv = el.getAttribute('data-variant') && vById(el.getAttribute('data-variant'));
        if (tv && tv.image_index != null) { var g = bb.querySelector('.pfm-gal [data-pfm-slider]'); if (g && g.__pfmGo) g.__pfmGo(tv.image_index); }
        render();
      });
    });
    if (sub) sub.addEventListener('click', function (e) { e.preventDefault(); sub.classList.toggle('is-on'); render(); });
    if (sel) sel.addEventListener('change', function () {
      variant = data.variants.filter(function (v) { return String(v.id) === sel.value; })[0] || variant;
      if (variant.image_index != null) { var s = bb.querySelector('.pfm-gal [data-pfm-slider]'); if (s && s.__pfmGo) s.__pfmGo(variant.image_index); }
      render();
    });

    atcs.forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.disabled) return;
        var t = tier();
        var p = t.el ? priceOf(t.el, true) : { v: variant, plan: data.plan };
        var addV = t.v || variant;
        var item = { id: addV.id, quantity: t.qty };
        // Loop Subscriptions = Shopify selling plan on the line item.
        if (subOn() && p.plan) item.selling_plan = p.plan;
        var drawer = document.querySelector('cart-drawer');
        var body = { items: [item] };
        if (drawer && drawer.getSectionsToRender) {
          body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
          body.sections_url = window.location.pathname;
        }
        a.classList.add('is-loading'); a.disabled = true;
        var url = (window.routes && window.routes.cart_add_url ? window.routes.cart_add_url : '/cart/add') + '.js';
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); })
          .then(function (json) {
            if (json.status && json.status !== 200) { alertMsg(a, json.description || json.message); return; }
            if (drawer && json.sections && drawer.renderContents) {
              json.id = addV.id;
              drawer.renderContents(json);
            } else {
              window.location.href = (window.routes && window.routes.cart_url) || '/cart';
            }
          })
          .catch(function () { window.location.href = (window.routes && window.routes.cart_url) || '/cart'; })
          .finally(function () { a.classList.remove('is-loading'); a.disabled = !addV.available; });
      });
    });

    function alertMsg(a, msg) {
      var box = a.parentNode.querySelector('.pfm-err');
      if (!box) { box = document.createElement('p'); box.className = 'pfm-err'; box.style.cssText = 'color:#b91c1c;font-size:13px;margin-top:8px;text-align:center'; a.parentNode.insertBefore(box, a.nextSibling); }
      box.textContent = msg;
    }

    if (sticky && 'IntersectionObserver' in window) {
      var main = bb.querySelector('.pfm-bb__info [data-pfm-atc]');
      var obs = new IntersectionObserver(function (e) {
        var past = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
        sticky.classList.toggle('is-on', past);
      });
      if (main) obs.observe(main);
    }
    render();
  }

  function init(root) {
    root = root || document;
    qa('.pfm-gal', root).forEach(initGallery);
    qa('[data-pfm-slider]', root).forEach(initSlider);
    qa('.pfm-bb', root).forEach(initBuyBox);
    initVideos(root); initFlips(root); initMore(root); watch(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
