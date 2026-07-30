/**
 * OptiCut 3D — Lógica de la página 404
 * Cuenta regresiva y redireccionamiento automático a la página principal.
 */
(function () {
  const REDIRECT_URL  = 'index.html';
  const COUNTDOWN_SEC = 10;

  const countdownEl = document.getElementById('countdown-sec');
  if (!countdownEl) return;

  let remaining = COUNTDOWN_SEC;
  countdownEl.textContent = remaining;

  const timer = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = remaining;

    if (remaining <= 0) {
      clearInterval(timer);
      window.location.href = REDIRECT_URL;
    }
  }, 1000);

  // Cancelar cuenta regresiva si el usuario hace clic en el botón manualmente
  const btnHome = document.getElementById('btn-home');
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      clearInterval(timer);
    });
  }
})();
