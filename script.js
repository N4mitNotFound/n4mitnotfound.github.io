/* NC portfolio — interactive layer. No analytics, APIs, or external JavaScript dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const themes = [
    { id: 'dark', label: 'Dark', short: 'LIGHT MODE', color: '#0d0c13' },
    { id: 'light', label: 'Light', short: 'DARK MODE', color: '#f7f5f0' }
  ];
  const themeButton = $('#themeToggle');
  let currentTheme = 'dark';
  
  function setTheme(id) {
    const theme = themes.find(x => x.id === id) || themes[0];
    currentTheme = theme.id;
    root.setAttribute('data-theme', theme.id);
    $('.theme-short').textContent = theme.short;
    themeButton.setAttribute('aria-label', `Switch to ${theme.id === 'dark' ? 'light' : 'dark'} mode`);
    themeButton.setAttribute('title', `Switch to ${theme.id === 'dark' ? 'light' : 'dark'} mode`);
    themeButton.setAttribute('aria-pressed', String(theme.id === 'light'));
    $('meta[name="theme-color"]').setAttribute('content', theme.color);
    $$('.mode-card').forEach(el => {
      const active = el.dataset.themeChoice === theme.id;
      el.classList.toggle('selected', active);
      el.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('nc-portfolio-theme', theme.id); } catch (_) { /* Optional on file:// */ }
  }
  try {
    const saved = localStorage.getItem('nc-portfolio-theme') || localStorage.getItem('freq01-theme');
    if (saved === 'dark' || saved === 'light') currentTheme = saved;
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) currentTheme = 'light';
  } catch (_) { /* Unavailable storage */ }
  setTheme(currentTheme);
  themeButton.addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'));
  $$('.mode-card').forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice)));

  // A soft spotlight follows pointing devices. CSS does the rendering; JS only sets coordinates.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let haloQueued = false, haloX = -500, haloY = -500;
    window.addEventListener('pointermove', e => {
      haloX = e.clientX; haloY = e.clientY;
      if (haloQueued) return;
      haloQueued = true;
      requestAnimationFrame(() => {
        root.style.setProperty('--cursor-x', `${haloX}px`);
        root.style.setProperty('--cursor-y', `${haloY}px`);
        document.body.classList.add('pointer-active');
        haloQueued = false;
      });
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('pointer-active'));
    $$('.featured-project, .redstone-project, .contact-links a').forEach(card => card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
      card.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
    }, { passive: true }));
  }

  // Redstone concept preview, with real AND, OR, XOR boolean logic.
  let a = true, b = false, gate = 'AND';
  const gateLabels = { AND: '&', OR: '≥1', XOR: '=1' };
  function updateLogic() {
    const out = gate === 'AND' ? a && b : gate === 'OR' ? a || b : a !== b;
    $('#inputA').setAttribute('aria-pressed', String(a));
    $('#inputB').setAttribute('aria-pressed', String(b));
    $('#aValue').textContent = a ? '1' : '0';
    $('#bValue').textContent = b ? '1' : '0';
    $('#qValue').textContent = out ? '1' : '0';
    $('#circuitOutput').classList.toggle('on', out);
    $('#wireA').classList.toggle('signal-on', a);
    $('#wireB').classList.toggle('signal-on', b);
    $('#wireOutput').classList.toggle('signal-on', out);
    $('#gateLabel').textContent = gateLabels[gate];
    const op = gate === 'AND' ? '·' : gate === 'OR' ? '+' : '⊕';
    $('#logicExpression').textContent = `${Number(a)} ${op} ${Number(b)} = ${Number(out)}`;
    $('#logicNote').textContent = gate === 'AND' ? 'AND = BOTH INPUTS ON' : gate === 'OR' ? 'OR = EITHER INPUT ON' : 'XOR = INPUTS MUST DIFFER';
    $$('.gate-button').forEach(el => {
      const active = el.dataset.gate === gate;
      el.classList.toggle('active', active);
      el.setAttribute('aria-pressed', String(active));
    });
  }
  $('#inputA').addEventListener('click', () => { a = !a; updateLogic(); });
  $('#inputB').addEventListener('click', () => { b = !b; updateLogic(); });
  $$('.gate-button').forEach(el => el.addEventListener('click', () => { gate = el.dataset.gate; updateLogic(); }));
  updateLogic();

  // Mobile navigation.
  const nav = $('#mobileNav');
  const menuBtn = $('#menuToggle');
  function closeMenu() {
    nav.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open navigation');
  }
  menuBtn.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    menuBtn.setAttribute('aria-expanded', String(!nav.hidden));
    menuBtn.setAttribute('aria-label', nav.hidden ? 'Open navigation' : 'Close navigation');
  });
  $$('a', nav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !nav.hidden) { closeMenu(); menuBtn.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth > 750) closeMenu(); });

  // Scroll progress and in-view entrance animations.
  let scrollQueued = false;
  function updateProgress() {
    const amount = document.documentElement.scrollHeight - innerHeight;
    $('#scrollProgress').style.width = `${amount > 0 ? Math.min(100, scrollY / amount * 100) : 0}%`;
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { requestAnimationFrame(updateProgress); scrollQueued = true; }
  }, { passive: true });
  updateProgress();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .06, rootMargin: '0px 0px -35px 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));
  } else { $$('.reveal').forEach(el => el.classList.add('visible')); }
  if ('IntersectionObserver' in window) {
    const sections = $$('#work, #about, #toolkit, #contact');
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('.desktop-nav a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-22% 0px -65% 0px' });
    sections.forEach(section => activeObserver.observe(section));
  }

  // Cyber Toolkit preview: accessible tabs with keyboard arrow support.
  const tabs = $$('.preview-tab');
  function switchTab(id, focus = false) {
    tabs.forEach(t => {
      const active = t.dataset.panel === id;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      if (active && focus) t.focus();
    });
    $$('.preview-panel').forEach(panel => { panel.hidden = panel.id !== `preview-${id}`; });
  }
  tabs.forEach((t, index) => {
    t.addEventListener('click', () => switchTab(t.dataset.panel));
    t.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      switchTab(tabs[next].dataset.panel, true);
    });
  });

  // URL parsing is strictly local. It does not load or fetch the supplied address.
  function inspectUrl() {
    const results = $('#urlResults');
    const input = $('#urlInput').value.trim();
    const fields = $$('strong', results);
    try {
      if (!/^https?:\/\//i.test(input)) throw Error('Enter an http:// or https:// URL');
      const url = new URL(input);
      if (!url.hostname) throw Error('Missing hostname');
      fields[0].textContent = url.protocol;
      fields[1].textContent = url.hostname;
      fields[2].textContent = url.pathname;
      fields[3].textContent = `${[...url.searchParams].length} detected`;
    } catch (_) {
      fields[0].textContent = 'Invalid URL';
      fields[1].textContent = '—';
      fields[2].textContent = '—';
      fields[3].textContent = '—';
    }
  }
  $('#inspectUrl').addEventListener('click', inspectUrl);
  $('#urlInput').addEventListener('keydown', e => { if (e.key === 'Enter') inspectUrl(); });

  // File is hashed on-device. Nothing is uploaded.
  $('#hashInput').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const output = $('#hashOutput');
    if (file.size > 25 * 1024 * 1024) { output.textContent = 'For this preview, choose a file under 25 MB.'; return; }
    if (!window.crypto || !window.crypto.subtle) { output.textContent = 'SHA-256 requires a secure browser context. Use localhost or HTTPS.'; return; }
    output.textContent = 'Calculating SHA-256 locally…';
    try {
      const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
      output.textContent = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) { output.textContent = 'Could not read or hash that file.'; }
  });

  // A deliberately simple educational length indicator, not password-strength assessment.
  $('#phraseInput').addEventListener('input', e => {
    const len = e.target.value.length;
    const n = !len ? 0 : len < 8 ? 1 : len < 14 ? 2 : len < 20 ? 3 : 4;
    $$('.phrase-bars span').forEach((bar, index) => bar.classList.toggle('lit', index < n));
    $('#phraseFeedback').textContent = !len ? 'Add a fictional phrase to see a basic length indicator.' :
      `${len} characters · ${n}/4 length bars. Length alone does not guarantee security.`;
  });

  // Code-themed generative illustration. These are sample snippets, not an executable shell.
  const examples = {
    python: { file: 'explore.py', code: 'interests = ["code", "circuits", "security"]\n\nfor topic in interests:\n    print("exploring:", topic)', output: 'exploring: code · circuits · security' },
    c: { file: 'iterate.c', code: '#include <stdio.h>\n\nint main(void) {\n    for (int i = 1; i <= 3; i++) {\n        printf("build %d\\n", i);\n    }\n    return 0;\n}', output: 'build 1 · build 2 · build 3' },
    html: { file: 'ideas.html', code: '<main class="ideas">\n  <h1>Keep building.</h1>\n  <p>One experiment at a time.</p>\n</main>', output: 'Page structure ready ✓' }
  };
  const codeEl = $('#codeStream');
  const codeGutter = $('#codeGutter');
  const codeFile = $('#editorFile');
  const codeOutput = $('#codeOutput');
  const loopCount = $('#loopCounter');
  const codeLab = $('#codeLab');
  const loopToggle = $('#loopToggle');
  const langButtons = $$('.code-lang');
  let codeLang = 'python', codeIndex = 0, codeCycles = 1;
  let pausedCode = reduced.matches, codeInView = true, codeTimeout = 0;
  let direction = 1;
  function paintCode() {
    const example = examples[codeLang];
    codeEl.textContent = example.code.slice(0, codeIndex);
    const count = Math.max(5, codeEl.textContent.split('\n').length);
    codeGutter.innerHTML = Array.from({ length: Math.min(count, 12) }, (_, i) => String(i + 1).padStart(2, '0')).join('<br>');
    codeFile.textContent = example.file;
    codeOutput.textContent = example.output;
    loopCount.textContent = `LOOP ${String(codeCycles).padStart(3,'0')} ↗`;
  }
  function scheduleCode() {
    clearTimeout(codeTimeout);
    if (pausedCode || !codeInView || document.hidden) return;
    const example = examples[codeLang];
    const end = codeIndex >= example.code.length;
    codeTimeout = setTimeout(() => {
      if (end) {
        codeCycles += 1;
        codeIndex = 0;
      } else {
        codeIndex = Math.min(example.code.length, codeIndex + 1 + (example.code[codeIndex] === ' ' ? 1 : 0));
      }
      paintCode();
      scheduleCode();
    }, end ? 1800 : 34);
  }
  function chooseLanguage(language) {
    if (!examples[language]) return;
    codeLang = language;
    codeIndex = 0;
    langButtons.forEach(button => {
      const active = button.dataset.lang === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    paintCode();
    scheduleCode();
  }
  function updateLoopButton() {
    loopToggle.setAttribute('aria-label', pausedCode ? 'Play code typing animation' : 'Pause code typing animation');
    loopToggle.setAttribute('aria-pressed', String(pausedCode));
    loopToggle.innerHTML = pausedCode ? '▶ <span>PLAY</span>' : 'Ⅱ <span>PAUSE</span>';
    codeLab.classList.toggle('loop-paused', pausedCode);
  }
  langButtons.forEach(button => button.addEventListener('click', () => chooseLanguage(button.dataset.lang)));
  loopToggle.addEventListener('click', () => {
    pausedCode = !pausedCode;
    updateLoopButton();
    scheduleCode();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { codeInView = entries[0].isIntersecting; scheduleCode(); }, { threshold: 0 }).observe(codeLab);
  }
  document.addEventListener('visibilitychange', scheduleCode);
  paintCode();
  if (reduced.matches) { codeIndex = examples.python.code.length; paintCode(); }
  updateLoopButton();
  scheduleCode();

  // Word-by-word scroll entrance, preserving original HTML and screen-reader text.
  const animatedHeadings = $$('#work .section-heading h2, #about h2, #toolkit .section-heading h2, .mode-description h2, #contact h2, .project-info h3, .redstone-copy h3');
  function wrapHeadingText(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let delay = 0;
    nodes.forEach(node => {
      const chunks = node.textContent.match(/\S+|\s+/g) || [];
      const fragment = document.createDocumentFragment();
      chunks.forEach(chunk => {
        if (/^\s+$/.test(chunk)) fragment.appendChild(document.createTextNode(chunk));
        else {
          const word = document.createElement('span');
          word.className = 'word-rise';
          word.style.setProperty('--word-index', String(delay++));
          word.textContent = chunk;
          fragment.appendChild(word);
        }
      });
      node.replaceWith(fragment);
    });
    element.classList.add('words-animated');
  }
  if (!reduced.matches) {
    animatedHeadings.forEach(wrapHeadingText);
    if ('IntersectionObserver' in window) {
      const wordObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('words-visible'); observer.unobserve(entry.target); }
        });
      }, { threshold: .15, rootMargin: '0px 0px -25px 0px' });
      animatedHeadings.forEach(el => wordObserver.observe(el));
    } else animatedHeadings.forEach(el => el.classList.add('words-visible'));
  }

  // Scroll-driven movement is subtle, clamped, and only applied while the hero is onscreen.
  let motionQueued = false;
  function updateScrollMotion() {
    const hero = $('.hero');
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight && !reduced.matches) {
      const amount = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
      codeLab.style.setProperty('--parallax', `${(amount * 26).toFixed(2)}px`);
      hero.style.setProperty('--hero-shift', `${(amount * 18).toFixed(2)}px`);
    }
    motionQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!motionQueued) { requestAnimationFrame(updateScrollMotion); motionQueued = true; }
  }, { passive: true });
  updateScrollMotion();
})();
