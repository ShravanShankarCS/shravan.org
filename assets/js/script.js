'use strict';

window.__shravanReady = true;
document.documentElement.classList.add('js-menu');

/*-----------------------------------*\
  Helpers
\*-----------------------------------*/

const root = document.documentElement;
const body = document.body;
const page = body.dataset.page || 'home';
const siteData = window.SHRAVAN_DATA || { i18n: {}, works: { artworks: [] } };

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) { /* storage can be blocked */ }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) { /* storage can be blocked */ }
  }
};

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const menu = document.querySelector('[data-menu]');
const menuOpen = document.querySelector('[data-menu-open]');
const menuClose = document.querySelector('[data-menu-close]');
const menuLinks = document.querySelectorAll('[data-menu-link]');

const settings = document.querySelector('[data-settings]');
const settingsOpeners = document.querySelectorAll('[data-settings-open]');
const settingsClose = document.querySelector('[data-settings-close]');
const settingsReset = document.querySelector('[data-settings-reset]');
const skinButtons = document.querySelectorAll('[data-skin-option]');
const modeButtons = document.querySelectorAll('[data-mode-option]');
const modeGroup = document.querySelector('[data-mode-group]');
const languageSelect = document.querySelector('[data-language-select]');

const lightbox = document.querySelector('[data-lightbox]');
const lightboxImg = document.querySelector('[data-lightbox-img]');
const lightboxTitle = document.querySelector('[data-lightbox-title]');
const lightboxMedium = document.querySelector('[data-lightbox-medium]');
const lightboxCount = document.querySelector('[data-lightbox-count]');

const gallery = document.querySelector('[data-gallery]');
const worksPreview = document.querySelector('[data-works-preview]');

let worksData = null;

const skins = ['paper', 'noir', 'gallery', 'signal'];
const skinColors = {
  paper: { light: '#f0efea', dark: '#121311' },
  noir: '#0b0b0c',
  gallery: '#fbfbf9',
  signal: '#e8ff00'
};

const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function syncScrollLock() {
  const isOpen =
    (menu && menu.open) ||
    (settings && settings.open) ||
    (lightbox && lightbox.open);

  body.style.overflow = isOpen ? 'hidden' : '';
}

function currentSkin() {
  const skin = root.getAttribute('data-skin');
  return skins.includes(skin) ? skin : 'paper';
}

function currentMode() {
  const mode = root.getAttribute('data-theme');
  if (mode === 'light' || mode === 'dark') return mode;
  return systemDark.matches ? 'dark' : 'light';
}

/*-----------------------------------*\
  Skin and mode
\*-----------------------------------*/

function paintThemeColor() {
  if (!themeColorMeta) return;

  const skin = currentSkin();
  const color = skinColors[skin];
  themeColorMeta.setAttribute(
    'content',
    typeof color === 'string' ? color : color[currentMode()]
  );
}

function paintSkinButtons() {
  const skin = currentSkin();

  skinButtons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      button.getAttribute('data-skin-option') === skin ? 'true' : 'false'
    );
  });

  if (modeGroup) {
    modeGroup.hidden = skin !== 'paper';
  }
}

function paintModeButtons() {
  const mode = currentMode();

  modeButtons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      button.getAttribute('data-mode-option') === mode ? 'true' : 'false'
    );
  });
}

function applySkin(skin, persist = true) {
  const next = skins.includes(skin) ? skin : 'paper';
  root.setAttribute('data-skin', next);
  if (persist) store.set('display-skin', next);
  paintSkinButtons();
  paintThemeColor();
}

function applyMode(mode, persist = true) {
  const next = mode === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  if (persist) store.set('theme', next);
  paintModeButtons();
  paintThemeColor();
}

skinButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applySkin(button.getAttribute('data-skin-option'));
  });
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyMode(button.getAttribute('data-mode-option'));
  });
});

systemDark.addEventListener('change', () => {
  if (!root.hasAttribute('data-theme')) {
    paintModeButtons();
    paintThemeColor();
  }
});

paintSkinButtons();
paintModeButtons();
paintThemeColor();

/*-----------------------------------*\
  Settings
\*-----------------------------------*/

let settingsTrigger = null;

