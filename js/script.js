// Select elements
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const filterBtns = document.querySelectorAll(".filter-btn");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Save tasks
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

// Render tasks
function renderTasks(filter = "all") {
  taskList.innerHTML = "";

  const filteredTasks = tasks.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    li.innerHTML = `
      <div class="left">
        <input type="checkbox" class="task-checkbox" data-index="${index}" ${task.completed ? "checked" : ""}>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <input class="task-edit-input" style="display:none" />
      </div>
      <div class="actions">
        <button class="edit-btn" data-index="${index}" aria-label="Edit"><i class="fa fa-pen"></i></button>
        <button class="delete-btn" data-index="${index}" aria-label="Delete"><i class="fa fa-trash"></i></button>
      </div>
    `;

    taskList.appendChild(li);
  });

  updateCount();
}

// Update remaining task count
function updateCount() {
  const remaining = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} left`;
}

// Add new task (click or Enter)
function addTask() {
  const text = taskInput.value.trim();
  if (text === "") return;

  tasks.push({ text, completed: false });
  taskInput.value = "";
  saveTasks();
  renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// Event delegation for task list
taskList.addEventListener('click', (e) => {
  const checkbox = e.target.closest('.task-checkbox');
  const deleteBtn = e.target.closest('.delete-btn');
  const editBtn = e.target.closest('.edit-btn');

  if (checkbox) {
    const idx = Number(checkbox.dataset.index);
    tasks[idx].completed = checkbox.checked;
    saveTasks();
    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
    return;
  }

  if (deleteBtn) {
    const idx = Number(deleteBtn.dataset.index);
    if (confirm('Delete this task?')) {
      tasks.splice(idx, 1);
      saveTasks();
      renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
    }
    return;
  }

  if (editBtn) {
    const idx = Number(editBtn.dataset.index);
    startEditing(idx);
    return;
  }
});

// Double-click to edit
taskList.addEventListener('dblclick', (e) => {
  const span = e.target.closest('.task-text');
  if (!span) return;
  const li = span.closest('li');
  const idx = Array.from(taskList.children).indexOf(li);
  startEditing(idx);
});

function startEditing(index) {
  const li = taskList.children[index];
  if (!li) return;
  const span = li.querySelector('.task-text');
  const input = li.querySelector('.task-edit-input');
  span.style.display = 'none';
  input.style.display = '';
  input.value = tasks[index].text;
  input.focus();

  function finish(save) {
    if (save) {
      const newText = input.value.trim();
      if (newText !== '') tasks[index].text = newText;
      saveTasks();
    }
    input.removeEventListener('blur', onBlur);
    input.removeEventListener('keydown', onKeydown);
    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
  }

  function onBlur() { finish(true); }
  function onKeydown(e) {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  }

  input.addEventListener('blur', onBlur);
  input.addEventListener('keydown', onKeydown);
}

// Filters
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filter-btn.active").classList.remove("active");
    btn.classList.add("active");
    renderTasks(btn.dataset.filter);
  });
});

// Clear completed
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
});

// Initialize
renderTasks();
