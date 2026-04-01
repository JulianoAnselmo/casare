/* ─── Page loader ─── */
const pageLoader = document.querySelector('.page-loader');
if (pageLoader) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      pageLoader.classList.add('is-hidden');
      pageLoader.addEventListener('transitionend', () => pageLoader.remove(), { once: true });
    }, 400);
  });
}

/* ─── Scroll progress bar ─── */
const progressBar = document.querySelector('.scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }, { passive: true });
}

/* ─── Mobile menu ─── */
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav a');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── Scroll reveal with stagger ─── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay;
      if (delay) {
        entry.target.style.transitionDelay = (parseInt(delay, 10) * 0.1) + 's';
      }
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

/* ─── Active nav tracking ─── */
const sections = document.querySelectorAll('section[id]');
const navMap = new Map([...navLinks].map((link) => [link.getAttribute('href').slice(1), link]));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.remove('is-active'));
    const activeLink = navMap.get(entry.target.id);
    if (activeLink) activeLink.classList.add('is-active');
  });
}, { threshold: 0.3, rootMargin: '-15% 0px -50% 0px' });

sections.forEach((section) => sectionObserver.observe(section));

/* ─── Header shrink on scroll ─── */
const header = document.querySelector('.header');
if (header) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('header-scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ─── Animated counters ─── */
function animateCounter(el) {
  const target = parseInt(el.dataset.countTarget, 10);
  const prefix = el.dataset.countPrefix || '';
  const suffix = el.dataset.countSuffix || '';
  if (isNaN(target)) return;

  const duration = 2000;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = prefix + current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsGrid = document.querySelector('.stats-row');
if (statsGrid) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('[data-count-target]');
        counters.forEach((el) => animateCounter(el));
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  counterObserver.observe(statsGrid);
}

/* ─── Build products dynamically from PRODUTOS_DATA ─── */
const categoryGrid = document.getElementById('category-grid');
const productPanel = document.getElementById('product-panel');
let activeCategoryId = null;
let closePanelFn = null;

if (categoryGrid && productPanel && typeof PRODUTOS_DATA !== 'undefined') {
  const panelTitle = productPanel.querySelector('.product-panel-title');
  const panelClose = productPanel.querySelector('.product-panel-close');
  const panelBody = document.getElementById('product-panel-body');

  const chevronSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  // Build category cards + product groups
  PRODUTOS_DATA.forEach((cat, i) => {
    const hasProducts = cat.produtos && cat.produtos.length > 0;
    const card = document.createElement('div');
    card.className = 'category-card reveal' + (hasProducts ? '' : ' category-card--no-products');
    if (hasProducts) card.dataset.category = cat.id;
    card.dataset.delay = String(i);

    const tag = hasProducts ? 'button' : 'div';
    const toggleHTML = hasProducts
      ? '<span class="category-toggle">Ver produtos ' + chevronSVG + '</span>'
      : '';

    card.innerHTML =
      '<' + tag + ' class="category-header"' + (hasProducts ? ' aria-expanded="false"' : '') + '>' +
        '<div class="category-img-wrap">' +
          '<img src="' + cat.capa + '" alt="Linha ' + cat.nome + '" loading="lazy">' +
        '</div>' +
        '<div class="category-info">' +
          '<h3>' + cat.nome + '</h3>' +
          toggleHTML +
        '</div>' +
      '</' + tag + '>';

    categoryGrid.appendChild(card);

    if (hasProducts) {
      const group = document.createElement('div');
      group.className = 'product-group';
      group.dataset.group = cat.id;
      group.innerHTML = cat.produtos.map((p) =>
        '<article class="product-item">' +
          '<img src="' + p.img + '" alt="' + p.nome + '" loading="lazy">' +
          '<span>' + p.nome + '</span>' +
        '</article>'
      ).join('');
      panelBody.appendChild(group);
    }
  });

  // Re-observe reveals for dynamically added cards
  categoryGrid.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

  // Stagger animation helper
  function applyStagger(group) {
    const items = group.querySelectorAll('.product-item');
    items.forEach((item, idx) => {
      item.style.animationDelay = (idx * 0.06) + 's';
    });
  }

  // Panel logic
  function openPanel(category, card) {
    const prevActive = categoryGrid.querySelector('.category-card.is-active');
    if (prevActive) {
      prevActive.classList.remove('is-active');
      prevActive.querySelector('.category-header')?.setAttribute('aria-expanded', 'false');
    }

    card.classList.add('is-active');
    card.querySelector('.category-header')?.setAttribute('aria-expanded', 'true');

    panelBody.querySelectorAll('.product-group').forEach((g) => g.classList.remove('is-visible'));
    const target = panelBody.querySelector('[data-group="' + category + '"]');
    if (target) {
      target.classList.add('is-visible');
      applyStagger(target);
    }

    panelTitle.textContent = card.querySelector('h3')?.textContent || '';
    productPanel.hidden = false;
    activeCategoryId = category;

    setTimeout(() => {
      productPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  closePanelFn = function closePanel() {
    const prevActive = categoryGrid.querySelector('.category-card.is-active');
    if (prevActive) {
      prevActive.classList.remove('is-active');
      prevActive.querySelector('.category-header')?.setAttribute('aria-expanded', 'false');
    }
    panelBody.querySelectorAll('.product-group').forEach((g) => g.classList.remove('is-visible'));
    productPanel.hidden = true;
    activeCategoryId = null;
  };

  categoryGrid.addEventListener('click', (e) => {
    const hdr = e.target.closest('.category-header');
    if (!hdr) return;
    const card = hdr.closest('.category-card');
    if (!card || card.classList.contains('category-card--no-products')) return;

    const category = card.dataset.category;
    if (!category) return;

    if (activeCategoryId === category) {
      closePanelFn();
    } else {
      openPanel(category, card);
    }
  });

  panelClose.addEventListener('click', closePanelFn);
}

/* ─── Lightbox ─── */
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');
  const lbOverlay = lightbox.querySelector('.lightbox-overlay');

  let lbImages = [];
  let lbIndex = 0;

  function openLightbox(imgSrc, altText, images, index) {
    lbImages = images || [{ src: imgSrc, alt: altText }];
    lbIndex = index || 0;
    showLightboxImage();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    updateLightboxNav();
  }

  function showLightboxImage() {
    const item = lbImages[lbIndex];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCaption.textContent = item.alt;
  }

  function updateLightboxNav() {
    lbPrev.style.display = lbImages.length > 1 ? '' : 'none';
    lbNext.style.display = lbImages.length > 1 ? '' : 'none';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function lightboxPrev() {
    if (lbImages.length < 2) return;
    lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
    showLightboxImage();
  }

  function lightboxNext() {
    if (lbImages.length < 2) return;
    lbIndex = (lbIndex + 1) % lbImages.length;
    showLightboxImage();
  }

  lbClose.addEventListener('click', closeLightbox);
  lbOverlay.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', lightboxPrev);
  lbNext.addEventListener('click', lightboxNext);

  // Click on product images to open lightbox
  document.addEventListener('click', (e) => {
    const productImg = e.target.closest('.product-item img');
    if (!productImg) return;

    const group = productImg.closest('.product-group');
    if (!group) return;

    const allImgs = [...group.querySelectorAll('.product-item img')];
    const images = allImgs.map((img) => ({ src: img.src, alt: img.alt }));
    const idx = allImgs.indexOf(productImg);

    openLightbox(productImg.src, productImg.alt, images, idx);
  });

  // Swipe support for mobile
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) lightboxPrev();
      else lightboxNext();
    }
  }, { passive: true });

  // Make lightbox available for ESC handler
  window._closeLightbox = closeLightbox;
  window._lightboxOpen = () => !lightbox.hidden;
}

