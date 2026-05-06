(() => {
  const videos = [
    {
      title: 'Studio V Showreel 2025',
      copy: 'Studio V의 LED Wall 촬영 장면을 모은 메인 쇼릴입니다.',
      type: 'Showreel',
      runtime: '2:16',
      src: './assets/video/showreel-web.mp4',
      poster: './assets/video/showreel-poster.jpg'
    },
    {
      title: 'Studio V Making Film',
      copy: '외관, 준비 과정, 장비 운용, 제작진 동선을 담은 메이킹 필름입니다.',
      type: 'BTS / Making',
      runtime: '3:30',
      src: './assets/video/making-film-web.mp4',
      poster: './assets/video/making-film-poster.jpg'
    },
    {
      title: 'Production Variables',
      copy: '날씨, 일정, 배경 전환 같은 현장 변수를 VP 환경에서 다루는 짧은 클립입니다.',
      type: 'Short Clip',
      runtime: '0:44',
      src: './assets/video/short1-web.mp4',
      poster: './assets/video/short1-poster.jpg'
    },
    {
      title: 'Mars Environment',
      copy: '사막, 화성 지형 계열 배경과 장비 배치가 함께 보이는 테스트 클립입니다.',
      type: 'Stage Test',
      runtime: '0:47',
      src: './assets/video/short2-web.mp4',
      poster: './assets/video/short2-poster.jpg'
    },
    {
      title: 'Cathedral Environment',
      copy: '대형 실내 배경에서 인물, 조명, 카메라 동선을 확인하는 테스트 클립입니다.',
      type: 'Stage Test',
      runtime: '0:48',
      src: './assets/video/short3-web.mp4',
      poster: './assets/video/short3-poster.jpg'
    }
  ];

  const player = document.querySelector('[data-showreel-player]');
  const title = document.querySelector('[data-showreel-title]');
  const copy = document.querySelector('[data-showreel-copy]');
  const type = document.querySelector('[data-showreel-type]');
  const runtime = document.querySelector('[data-showreel-runtime]');
  const cards = [...document.querySelectorAll('[data-video-index]')];

  if (!player || !cards.length) return;

  const setVideo = (index) => {
    const item = videos[index];
    if (!item) return;
    const shouldPlay = !player.paused;
    player.pause();
    player.poster = item.poster;
    player.src = item.src;
    player.load();
    if (title) title.textContent = item.title;
    if (copy) copy.textContent = item.copy;
    if (type) type.textContent = item.type;
    if (runtime) runtime.textContent = item.runtime;
    cards.forEach((card) => {
      card.classList.toggle('is-active', Number(card.dataset.videoIndex) === index);
    });
    if (shouldPlay) {
      player.play().catch(() => {});
    }
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => setVideo(Number(card.dataset.videoIndex)));
  });
})();
