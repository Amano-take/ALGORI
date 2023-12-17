const events = [
  'join-room',
  'color-of-wild',
  'play-card',
  'draw-card',
  'play-draw-card',
  'challenge',
  'pointed-not-say-uno',
  'special-logic',
];

const socket = io();

for (const event of events) {
  socket.on(event, function (message) {
    updateEventContent(event, message);
  });
}

function resetEvent(event) {
  updateEventContent(event, null);
}

function updateEventContent(event, message) {
  const eventContentConsole = document.getElementById(`${event}-console`);
  const eventContentElement = document.getElementById(`${event}-content`);
  eventContentConsole.classList.remove('success');
  eventContentConsole.classList.remove('error');
  if (!message) {
    eventContentElement.innerHTML = '';
    return;
  }
  const data = message.data;
  const error = message.error;
  if (data) {
    eventContentElement.innerHTML = `${JSON.stringify(data)}`;
    eventContentConsole.classList.add('success');
    return;
  }
  if (error) {
    const actualData = message.actual;
    const expectedData = message.expected;
    eventContentElement.innerHTML = `
    Error: ${error.message}

expected
${JSON.stringify(expectedData)}

actual
${JSON.stringify(actualData)}`.trim();
    eventContentConsole.classList.add('error');
  }
}
