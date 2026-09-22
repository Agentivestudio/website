/* Contactgegevens pas in de browser opbouwen, zodat spambots ze niet uit de broncode kunnen plukken. */
(function(){
  var WA = 'https://wa.me/' + atob('MzE2NTc3NzgzNTc=');
  window.AS_WA = WA;
  document.querySelectorAll('.js-mail').forEach(function(a){
    var m = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.href = 'mailto:' + m; a.textContent = m;
  });
  document.querySelectorAll('.js-wa').forEach(function(a){ a.href = WA });
})();
