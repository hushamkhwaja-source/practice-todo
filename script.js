// These two values identify our Supabase project. They are safe to be
// public — real protection comes from the Row Level Security rules we
// set up in the database, not from hiding these.
const SUPABASE_URL = 'https://aebjdwvfqhonqeatysvg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eW-iAJEjFXU2YzndfPFWtA_R6i9eRaW';

// The Supabase library (loaded via the <script> tag in index.html) gives us
// a global `supabase` object with a `.createClient()` function. We call the
// object we create from it `client`, so it doesn't clash with that global name.
const client = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Grab references to the HTML elements we need to work with.
const loading = document.getElementById('loading');
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const magicLinkForm = document.getElementById('magic-link-form');
const emailInput = document.getElementById('email-input');
const authStatus = document.getElementById('auth-status');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyMessage = document.getElementById('empty-message');

// Our list of tasks, loaded from the database once someone is logged in.
// Each task looks like: { id, user_id, text, completed, inserted_at }
let tasks = [];

// --- Auth ---

// Runs once immediately, and again every time the login state changes
// (logging in, logging out, a magic link being clicked).
client.auth.onAuthStateChange(function (event, session) {
  loading.hidden = true;

  if (session) {
    // Logged in: show the app, hide the login screen.
    authScreen.hidden = true;
    appScreen.hidden = false;
    userEmail.textContent = session.user.email;
    loadTasksFromDB();
  } else {
    // Logged out: show the login screen, hide the app.
    authScreen.hidden = false;
    appScreen.hidden = true;
    tasks = [];
  }
});

googleLoginBtn.addEventListener('click', function () {
  client.auth.signInWithOAuth({ provider: 'google' });
});

magicLinkForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const email = emailInput.value.trim();
  if (!email) {
    return;
  }

  authStatus.textContent = 'Sending...';

  const { error } = await client.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo: window.location.origin }
  });

  authStatus.textContent = error
    ? 'Something went wrong: ' + error.message
    : 'Check your email for a login link!';
});

logoutBtn.addEventListener('click', function () {
  client.auth.signOut();
});

// --- Tasks (now stored in the database instead of local storage) ---

// Fetches this user's tasks from the `todos` table and redraws the list.
// Row Level Security guarantees this only ever returns rows belonging
// to whoever is currently logged in.
async function loadTasksFromDB() {
  const { data, error } = await client
    .from('todos')
    .select('*')
    .order('inserted_at', { ascending: true });

  if (error) {
    alert('Could not load tasks: ' + error.message);
    return;
  }

  tasks = data;
  render();
}

// Run this function whenever the form is submitted (button click OR Enter key).
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the page from reloading, which forms do by default
  const text = input.value.trim(); // trim() removes extra spaces at start/end

  if (text === '') {
    return; // ignore empty submissions
  }

  input.value = ''; // clear the input box

  const { error } = await client.from('todos').insert({ text: text });

  if (error) {
    alert('Could not add task: ' + error.message);
    return;
  }

  loadTasksFromDB();
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
    span.addEventListener('click', async function () {
      const { error } = await client
        .from('todos')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) {
        alert('Could not update task: ' + error.message);
        return;
      }

      loadTasksFromDB();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×'; // an "x" symbol
    deleteBtn.addEventListener('click', async function () {
      const { error } = await client.from('todos').delete().eq('id', task.id);

      if (error) {
        alert('Could not delete task: ' + error.message);
        return;
      }

      loadTasksFromDB();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';
}
