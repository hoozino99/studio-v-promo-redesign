(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const cursor = document.getElementById('cursor');

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-solid', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      menuButton.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuButton.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
      });
    });
  }

  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      cursor.classList.add('is-visible');
    };
    const tick = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    document.addEventListener('mousemove', move, { passive: true });
    document.querySelectorAll('a, button, input, select, textarea, canvas').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    tick();
  }

  const inquiryForm = document.querySelector('[data-inquiry-form]');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(inquiryForm);
      const type = form.get('type') || '';
      const date = form.get('date') || '';
      const brief = form.get('brief') || '';
      const body = [
        'Studio V 촬영 문의',
        '',
        `프로젝트 유형: ${type}`,
        `희망 일정: ${date}`,
        '',
        '촬영 개요:',
        brief
      ].join('\n');
      const href = `mailto:virtual@kocca.kr?subject=${encodeURIComponent('Studio V 촬영 문의')}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
    });
  }
})();
