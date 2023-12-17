const baseUrl = `${window.location.origin}/api/v1/test-tool`;
const currentUrl = `${window.location.origin}${window.location.pathname}`;

function startTestStep(url) {
  window.location.href = `${baseUrl}/${url}${window.location.search}`;
}

function changeLanguage(obj) {
  const idx = obj.selectedIndex;
  const value = obj.options[idx].value;
  window.location.href = `${currentUrl}?lang=${value}`;
}
