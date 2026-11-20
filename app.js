// app.js - Life Dashboard
// All JavaScript in a single file, organized by module section.

// ============================================================
// STORAGE KEYS
// ============================================================
var KEYS = {
  theme:    'dashboard_theme',
  name:     'dashboard_name',
  timerDur: 'dashboard_timer_duration',
  todos:    'dashboard_todos',
  links:    'dashboard_links'
};

// ============================================================
// STORAGE HELPERS
// ============================================================
function storageGet(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val);
  } catch(e) { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

// ============================================================
// MODULE: THEME (Light / Dark mode)
// ============================================================
function themeInit() {
  var saved = storageGet(KEYS.theme, 'light');
  applyTheme(saved);
  document.getElementById('theme-toggle').addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storageSet(KEYS.theme, next);
  });
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'sun' : 'moon';
}

// ============================================================
// MODULE: GREETING (Clock, Date, Greeting, Custom Name)
// ============================================================
function greetingInit() {
  updateGreeting();
  setInterval(updateGreeting, 1000);

  var nameInput   = document.getElementById('name-input');
  var nameSaveBtn = document.getElementById('name-save-btn');
  var nameEditBtn = document.getElementById('name-edit-btn');
  var nameDisplay = document.getElementById('name-display');
  var nameForm    = document.getElementById('name-form');

  var saved = storageGet(KEYS.name, '');
  if (saved) {
    nameDisplay.textContent = 'Hi, ' + saved + '!';
    nameDisplay.classList.remove('hidden');
    nameForm.classList.add('hidden');
    nameEditBtn.classList.remove('hidden');
  }

  nameSaveBtn.addEventListener('click', function() {
    var n = nameInput.value.trim();
    storageSet(KEYS.name, n);
    if (n) {
      nameDisplay.textContent = 'Hi, ' + n + '!';
      nameDisplay.classList.remove('hidden');
      nameForm.classList.add('hidden');
      nameEditBtn.classList.remove('hidden');
    }
    updateGreeting();
  });

  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') nameSaveBtn.click();
  });

  nameEditBtn.addEventListener('click', function() {
    var currentName = storageGet(KEYS.name, '');
    nameInput.value = currentName;
    nameForm.classList.remove('hidden');
    nameDisplay.classList.add('hidden');
    nameEditBtn.classList.add('hidden');
    nameInput.focus();
  });
}

function updateGreeting() {
  var now  = new Date();
  var h    = now.getHours();
  var name = storageGet(KEYS.name, '');

  var greet;
  if (h >= 5  && h < 12) greet = 'Good morning';
  else if (h >= 12 && h < 18) greet = 'Good afternoon';
  else if (h >= 18 && h < 22) greet = 'Good evening';
  else greet = 'Good night';

  if (name) greet += ', ' + name + '!';
  else       greet += '!';

  document.getElementById('greeting-text').textContent = greet;

  var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  document.getElementById('date-text').textContent =
    days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

  var hh = String(now.getHours()).padStart(2,'0');
  var mm = String(now.getMinutes()).padStart(2,'0');
  var ss = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('clock-text').textContent = hh + ':' + mm + ':' + ss;
}

// ============================================================
// MODULE: FOCUS TIMER
// ============================================================
var timerState = {
  intervalId:  null,
  remaining:   25 * 60,
  duration:    25 * 60,
  running:     false
};

function timerInit() {
  var savedMin = storageGet(KEYS.timerDur, 25);
  timerState.duration  = savedMin * 60;
  timerState.remaining = timerState.duration;
  document.getElementById('timer-duration-input').value = savedMin;
  timerRender();

  document.getElementById('timer-start-btn').addEventListener('click', timerStart);
  document.getElementById('timer-pause-btn').addEventListener('click', timerPause);
  document.getElementById('timer-reset-btn').addEventListener('click', timerReset);
  document.getElementById('timer-set-btn').addEventListener('click', timerSetDuration);
  document.getElementById('timer-duration-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') timerSetDuration();
  });
}

