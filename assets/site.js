/* Agentive Studio · interacties. Geen bibliotheken, alleen wat nodig is. */
(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $  = function(s, r){ return (r||document).querySelector(s) };
  var $$ = function(s, r){ return [].slice.call((r||document).querySelectorAll(s)) };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- kop: compacter bij scrollen, actieve sectie ---------- */
  var head = $('#head');
  var navLinks = $$('.nav a');
  var ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      head.classList.toggle('compact', window.scrollY > 16);
      story();
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);

  if('IntersectionObserver' in window){
    var ids = ['werk','aanpak','over','vragen'];
    var seen = {};
    var navIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0 });
      var best = null, max = 0;
      ids.forEach(function(id){ if((seen[id]||0) > max){ max = seen[id]; best = id } });
      navLinks.forEach(function(a){ a.setAttribute('aria-current', a.getAttribute('href') === '#'+best ? 'true' : 'false') });
    }, {rootMargin:'-35% 0px -50% 0px', threshold:[0,.01,.25,.5,1]});
    ids.forEach(function(id){ var el = document.getElementById(id); if(el) navIO.observe(el) });
  }

  /* ---------- mobiel menu ---------- */
  var mnav = $('#mnav'), menuBtn = $('#menuBtn'), menuX = $('#menuX');
  function openMenu(){ mnav.hidden = false; requestAnimationFrame(function(){ mnav.classList.add('open') });
    menuBtn.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; zandHide(true); menuX.focus() }
  function closeMenu(focusBack){ mnav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); document.body.style.overflow='';
    zandHide(false); setTimeout(function(){ mnav.hidden = true }, reduce ? 0 : 300); if(focusBack) menuBtn.focus() }
  menuBtn.addEventListener('click', openMenu);
  menuX.addEventListener('click', function(){ closeMenu(true) });
  $$('#mnav a').forEach(function(a){ a.addEventListener('click', function(){ closeMenu(false) }) });

  /* ---------- rustig verschijnen ---------- */
  var reveals = $$('.reveal');
  if(reduce || !('IntersectionObserver' in window)){
    reveals.forEach(function(el){ el.classList.add('in') });
  } else {
    var rIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); rIO.unobserve(e.target) } });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(function(el){ rIO.observe(el) });
    /* wat al in beeld staat bij laden, meteen tonen */
    reveals.forEach(function(el){ var r = el.getBoundingClientRect(); if(r.top < innerHeight*.92) el.classList.add('in') });
  }

  /* ---------- scrollverhaal: één canvas, vier stappen ---------- */
  var track = $('#story'), panels = $$('[data-panel]'), rail = $('#rail');
  var railBtns = rail ? $$('button', rail) : [], current = 0;
  function setStage(i){
    if(i === current) return;
    panels.forEach(function(p, k){ p.classList.toggle('on', k === i); p.classList.toggle('past', k < i) });
    railBtns.forEach(function(b, k){ b.classList.toggle('on', k === i) });
    current = i;
    if(window.innerWidth <= 860 && railBtns[i]) rail.scrollTo({left: railBtns[i].offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth'});
  }
  function story(){
    if(!track || reduce) return;
    var r = track.getBoundingClientRect();
    var total = track.offsetHeight - innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1,total)));
    rail.style.setProperty('--p', p.toFixed(3));
    setStage(Math.min(panels.length - 1, Math.floor(p * panels.length * .999)));
  }
  railBtns.forEach(function(b, k){
    b.addEventListener('click', function(){
      if(reduce){ panels[k].scrollIntoView({block:'center'}); return }
      var total = track.offsetHeight - innerHeight;
      var y = track.getBoundingClientRect().top + scrollY + total * ((k + .5) / panels.length);
      window.scrollTo({top:y, behavior:'smooth'});
    });
  });
  story();

  /* demo: akkoord geven */
  var approve = $('#approve'), waitStep = $('#waitStep');
  if(approve) approve.addEventListener('click', function(){
    approve.classList.add('ok'); approve.innerHTML = 'Akkoord gegeven <span class="arr" aria-hidden="true">✓</span>';
    approve.setAttribute('aria-disabled','true');
    if(waitStep){ waitStep.classList.remove('wait'); waitStep.classList.add('done');
      $('i', waitStep).textContent = '✓'; $('span', waitStep).textContent = 'Klant heeft de offerte ontvangen'; $('time', waitStep).textContent = '09:44' }
  });

  /* ---------- flipkaarten ---------- */
  function flip(card, toBack){
    var back = toBack === undefined ? !card.classList.contains('flipped') : toBack;
    card.classList.toggle('flipped', back);
    var front = $('.face.front', card), rear = $('.face.back', card);
    front.inert = back; rear.inert = !back;
    $$('.turn', card).forEach(function(t){ t.setAttribute('aria-expanded', String(back)) });
    var target = $(back ? '.face.back .turn' : '.face.front .turn', card);
    if(card.contains(document.activeElement) || document.activeElement === document.body){
      setTimeout(function(){ target.focus({preventScroll:true}) }, reduce ? 0 : 380);
    }
  }
  $$('.fc').forEach(function(card){
    var name = $('.nm', card).textContent;
    $('.face.front .turn', card).setAttribute('aria-label', 'Draai de kaart van ' + name + ' om');
    $('.face.back .turn', card).setAttribute('aria-label', 'Terug naar de voorkant van ' + name);
    card.addEventListener('click', function(e){
      if(e.target.closest('a')) return;
      if(window.getSelection && String(window.getSelection()).length) return;
      flip(card);
    });
  });

  /* stipjes onder de kaarten op mobiel */
  var projects = $('#projects'), dots = $$('#dots i');
  if(projects){ projects.addEventListener('scroll', railState, {passive:true}); window.addEventListener('resize', railState); setTimeout(railState, 50) }
  /* pijlen naast de projecten */
  var prevP = $('#prevP'), nextP = $('#nextP');
  function railStep(){ var c = $('.fc', projects); return c ? c.getBoundingClientRect().width + 16 : 280 }
  function railState(){ if(!prevP) return; prevP.disabled = projects.scrollLeft < 8; nextP.disabled = projects.scrollLeft + projects.clientWidth > projects.scrollWidth - 8 }
  if(prevP){ prevP.addEventListener('click', function(){ projects.scrollBy({left:-railStep(), behavior: reduce ? 'auto' : 'smooth'}) });
             nextP.addEventListener('click', function(){ projects.scrollBy({left: railStep(), behavior: reduce ? 'auto' : 'smooth'}) }) }

  if(projects && dots.length){
    projects.addEventListener('scroll', function(){
      var cards = $$('.fc', projects), sl = projects.scrollLeft, best = 0, bd = 1e9;
      cards.forEach(function(c, i){ var d = Math.abs(c.offsetLeft - projects.offsetLeft - sl - parseFloat(getComputedStyle(projects).paddingLeft)); if(d < bd){ bd = d; best = i } });
      dots.forEach(function(d, i){ d.classList.toggle('on', i === best) });
    }, {passive:true});
  }

  /* ---------- Zand ---------- */
  var zand = $('#zand'), zBtn = $('#zandBtn'), zAsk = $('#zandAsk'), zp = $('#zp'), zB = $('#zpB'), zF = $('#zpF'), zIn = $('#zpIn');

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
  function ctaRow(){ var w = document.createElement('div'); w.className = 'cta-row';
    w.innerHTML = '<a class="btn btn-primary btn-sm" href="https://cal.com/agentivestudio" target="_blank" rel="noopener">Plan een gesprek <span class="arr" aria-hidden="true">→</span></a>'+
                  '<a class="btn btn-wa btn-sm" href="' + (window.AS_WA || '#contact') + '" target="_blank" rel="noopener">WhatsApp</a>';
    zB.appendChild(w); zB.scrollTop = zB.scrollHeight }
  function options(){
    var w = document.createElement('div'); w.className = 'opts';
    var list = [
      {id:'werk', label:'Bekijk het werk', icon:ICON.werk},
      {id:'kost', label:QA.kost.q, icon:ICON.vraag},
      {id:'duur', label:QA.duur.q, icon:ICON.vraag},
      {id:'wie',  label:QA.wie.q,  icon:ICON.vraag},
      {id:'plan', label:'Plan direct een gesprek', icon:ICON.cal}
    ];
    list.forEach(function(o){
      var b = document.createElement(o.id === 'plan' ? 'a' : 'button');
      b.className = 'opt';
      if(o.id === 'plan'){ b.href = 'https://cal.com/agentivestudio'; b.target = '_blank'; b.rel = 'noopener' } else { b.type = 'button' }
      b.innerHTML = '<span class="oi">' + o.icon + '</span><span></span>';
      b.lastChild.textContent = o.label;
      if(o.id === 'werk') b.addEventListener('click', function(){ closeZand(false); document.getElementById('werk').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}) });
      else if(o.id !== 'plan') b.addEventListener('click', function(){ ask(o.id) });
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
  var zOpen = false;
  function openZand(){
    zp.hidden = false; zOpen = true; zand.classList.add('open'); zBtn.setAttribute('aria-expanded','true'); zAsk.setAttribute('aria-expanded','true');
    if(!zB.childElementCount){ options() }
    if(finePointer) setTimeout(function(){ zIn.focus() }, 60);
  }
  function closeZand(focusBack){ if(rTimer){ clearTimeout(rTimer); rTimer = null; zand.classList.remove('reacting','reaction-hop','reaction-wiggle','reaction-nod') } zp.hidden = true; zOpen = false; zand.classList.remove('open'); zBtn.setAttribute('aria-expanded','false'); zAsk.setAttribute('aria-expanded','false'); if(focusBack) zBtn.focus() }
  /* Zand reageert eerst, daarna gaat het venster open */
  var zSay = $('#zandSay'), rTimer = null, rIdx = 0;
  var REACT = [['reaction-hop','Hoi 👋'], ['reaction-wiggle','Ik luister.'], ['reaction-nod','Kom maar door.']];
  function stopReact(){ clearTimeout(rTimer); rTimer = null; zand.classList.remove('reacting','reaction-hop','reaction-wiggle','reaction-nod') }
  function reactThenOpen(){
    if(zOpen){ stopReact(); closeZand(true); return }
    if(rTimer) return;
    if(reduce){ openZand(); return }
    var r = REACT[rIdx++ % REACT.length];
    stopReact(); void zand.offsetWidth;
    zSay.textContent = r[1];
    zand.classList.add('reacting', r[0]);
    if(navigator.vibrate){ try{ navigator.vibrate(8) }catch(e){} }
    zBtn.setAttribute('aria-expanded','true'); zAsk.setAttribute('aria-expanded','true');
    rTimer = setTimeout(function(){ stopReact(); openZand() }, 520);
  }
  zBtn.addEventListener('click', reactThenOpen);
  zAsk.addEventListener('click', reactThenOpen);
  $('#zpX').addEventListener('click', function(){ closeZand(true) });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(zOpen || rTimer) closeZand(true);
    else if(mnav.classList.contains('open')) closeMenu(true);
  });

  /* op mobiel wegblijven waar al knoppen staan */
  var forcedHide = false;
  function zandHide(v){ forcedHide = v; zand.classList.toggle('away', v || finalInView) }
  var finalInView = false;
  var vis = {c:false, f:false, s:false}, foot = $('.foot');
  if('IntersectionObserver' in window){
    var zIO = new IntersectionObserver(function(es){
      es.forEach(function(e){ vis[e.target === foot ? 'f' : (e.target === track ? 's' : 'c')] = e.isIntersecting });
      finalInView = vis.f || (window.innerWidth <= 680 && (vis.c || vis.s));
      if(!zOpen) zand.classList.toggle('away', forcedHide || finalInView);
    }, {threshold:.15});
    ['contact'].forEach(function(id){ var el = document.getElementById(id); if(el) zIO.observe(el) });
    if(foot) zIO.observe(foot);
    if(track) zIO.observe(track);
  }
})();
