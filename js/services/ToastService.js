/**
 * Servicio de Toast Notifications para OptiCut 3D.
 * Muestra notificaciones flotantes no intrusivas con icono, título y mensaje.
 */
export class ToastService {
  /**
   * @param {string} type   - 'success' | 'info' | 'warning' | 'error'
   * @param {string} title  - Título breve
   * @param {string} msg    - Descripción del resultado
   * @param {number} [duration=7000] - Duración en ms antes de auto-cerrar
   */
  static show(type = 'success', title, msg = '', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'check-circle',
      info:    'info',
      warning: 'alert-triangle',
      error:   'x-circle',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round">
          ${ToastService._iconPath(icons[type] || 'info')}
        </svg>
      </div>
      <div class="toast-content">
        <span class="toast-title">${title}</span>
        ${msg ? `<span class="toast-msg">${msg}</span>` : ''}
      </div>
      <button class="toast-close" title="Cerrar">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('toast-hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }

  /** Retorna el path SVG según el nombre del ícono */
  static _iconPath(name) {
    const paths = {
      'check-circle':   '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      'info':           '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      'x-circle':       '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    };
    return paths[name] || paths['info'];
  }
}
