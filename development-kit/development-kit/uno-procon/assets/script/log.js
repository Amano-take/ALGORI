const parentLogData = document.getElementById('detail-log-inner-content');
parentLogData.addEventListener('click', (e) => {
  e.stopPropagation();
});

const closeModal = (e) => {
  if (e.keyCode === 27) {
    hideDetailLog();
  }
};

function showDetailLog(log) {
  const bodyElement = document.getElementsByTagName('body');
  bodyElement[0].classList.add('no-scroll');

  const detailLogElement = document.getElementById('detail-log');
  detailLogElement.style.display = 'flex';

  const logDataElement = document.getElementById('log-data');
  logDataElement.innerHTML = JSON.stringify(log, null, '\t').replace(/\\/g, '');

  document.addEventListener('keydown', closeModal);
}

function hideDetailLog() {
  const bodyElement = document.getElementsByTagName('body');
  bodyElement[0].classList.remove('no-scroll');

  const detailLogElement = document.getElementById('detail-log');
  detailLogElement.style.display = 'none';

  document.removeEventListener('keydown', closeModal);
}
