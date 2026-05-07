// ===================================
//  MODEL CONFIG — order: dev, distilled, sparse
// ===================================
const MODELS = [
  {
    id: 0,
    key: 'dev',
    folder: 'Images/results_flux_H200_standard_4_steps_dev/Baseline_Flux_Standard_2Steps',
    desc: 'Flux.1-Dev · 50-step · SDPA — baseline reference.',
  },
  {
    id: 1,
    key: 'sparge_dev',
    folder: 'Images/results_flux_H200_sparge_dev/Baseline_Flux_Standard_2Steps',
    desc: 'Flux.1-Dev · 50-step · SpargeAttn',
  },
  {
    id: 2,
    key: 'distilled',
    folder: 'Images/results_flux_H200_standard_4_steps_distilled/Baseline_Flux_Standard_2Steps',
    desc: 'Flux.1-schnell · 4-step · SDPA',
  },
  {
    id: 3,
    key: 'sparse',
    folder: 'Images/results_flux_H200_sparge_schnell/Baseline_Flux_Standard_2Steps',
    desc: 'Flux.1-schnell · 4-step · SpargeAttn',
  },
];

// ===================================
//  K-VALUE CONFIG (Flux1.Distilled[SpargeAttn] only)
// ===================================
const K_VALUES = [
  { label: 'Adaptive', folder: 'Images/results_flux_H200_sparge_schnell/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 0.1', folder: 'Images/results_flux_H200_sparge_4_step_k0.1/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 0.3', folder: 'Images/results_flux_H200_sparge_4_step_k0.3/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 0.5', folder: 'Images/results_flux_H200_sparge_4_step_k0.5/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 0.7', folder: 'Images/results_flux_H200_sparge_4_step_k0.7/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 0.9', folder: 'Images/results_flux_H200_sparge_4_step_k0.9/Baseline_Flux_Standard_2Steps' },
  { label: 'k = 1.0', folder: 'Images/results_flux_H200_sparge_4_step_k1.0/Baseline_Flux_Standard_2Steps' },
];

// ===================================
//  IMAGE LIST — built from known files
//  (generated at page load via fetch probing or hardcoded)
// ===================================

// Since this is a local file:// page, we can't use fetch to list directories.
// We use a manifest approach: the file list is embedded below.
// All three folders share the same filenames, so one list covers all.

const IMAGE_FILES = [
  "000000000724.png", "000000001296.png", "000000001490.png", "000000001503.png",
  "000000002157.png", "000000003553.png", "000000004795.png", "000000005586.png",
  "000000006771.png", "000000006818.png", "000000007784.png", "000000008532.png",
  "000000010092.png", "000000010583.png", "000000011760.png", "000000012120.png",
  "000000013546.png", "000000014439.png", "000000014888.png", "000000017905.png",
  "000000018575.png", "000000020247.png", "000000021465.png", "000000022623.png",
  "000000022969.png", "000000024144.png", "000000024567.png", "000000025394.png",
  "000000027186.png", "000000027620.png"
];

// ===================================
//  STATE
// ===================================
let currentModel = 0;
let currentIndex = 0;   // index into IMAGE_FILES
let currentK = 0;   // index into K_VALUES (only for model 3)
let isDragging = false;
let dragStartX = 0;
let dragScrollStart = 0;
let carouselOffset = 0;   // px offset for virtual infinite scroll
let THUMB_SIZE = 98; // 90px thumb + 8px gap (must match CSS)
let PROMPTS = {}; // filename (no ext) -> caption string

// ===================================
//  LOAD PROMPTS FROM CSV
// ===================================
fetch('Images/manifest_512.csv')
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  })
  .then(text => {
    const lines = text.trim().split('\n');
    lines.slice(1).forEach(line => {
      const firstComma = line.indexOf(',');
      if (firstComma === -1) return;
      const rawFile = line.slice(0, firstComma).trim().replace(/\r$/, '');
      let caption = line.slice(firstComma + 1).trim().replace(/\r$/, '');
      if (caption.startsWith('"') && caption.endsWith('"')) {
        caption = caption.slice(1, -1).replace(/""/g, '"');
      }
      const stem = rawFile.replace(/\.[^.]+$/, '');
      PROMPTS[stem] = caption;
    });
    updatePrompt(IMAGE_FILES[currentIndex]);
  })
  .catch(err => console.warn('[prompts] Could not load captions:', err.message));

