function fileStamp() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function saveCanvas(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Không thể tạo file ảnh.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
}

function screenshotBackground() {
  return document.documentElement.dataset.theme === 'light' ? '#f3f6fb' : '#080b14';
}

async function renderCanvas(element, options = {}) {
  if (typeof window.html2canvas !== 'function') throw new Error('Không tải được thư viện chụp trang.');
  return window.html2canvas(element, {
    backgroundColor: screenshotBackground(),
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    ...options
  });
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function createOffscreenStage() {
  const stage = document.createElement('div');
  stage.className = 'screenshot-offscreen-stage';
  stage.setAttribute('aria-hidden', 'true');
  document.body.append(stage);
  return stage;
}

function stripInteractiveState(clone) {
  clone.querySelectorAll('.dragging, .drop-target, .drop-target-swap, .drop-target-move, .drop-target-invalid')
    .forEach((element) => element.classList.remove('dragging', 'drop-target', 'drop-target-swap', 'drop-target-move', 'drop-target-invalid'));
  clone.classList.remove('is-dragging-member');
}

function sanitizeUnsupportedColors(clone) {
  const unsupportedColor = /(?:color-mix|oklab|oklch|lab|lch|color)\(/i;
  const properties = [
    'color', 'background-color', 'background-image',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'box-shadow', 'text-shadow', 'fill', 'stroke'
  ];
  const dark = document.documentElement.dataset.theme !== 'light';
  const fallback = (property) => {
    if (property === 'color') return dark ? '#dce4f4' : '#263248';
    if (property === 'background-color') return 'transparent';
    if (property === 'background-image' || property.includes('shadow')) return 'none';
    if (property === 'fill' || property === 'stroke') return 'none';
    return dark ? '#2a3448' : '#d7deea';
  };

  [clone, ...clone.querySelectorAll('*')].forEach((element) => {
    const computed = getComputedStyle(element);
    properties.forEach((property) => {
      const value = computed.getPropertyValue(property);
      if (unsupportedColor.test(value)) element.style.setProperty(property, fallback(property));
    });
  });
  clone.style.setProperty('--purple-2', dark ? '#6f46c9' : '#7651d5');
}

async function withClone(source, className, task) {
  const stage = createOffscreenStage();
  const clone = source.cloneNode(true);
  clone.classList.add(className, 'screenshot-static-clone');
  stripInteractiveState(clone);
  stage.append(clone);
  sanitizeUnsupportedColors(clone);

  try {
    // Wait until layout/fonts/styles have settled on the detached visual copy.
    if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
    await nextFrame();
    return await task(clone);
  } finally {
    stage.remove();
  }
}

export async function captureFullOverview({ root, toast }) {
  const surface = document.querySelector('.app-shell');
  const button = root.querySelector('[data-action="capture-page"]');
  if (!surface) throw new Error('Không tìm thấy nội dung Tổng quan cần chụp.');

  // Keep the live UI untouched. Even the button text is not changed, because
  // changing its width can shift the header while html2canvas is working.
  if (button) {
    if (button.dataset.capturing === 'true') return;
    button.dataset.capturing = 'true';
    button.setAttribute('aria-busy', 'true');
    button.style.pointerEvents = 'none';
  }

  try {
    await withClone(surface, 'capture-clone-mode', async (clone) => {
      const canvas = await renderCanvas(clone, {
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
      });
      await saveCanvas(canvas, `guild-manager-tong-quan-${fileStamp()}.png`);
    });
    toast('Đã chụp toàn bộ trang Tổng quan.');
  } finally {
    if (button) {
      delete button.dataset.capturing;
      button.removeAttribute('aria-busy');
      button.style.pointerEvents = '';
    }
  }
}

export async function captureLegion({ root, legionId, legionName, toast }) {
  const legion = [...root.querySelectorAll('.legion-card[data-legion-id]')]
    .find((item) => item.dataset.legionId === legionId);
  if (!legion) throw new Error('Không tìm thấy Đoàn cần chụp.');

  const button = legion.querySelector('[data-action="capture-legion"]');
  if (button) {
    if (button.dataset.capturing === 'true') return;
    button.dataset.capturing = 'true';
    button.setAttribute('aria-busy', 'true');
    button.style.pointerEvents = 'none';
  }

  try {
    await withClone(legion, 'legion-screenshot-mode', async (clone) => {
      const width = Math.max(clone.scrollWidth, 1560);
      const canvas = await renderCanvas(clone, {
        scale: 2,
        width,
        height: clone.scrollHeight,
        windowWidth: width,
        windowHeight: clone.scrollHeight
      });
      const safeName = (legionName || legionId)
        .toLowerCase()
        .replace(/[^a-z0-9à-ỹ]+/gi, '-')
        .replace(/^-|-$/g, '');
      await saveCanvas(canvas, `guild-manager-${safeName}-${fileStamp()}.png`);
    });
    toast(`Đã chụp ${legionName}.`);
  } finally {
    if (button) {
      delete button.dataset.capturing;
      button.removeAttribute('aria-busy');
      button.style.pointerEvents = '';
    }
  }
}
