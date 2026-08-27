const TEL = '+14402419287';
const form = document.getElementById('quoteForm');
const statusEl = document.getElementById('formStatus');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const body = [
      'New window cleaning quote request',
      'Name: ' + data.name,
      'Phone: ' + data.phone,
      'City/zip: ' + data.city,
      'Job: ' + data.job,
      'Windows: ' + (data.count || 'not sure'),
      'Notes: ' + (data.notes || 'none')
    ].join('\n');
    window.location.href = 'sms:' + TEL + '?&body=' + encodeURIComponent(body);
    statusEl.textContent = 'Opening your messages app…';
  });
}
const chat = document.getElementById('chat');
const log = document.getElementById('chatLog');
document.getElementById('chatOpen').onclick = () => {
  chat.hidden = false;
  if (!log.dataset.ready) {
    bot('Hey — I\u2019m the quote helper for Matt Stout Window Cleaning. Ask about pricing, areas, screens, or how to book. For a real number, call or text (440) 241-9287.');
    log.dataset.ready = '1';
  }
};
document.getElementById('chatClose').onclick = () => { chat.hidden = true; };
document.getElementById('chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const q = input.value.trim();
  if (!q) return;
  you(q);
  input.value = '';
  bot(answer(q));
});
function you(text) {
  const el = document.createElement('div');
  el.className = 'bubble you';
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}
function bot(text) {
  const el = document.createElement('div');
  el.className = 'bubble bot';
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}
function answer(q) {
  const s = q.toLowerCase();
  if (/(price|cost|how much|rate|quote)/.test(s)) {
    return 'Most homes land between a small-house exterior and a full inside/out with screens. Matt prices by pane count, stories, and how dirty the glass is. Text photos + city to (440) 241-9287 and he will send a range the same day.';
  }
  if (/(area|city|cleveland|parma|lakewood|westlake|height|avon|serve|travel)/.test(s)) {
    return 'Greater Cleveland and the 440 suburbs — Lakewood, Westlake, Rocky River, Parma, Strongsville, Cleveland Heights, Shaker, Solon, Avon, and nearby. If you are a stretch, still text the zip.';
  }
  if (/(screen|track|sill|gutter)/.test(s)) {
    return 'Yes. Screens come off and get rinsed, tracks get brushed, sills wiped. Gutters are an add-on. Tell Matt if you want those on the same visit.';
  }
  if (/(book|schedule|appoint|when|today|tomorrow)/.test(s)) {
    return 'Call or text (440) 241-9287. Same-week is common outside peak spring. Use the form and it drafts a text with your details.';
  }
  if (/(insured|license|bonded|ladder|safe)/.test(s)) {
    return 'Insured. High glass is done from the ground with a pole when that is the safer move.';
  }
  return 'Matt handles interior, exterior, screens, tracks, and gutters around Greater Cleveland. Call or text (440) 241-9287. What city are you in?';
}
