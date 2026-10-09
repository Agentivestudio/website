/* Agentive Studio · interacties. Geen bibliotheken.
   Wat beweegt, loopt op een veer: massa, stijfheid en demping, zoals in iOS. */
(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s,r){ return (r||document).querySelector(s) };
  var $$ = function(s,r){ return [].slice.call((r||document).querySelectorAll(s)) };
  var lerp = function(a,b,t){ return a + (b-a)*t };
  var CAL = 'https://cal.com/agentivestudio';
  var MAIL = ['omar','agentivestudio.nl'].join('@');

  function spring(o){
    var x=o.from, v=0, to=o.to, k=o.stiffness||300, c=o.damping||28, last=0, alive=true;
    if(REDUCE){ o.update(to); o.done && o.done(); return {stop:function(){}} }
    function f(now){
      if(!alive) return;
      var dt = last ? Math.min(.032,(now-last)/1000) : 1/60; last = now;
      for(var i=0;i<6;i++){ var h=dt/6, a=-k*(x-to)-c*v; v+=a*h; x+=v*h }
      o.update(x);
      if(Math.abs(v)<.01 && Math.abs(x-to)<.001){ o.update(to); alive=false; o.done && o.done(); return }
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
    return {stop:function(){ alive=false }};
  }

  /* ---------- Google Ads: de klikcode gaat mee naar de agenda, zonder iets op te slaan ---------- */
  var gclid = new URLSearchParams(location.search).get('gclid');
  if(gclid && /^[\w-]{10,200}$/.test(gclid)){
    $$('a[href^="/contact"]').forEach(function(a){ a.href = '/contact?gclid=' + encodeURIComponent(gclid) });
  }

  /* ---------- menu Diensten ---------- */
  $$('.dd').forEach(function(dd){
    var b = $('button', dd), m = $('.menu', dd), t = 0;
    function open(v){ b.setAttribute('aria-expanded', v ? 'true' : 'false'); m.classList.toggle('open', v) }
    b.addEventListener('click', function(){ open(b.getAttribute('aria-expanded') !== 'true') });
    dd.addEventListener('mouseenter', function(){ if(matchMedia('(hover:hover)').matches){ clearTimeout(t); open(true) } });
    dd.addEventListener('mouseleave', function(){ t = setTimeout(function(){ open(false) }, 160) });
    dd.addEventListener('focusout', function(e){ if(!dd.contains(e.relatedTarget)) open(false) });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true'){ open(false); b.focus() } });
  });

  /* ---------- mobiel menu ---------- */
  var sheet = $('#sheet'), mbtn = $('#menuBtn');
  if(sheet && mbtn){
    var last = null;
    function openSheet(){ last = document.activeElement; sheet.hidden = false; document.body.classList.add('locked'); mbtn.setAttribute('aria-expanded','true');
      requestAnimationFrame(function(){ sheet.classList.add('open') }); $('.x', sheet).focus() }
    function closeSheet(){ sheet.classList.remove('open'); document.body.classList.remove('locked'); mbtn.setAttribute('aria-expanded','false');
      setTimeout(function(){ sheet.hidden = true }, REDUCE ? 0 : 280); last && last.focus && last.focus() }
    mbtn.addEventListener('click', openSheet);
    $('.x', sheet).addEventListener('click', closeSheet);
    $$('a', sheet).forEach(function(a){ a.addEventListener('click', closeSheet) });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !sheet.hidden) closeSheet() });
  }

  /* ---------- glazen schuifknop (gedeeld) ---------- */
  function slider(group, buttons, onPick, attr){
    var thumb = $('.thumb', group);
    attr = attr || 'aria-selected';
    function place(b, animate){
      if(!thumb || !b) return;
      var tx = b.offsetLeft, tw = b.offsetWidth, sx = parseFloat(thumb.dataset.x || tx), sw = parseFloat(thumb.dataset.w || tw);
      function set(x,w){ thumb.style.transform = 'translateX(' + x + 'px)'; thumb.style.width = w + 'px'; thumb.dataset.x = x; thumb.dataset.w = w }
      if(!animate){ set(tx,tw); return }
      spring({from:0, to:1, stiffness:420, damping:30, update:function(k){ set(lerp(sx,tx,k), lerp(sw,tw,k)) }});
    }
    buttons.forEach(function(b,i){
      b.addEventListener('click', function(){
        buttons.forEach(function(x){ x.setAttribute(attr, x === b ? 'true' : 'false'); if(attr === 'aria-selected') x.tabIndex = x === b ? 0 : -1 });
        place(b, true); onPick && onPick(i, b);
      });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if(!d) return; e.preventDefault(); var n = buttons[(i + d + buttons.length) % buttons.length]; n.click(); n.focus();
      });
    });
    function init(){ place(buttons.filter(function(x){ return x.getAttribute(attr) === 'true' })[0], false) }
    requestAnimationFrame(init); addEventListener('resize', init);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  }

  /* ---------- home: één glazen vlak dat van vorm wisselt ---------- */
  var dev = $('#dev');
  if(dev){
    var panes = $$('.pane', dev), tabs = $$('.show .seg button'), cap = $('#cap'), box = $('.stagebox');
    var CAPS = ['Voorbeeld van een app voor vakmensen, zoals Proofmakr', 'Voorbeeld van een planning in de browser, zoals Service-Pro', 'Voorbeeld van een koppeling: bestellingen vanzelf in je boekhouding'];
    var cur = 0, anim = null, now;
    function shapes(){
      var w = box.clientWidth, small = innerWidth < 900;
      return [{w:Math.min(300, w-8), h:small?540:600, r:46}, {w:Math.min(760, w-8), h:small?440:470, r:small?26:30}, {w:Math.min(600, w-8), h:small?300:330, r:small?28:34}];
    }
    function apply(s){ dev.style.width = s.w + 'px'; dev.style.height = s.h + 'px'; dev.style.borderRadius = s.r + 'px' }
    now = shapes()[0]; apply(now);
    slider($('.show .seg'), tabs, function(i){
      if(i === cur) return;
      var from = {w:now.w, h:now.h, r:now.r}, to = shapes()[i];
      panes[cur].classList.remove('on'); panes[i].classList.add('on'); cap.textContent = CAPS[i]; cur = i;
      anim && anim.stop();
      anim = spring({from:0, to:1, stiffness:230, damping:24, update:function(k){
        now = {w:lerp(from.w,to.w,k), h:lerp(from.h,to.h,k), r:lerp(from.r,to.r,Math.min(1,Math.max(0,k)))}; apply(now) }});
    });
    addEventListener('resize', function(){ now = shapes()[cur]; apply(now) });
  }

  /* ---------- werk: de rij opzij schuiven ---------- */
  var rail = $('#rail');
  if(rail){
    $('#next').addEventListener('click', function(){ rail.scrollBy({left: rail.clientWidth * .8, behavior: REDUCE ? 'auto' : 'smooth'}) });
    $('#prev').addEventListener('click', function(){ rail.scrollBy({left: -rail.clientWidth * .8, behavior: REDUCE ? 'auto' : 'smooth'}) });
  }

  /* ---------- rustig verschijnen, alleen wat nog buiten beeld staat ---------- */
  if(!REDUCE && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pre'); io.unobserve(e.target) } }) }, {rootMargin:'0px 0px -8% 0px'});
    $$('.rv').forEach(function(el){ if(el.getBoundingClientRect().top > innerHeight * .92){ el.classList.add('pre'); io.observe(el) } });
  }

  /* ---------- contact: invullen, controleren, dan agenda of mail ---------- */
  var form = $('#intake');
  if(form){
    var data = {wat:[], omvang:'', vorm:'Videogesprek'};
    $$('.optbtn', form).forEach(function(b){
      b.addEventListener('click', function(){
        var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
        data.wat = $$('.optbtn[aria-pressed="true"]', form).map(function(x){ return x.textContent.trim() });
      });
    });
    var om = $('#omvang');
    slider(om, $$('button', om), function(i,b){ data.omvang = b.textContent.trim() }, 'aria-pressed');
    var vm = $('#vorm');
    slider(vm, $$('button', vm), function(i,b){ data.vorm = b.textContent.trim() }, 'aria-pressed');

    var note = $('#toelichting'), count = $('#count');
    function cnt(){ count.textContent = note.value.length + ' / ' + note.maxLength }
    note.addEventListener('input', cnt); cnt();

    var rules = {
      naam:function(v){ return v.trim().length >= 2 || 'Vul je naam in.' },
      email:function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.' },
      telefoon:function(v){ return !v.trim() || /^[+0-9 ()-]{8,20}$/.test(v.trim()) || 'Vul een telefoonnummer in met alleen cijfers, of laat het leeg.' }
    };
    function check(id, show){
      var el = $('#' + id), f = el.closest('.f'), r = rules[id](el.value), err = $('.err', f);
      var ok = r === true;
      if(show){ f.classList.toggle('bad', !ok); f.classList.toggle('ok', ok && el.value.trim() !== ''); el.setAttribute('aria-invalid', ok ? 'false' : 'true'); err.textContent = ok ? '' : r }
      return ok;
    }
    Object.keys(rules).forEach(function(id){
      var el = $('#' + id), touched = false;
      el.addEventListener('blur', function(){ touched = true; check(id, true) });
      el.addEventListener('input', function(){ if(touched) check(id, true) });
    });
    function summary(){
      var v = function(id){ return $('#' + id).value.trim() };
      var lines = ['Naam: ' + v('naam')];
      if(v('bedrijf')) lines.push('Bedrijf: ' + v('bedrijf'));
      if(v('telefoon')) lines.push('Telefoon: ' + v('telefoon'));
      if(data.wat.length) lines.push('Wil laten maken: ' + data.wat.join(', '));
      if(data.omvang) lines.push('Omvang: ' + data.omvang);
      lines.push('Gesprek: ' + data.vorm);
      if(v('toelichting')) lines.push('Toelichting: ' + v('toelichting'));
      return lines.join('\n');
    }
    function valid(){
      var all = Object.keys(rules).map(function(id){ return check(id, true) });
      var firstBad = $('.f.bad .inp', form);
      if(firstBad){ firstBad.focus(); $('#fstatus').textContent = 'Controleer de velden die rood zijn.'; return false }
      return all.every(Boolean);
    }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!valid()) return;
      var p = new URLSearchParams();
      p.set('name', $('#naam').value.trim()); p.set('email', $('#email').value.trim()); p.set('notes', summary());
      var g = new URLSearchParams(location.search).get('gclid');
      if(g && /^[\w-]{10,200}$/.test(g)) p.set('metadata[gclid]', g);
      $('#fstatus').textContent = 'De agenda opent in een nieuw venster. Je gegevens staan er al in.';
      window.open(CAL + '?' + p.toString(), '_blank', 'noopener');
    });
    $('#mailBtn').addEventListener('click', function(){
      if(!valid()) return;
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Kennismaking via de website') + '&body=' + encodeURIComponent(summary());
      $('#fstatus').textContent = 'Je e-mailprogramma opent met je bericht klaar om te versturen.';
    });
  }
})();