// ===================================
//  DOM REFS
// ===================================
const mainImg = document.getElementById('main-image');
const carouselTrack = document.getElementById('carousel-track');
const promptText = document.getElementById('prompt-text');
const modelDesc = document.getElementById('model-desc');
const kPillsWrap = document.getElementById('k-pills-wrap');

// ===================================
//  HELPERS
// ===================================
function imgPath(modelIndex, filename) {
  const folder = (modelIndex === 3)
    ? K_VALUES[currentK].folder
    : MODELS[modelIndex].folder;
  return folder + '/' + filename;
}

function selectK(kIndex) {
  currentK = kIndex;
  document.querySelectorAll('.k-pill').forEach((el, i) => {
    el.classList.toggle('active', i === kIndex);
  });
  buildCarousel();
  mainImg.src = imgPath(currentModel, IMAGE_FILES[currentIndex]);
}

function updatePrompt(filename) {
  const stem = filename.replace(/\.[^.]+$/, '');
  const caption = PROMPTS[stem] || '';
  promptText.textContent = caption;
}

// Info card removed — no-op placeholder
function updateInfoCard(modelIndex) { }

// ===================================
//  MAIN IMAGE SWITCH
// ===================================
function selectImage(index, skipFade) {
  currentIndex = ((index % IMAGE_FILES.length) + IMAGE_FILES.length) % IMAGE_FILES.length;
  const path = imgPath(currentModel, IMAGE_FILES[currentIndex]);

  if (skipFade) {
    mainImg.src = path;
  } else {
    mainImg.classList.add('fade-out');
    setTimeout(() => {
      mainImg.src = path;
      mainImg.classList.remove('fade-out');
    }, 200);
  }

  // highlight active thumb
  document.querySelectorAll('.carousel-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === currentIndex);
  });

  // update prompt overlay
  updatePrompt(IMAGE_FILES[currentIndex]);

  // scroll carousel so active thumb is visible
  scrollCarouselToIndex(currentIndex);
}

// ===================================
//  CAROUSEL BUILD
// ===================================
function buildCarousel() {
  carouselTrack.innerHTML = '';

  IMAGE_FILES.forEach((file, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'carousel-thumb' + (i === currentIndex ? ' active' : '');
    thumb.dataset.index = i;

    const img = document.createElement('img');
    img.src = imgPath(currentModel, file);
    img.alt = `Image ${file}`;
    img.loading = 'lazy';

    thumb.appendChild(img);
    thumb.addEventListener('click', () => selectImage(i));
    carouselTrack.appendChild(thumb);
  });

  THUMB_SIZE = 98; // 90px thumb + 8px gap (must match CSS)
  carouselTrack.style.transform = 'translateX(0px)';
  carouselOffset = 0;
  scrollCarouselToIndex(currentIndex, true);
}

// ===================================
//  CAROUSEL SCROLL
// ===================================
function scrollCarouselToIndex(index, instant) {
  const trackWrap = document.getElementById('carousel-track-wrap');
  const wrapWidth = trackWrap.clientWidth;
  const totalWidth = IMAGE_FILES.length * THUMB_SIZE;
  const targetX = index * THUMB_SIZE - wrapWidth / 2 + THUMB_SIZE / 2;
  const clamped = Math.max(0, Math.min(targetX, totalWidth - wrapWidth));

  carouselOffset = -clamped;
  if (instant) {
    carouselTrack.style.transition = 'none';
    carouselTrack.style.transform = `translateX(${carouselOffset}px)`;
    requestAnimationFrame(() => {
      carouselTrack.style.transition = '';
    });
  } else {
    carouselTrack.style.transform = `translateX(${carouselOffset}px)`;
  }
}

