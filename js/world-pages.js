
(() => {
  const menuButton=document.getElementById('storyMenuButton');
  const nav=document.getElementById('storyNav');
  if(menuButton&&nav){menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));});}
  // No page-turn animation, timed blackout, reload, or automatic navigation on world pages.
  document.documentElement.classList.add('worlds-ready');
})();
