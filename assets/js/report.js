function getYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]+)/,
    /youtu\.be\/([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/,
    /youtube\.com\/shorts\/([\w-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function getGoogleDriveId(url) {
  const patterns = [
    /drive\.google\.com\/file\/d\/([\w-]+)/,
    /drive\.google\.com\/open\?id=([\w-]+)/,
    /drive\.google\.com\/uc\?(?:export=download&)?id=([\w-]+)/,
    /drive\.google\.com\/[^?]*[?&]id=([\w-]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function appendSourceLink(container, url, label) {
  const link = document.createElement('a');
  link.className = 'source-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = label;
  container.appendChild(link);
}

// Google Driveのプレビューはツールバー込みの固定レイアウトで、
// 狭い枠にそのまま押し込むと内部でクリップされてしまう。
// 十分広いサイズで描画してから縮小表示することで、常に全体を表示する。
const DRIVE_DEVICE_WIDTH = 960;
const DRIVE_DEVICE_HEIGHT = 720;

function renderVideoEmbed(container, url, linkContainer) {
  if (!container) return;
  container.innerHTML = '';
  container.style.height = '';
  if (linkContainer) linkContainer.innerHTML = '';
  if (!url) {
    container.classList.add('is-empty');
    container.classList.remove('drive-embed');
    container.textContent = '動画を表示（任意に再生）';
    return;
  }
  container.classList.remove('is-empty');

  const youTubeId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const driveId = getGoogleDriveId(url);
  container.classList.toggle('drive-embed', Boolean(driveId));
  let mediaEl;

  if (youTubeId) {
    mediaEl = document.createElement('iframe');
    mediaEl.src = `https://www.youtube.com/embed/${youTubeId}`;
    mediaEl.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    mediaEl.allowFullscreen = true;
  } else if (vimeoId) {
    mediaEl = document.createElement('iframe');
    mediaEl.src = `https://player.vimeo.com/video/${vimeoId}`;
    mediaEl.allow = 'autoplay; fullscreen; picture-in-picture';
    mediaEl.allowFullscreen = true;
  } else if (driveId) {
    mediaEl = document.createElement('iframe');
    mediaEl.src = `https://drive.google.com/file/d/${driveId}/preview`;
    mediaEl.allow = 'autoplay; fullscreen';
    mediaEl.allowFullscreen = true;

    const scale = container.clientWidth / DRIVE_DEVICE_WIDTH;
    mediaEl.style.position = 'absolute';
    mediaEl.style.top = '0';
    mediaEl.style.left = '0';
    mediaEl.style.width = `${DRIVE_DEVICE_WIDTH}px`;
    mediaEl.style.height = `${DRIVE_DEVICE_HEIGHT}px`;
    mediaEl.style.border = '0';
    mediaEl.style.transform = `scale(${scale})`;
    mediaEl.style.transformOrigin = 'top left';
    container.style.height = `${DRIVE_DEVICE_HEIGHT * scale}px`;
  } else if (isDirectVideoFile(url)) {
    mediaEl = document.createElement('video');
    mediaEl.controls = true;
    mediaEl.preload = 'metadata';
    const source = document.createElement('source');
    source.src = url;
    mediaEl.appendChild(source);
    mediaEl.appendChild(document.createTextNode('お使いのブラウザは動画再生に対応していません。'));
  } else {
    // YouTube/Vimeo以外の埋め込みURL（プレーヤーのembed URL等）はそのままiframe化
    mediaEl = document.createElement('iframe');
    mediaEl.src = url;
    mediaEl.allow = 'autoplay; fullscreen; picture-in-picture';
    mediaEl.allowFullscreen = true;
  }
  mediaEl.title = '動画';

  container.appendChild(mediaEl);
  if (linkContainer) appendSourceLink(linkContainer, url, '元のURLを開く');
}

function rescaleDriveEmbeds() {
  document.querySelectorAll('.media-embed.video-embed.drive-embed').forEach((container) => {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;
    const scale = container.clientWidth / DRIVE_DEVICE_WIDTH;
    iframe.style.transform = `scale(${scale})`;
    container.style.height = `${DRIVE_DEVICE_HEIGHT * scale}px`;
  });
}

const LP_DEVICE_WIDTH = 1080;
const LP_DEVICE_HEIGHT = 1920;

function renderLpEmbed(container, url, linkContainer) {
  if (!container) return;
  container.innerHTML = '';
  container.style.height = '';
  if (linkContainer) linkContainer.innerHTML = '';
  if (!url) {
    container.classList.add('is-empty');
    container.textContent = 'LPを表示';
    return;
  }
  container.classList.remove('is-empty');

  // LP自体を幅1080pxの画面として描画し、コラム幅に合わせて縮小表示する
  // （iframeを100%幅にすると、狭い枠に押し込まれてLP側のレスポンシブ崩れが起きるため）
  const scale = container.clientWidth / LP_DEVICE_WIDTH;

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.title = 'LP';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = `${LP_DEVICE_WIDTH}px`;
  iframe.style.height = `${LP_DEVICE_HEIGHT}px`;
  iframe.style.border = '0';
  iframe.style.transform = `scale(${scale})`;
  iframe.style.transformOrigin = 'top left';

  container.style.height = `${LP_DEVICE_HEIGHT * scale}px`;
  container.appendChild(iframe);
  if (linkContainer) appendSourceLink(linkContainer, url, '元のページを新しいタブで開く');
}

function rescaleLpEmbeds() {
  document.querySelectorAll('.media-embed.lp-embed').forEach((container) => {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;
    const scale = container.clientWidth / LP_DEVICE_WIDTH;
    iframe.style.transform = `scale(${scale})`;
    container.style.height = `${LP_DEVICE_HEIGHT * scale}px`;
  });
}

let lpResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(lpResizeTimer);
  lpResizeTimer = setTimeout(() => {
    rescaleLpEmbeds();
    rescaleDriveEmbeds();
  }, 150);
});