function timerStart() {
  if (timerState.running) return;
  if (timerState.remaining <= 0) timerReset();
  timerState.running = true;
  document.getElementById('timer-display').classList.add('running');
  document.getElementById('timer-alert').classList.add('hidden');
  document.getElementById('timer-start-btn').disabled = true;
  document.getElementById('timer-pause-btn').disabled = false;
  timerState.intervalId = setInterval(timerTick, 1000);
}

function timerPause() {
  if (!timerState.running) return;
  timerState.running = false;
  document.getElementById('timer-display').classList.remove('running');
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  document.getElementById('timer-start-btn').disabled = false;
  document.getElementById('timer-pause-btn').disabled = true;
}

function timerReset() {
  timerPause();
  timerState.remaining = timerState.duration;
  document.getElementById('timer-alert').classList.add('hidden');
  document.getElementById('timer-start-btn').disabled = false;
  document.getElementById('timer-pause-btn').disabled = true;
  timerRender();
}

function timerTick() {
  timerState.remaining--;
  if (timerState.remaining <= 0) {
    timerState.remaining = 0;
    timerRender();
    timerPause();
    timerAlert();
  } else {
    timerRender();
  }
}

function timerRender() {
  var m = Math.floor(timerState.remaining / 60);
  var s = timerState.remaining % 60;
  document.getElementById('timer-display').textContent =
    String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function timerAlert() {
  document.getElementById('timer-alert').classList.remove('hidden');
  // Web Audio beep
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch(e) {}
}

function timerSetDuration() {
  var val = parseInt(document.getElementById('timer-duration-input').value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 120) val = 120;
  document.getElementById('timer-duration-input').value = val;
  timerState.duration  = val * 60;
  timerState.remaining = timerState.duration;
  storageSet(KEYS.timerDur, val);
  timerReset();
}

// ============================================================
// MODULE: TO-DO LIST
// ============================================================
var todos = [];

function todoInit() {
  todos = storageGet(KEYS.todos, []);
  todoRender();

  document.getElementById('todo-add-btn').addEventListener('click', todoAdd);
  document.getElementById('todo-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') todoAdd();
  });
  document.getElementById('sort-select').addEventListener('change', todoRender);
}

function todoAdd() {
  var input = document.getElementById('todo-input');
  var text  = input.value.trim();
  var errorEl = document.getElementById('todo-error');

  if (!text) {
    todoShowError('Please enter a task.');
    return;
  }

  // Challenge: Prevent duplicate tasks (case-insensitive)
  var isDuplicate = todos.some(function(t) {
    return t.text.toLowerCase() === text.toLowerCase();
  });
  if (isDuplicate) {
    todoShowError('That task already exists!');
    return;
  }

  errorEl.classList.add('hidden');
  todos.push({ id: Date.now(), text: text, done: false, addedAt: Date.now() });
  storageSet(KEYS.todos, todos);
  input.value = '';
  todoRender();
}