/* ─── Global keyboard shortcuts ─── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Priority: lightbox first, then product panel
    if (window._lightboxOpen && window._lightboxOpen()) {
      window._closeLightbox();
    } else if (activeCategoryId && closePanelFn) {
      closePanelFn();
    }
  }

  // Arrow keys for lightbox navigation
  if (window._lightboxOpen && window._lightboxOpen()) {
    if (e.key === 'ArrowLeft') {
      const lbPrev = document.querySelector('.lightbox-prev');
      if (lbPrev) lbPrev.click();
    }
    if (e.key === 'ArrowRight') {
      const lbNext = document.querySelector('.lightbox-next');
      if (lbNext) lbNext.click();
    }
  }
});

/* ─── Scroll-to-top button ─── */
const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    if (show && scrollTopBtn.hidden) {
      scrollTopBtn.hidden = false;
    } else if (!show && !scrollTopBtn.hidden) {
      scrollTopBtn.hidden = true;
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─── Image fade-in on load ─── */
function initImageFadeIn(scope) {
  const images = (scope || document).querySelectorAll('.category-img-wrap img, .product-item img');
  images.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
    }
  });
}

// Run on initial load and observe for dynamic content
initImageFadeIn();
const imgObserver = new MutationObserver(() => initImageFadeIn());
const panelBodyEl = document.getElementById('product-panel-body');
if (panelBodyEl) {
  imgObserver.observe(panelBodyEl, { childList: true, subtree: true });
}

/* ─── Contact form feedback ─── */
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = 'Enviando...';

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok || response.status === 200) {
        showToast('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
        contactForm.reset();
      } else {
        throw new Error('Erro no envio');
      }
    } catch (err) {
      showToast('Erro ao enviar mensagem. Tente novamente ou entre em contato por WhatsApp.', 'error');
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.innerHTML = originalHTML;
    }
  });
}

/* ─── Toast system ─── */
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 4000);
}

/* ─── Lightweight parallax ─── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!prefersReducedMotion.matches) {
  const heroVisual = document.querySelector('.hero-visual');
  const heroCopy = document.querySelector('.hero-copy');

  if (heroVisual && heroCopy) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > window.innerHeight) return;
      heroVisual.style.transform = 'translateY(' + (y * 0.06) + 'px)';
      heroCopy.style.transform = 'translateY(' + (y * 0.03) + 'px)';
    }, { passive: true });
  }
}
