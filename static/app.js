// DOM Elements
const todoInput = document.getElementById("new-todo");
const addTodoButton = document.getElementById("add-todo");
const todoList = document.getElementById("todo-list");
const itemsLeftSpan = document.getElementById("items-left");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// API URL
const API_URL = "/api/todos";

// Current filter
let currentFilter = "all";

// Fetch all todos from the API
async function fetchTodos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch todos");
    }
    const todos = await response.json();
    renderTodos(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
}

// Create a new todo
async function createTodo(title) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to create todo");
    }

    const newTodo = await response.json();
    return newTodo;
  } catch (error) {
    console.error("Error creating todo:", error);
    return null;
  }
}

// Update a todo
async function updateTodo(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update todo");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating todo:", error);
    return null;
  }
}

// Delete a todo
async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete todo");
    }

    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    return false;
  }
}

// Render todos based on the current filter
function renderTodos(todos) {
  // Filter todos based on the current filter
  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true; // 'all' filter
  });

  // Clear the todo list
  todoList.innerHTML = "";

  // If there are no todos to display
  if (filteredTodos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-list";
    emptyMessage.textContent = "No tasks to display";
    todoList.appendChild(emptyMessage);
  } else {
    // Render each todo
    filteredTodos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item ${todo.completed ? "completed" : ""}`;
      li.dataset.id = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;

      const todoText = document.createElement("span");
      todoText.className = "todo-text";
      todoText.textContent = todo.title;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.innerHTML = "&times;";

      li.appendChild(checkbox);
      li.appendChild(todoText);
      li.appendChild(deleteButton);

      todoList.appendChild(li);

      // Add event listeners
      checkbox.addEventListener("change", async () => {
        const updated = await updateTodo(todo.id, {
          completed: checkbox.checked,
        });
        if (updated) {
          li.classList.toggle("completed", checkbox.checked);
          updateItemsLeft(todos);
        }
      });

      deleteButton.addEventListener("click", async () => {
        const deleted = await deleteTodo(todo.id);
        if (deleted) {
          // Remove from the UI
          li.remove();
          // Remove from the todos array
          const index = todos.findIndex((t) => t.id === todo.id);
          if (index !== -1) {
            todos.splice(index, 1);
            updateItemsLeft(todos);
          }
        }
      });
    });
  }

  // Update items left count
  updateItemsLeft(todos);
}

// Update the items left counter
function updateItemsLeft(todos) {
  const activeCount = todos.filter((todo) => !todo.completed).length;
  itemsLeftSpan.textContent = `${activeCount} item${
    activeCount !== 1 ? "s" : ""
  } left`;
}

// Add a new todo
async function addNewTodo() {
  const title = todoInput.value.trim();
  if (!title) return;

  const newTodo = await createTodo(title);
  if (newTodo) {
    todoInput.value = "";
    await fetchTodos();
  }
}

// Initialize the app
async function init() {
  // Fetch initial todos
  await fetchTodos();

  // Add event listener for adding new todos
  addTodoButton.addEventListener("click", addNewTodo);
  todoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addNewTodo();
    }
  });

  // Add event listener for clearing completed todos
  clearCompletedButton.addEventListener("click", async () => {
    const response = await fetch(API_URL);
    if (!response.ok) return;

    const todos = await response.json();
    const completedTodos = todos.filter((todo) => todo.completed);

    // Delete all completed todos
    for (const todo of completedTodos) {
      await deleteTodo(todo.id);
    }

    // Refresh the todo list
    await fetchTodos();
  });

  // Add event listeners for filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active filter
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;

      // Re-fetch and render todos with the new filter
      fetchTodos();
    });
  });
}

// Start the app
init();
