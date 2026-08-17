import { escapeHtml as e } from '../utils/text.js';

export function closeModal(modalRoot) {
  modalRoot.innerHTML = '';
}

export function openModal(modalRoot, { title, subtitle = '', body, footer = '', wide = false }) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${e(title)}">
        <div class="modal-head">
          <div><h2>${e(title)}</h2>${subtitle ? `<p>${e(subtitle)}</p>` : ''}</div>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </section>
    </div>
  `;

  modalRoot.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', (event) => {
    if (event.target === element || element.classList.contains('modal-close')) closeModal(modalRoot);
  }));
  modalRoot.querySelector('.modal-card')?.addEventListener('click', (event) => event.stopPropagation());
}

export function selectOptions(items, selected, labelFn = (item) => item.name) {
  return items.map((item) => `<option value="${item.id}" ${selected === item.id ? 'selected' : ''}>${e(labelFn(item))}</option>`).join('');
}
