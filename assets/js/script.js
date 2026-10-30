'use strict';

window.__shravanReady = true;
document.documentElement.classList.add('js-menu');

/*-----------------------------------*\
  Theme
\*-----------------------------------*/

const root = document.documentElement;
const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

const themeColors = {
  light: '#f0efea',
  dark: '#121311'
};

const currentTheme = function () {
  const forced = root.getAttribute('data-theme');
  if (forced === 'light' || forced === 'dark') return forced;
  return systemTheme.matches ? 'dark' : 'light';
};

const paintThemeState = function (theme) {
  const next = theme === 'dark' ? 'light' : 'dark';

  themeButtons.forEach(function (button) {
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  });

  if (themeLabel) {
    themeLabel.textContent = 'Switch to ' + next + ' theme';
  }

  if (themeMeta) {
    themeMeta.setAttribute('content', themeColors[theme]);
  }
};

const applyTheme = function (theme, persist) {
  root.setAttribute('data-theme', theme);

  if (persist) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      /* storage can be blocked */
    }
  }

  paintThemeState(theme);
};

themeButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
  });
});

systemTheme.addEventListener('change', function () {
  if (!root.hasAttribute('data-theme')) {
    paintThemeState(currentTheme());
  }
});

paintThemeState(currentTheme());

/*-----------------------------------*\
  Header state
\*-----------------------------------*/

const header = document.querySelector('[data-header]');
const headerSentinel = document.querySelector('[data-header-sentinel]');

if (header && headerSentinel) {
  const headerObserver = new IntersectionObserver(function (entries) {
    const isScrolled = !entries[0].isIntersecting;
    header.classList.toggle('is-scrolled', isScrolled);

    if (!isScrolled) {
      document.querySelectorAll('[data-nav]').forEach(function (link) {
        link.removeAttribute('aria-current');
      });
    }
  });

  headerObserver.observe(headerSentinel);
}

/*-----------------------------------*\
  Mobile menu
\*-----------------------------------*/

const menu = document.querySelector('[data-menu]');
const menuOpen = document.querySelector('[data-menu-open]');
const menuClose = document.querySelector('[data-menu-close]');
const menuLinks = document.querySelectorAll('[data-menu-link]');

if (menu && menuOpen) {
  menuOpen.addEventListener('click', function () {
    menu.showModal();
    document.body.style.overflow = 'hidden';
  });

  const closeMenu = function () {
    if (menu.open) menu.close();
  };

  menuClose.addEventListener('click', closeMenu);

  menuLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  menu.addEventListener('close', function () {
    document.body.style.overflow = '';
    menuOpen.focus();
  });

  window.matchMedia('(min-width: 820px)').addEventListener('change', function (event) {
    if (event.matches) closeMenu();
  });
}

/*-----------------------------------*\
  Scroll reveal
\*-----------------------------------*/

const revealItems = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (revealItems.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.08
  });

  revealItems.forEach(function (item) {
    if (reduceMotion.matches) {
      item.classList.add('is-in');
    } else {
      revealObserver.observe(item);
    }
  });
} else {
  revealItems.forEach(function (item) {
    item.classList.add('is-in');
  });
}

/*-----------------------------------*\
  Active navigation
\*-----------------------------------*/

const navLinks = document.querySelectorAll('[data-nav]');
const sections = document.querySelectorAll('main section[id]');

if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      navLinks.forEach(function (link) {
        const isCurrent = link.getAttribute('href') === '#' + entry.target.id;
        if (isCurrent) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, {
    rootMargin: '-18% 0px -68% 0px'
  });

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

/*-----------------------------------*\
  Copy email
\*-----------------------------------*/

const copyButton = document.querySelector('[data-copy]');
const copyStatus = document.querySelector('[data-copy-status]');

const fallbackCopy = function (text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();

  try {
    document.execCommand('copy');
  } catch (error) {
    /* nothing else to try */
  }

  document.body.removeChild(field);
};

if (copyButton) {
  copyButton.addEventListener('click', async function () {
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

      copyButton.textContent = 'Copied';
      copyButton.classList.add('is-copied');

      if (copyStatus) copyStatus.textContent = 'Email address copied';

      window.setTimeout(function () {
        copyButton.textContent = 'Copy';
        copyButton.classList.remove('is-copied');
        if (copyStatus) copyStatus.textContent = '';
      }, 2000);
    } catch (error) {
      if (copyStatus) copyStatus.textContent = 'Could not copy. The address is contact@shravan.org';
    }
  });
}

/*-----------------------------------*\
  Year
\*-----------------------------------*/

const year = document.querySelector('[data-year]');

if (year) {
  year.textContent = String(new Date().getFullYear());
}