function openSettings(trigger) {
  if (!settings) return;

  settingsTrigger = trigger || null;

  if (menu && menu.open) menu.close();
  settings.showModal();
  syncScrollLock();
  paintSkinButtons();
  paintModeButtons();

  if (languageSelect) languageSelect.value = currentLanguage;
}

function closeSettings() {
  if (settings && settings.open) settings.close();
}

settingsOpeners.forEach((button) => {
  button.addEventListener('click', () => openSettings(button));
});

if (settingsClose) settingsClose.addEventListener('click', closeSettings);

if (settings) {
  settings.addEventListener('click', (event) => {
    if (event.target === settings) closeSettings();
  });

  settings.addEventListener('close', () => {
    syncScrollLock();

    const fallback = document.querySelector('.header-actions [data-settings-open]');
    const target = settingsTrigger && settingsTrigger.offsetParent !== null
      ? settingsTrigger
      : fallback;

    if (target) target.focus();
  });
}

if (settingsReset) {
  settingsReset.addEventListener('click', () => {
    ['theme', 'display-skin', 'lang'].forEach((key) => store.remove(key));
    closeSettings();
    window.location.reload();
  });
}

/*-----------------------------------*\
  Menu
\*-----------------------------------*/

if (menu && menuOpen) {
  menuOpen.addEventListener('click', () => {
    menu.showModal();
    syncScrollLock();
  });

  const closeMenu = () => {
    if (menu.open) menu.close();
  };

  if (menuClose) menuClose.addEventListener('click', closeMenu);

  menuLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  menu.addEventListener('close', () => {
    syncScrollLock();
    menuOpen.focus();
  });

  window.matchMedia('(min-width: 820px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
}

/*-----------------------------------*\
  Header, reveal, active nav
\*-----------------------------------*/

const header = document.querySelector('[data-header]');
const headerSentinel = document.querySelector('[data-header-sentinel]');

if (header && headerSentinel) {
  const headerObserver = new IntersectionObserver((entries) => {
    const isScrolled = !entries[0].isIntersecting;
    header.classList.toggle('is-scrolled', isScrolled);

    if (!isScrolled) {
      document.querySelectorAll('[data-nav]').forEach((link) => {
        link.removeAttribute('aria-current');
      });
    }
  });

  headerObserver.observe(headerSentinel);
}

const revealItems = document.querySelectorAll('[data-reveal]');

if (revealItems.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.08
  });

  revealItems.forEach((item) => {
    if (reduceMotion.matches) {
      item.classList.add('is-in');
    } else {
      revealObserver.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-in'));
}

const navLinks = document.querySelectorAll('[data-nav]');
const sections = document.querySelectorAll('main section[id]');

if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, {
    rootMargin: '-18% 0px -68% 0px'
  });

  sections.forEach((section) => sectionObserver.observe(section));
}

/*-----------------------------------*\
  Copy email
\*-----------------------------------*/

const copyButton = document.querySelector('[data-copy]');
const copyStatus = document.querySelector('[data-copy-status]');

function fallbackCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  body.appendChild(field);
  field.select();

  try {
    document.execCommand('copy');
  } catch (error) { /* nothing else to try */ }

  body.removeChild(field);
}

if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const text = copyButton.getAttribute('data-copy');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
        } catch (error) {
          fallbackCopy(text);
        }
      } else {
        fallbackCopy(text);
      }

      copyButton.textContent = currentDict['contact.copied'] || 'Copied';
      copyButton.classList.add('is-copied');

      if (copyStatus) {
        copyStatus.textContent = currentDict['contact.copiedStatus'] || 'Email address copied';
      }

      window.setTimeout(() => {
        copyButton.textContent = currentDict['contact.copy'] || 'Copy';
        copyButton.classList.remove('is-copied');
        if (copyStatus) copyStatus.textContent = '';
      }, 2000);
    } catch (error) {
      if (copyStatus) {
        copyStatus.textContent =
          currentDict['contact.copyError'] ||
          'Could not copy. The address is contact@shravan.org';
      }
    }
  });
}

/*-----------------------------------*\
  Year
\*-----------------------------------*/

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

/*-----------------------------------*\
  Language: English and German only
\*-----------------------------------*/

const locales = {
  en: { label: 'English', og: 'en_US' },
  de: { label: 'Deutsch', og: 'de_DE' }
};

