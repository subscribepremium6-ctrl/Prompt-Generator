// app.js — Darkroom frontend.
// No framework: a small hand-rolled view controller plus a thin API client.
// State that must survive a refresh (the saved key, the library) lives in
// localStorage; nothing here talks to any provider directly — every network
// call goes through our own /api/* backend proxy.

(function () {
  const { icon } = window.Darkroom;

  /* ---------------------------- static icon slots ---------------------------- */
  document.getElementById('icon-mark').innerHTML = icon('spark');
  document.getElementById('nav-workspace').innerHTML = icon('aperture');
  document.getElementById('nav-library').innerHTML = icon('filmstrip');
  document.getElementById('nav-settings').innerHTML = icon('dial');
  document.getElementById('generate-icon').innerHTML = icon('spark');
  document.getElementById('regen-icon').innerHTML = icon('refresh');
  document.getElementById('clear-icon').innerHTML = icon('trash');
  document.getElementById('test-icon').innerHTML = icon('dial');
  document.getElementById('save-icon').innerHTML = icon('check');
  document.getElementById('remove-icon').innerHTML = icon('trash');
  document.getElementById('btn-toggle-key').innerHTML = icon('eye');
  document.querySelectorAll('.chip-field').forEach((f) => {
    const span = document.createElement('span');
    span.innerHTML = icon('chevronDown');
    f.appendChild(span.firstChild);
  });

  /* ------------------------------- navigation -------------------------------- */
  const views = {
    workspace: document.getElementById('view-workspace'),
    library: document.getElementById('view-library'),
    settings: document.getElementById('view-settings'),
  };
  const navButtons = document.querySelectorAll('.rail-btn[data-view]');

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => el.classList.toggle('is-active', key === name));
    navButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.view === name));
    if (name === 'library') renderLibrary();
  }
  navButtons.forEach((btn) => btn.addEventListener('click', () => showView(btn.dataset.view)));

  /* --------------------------------- storage ---------------------------------- */
  const STORAGE_KEYS = {
    groqKey: 'darkroom.key.groq',
    geminiKey: 'darkroom.key.gemini',
    activeProvider: 'darkroom.activeProvider',
    library: 'darkroom.library',
  };

  function getStoredKey(providerId) {
    return localStorage.getItem(STORAGE_KEYS[providerId + 'Key']) || '';
  }
  function setStoredKey(providerId, value) {
    localStorage.setItem(STORAGE_KEYS[providerId + 'Key'], value);
  }
  function removeStoredKey(providerId) {
    localStorage.removeItem(STORAGE_KEYS[providerId + 'Key']);
  }
  function getLibrary() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.library) || '[]'); }
    catch { return []; }
  }
  function setLibrary(items) {
    localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(items));
  }

  /* ------------------------------- settings view ------------------------------ */
  let activeProvider = localStorage.getItem(STORAGE_KEYS.activeProvider) || 'groq';
  const providerTabs = document.querySelectorAll('.provider-tab');
  const apiKeyInput = document.getElementById('api-key-input');
  const statusBanner = document.getElementById('status-banner');
  const railStatus = document.getElementById('rail-status');

  function paintProviderTabs() {
    providerTabs.forEach((tab) => {
      const isActive = tab.dataset.provider === activeProvider;
      tab.classList.toggle('is-active', isActive);
      const dot = tab.querySelector('.dot');
      dot.style.background = getStoredKey(tab.dataset.provider) ? 'var(--fixer-teal-bright)' : 'var(--graphite-dim)';
    });
    apiKeyInput.value = getStoredKey(activeProvider);
    hideStatusBanner();
    updateRailStatus();
  }

  function updateRailStatus() {
    const hasAnyKey = getStoredKey('groq') || getStoredKey('gemini');
    railStatus.className = 'rail-status' + (hasAnyKey ? ' connected' : '');
  }

  providerTabs.forEach((tab) => tab.addEventListener('click', () => {
    activeProvider = tab.dataset.provider;
    localStorage.setItem(STORAGE_KEYS.activeProvider, activeProvider);
    paintProviderTabs();
  }));

  function showStatusBanner(kind, message) {
    statusBanner.style.display = 'flex';
    statusBanner.className = 'status-banner ' + kind;
    const iconName = kind === 'ok' ? 'check' : kind === 'error' ? 'alert' : 'dial';
    statusBanner.innerHTML = icon(iconName) + `<span>${message}</span>`;
  }
  function hideStatusBanner() { statusBanner.style.display = 'none'; }

  document.getElementById('btn-toggle-key').addEventListener('click', (e) => {
    const showing = apiKeyInput.type === 'text';
    apiKeyInput.type = showing ? 'password' : 'text';
    e.currentTarget.innerHTML = icon(showing ? 'eye' : 'eyeOff');
  });

  document.getElementById('btn-save-key').addEventListener('click', () => {
    const value = apiKeyInput.value.trim();
    if (!value) { showStatusBanner('error', 'Enter a key before saving.'); return; }
    setStoredKey(activeProvider, value);
    paintProviderTabs();
    showStatusBanner('ok', 'Key saved to this browser.');
  });

  document.getElementById('btn-remove-key').addEventListener('click', () => {
    removeStoredKey(activeProvider);
    apiKeyInput.value = '';
    paintProviderTabs();
    showStatusBanner('pending', 'Key removed.');
  });

  document.getElementById('btn-test-connection').addEventListener('click', async () => {
    const value = apiKeyInput.value.trim();
    if (!value) { showStatusBanner('error', 'Enter a key first.'); return; }
    showStatusBanner('pending', 'Testing connection…');
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: activeProvider, apiKey: value }),
      });
      const data = await res.json();
      if (data.ok) {
        showStatusBanner('ok', data.message || 'Connected.');
      } else {
        showStatusBanner('error', data.message || 'Connection failed.');
      }
    } catch (err) {
      showStatusBanner('error', 'Could not reach the Darkroom proxy. Is the server running?');
    }
  });

  paintProviderTabs();

  /* ------------------------------- workspace view ------------------------------ */
  let selectedMedium = 'image';
  document.querySelectorAll('.medium-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMedium = btn.dataset.medium;
      document.querySelectorAll('.medium-toggle button').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  const countRange = document.getElementById('count-range');
  const countValue = document.getElementById('count-value');
  countRange.addEventListener('input', () => { countValue.textContent = countRange.value; });

  const resultsArea = document.getElementById('results-area');
  const sheetToolbar = document.getElementById('sheet-toolbar');
  const sheetCount = document.getElementById('sheet-count');

  function emptyStateSVG() {
    return `<svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="152" height="102" rx="10" stroke="var(--hairline-strong)" stroke-width="1.5" stroke-dasharray="4 6"/>
      <line x1="4" y1="30" x2="156" y2="30" stroke="var(--hairline-strong)" stroke-width="1"/>
      <line x1="4" y1="80" x2="156" y2="80" stroke="var(--hairline-strong)" stroke-width="1"/>
      <circle cx="16" cy="16" r="2" fill="var(--graphite-dim)"/>
      <circle cx="144" cy="16" r="2" fill="var(--graphite-dim)"/>
      <circle cx="16" cy="94" r="2" fill="var(--graphite-dim)"/>
      <circle cx="144" cy="94" r="2" fill="var(--graphite-dim)"/>
      <path d="M64 60 78 46 96 68 108 58" stroke="var(--graphite)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="60" cy="46" r="5" stroke="var(--graphite)" stroke-width="2" fill="none"/>
    </svg>`;
  }

  function renderEmptyWorkspace() {
    resultsArea.innerHTML = `<div class="empty-state">${emptyStateSVG()}<h3>No exposures yet</h3><p>Describe an idea above and develop your first roll of prompts.</p></div>`;
    sheetToolbar.style.display = 'none';
  }
  renderEmptyWorkspace();

  function renderDeveloping(count) {
    sheetToolbar.style.display = 'none';
    const frames = Array.from({ length: count }, (_, i) => `
      <div class="developing-frame">
        <div class="developing-label">Frame ${i + 1} developing…</div>
      </div>`).join('');
    resultsArea.innerHTML = `<div class="contact-sheet">${frames}</div>`;
  }

  function renderError(message) {
    sheetToolbar.style.display = 'none';
    resultsArea.innerHTML = `<div class="status-banner error" style="display:flex;">${icon('alert')}<span>${escapeHTML(message)}</span></div>`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderResults(prompts, meta) {
    sheetToolbar.style.display = 'flex';
    sheetCount.textContent = `${prompts.length} frames · ${meta.providerId} · ${meta.medium}`;

    resultsArea.innerHTML = `<div class="contact-sheet">${prompts.map((p, i) => `
      <div class="frame" data-index="${i}">
        <div class="frame-index">
          <span>Frame ${String(i + 1).padStart(2, '0')}</span>
          ${p.flagged ? `<span class="frame-flag">${icon('alert')} similar to #${String(p.similarTo + 1).padStart(2, '0')}</span>` : ''}
        </div>
        <p class="frame-text">${escapeHTML(p.text)}</p>
        <div class="frame-actions">
          <button class="btn-icon btn-copy" title="Copy prompt">${icon('copy')}</button>
          <button class="btn-icon btn-save" title="Save to library">${icon('bookmark')}</button>
        </div>
      </div>`).join('')}</div>`;

    resultsArea.querySelectorAll('.btn-copy').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(prompts[i].text).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = icon('check');
          setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = icon('copy'); }, 1400);
        });
      });
    });
    resultsArea.querySelectorAll('.btn-save').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const library = getLibrary();
        library.unshift({ text: prompts[i].text, medium: meta.medium, providerId: meta.providerId, savedAt: Date.now() });
        setLibrary(library);
        btn.classList.add('is-on');
        btn.innerHTML = icon('check');
      });
    });
  }

  function collectFormInput() {
    return {
      providerId: activeProvider,
      apiKey: getStoredKey(activeProvider),
      concept: document.getElementById('concept-input').value,
      medium: selectedMedium,
      style: document.getElementById('sel-style').value,
      lighting: document.getElementById('sel-lighting').value,
      perspective: document.getElementById('sel-perspective').value,
      palette: document.getElementById('sel-palette').value,
      season: document.getElementById('sel-season').value,
      count: parseInt(countRange.value, 10),
    };
  }

  async function runGeneration() {
    const input = collectFormInput();
    if (!input.apiKey) {
      renderError(`No ${activeProvider === 'groq' ? 'Groq' : 'Gemini'} key saved yet. Add one in Settings first.`);
      showView('settings');
      return;
    }
    if (!input.concept || input.concept.trim().length < 3) {
      renderError('Describe your idea in at least a few words first.');
      return;
    }

    const btn = document.getElementById('btn-generate');
    btn.disabled = true;
    renderDeveloping(input.count);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!data.ok) {
        renderError(data.message || 'Something went wrong developing this roll.');
      } else {
        renderResults(data.prompts, { providerId: data.providerId, medium: input.medium });
      }
    } catch (err) {
      renderError('Could not reach the Darkroom proxy. Is the server running?');
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById('btn-generate').addEventListener('click', runGeneration);
  document.getElementById('btn-regenerate').addEventListener('click', runGeneration);

  /* --------------------------------- library view ------------------------------- */
  const libraryArea = document.getElementById('library-area');

  function libraryEmptySVG() {
    return `<svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="14" width="120" height="82" rx="8" stroke="var(--hairline-strong)" stroke-width="1.5"/>
      <path d="M60 14v82M100 14v82" stroke="var(--hairline-strong)" stroke-width="1" stroke-dasharray="3 5"/>
      <path d="M74 46h12v20l-6-4-6 4z" stroke="var(--graphite)" stroke-width="2" fill="none" stroke-linejoin="round"/>
    </svg>`;
  }

  function renderLibrary() {
    const items = getLibrary();
    if (items.length === 0) {
      libraryArea.innerHTML = `<div class="empty-state">${libraryEmptySVG()}<h3>Library is empty</h3><p>Bookmark a frame from the workspace to keep it here.</p></div>`;
      return;
    }
    libraryArea.innerHTML = `<div class="contact-sheet">${items.map((item, i) => `
      <div class="frame" data-index="${i}">
        <div class="frame-index">
          <span>${new Date(item.savedAt).toLocaleDateString()} · ${item.providerId}</span>
        </div>
        <p class="frame-text">${escapeHTML(item.text)}</p>
        <div class="frame-actions">
          <button class="btn-icon btn-copy-lib" title="Copy prompt">${icon('copy')}</button>
          <button class="btn-icon btn-remove-lib" title="Remove">${icon('trash')}</button>
        </div>
      </div>`).join('')}</div>`;

    libraryArea.querySelectorAll('.btn-copy-lib').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(items[i].text).then(() => {
          btn.innerHTML = icon('check');
          setTimeout(() => { btn.innerHTML = icon('copy'); }, 1400);
        });
      });
    });
    libraryArea.querySelectorAll('.btn-remove-lib').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const current = getLibrary();
        current.splice(i, 1);
        setLibrary(current);
        renderLibrary();
      });
    });
  }

  document.getElementById('btn-clear-library').addEventListener('click', () => {
    setLibrary([]);
    renderLibrary();
  });
})();