function shiftCarousel(direction) {
  const trackWrap = document.getElementById('carousel-track-wrap');
  const wrapWidth = trackWrap.clientWidth;
  const totalWidth = IMAGE_FILES.length * THUMB_SIZE;
  const shift = THUMB_SIZE * 3;

  carouselOffset = carouselOffset - direction * shift;
  const maxOffset = -(totalWidth - wrapWidth);
  carouselOffset = Math.max(maxOffset, Math.min(0, carouselOffset));
  carouselTrack.style.transform = `translateX(${carouselOffset}px)`;
}

// ===================================
//  MODEL SWITCH
// ===================================
function switchModel(modelIndex) {
  currentModel = modelIndex;
  document.body.dataset.model = modelIndex;

  // update tab styles
  document.querySelectorAll('.model-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === modelIndex);
  });

  // update description text
  modelDesc.textContent = MODELS[modelIndex].desc;

  // show k-pills only for Flux1.Distilled[SpargeAttn] (model 3)
  kPillsWrap.classList.toggle('visible', modelIndex === 3);

  // update info card
  updateInfoCard(modelIndex);

  // rebuild carousel thumbnails with new model's images
  buildCarousel();

  // reload main image for same index
  mainImg.src = imgPath(currentModel, IMAGE_FILES[currentIndex]);
}

// ===================================
//  DRAG-TO-SCROLL CAROUSEL
// ===================================
const trackWrap = document.getElementById('carousel-track-wrap');

trackWrap.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragScrollStart = carouselOffset;
  carouselTrack.style.transition = 'none';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const trackWrapW = trackWrap.clientWidth;
  const totalW = IMAGE_FILES.length * THUMB_SIZE;
  const maxOffset = -(totalW - trackWrapW);

  carouselOffset = Math.max(maxOffset, Math.min(0, dragScrollStart + dx));
  carouselTrack.style.transform = `translateX(${carouselOffset}px)`;
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  carouselTrack.style.transition = '';
});

// Touch support
trackWrap.addEventListener('touchstart', (e) => {
  dragStartX = e.touches[0].clientX;
  dragScrollStart = carouselOffset;
  carouselTrack.style.transition = 'none';
}, { passive: true });

trackWrap.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - dragStartX;
  const trackWrapW = trackWrap.clientWidth;
  const totalW = IMAGE_FILES.length * THUMB_SIZE;
  const maxOffset = -(totalW - trackWrapW);

  carouselOffset = Math.max(maxOffset, Math.min(0, dragScrollStart + dx));
  carouselTrack.style.transform = `translateX(${carouselOffset}px)`;
}, { passive: true });

trackWrap.addEventListener('touchend', () => {
  carouselTrack.style.transition = '';
});

// ===================================
//  ARROW BUTTONS — removed, drag only
// ===================================

// ===================================
//  MODEL PREV / NEXT ARROWS (on image)
// ===================================
document.getElementById('model-prev').addEventListener('click', () => {
  switchModel((currentModel + MODELS.length - 1) % MODELS.length);
});
document.getElementById('model-next').addEventListener('click', () => {
  switchModel((currentModel + 1) % MODELS.length);
});

// ===================================
//  K-PILL CLICKS
// ===================================
document.querySelectorAll('.k-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const k = parseInt(pill.dataset.k, 10);
    if (k !== currentK) selectK(k);
  });
});

// ===================================
//  TAB CLICKS
// ===================================
document.querySelectorAll('.model-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const idx = parseInt(tab.dataset.model, 10);
    if (idx !== currentModel) switchModel(idx);
  });
});

// ===================================
//  KEYBOARD NAV
// ===================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') selectImage(currentIndex + 1);
  if (e.key === 'ArrowLeft') selectImage(currentIndex - 1);
  if (e.key === '1') switchModel(0);
  if (e.key === '2') switchModel(1);
  if (e.key === '3') switchModel(2);
  if (e.key === '4') switchModel(3);
});

// ===================================
//  INIT
// ===================================
document.body.dataset.model = 0;
modelDesc.textContent = MODELS[0].desc;  // set initial description
updateInfoCard(0);
buildCarousel();
selectImage(0, true);