let currentDict = {};
let currentLanguage = 'en';

function queryLanguage() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get('lang');
  return value && locales[value] ? value : null;
}

function t(key, fallback) {
  return currentDict[key] ?? fallback ?? '';
}

function applyTranslations(dict) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (dict[key] != null) element.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    const key = element.getAttribute('data-i18n-html');
    if (dict[key] != null) element.innerHTML = dict[key];
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.getAttribute('data-i18n-aria-label');
    if (dict[key] != null) element.setAttribute('aria-label', dict[key]);
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    const key = element.getAttribute('data-i18n-alt');
    if (dict[key] != null) element.setAttribute('alt', dict[key]);
  });

  const titleKey = page === 'works' ? 'meta.worksTitle' : 'meta.title';
  const descriptionKey = page === 'works' ? 'meta.worksDescription' : page === '404' ? null : 'meta.description';

  if (page !== '404' && dict[titleKey]) document.title = dict[titleKey];

  const description = document.querySelector('meta[name="description"]');
  if (description && descriptionKey && dict[descriptionKey]) {
    description.setAttribute('content', dict[descriptionKey]);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && dict[titleKey]) ogTitle.setAttribute('content', dict[titleKey]);

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription && descriptionKey && dict[descriptionKey]) {
    ogDescription.setAttribute('content', dict[descriptionKey]);
  }

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle && dict[titleKey]) twitterTitle.setAttribute('content', dict[titleKey]);

  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription && descriptionKey && dict[descriptionKey]) {
    twitterDescription.setAttribute('content', dict[descriptionKey]);
  }

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale && locales[currentLanguage]) {
    ogLocale.setAttribute('content', locales[currentLanguage].og);
  }

  updateWorksCounts(worksData);
}

function updateUrlLanguage(code) {
  const url = new URL(window.location.href);

  if (code === 'en') {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', code);
  }

  window.history.replaceState(null, '', url);
}

function loadLocale(code) {
  const language = locales[code] ? code : 'en';

  currentLanguage = language;
  currentDict = siteData.i18n[language] || {};
  root.lang = language;

  if (languageSelect) languageSelect.value = language;

  applyTranslations(currentDict);
  updateUrlLanguage(language);
  store.set('lang', language);
}

if (languageSelect) {
  languageSelect.addEventListener('change', () => {
    loadLocale(languageSelect.value);
  });
}

const initialLanguage = queryLanguage() || store.get('lang', 'en');
loadLocale(initialLanguage);

/*-----------------------------------*\
  Works
\*-----------------------------------*/

function fetchWorks() {
  if (!worksData) {
    worksData = siteData.works || { artworks: [] };
  }

  return Promise.resolve(worksData);
}

function renderWorksPreview(data) {
  if (!worksPreview) return;

  worksPreview.innerHTML = '';

  data.artworks.slice(0, 5).forEach((artwork) => {
    const link = document.createElement('a');
    link.className = 'works-preview-item';
    link.href = 'works.html';

    const media = document.createElement('span');
    media.className = 'works-preview-media';

    const image = document.createElement('img');
    image.src = artwork.src;
    image.alt = '';
    image.width = artwork.width;
    image.height = artwork.height;
    image.loading = 'lazy';
    image.decoding = 'async';

    const title = document.createElement('span');
    title.className = 'works-preview-title';
    title.textContent = artwork.title;

    const year = document.createElement('span');
    year.className = 'works-preview-year';
    year.textContent = artwork.year || '';

    media.appendChild(image);
    link.append(media, title);
    if (artwork.year) link.appendChild(year);
    worksPreview.appendChild(link);
  });
}

let artworkList = [];
let lightboxIndex = 0;

function renderLightbox(index) {
  if (!lightboxImg || !artworkList.length) return;

  const artwork = artworkList[index];
  if (!artwork) return;

  lightboxIndex = index;
  lightboxImg.src = artwork.full;
  lightboxImg.alt = artwork.title;

  if (lightboxTitle) lightboxTitle.textContent = artwork.title;
  if (lightboxMedium) {
    const mediumText =
      artwork.medium === 'Ink on paper'
        ? t('works.ink', 'Ink on paper')
        : artwork.medium;

    lightboxMedium.textContent = artwork.year
      ? `${mediumText}, ${artwork.year}`
      : mediumText;
  }
  if (lightboxCount) {
    lightboxCount.textContent = `${index + 1} / ${artworkList.length}`;
  }

  const next = artworkList[(index + 1) % artworkList.length];
  const previous = artworkList[(index - 1 + artworkList.length) % artworkList.length];

  [next, previous].forEach((item) => {
    if (item) {
      const preload = new Image();
      preload.src = item.full;
    }
  });
}

