(() => {
  const works = [
    {
      id: 'film',
      category: 'Film & Drama',
      title: '영화 촬영 활용',
      location: '대전 스튜디오큐브 V동',
      tech: '60m x 8m Main LED Wall / 21K x 3K / OptiTrack',
      image: './assets/images/optimized/overview-1.jpg',
      copy: '대형 로케이션, 날씨, 시간대 전환을 스튜디오 안에서 처리하는 방식입니다.'
    },
    {
      id: 'film',
      category: 'Film & Drama',
      title: '드라마 촬영 활용',
      location: '대전 스튜디오큐브 V동',
      tech: 'LED Volume / OptiTrack / Unreal Pipeline',
      image: './assets/images/optimized/hero-clean-final.jpg',
      copy: '반복 세트와 배경 전환이 많은 장기 촬영에 맞춘 운용 방식입니다.'
    },
    {
      id: 'commercial',
      category: 'Commercial',
      title: '광고 촬영 활용',
      location: '대전 스튜디오큐브 V동',
      tech: 'Pixera Media Server / LED Playback / Real-time Preview',
      image: './assets/images/optimized/hero-main-04.jpg',
      copy: '제품, 인물, 차량 촬영에서 배경과 조명을 빠르게 바꿔가며 테스트합니다.'
    },
    {
      id: 'commercial',
      category: 'Commercial',
      title: '브랜드 필름 활용',
      location: '대전 스튜디오큐브 V동',
      tech: 'LED Volume / Lighting Coordination / Unreal Pipeline',
      image: './assets/images/overview-3.jpg',
      copy: '브랜드 필름에 필요한 배경, 반사, 컬러 톤을 LED Wall과 조명으로 맞춥니다.'
    },
    {
      id: 'event',
      category: 'Event & Live',
      title: '행사 촬영 활용',
      location: '대전 스튜디오큐브 V동',
      tech: '21m x 15m Ceiling LED / Main LED Wall / Live Operation',
      image: './assets/images/gallery-1.jpg',
      copy: '행사, 프레스, 라이브 스테이지를 LED Wall 기반으로 운용합니다.'
    },
    {
      id: 'event',
      category: 'Event & Live',
      title: '라이브 콘텐츠 활용',
      location: '대전 스튜디오큐브 V동',
      tech: 'LED Volume / Pixera / Real-time Production',
      image: './assets/images/optimized/gallery-2.jpg',
      copy: '배경 재생, 카메라 동선, 현장 모니터링을 한 공간에서 맞춥니다.'
    }
  ];

  const grid = document.querySelector('[data-works-grid]');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (!grid) return;

  const render = (filter = 'all') => {
    const list = filter === 'all' ? works : works.filter((work) => work.id === filter);
    grid.innerHTML = list.map((work) => `
      <article class="work-card reveal" id="${work.id}">
        <img src="${work.image}" alt="${work.title}" loading="lazy" decoding="async">
        <div class="work-body">
          <span>${work.category}</span>
          <h3>${work.title}</h3>
          <p>${work.copy}</p>
          <div class="work-meta">
            <strong>${work.location}</strong>
            <small>${work.tech}</small>
          </div>
        </div>
      </article>
    `).join('');
    requestAnimationFrame(() => {
      grid.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      render(button.dataset.filter);
    });
  });

  const hashFilter = window.location.hash.replace('#', '');
  render(['film', 'commercial', 'event'].includes(hashFilter) ? hashFilter : 'all');
  if (['film', 'commercial', 'event'].includes(hashFilter)) {
    filterButtons.forEach((item) => item.classList.toggle('is-active', item.dataset.filter === hashFilter));
  }
})();
