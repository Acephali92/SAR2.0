// Wires up any "Link kopieren" button marked with data-copy-link
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
    });
  });
});