function openLightbox(index) {
  if (!lightbox) return;

  renderLightbox(index);
  lightbox.showModal();
  syncScrollLock();
}

function closeLightbox() {
  if (lightbox && lightbox.open) lightbox.close();
}

function renderGallery(data) {
  if (!gallery) return;

  artworkList = data.artworks;
  gallery.innerHTML = '';

  const rest = document.createElement('div');
  rest.className = 'gallery-rest';

  data.artworks.forEach((artwork, index) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-item';

    const link = document.createElement('a');
    link.className = 'plate';
    link.href = artwork.full;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openLightbox(index);
    });

    const image = document.createElement('img');
    image.src = artwork.src;
    image.srcset = index === 0
      ? `${artwork.src} 900w, ${artwork.full} 1600w`
      : `${artwork.src} 900w`;
    image.sizes = index === 0
      ? '(min-width: 1024px) 1200px, 300px'
      : '(min-width: 1024px) 600px, 300px';
    image.alt = artwork.title;
    image.width = artwork.width;
    image.height = artwork.height;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (index === 0) image.fetchPriority = 'high';

    const open = document.createElement('span');
    open.className = 'plate-open';
    open.setAttribute('data-i18n', 'works.view');
    open.textContent = t('works.view', 'View');

    const caption = document.createElement('figcaption');
    caption.className = 'artwork-caption';

    const title = document.createElement('span');
    title.className = 'artwork-title';
    title.textContent = artwork.title;

    const medium = document.createElement('span');
    medium.className = 'artwork-medium';

    if (artwork.medium === 'Ink on paper') {
      const label = document.createElement('span');
      label.setAttribute('data-i18n', 'works.ink');
      label.textContent = t('works.ink', 'Ink on paper');
      medium.appendChild(label);
      if (artwork.year) medium.append(`, ${artwork.year}`);
    } else {
      medium.textContent = artwork.year
        ? `${artwork.medium}, ${artwork.year}`
        : artwork.medium;
    }

    link.append(image, open);
    caption.append(title, medium);
    figure.append(link, caption);

    if (index === 0) gallery.appendChild(figure);
    else rest.appendChild(figure);
  });

  if (rest.children.length) gallery.appendChild(rest);
}

function updateWorksCounts(data) {
  if (!data) return;

  const count = document.querySelector('[data-works-count]');
  if (count) {
    count.textContent = `${t('works.drawings', 'Drawings')}: ${data.artworks.length}`;
  }

  const range = document.querySelector('[data-works-range]');
  if (range && data.artworks.length) {
    range.textContent = `01 - ${String(data.artworks.length).padStart(2, '0')}`;
  }
}

const needsWorks = Boolean(worksPreview || gallery);

if (needsWorks) {
  fetchWorks().then((data) => {
    renderWorksPreview(data);
    renderGallery(data);
    updateWorksCounts(data);
    applyTranslations(currentDict);
  });
}

/*-----------------------------------*\
  Lightbox controls
\*-----------------------------------*/

if (lightbox) {
  const close = document.querySelector('[data-lightbox-close]');
  const previous = document.querySelector('[data-lightbox-prev]');
  const next = document.querySelector('[data-lightbox-next]');

  if (close) close.addEventListener('click', closeLightbox);

  if (previous) {
    previous.addEventListener('click', () => {
      renderLightbox((lightboxIndex - 1 + artworkList.length) % artworkList.length);
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      renderLightbox((lightboxIndex + 1) % artworkList.length);
    });
  }

  lightbox.addEventListener('close', () => {
    syncScrollLock();
  });

  lightbox.addEventListener('keydown', (event) => {
    if (!artworkList.length) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      renderLightbox((lightboxIndex - 1 + artworkList.length) % artworkList.length);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      renderLightbox((lightboxIndex + 1) % artworkList.length);
    }
  });
}
