// Grab references to the HTML elements we need to work with.
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyMessage = document.getElementById('empty-message');

// Our list of tasks lives in memory as an array (a numbered list) of objects.
// Each task object looks like: { id: 123, text: "Buy milk", completed: false }
let tasks = loadTasks();

// Draw the tasks currently in memory onto the page.
render();

// Run this function whenever the form is submitted (button click OR Enter key).
form.addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading, which forms do by default
  const text = input.value.trim(); // trim() removes extra spaces at start/end

  if (text === '') {
    return; // ignore empty submissions
  }

  tasks.push({
    id: Date.now(), // a quick way to get a unique number (current time in milliseconds)
    text: text,
    completed: false
  });

  input.value = ''; // clear the input box
  saveTasks();
  render();
});

// Rebuilds the visible <li> list to match the `tasks` array.
function render() {
  list.innerHTML = ''; // clear out everything currently shown

  tasks.forEach(function (task) {
    const li = document.createElement('li');
    if (task.completed) {
      li.classList.add('completed');
    }

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;
    span.addEventListener('click', function () {
      task.completed = !task.completed; // flip true/false
      saveTasks();
      render();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×'; // an "x" symbol
    deleteBtn.addEventListener('click', function () {
      tasks = tasks.filter(function (t) {
        return t.id !== task.id; // keep every task except this one
      });
      saveTasks();
      render();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';
}

// Saves the tasks array into the browser's local storage as text.
function saveTasks() {
  localStorage.setItem('todo-tasks', JSON.stringify(tasks));
}

// Loads tasks from local storage when the page first opens.
function loadTasks() {
  const saved = localStorage.getItem('todo-tasks');
  return saved ? JSON.parse(saved) : [];
}
