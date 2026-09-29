/* Agentive Studio · interacties. Geen bibliotheken.
   Alles wat beweegt loopt op een veer: massa, stijfheid en demping, zoals op een iPhone. */
(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $  = function(s, r){ return (r || document).querySelector(s) };
  var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)) };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(pointer: fine)').matches;
  var clamp = function(v, a, b){ return Math.max(a, Math.min(b, v)) };
  var lerp = function(a, b, t){ return a + (b - a) * t };
  function tick(){ try{ navigator.vibrate && navigator.vibrate(6) }catch(e){} }
  var CAL = 'https://cal.com/agentivestudio';

  /* ---------- veer ---------- */
  function spring(o){
    var x = o.from, v = o.velocity || 0, to = o.to, k = o.stiffness || 320, c = o.damping || 30, id = 0, last = 0, alive = true;
    if(reduce){ o.update(to, 0); o.done && o.done(); return {stop:function(){}} }
    function f(now){
      if(!alive) return;
      var dt = last ? Math.min(0.032, (now - last) / 1000) : 1/60; last = now;
      for(var i = 0; i < 6; i++){ var h = dt / 6, a = -k * (x - to) - c * v; v += a * h; x += v * h }
      o.update(x, v);
      if(Math.abs(v) < 0.01 && Math.abs(x - to) < 0.001){ o.update(to, 0); alive = false; o.done && o.done(); return }
      id = requestAnimationFrame(f);
    }
    id = requestAnimationFrame(f);
    return {stop:function(){ alive = false; cancelAnimationFrame(id) }};
  }

  var lockDepth = 0;
  function lock(){ if(lockDepth++ === 0) document.body.classList.add('locked') }
  function unlock(){ if(--lockDepth <= 0){ lockDepth = 0; document.body.classList.remove('locked') } }
  function trap(root){
    function h(e){
      if(e.key !== 'Tab') return;
      var f = $$('button:not([disabled]),a[href],textarea,input,[tabindex]:not([tabindex="-1"])', root).filter(function(x){ return x.offsetParent !== null });
      if(!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if(e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus() }
      else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus() }
    }
    root.addEventListener('keydown', h);
    return function(){ root.removeEventListener('keydown', h) };
  }
  var liveEl = $('#live');
  function live(t){ if(liveEl) liveEl.textContent = t }

  /* ---------- kop: glas bij scrollen, actieve sectie ---------- */
  var head = $('#head'), navLinks = $$('.nav a'), ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){ ticking = false; head.classList.toggle('compact', scrollY > 12) });
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  if('IntersectionObserver' in window){
    var ids = ['werk','aanpak','over','vragen'], seen = {};
    var navIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0 });
      var best = null, max = 0;
      ids.forEach(function(id){ if((seen[id] || 0) > max){ max = seen[id]; best = id } });
      navLinks.forEach(function(a){ a.setAttribute('aria-current', a.getAttribute('href') === '#' + best ? 'true' : 'false') });
    }, {rootMargin:'-35% 0px -50% 0px', threshold:[0,.01,.25,.5,1]});
    ids.forEach(function(id){ var el = document.getElementById(id); if(el) navIO.observe(el) });
  }

  /* ---------- rustig verschijnen ---------- */
  var reveals = $$('.rv');
  if(reduce || !('IntersectionObserver' in window)) reveals.forEach(function(el){ el.classList.add('in') });
  else {
    var rIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); rIO.unobserve(e.target) } });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(function(el){ rIO.observe(el) });
  }

  /* ---------- Zand (voor de rest nodig: tonen en verbergen) ---------- */
  var zand = $('#zand'), hideReasons = {}, finalInView = false;
  function zandHide(reason, on){
    if(on) hideReasons[reason] = 1; else delete hideReasons[reason];
    if(zand) zand.classList.toggle('away', Object.keys(hideReasons).length > 0 || finalInView);
  }

  /* ---------- mobiel menu ---------- */
  var mnav = $('#mnav'), menuBtn = $('#menuBtn'), menuX = $('#menuX'), mUntrap = null;
  function openMenu(){
    mnav.hidden = false; requestAnimationFrame(function(){ mnav.classList.add('open') });
    menuBtn.setAttribute('aria-expanded','true'); lock(); zandHide('menu', true); mUntrap = trap(mnav); menuX.focus();
  }
  function closeMenu(focusBack){
    if(mnav.hidden) return;
    mnav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); unlock(); zandHide('menu', false);
    mUntrap && mUntrap(); setTimeout(function(){ mnav.hidden = true }, reduce ? 0 : 300);
    if(focusBack) menuBtn.focus();
  }
  menuBtn.addEventListener('click', openMenu);
  menuX.addEventListener('click', function(){ closeMenu(true) });
  $$('#mnav nav a').forEach(function(a){ a.addEventListener('click', function(){ closeMenu(false) }) });

  /* ---------- herkenbaar: tabs ---------- */
  var hkTabs = $$('.hk-tab'), hkPanels = $$('.hk-panel');
  function hkShow(i, focus){
    hkTabs.forEach(function(t, k){
      var on = k === i;
      t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      hkPanels[k].hidden = !on; hkPanels[k].classList.toggle('on', on);
    });
    if(focus) hkTabs[i].focus();
    var t = hkTabs[i]; if(t.parentNode.scrollWidth > t.parentNode.clientWidth) t.parentNode.scrollTo({left:t.offsetLeft - 20, behavior:reduce ? 'auto' : 'smooth'});
  }
  hkTabs.forEach(function(t, i){
    t.addEventListener('click', function(){ hkShow(i) });
    t.addEventListener('keydown', function(e){
      var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if(!n) return; e.preventDefault(); hkShow((i + n + hkTabs.length) % hkTabs.length, true);
    });
  });

  /* ==================================================================
     Project opent zich tot scherm. Eén getal p stuurt alles:
     p = 0 is de kaart, p = 1 is de volle weergave.
     ================================================================== */
  var scrim = $('#scrim'), scrimOwners = 0;
  function scrimTo(p){ scrim.hidden = p <= 0.001 && scrimOwners === 0; scrim.style.opacity = clamp(p, 0, 1) }

  var cards = $$('.card');
  var detail = $('#detail'), dScroll = $('#dScroll'), dBody = $('#dBody'), dClose = $('#dClose'), dImg = $('#dImg'), dContent = $('#dContent');
  var D = {open:false, card:null, from:null, to:null, p:0, anim:null, untrap:null};

  function targetRect(){
    var w = innerWidth, h = innerHeight;
    if(w < 760) return {x:0, y:0, w:w, h:h, r:0};
    var W = Math.min(800, w - 48), H = h - 48;
    return {x:(w - W) / 2, y:24, w:W, h:H, r:28};
  }
  function applyDetail(p, drag){
    D.p = p;
    var a = D.from, b = D.to, s = drag ? drag.s : 1, cp = clamp(p, 0, 1);
    detail.style.left = lerp(a.x, b.x, p) + 'px'; detail.style.top = lerp(a.y, b.y, p) + 'px';
    detail.style.width = lerp(a.w, b.w, p) + 'px'; detail.style.height = lerp(a.h, b.h, p) + 'px';
    detail.style.borderRadius = (lerp(a.r, b.r, cp) + (drag ? 180 * (1 - s) : 0)) + 'px';
    detail.style.transform = drag ? 'translate3d(0,' + drag.dy + 'px,0) scale(' + s + ')' : '';
    detail.style.setProperty('--hh', lerp(a.h, Math.max(260, b.h * .56), cp) + 'px');
    var c = clamp((p - .55) / .45, 0, 1);
    dBody.style.opacity = c; dBody.style.transform = 'translate3d(0,' + (1 - c) * 18 + 'px,0)';
    dClose.style.opacity = c;
    scrimTo(cp * (drag ? s * s : 1));
  }
  function rectOf(card){ var r = card.getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height, r:24} }
  function fillDetail(card){
    var img = $('img', card);
    dImg.src = img.getAttribute('src').replace(/\.webp$/, '-l.webp'); dImg.alt = img.alt;
    $('#d-name').textContent = $('h3 button', card).firstChild.textContent;
    var chips = $$('.chip', card);
    var st = $('#dStatus'); st.textContent = chips[0].textContent; st.classList.toggle('dev', chips[0].classList.contains('dev'));
    $('#dTag').textContent = chips[1] ? chips[1].textContent : '';
    dContent.innerHTML = ''; dContent.appendChild($('template', card).content.cloneNode(true));
  }
  function openDetail(card, fromHistory){
    if(D.open || S.open) return;
    D.open = true; D.card = card;
    fillDetail(card);
    D.from = rectOf(card); D.to = targetRect();
    dScroll.scrollTop = 0;
    detail.hidden = false; scrimOwners++; lock(); zandHide('detail', true);
    card.classList.add('hide');
    applyDetail(0); tick();
    D.anim && D.anim.stop();
    D.anim = spring({from:0, to:1, stiffness:260, damping:26, update:function(p){ applyDetail(p) }, done:function(){ D.anim = null; dClose.focus({preventScroll:true}) }});
    D.untrap = trap(detail);
    if(!fromHistory) history.pushState({layer:'detail'}, '');
    live('Project ' + $('#d-name').textContent + ' geopend');
  }
  function closeDetail(velocity, fromHistory){
    if(!D.open) return;
    D.open = false;
    var cr = detail.getBoundingClientRect(), card = D.card;
    D.from = rectOf(card);
    D.to = {x:cr.left, y:cr.top, w:cr.width, h:cr.height, r:parseFloat(detail.style.borderRadius) || 0};
    detail.style.transform = '';
    applyDetail(1);
    D.anim && D.anim.stop();
    D.anim = spring({from:1, to:0, velocity:velocity || 0, stiffness:300, damping:30,
      update:function(p){ applyDetail(p) },
      done:function(){
        D.anim = null; detail.hidden = true; card.classList.remove('hide');
        scrimOwners--; scrimTo(0); unlock(); zandHide('detail', false);
        D.untrap && D.untrap(); $('.card-hit', card).focus({preventScroll:true});
      }});
    if(!fromHistory && history.state && history.state.layer === 'detail') history.back();
  }
  cards.forEach(function(card){
    var hit = $('.card-hit', card);
    card.addEventListener('pointerdown', function(e){ if(e.button === 0) card.classList.add('press') });
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){ card.addEventListener(ev, function(){ card.classList.remove('press') }) });
    hit.addEventListener('click', function(){ openDetail(card) });
  });
  dClose.addEventListener('click', function(){ closeDetail(0) });

  /* naar beneden vegen sluit, als je bovenaan de inhoud staat */
  (function(){
    var st = null, lastY = 0, lastT = 0, vy = 0;
    function begin(x, y, target){
      if(!D.open || D.anim || target.closest('button,a')) return false;
      if(dScroll.scrollTop > 0) return false;
      st = {x:x, y:y, moved:false}; lastY = y; lastT = performance.now(); vy = 0; return true;
    }
    function move(x, y, ev){
      if(!st) return;
      var dy = y - st.y, dx = x - st.x;
      if(!st.moved){
        if(Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        if(dy < 0 || Math.abs(dx) > Math.abs(dy) || dScroll.scrollTop > 0){ st = null; return }
        st.moved = true;
      }
      if(ev.cancelable) ev.preventDefault();
      var now = performance.now(); vy = (y - lastY) / Math.max(1, now - lastT); lastY = y; lastT = now;
      st.dy = dy * .9; st.s = 1 - clamp(dy / 1400, 0, .18);
      applyDetail(1, {dy:st.dy, s:st.s});
    }
    function finish(){
      if(!st) return;
      var s0 = st; st = null; if(!s0.moved) return;
      if(s0.dy > 110 || vy > 0.55){ tick(); closeDetail(-vy * 2) }
      else spring({from:1, to:0, stiffness:420, damping:34, update:function(k){ applyDetail(1, {dy:s0.dy * k, s:1 - (1 - s0.s) * k}) }});
    }
    detail.addEventListener('touchstart', function(e){ var t = e.touches[0]; begin(t.clientX, t.clientY, e.target) }, {passive:true});
    detail.addEventListener('touchmove', function(e){ var t = e.touches[0]; move(t.clientX, t.clientY, e) }, {passive:false});
    detail.addEventListener('touchend', finish); detail.addEventListener('touchcancel', finish);
    detail.addEventListener('mousedown', function(e){ if(e.button === 0 && begin(e.clientX, e.clientY, e.target)) e.preventDefault() });
    addEventListener('mousemove', function(e){ move(e.clientX, e.clientY, e) });
    addEventListener('mouseup', finish);
  })();

  /* ==================================================================
     Gesprek voorbereiden: vier korte vragen in een sheet
     ================================================================== */
  var sheet = $('#sheet'), stage = $('#sStage'), nextBtn = $('#sNext'), backBtn = $('#sBack'), dots = [].slice.call($('#sDots').children);
  var S = {open:false, step:0, y:1, anim:null, untrap:null, returnFocus:null, data:null};
  function fresh(){ return {werk:[], team:'', freq:'', vorm:'', notitie:''} }
  var WERK = ['Gegevens overtypen','Werk vastleggen op locatie','Planning en roosters','Klanten op de hoogte houden','Rapportages maken','Iets anders'];
  var STEPS = [
    {titel:'Waar gaat bij jou de tijd heen?', hint:'Kies wat herkenbaar is. Meer dan één mag.', ok:function(){ return S.data.werk.length > 0 },
     render:function(el){
       var w = document.createElement('div'); w.className = 's-opts'; w.setAttribute('role','group'); w.setAttribute('aria-label','Soorten werk');
       WERK.forEach(function(t){
         var b = document.createElement('button'); b.type = 'button'; b.className = 's-opt'; b.textContent = t;
         b.setAttribute('aria-pressed', S.data.werk.indexOf(t) > -1 ? 'true' : 'false');
         b.addEventListener('click', function(){
           var i = S.data.werk.indexOf(t); if(i > -1) S.data.werk.splice(i, 1); else S.data.werk.push(t);
           b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true'); tick(); syncNext();
         });
         w.appendChild(b);
       });
       el.appendChild(w);
     }},
    {titel:'Hoe groot is het?', hint:'Een schatting is genoeg.', ok:function(){ return !!S.data.team && !!S.data.freq },
     render:function(el){
       el.appendChild(label('Met hoeveel mensen doe je dit werk?'));
       el.appendChild(segmented(['1 tot 3','4 tot 10','Meer dan 10'], 'team', 'Aantal mensen'));
       el.appendChild(label('Hoe vaak komt het terug?'));
       el.appendChild(segmented(['Dagelijks','Wekelijks','Maandelijks'], 'freq', 'Hoe vaak'));
     }},
    {titel:'Hoe wil je praten?', hint:'Een half uur, zonder verplichting.', ok:function(){ return !!S.data.vorm },
     render:function(el){
       el.appendChild(segmented(['Online','Telefonisch'], 'vorm', 'Soort gesprek'));
       var l = label('Wil je alvast iets kwijt? Mag ook leeg blijven.'); l.setAttribute('for','sNote'); el.appendChild(l);
       var t = document.createElement('textarea'); t.className = 'field'; t.id = 'sNote'; t.maxLength = 400; t.rows = 3;
       t.placeholder = 'Bijvoorbeeld: we typen elke ochtend de bestellingen over.'; t.value = S.data.notitie;
       t.addEventListener('input', function(){ S.data.notitie = t.value });
       el.appendChild(t);
     }},
    {titel:'Klaar om te plannen', hint:'Je antwoorden gaan mee in de afspraak, zodat we niet bij nul beginnen.', ok:function(){ return true }, last:true,
     render:function(el){
       var m = document.createElement('div'); m.className = 'done-mark';
       m.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
       el.insertBefore(m, el.firstChild);
       requestAnimationFrame(function(){ m.classList.add('go') });
       var dl = document.createElement('dl'); dl.className = 'sum';
       [['Tijd gaat naar', S.data.werk.join(', ')], ['Omvang', S.data.team + ', ' + S.data.freq.toLowerCase()], ['Gesprek', S.data.vorm]]
         .concat(S.data.notitie ? [['Notitie', S.data.notitie]] : [])
         .forEach(function(r){ var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
           dt.textContent = r[0]; dd.textContent = r[1]; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d) });
       el.appendChild(dl);
       var alt = document.createElement('p'); alt.className = 'alt'; alt.appendChild(document.createTextNode('Liever mailen? '));
       var mail = ['omar','agentivestudio.nl'].join('@'), a = document.createElement('a');
       a.textContent = mail; a.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Kennismaking') + '&body=' + encodeURIComponent(samenvatting());
       alt.appendChild(a); el.appendChild(alt);
     }}
  ];
  function label(t){ var l = document.createElement('label'); l.className = 'lbl'; l.textContent = t; return l }
  function segmented(items, key, name){
    var w = document.createElement('div'); w.className = 'seg'; w.setAttribute('role','group'); w.setAttribute('aria-label', name);
    var thumb = document.createElement('span'); thumb.className = 'thumb'; thumb.setAttribute('aria-hidden','true'); w.appendChild(thumb);
    var cur = null;
    var btns = items.map(function(t){
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t;
      b.setAttribute('aria-pressed', S.data[key] === t ? 'true' : 'false');
      b.addEventListener('click', function(){
        S.data[key] = t; btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false') });
        moveThumb(true); tick(); syncNext();
      });
      w.appendChild(b); return b;
    });
    function moveThumb(animate){
      var b = btns.filter(function(x){ return x.getAttribute('aria-pressed') === 'true' })[0];
      if(!b){ thumb.style.opacity = 0; return }
      thumb.style.opacity = 1;
      var tx = b.offsetLeft, tw = b.offsetWidth;
      if(!animate || !cur){ cur = {x:tx, w:tw}; thumb.style.transform = 'translateX(' + tx + 'px)'; thumb.style.width = tw + 'px'; return }
      var s = {x:cur.x, w:cur.w};
      spring({from:0, to:1, stiffness:520, damping:34, update:function(k){
        cur = {x:lerp(s.x, tx, k), w:lerp(s.w, tw, k)};
        thumb.style.transform = 'translateX(' + cur.x + 'px)'; thumb.style.width = cur.w + 'px';
      }});
    }
    requestAnimationFrame(function(){ moveThumb(false) });
    return w;
  }
  function samenvatting(){
    var d = S.data;
    return 'Tijd gaat naar: ' + d.werk.join(', ') + '\nOmvang: ' + d.team + ', ' + (d.freq || '').toLowerCase() +
           '\nGesprek: ' + d.vorm + (d.notitie ? '\nNotitie: ' + d.notitie : '');
  }
  function syncNext(){
    var st = STEPS[S.step];
    nextBtn.disabled = !st.ok();
    nextBtn.textContent = st.last ? 'Kies een moment' : 'Verder';
    backBtn.hidden = S.step === 0;
    dots.forEach(function(d, i){ d.classList.toggle('on', i === S.step); d.classList.toggle('done', i < S.step) });
  }
  function build(i){
    var el = document.createElement('div'); el.className = 'step';
    var h = document.createElement('h3'); h.textContent = STEPS[i].titel; h.tabIndex = -1;
    var p = document.createElement('p'); p.className = 'hint'; p.textContent = STEPS[i].hint;
    el.appendChild(h); el.appendChild(p); STEPS[i].render(el);
    return el;
  }
  function goto(i, dir){
    var old = stage.firstElementChild, nu = build(i), h0 = stage.offsetHeight;
    S.step = i; syncNext();
    if(!old || reduce){ stage.innerHTML = ''; stage.appendChild(nu); stage.style.height = ''; if(old) focusStep(nu); return }
    old.style.position = 'absolute'; old.style.left = 0; old.style.right = 0; old.style.top = 0;
    stage.appendChild(nu);
    var h1 = nu.offsetHeight, dx = dir > 0 ? 1 : -1;
    stage.style.height = h0 + 'px';
    spring({from:0, to:1, stiffness:340, damping:32, update:function(k){
      stage.style.height = lerp(h0, h1, k) + 'px';
      old.style.transform = 'translate3d(' + (-dx * 40 * k) + 'px,0,0)'; old.style.opacity = 1 - clamp(k * 1.8, 0, 1);
      nu.style.transform = 'translate3d(' + (dx * 40 * (1 - k)) + 'px,0,0)'; nu.style.opacity = clamp(k * 1.4, 0, 1);
    }, done:function(){ old.remove(); stage.style.height = ''; nu.style.transform = ''; nu.style.opacity = ''; focusStep(nu) }});
  }
  function focusStep(el){ var h = $('h3', el); h && h.focus({preventScroll:true}) }
  function applySheet(y){
    S.y = y;
    sheet.style.transform = 'translate3d(0,' + (y * 105) + '%,0)';
    scrimTo(Math.max(1 - y, D.open ? 1 : 0));
  }
  function sheetTo(y, v, done){
    S.anim && S.anim.stop();
    S.anim = spring({from:S.y, to:y, velocity:v || 0, stiffness:y === 0 ? 300 : 360, damping:y === 0 ? 30 : 36, update:function(k){ applySheet(k) }, done:done});
  }
  function openSheet(e){
    if(e && e.preventDefault) e.preventDefault();
    if(S.open) return;
    if(!mnav.hidden) closeMenu(false);
    S.open = true; S.returnFocus = e && e.currentTarget && e.currentTarget.focus ? e.currentTarget : null;
    S.step = 0; S.data = fresh();
    stage.innerHTML = ''; goto(0, 1);
    sheet.hidden = false; scrimOwners++; lock(); zandHide('sheet', true);
    applySheet(1); tick();
    sheetTo(0, 0, function(){ focusStep(stage.firstElementChild) });
    S.untrap = trap(sheet);
    history.pushState({layer:'sheet'}, '');
    live('Gesprek voorbereiden, stap 1 van 4');
  }
  function closeSheet(v, fromHistory){
    if(!S.open) return;
    S.open = false;
    sheetTo(1, v, function(){
      sheet.hidden = true; scrimOwners--; scrimTo(D.open ? 1 : 0); unlock(); zandHide('sheet', false);
      S.untrap && S.untrap();
      var back = D.open ? dClose : S.returnFocus;
      back && back.focus({preventScroll:true});
    });
    if(!fromHistory && history.state && history.state.layer === 'sheet') history.back();
  }
  nextBtn.addEventListener('click', function(){
    var st = STEPS[S.step];
    if(!st.ok()) return;
    if(st.last){ window.open(CAL + '?notes=' + encodeURIComponent(samenvatting()), '_blank', 'noopener'); return }
    tick(); goto(S.step + 1, 1);
    live('Stap ' + (S.step + 1) + ' van 4');
  });
  backBtn.addEventListener('click', function(){ if(S.step > 0) goto(S.step - 1, -1) });
  $('#sX').addEventListener('click', function(){ closeSheet(0) });
  scrim.addEventListener('click', function(){ if(S.open) closeSheet(0); else if(D.open) closeDetail(0) });
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-open-sheet]');
    if(!t || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); openSheet({currentTarget:t});
  });

  (function(){
    var start = null, lastY = 0, lastT = 0, vy = 0, h = 1;
    function down(e){
      if(!S.open || (e.target.closest('button') && !e.target.closest('.s-grab'))) return;
      start = {y:e.clientY, id:e.pointerId}; h = sheet.offsetHeight; lastY = e.clientY; lastT = performance.now(); vy = 0;
      S.anim && S.anim.stop();
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    function move(e){
      if(!start || e.pointerId !== start.id) return;
      var dy = e.clientY - start.y, now = performance.now();
      vy = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
      applySheet(clamp((dy < 0 ? -Math.sqrt(-dy) * 2 : dy) / (h * 1.05), -0.03, 1));
    }
    function up(){
      if(!start) return; start = null;
      if(S.y > .28 || vy > .6){ tick(); closeSheet(vy / (h / 1000)) }
      else sheetTo(0, 0);
    }
    [$('#sGrab'), $('.s-head')].forEach(function(el){
      el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  })();

  addEventListener('popstate', function(){
    if(S.open) closeSheet(0, true);
    else if(D.open) closeDetail(0, true);
  });
  addEventListener('resize', function(){ if(D.open){ D.to = targetRect(); if(!D.anim) applyDetail(1) } });

  /* ==================================================================
     Zand: reageert eerst, opent dan een klein venster met antwoorden
     ================================================================== */
  var zBtn = $('#zandBtn'), zAsk = $('#zandAsk'), zp = $('#zp'), zB = $('#zpB'), zF = $('#zpF'), zIn = $('#zpIn');
  var QA = {
    kost:{q:'Wat kost zoiets?', a:'Dat hangt af van wat er nodig is, en daarom noem ik hier geen bedrag dat toch niet klopt. Na een eerste gesprek weet ik wat ik nog moet uitzoeken, en daarna krijg je een prijs voordat we beginnen.', cta:true,
      k:'kost kosten prijs tarief euro geld offerte budget betalen duur'},
    duur:{q:'Hoe lang duurt het?', a:'Voor een eerste werkende versie met je eigen gegevens reken ik meestal op twee tot vier weken, afhankelijk van wat er nodig is. Je probeert hem uit op je telefoon of laptop, daarna passen we aan op wat je in de praktijk tegenkomt.',
      k:'lang duurt snel wanneer klaar levertijd weken tijd'},
    wie:{q:'Voor wat voor bedrijven werk je?', a:'Voor het MKB in de breedte. Wat ik tot nu toe bouwde draait in de bouw, in het onderwijs, bij een beveiligings- en uitzendbedrijf, in een webshop en op een platform dat nieuwkomers aan werk helpt. De branche maakt niet uit, het gaat erom of er werk in zit dat elke week op dezelfde manier terugkomt.',
      k:'bedrijf bedrijven sector branche klanten mkb soort'},
    tech:{q:'Moet ik zelf technisch zijn?', a:'Nee. Je vertelt hoe je werkt, ik regel het bouwen, het live zetten en het onderhoud. Je hebt alleen een browser of een telefoon nodig.',
      k:'technisch ict kennis moeilijk installeren onderhouden zelf'},
    data:{q:'Van wie is het en waar staan mijn gegevens?', a:'Wat ik voor je bouw, is van jou. Je gegevens staan op servers in Europa en de verwerking is volgens de AVG ingericht. Je kunt op elk moment alles meekrijgen, inclusief uitleg over hoe het in elkaar zit.',
      k:'eigenaar eigendom gegevens data avg privacy servers europa'},
    groei:{q:'Kan ik het later uitbreiden?', a:'Dat kan, en daar is bij het bouwen rekening mee gehouden. Je praat dan opnieuw met dezelfde persoon die het gemaakt heeft, dus niemand hoeft zich eerst in te lezen.',
      k:'uitbreiden later groeien extra aanpassen'},
    kan:{q:'Is mijn probleem met software op te lossen?', a:'Dat hoef je zelf niet te weten, daar is het eerste gesprek voor. Soms is het antwoord een app, soms een koppeling tussen twee systemen die je al hebt, en soms blijkt een half uur instellen genoeg. Als er niets te winnen valt, zeg ik dat.',
      k:'probleem oplossen software app nodig helpt zinvol'}
  };
  var ICON = {
    werk:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17"/></svg>',
    vraag:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01"/></svg>',
    cal:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>'
  };
  function msg(t, me){ var d = document.createElement('p'); d.className = 'msg' + (me ? ' me' : ''); d.textContent = t; zB.appendChild(d); zB.scrollTop = zB.scrollHeight }
  function planFromZand(){ closeZand(false); openSheet(null) }
  function ctaRow(){
    var w = document.createElement('div'); w.className = 'cta-row';
    var a = document.createElement('button'); a.type = 'button'; a.className = 'big-btn'; a.textContent = 'Plan een gesprek'; a.addEventListener('click', planFromZand);
    var b = document.createElement('a'); b.className = 'soft-btn'; b.href = window.AS_WA || '#contact'; b.target = '_blank'; b.rel = 'noopener'; b.textContent = 'WhatsApp';
    w.appendChild(a); w.appendChild(b); zB.appendChild(w); zB.scrollTop = zB.scrollHeight;
  }
  function options(){
    var w = document.createElement('div'); w.className = 'opts';
    [{id:'werk', label:'Bekijk het werk', icon:ICON.werk},
     {id:'kost', label:QA.kost.q, icon:ICON.vraag},
     {id:'duur', label:QA.duur.q, icon:ICON.vraag},
     {id:'wie',  label:QA.wie.q,  icon:ICON.vraag},
     {id:'plan', label:'Plan direct een gesprek', icon:ICON.cal}].forEach(function(o){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
      b.innerHTML = '<span class="oi">' + o.icon + '</span><span></span>';
      b.lastChild.textContent = o.label;
      b.addEventListener('click', function(){
        if(o.id === 'werk'){ closeZand(false); document.getElementById('werk').scrollIntoView({behavior:reduce ? 'auto' : 'smooth'}) }
        else if(o.id === 'plan') planFromZand();
        else ask(o.id);
      });
      w.appendChild(b);
    });
    zB.appendChild(w); zB.scrollTop = zB.scrollHeight;
  }
  function ask(id){
    var x = QA[id]; msg(x.q, true);
    setTimeout(function(){ msg(x.a); if(x.cta) ctaRow(); options() }, reduce ? 0 : 280);
  }
  function match(t){
    t = t.toLowerCase(); var best = null, score = 0;
    Object.keys(QA).forEach(function(id){ var s = 0; QA[id].k.split(' ').forEach(function(w){ if(w.length > 2 && t.indexOf(w) > -1) s++ }); if(s > score){ score = s; best = id } });
    return best;
  }
  zF.addEventListener('submit', function(e){
    e.preventDefault(); var t = zIn.value.trim(); if(!t) return; zIn.value = ''; msg(t, true);
    var id = match(t);
    setTimeout(function(){
      if(id){ msg(QA[id].a); if(QA[id].cta) ctaRow() }
      else { msg('Daar heb ik geen kant-en-klaar antwoord op, en dan ga ik liever niet gokken. Stel hem in een gesprek van een half uur, dan hoor je het meteen.'); ctaRow() }
      options();
    }, reduce ? 0 : 300);
  });
  var zOpen = false, zSay = $('#zandSay'), rTimer = null, rIdx = 0;
  var REACT = [['reaction-hop','Hoi 👋'], ['reaction-wiggle','Ik luister.'], ['reaction-nod','Kom maar door.']];
  function stopReact(){ clearTimeout(rTimer); rTimer = null; zand.classList.remove('reacting','reaction-hop','reaction-wiggle','reaction-nod') }
  function openZand(){
    zp.hidden = false; zOpen = true; zand.classList.add('open'); zBtn.setAttribute('aria-expanded','true'); zAsk.setAttribute('aria-expanded','true');
    if(!zB.childElementCount) options();
    if(finePointer) setTimeout(function(){ zIn.focus() }, 60);
  }
  function closeZand(focusBack){
    stopReact(); zp.hidden = true; zOpen = false; zand.classList.remove('open');
    zBtn.setAttribute('aria-expanded','false'); zAsk.setAttribute('aria-expanded','false');
    if(focusBack) zBtn.focus();
  }
  function reactThenOpen(){
    if(zOpen){ closeZand(true); return }
    if(rTimer) return;
    if(reduce){ openZand(); return }
    var r = REACT[rIdx++ % REACT.length];
    stopReact(); void zand.offsetWidth;
    zSay.textContent = r[1];
    zand.classList.add('reacting', r[0]);
    tick();
    zBtn.setAttribute('aria-expanded','true'); zAsk.setAttribute('aria-expanded','true');
    rTimer = setTimeout(function(){ stopReact(); openZand() }, 520);
  }
  zBtn.addEventListener('click', reactThenOpen);
  zAsk.addEventListener('click', reactThenOpen);
  $('#zpX').addEventListener('click', function(){ closeZand(true) });

  /* Zand gaat opzij waar de pagina zelf al knoppen toont */
  if('IntersectionObserver' in window){
    var foot = $('.foot'), contact = document.getElementById('contact'), vis = {c:false, f:false};
    var zIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ vis[e.target === foot ? 'f' : 'c'] = e.isIntersecting });
      finalInView = vis.f || (innerWidth <= 680 && vis.c);
      if(!zOpen) zandHide('x', false);
    }, {threshold:.15});
    if(contact) zIO.observe(contact);
    /* op de telefoon pas verschijnen na de opening, daar staan de knoppen al */
    var hero = document.getElementById('top');
    if(hero) new IntersectionObserver(function(es){ zandHide('hero', es[0].isIntersecting && innerWidth <= 680) }, {threshold:.35}).observe(hero);
    if(foot) zIO.observe(foot);
  }

  /* Escape sluit wat bovenop ligt */
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(S.open) closeSheet(0);
    else if(D.open) closeDetail(0);
    else if(zOpen || rTimer) closeZand(true);
    else if(!mnav.hidden) closeMenu(true);
  });
})();
