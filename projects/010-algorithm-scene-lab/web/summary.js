const overviewImage = document.getElementById('overview-map');
const zoomButtons = [...document.querySelectorAll('[data-zoom]')];
for (const button of zoomButtons) {
  button.addEventListener('click', () => {
    const zoom = button.dataset.zoom;
    overviewImage.style.width = zoom === 'fit' ? '100%' : `${2400 * Number(zoom)}px`;
    for (const other of zoomButtons) other.setAttribute('aria-pressed', String(other === button));
  });
}