function todoShowError(msg) {
  var el = document.getElementById('todo-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(function() { el.classList.add('hidden'); }, 3000);
}

function todoGetSorted() {
  var sort = document.getElementById('sort-select').value;
  var copy = todos.slice();
  if (sort === 'name') {
    copy.sort(function(a, b) { return a.text.localeCompare(b.text); });
  } else if (sort === 'status') {
    copy.sort(function(a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
  }
  // 'added' keeps original insertion order (already stable)
  return copy;
}

function todoRender() {
  var list    = document.getElementById('todo-list');
  var emptyEl = document.getElementById('todo-empty');
  list.innerHTML = '';

  if (todos.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  var sorted = todoGetSorted();
  sorted.forEach(function(todo) {
    var li = document.createElement('li');
    li.className = 'todo-item';
    li.setAttribute('data-id', todo.id);

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked = todo.done;
    cb.setAttribute('aria-label', 'Mark done');
    cb.addEventListener('change', function() { todoToggle(todo.id); });

    var span = document.createElement('span');
    span.className = 'todo-text' + (todo.done ? ' done' : '');
    span.textContent = todo.text;

    var actions = document.createElement('div');
    actions.className = 'todo-actions';

    var editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-small';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function() { todoStartEdit(todo.id, li, span, editBtn); });

    var delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-small';
    delBtn.textContent = 'Del';
    delBtn.addEventListener('click', function() { todoDelete(todo.id); });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

function todoToggle(id) {
  todos = todos.map(function(t) {
    return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
  });
  storageSet(KEYS.todos, todos);
  todoRender();
}

function todoDelete(id) {
  todos = todos.filter(function(t) { return t.id !== id; });
  storageSet(KEYS.todos, todos);
  todoRender();
}

function todoStartEdit(id, li, span, editBtn) {
  var todo = todos.find(function(t) { return t.id === id; });
  if (!todo) return;

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = todo.text;

  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-small';
  saveBtn.textContent = 'Save';

  function commitEdit() {
    var newText = input.value.trim();
    if (!newText) return;
    // Prevent duplicate on edit (ignore self)
    var isDup = todos.some(function(t) {
      return t.id !== id && t.text.toLowerCase() === newText.toLowerCase();
    });
    if (isDup) {
      todoShowError('A task with that name already exists!');
      return;
    }
    todos = todos.map(function(t) {
      return t.id === id ? Object.assign({}, t, { text: newText }) : t;
    });
    storageSet(KEYS.todos, todos);
    todoRender();
  }

  saveBtn.addEventListener('click', commitEdit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') todoRender();
  });

  li.replaceChild(input, span);
  editBtn.replaceWith(saveBtn);
  input.focus();
}

// ============================================================
// MODULE: QUICK LINKS
// ============================================================
var links = [];

var DEFAULT_LINKS = [
  { id: 1, name: 'Google',    url: 'https://www.google.com' },
  { id: 2, name: 'GitHub',    url: 'https://www.github.com' },
  { id: 3, name: 'YouTube',   url: 'https://www.youtube.com' },
  { id: 4, name: 'Gmail',     url: 'https://mail.google.com' },
  { id: 5, name: 'Wikipedia', url: 'https://www.wikipedia.org' }
];

function linksInit() {
  links = storageGet(KEYS.links, null);
  if (links === null) {
    links = DEFAULT_LINKS;
    storageSet(KEYS.links, links);
  }
  linksRender();

  document.getElementById('link-add-btn').addEventListener('click', linkAdd);
  document.getElementById('link-url-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') linkAdd();
  });
  document.getElementById('link-name-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') linkAdd();
  });
}

function linkAdd() {
  var nameInput = document.getElementById('link-name-input');
  var urlInput  = document.getElementById('link-url-input');
  var errorEl   = document.getElementById('link-error');
  var name = nameInput.value.trim();
  var url  = urlInput.value.trim();

  if (!name || !url) {
    linkShowError('Please enter both a name and a URL.');
    return;
  }

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // Validate URL format
  try { new URL(url); } catch(e) {
    linkShowError('Please enter a valid URL.');
    return;
  }

  errorEl.classList.add('hidden');
  links.push({ id: Date.now(), name: name, url: url });
  storageSet(KEYS.links, links);
  nameInput.value = '';
  urlInput.value  = '';
  linksRender();
}

function linkShowError(msg) {
  var el = document.getElementById('link-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(function() { el.classList.add('hidden'); }, 3000);
}

function linkDelete(id) {
  links = links.filter(function(l) { return l.id !== id; });
  storageSet(KEYS.links, links);
  linksRender();
}

function linksRender() {
  var container = document.getElementById('links-container');
  var emptyEl   = document.getElementById('links-empty');
  container.innerHTML = '';

  if (links.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  links.forEach(function(link) {
    var card = document.createElement('div');
    card.className = 'link-card';

    var a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name;

    var delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-small';
    delBtn.textContent = 'x';
    delBtn.setAttribute('aria-label', 'Delete ' + link.name);
    delBtn.addEventListener('click', function() { linkDelete(link.id); });

    card.appendChild(a);
    card.appendChild(delBtn);
    container.appendChild(card);
  });
}

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  themeInit();
  greetingInit();
  timerInit();
  todoInit();
  linksInit();
});