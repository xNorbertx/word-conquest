// Isolated visual preview: no authentication, requests, storage or credential persistence.
const toast = document.querySelector('.toast');
let timer;
function announce(message) {
  clearTimeout(timer);
  toast.textContent = message;
  toast.hidden = false;
  timer = setTimeout(() => { toast.hidden = true; }, 2800);
}
document.querySelectorAll('.reveal').forEach(button => button.addEventListener('click', () => {
  const input = button.parentElement.querySelector('input');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(show));
}));
document.querySelectorAll('.auth-form').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  form.querySelector('.password-input').value = '';
  announce('Design preview · sign-in is disabled');
}));
document.querySelectorAll('[data-preview-action]').forEach(button => button.addEventListener('click', () => {
  announce('Design preview · ' + button.dataset.previewAction);
}));
document.querySelectorAll('input').forEach(input => input.addEventListener('focus', () => {
  if (window.visualViewport && window.visualViewport.height < 480) input.scrollIntoView({ block: 'center', behavior: 'auto' });
}));
