import { state, save } from "../state.js";
import { uuid, formatDate, isOverdue, showConfirm } from "../utils.js";

export const renderTodos = (renderCallback) => {
    const filtered = (items, fields) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) =>
            fields.some((f) => i[f]?.toLowerCase().includes(q))
        );
    };

    const todos = filtered(
        state.todos.filter((t) => state.showDone || !t.done),
        ["text"]
    );
    const doneCount = state.todos.filter((t) => t.done).length;
    const isSearching = state.search.length > 0;

    return `
        ${
            !isSearching
                ? `
        <div class="card form-card">
          <div class="form-group">
            <input id="newTodo" placeholder="What needs to be done?" onkeypress="if(event.key==='Enter')window.addTodo()">
          </div>
          <div class="form-row cols-2">
            <div>
              <input id="todoDueDate" type="date" style="color-scheme: dark;">
            </div>
            <div class="priority-selector">
              <button class="priority-option high ${
                  state.newTodoPriority === "high" ? "selected" : ""
              }" onclick="state.newTodoPriority='high'; render()">High</button>
              <button class="priority-option medium ${
                  state.newTodoPriority === "medium" ? "selected" : ""
              }" onclick="state.newTodoPriority='medium'; render()">Med</button>
              <button class="priority-option low ${
                  state.newTodoPriority === "low" ? "selected" : ""
              }" onclick="state.newTodoPriority='low'; render()">Low</button>
            </div>
          </div>
          <button class="btn btn-primary" onclick="window.addTodo()">➕ Add Todo</button>
        </div>
        `
                : `<p class="search-results-info">🔍 Found ${
                      todos.length
                  } result${todos.length !== 1 ? "s" : ""}</p>`
        }

        <button class="btn ${
            state.showDone ? "btn-primary" : "btn-secondary"
        } show-done-btn" onclick="state.showDone=!state.showDone; render()">
          ${state.showDone ? "👁️ Hide" : "👁️ Show"} Done (${doneCount})
        </button>

        <div class="todos-list">
          ${todos
              .map(
                  (t) => `
            <div class="card todo-item"
                 draggable="true"
                 ondragstart="window.handleDragStart(event, '${t.id}')"
                 ondragend="window.handleDragEnd(event)"
                 ondragover="window.handleDragOver(event)"
                 ondragleave="window.handleDragLeave(event)"
                 ondrop="window.handleDrop(event, '${t.id}')">
              <div class="todo-checkbox ${
                  t.done ? "checked" : ""
              }" onclick="window.toggleTodo('${t.id}')"></div>
              <div class="todo-content">
                ${
                    state.editing[t.id]
                        ? `
                  <input value="${t.text}" id="edit-${t.id}" onkeypress="if(event.key==='Enter')window.saveEdit('${t.id}')" style="margin-bottom: 8px;">
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" onclick="window.saveEdit('${t.id}')">Save</button>
                    <button class="btn btn-secondary" onclick="delete state.editing['${t.id}']; render()">Cancel</button>
                  </div>
                `
                        : `
                  <div class="todo-text ${t.done ? "done" : ""}">${t.text}</div>
                  <div class="todo-meta">
                    ${
                        t.priority
                            ? `<span class="todo-badge priority-${
                                  t.priority
                              }">${t.priority.toUpperCase()}</span>`
                            : ""
                    }
                    ${
                        t.dueDate
                            ? `<span class="todo-badge ${
                                  isOverdue(t.dueDate) && !t.done
                                      ? "overdue"
                                      : "due-date"
                              }">📅 ${formatDate(t.dueDate)}</span>`
                            : ""
                    }
                  </div>
                `
                }
              </div>
              <div class="todo-actions">
                <button class="btn-icon" onclick="state.editing['${
                    t.id
                }']=true; render()" title="Edit">✏️</button>
                <button class="btn-icon danger" onclick="window.confirmDeleteTodo('${
                    t.id
                }')" title="Delete">🗑️</button>
              </div>
            </div>
          `
              )
              .join("")}
        </div>
    `;
};

export const setupTodoActions = (render) => {
    window.addTodo = () => {
        const text = document.getElementById("newTodo").value.trim();
        if (!text) return;
        const dueDate = document.getElementById("todoDueDate").value;
        state.todos.unshift({
            id: uuid(),
            text,
            done: false,
            priority: state.newTodoPriority,
            dueDate: dueDate || null,
            updatedAt: new Date().toISOString(),
        });
        save(render);
    };

    window.toggleTodo = (id) => {
        const todo = state.todos.find((t) => t.id === id);
        todo.done = !todo.done;
        todo.updatedAt = new Date().toISOString();
        save(render);
    };

    window.saveEdit = (id) => {
        const input = document.getElementById(`edit-${id}`);
        const todoIndex = state.todos.findIndex((t) => t.id === id);
        if (todoIndex === -1) return;

        const todo = state.todos[todoIndex];
        todo.text = input.value;
        todo.updatedAt = new Date().toISOString();

        // Move to top (Newest First)
        state.todos.splice(todoIndex, 1);
        state.todos.unshift(todo);

        delete state.editing[id];
        save(render);
    };

    window.confirmDeleteTodo = (id) => {
        showConfirm("Are you sure you want to delete this todo?", () => {
            state.todos = state.todos.filter((t) => t.id !== id);
            save(render);
        });
    };

    // Drag and Drop handlers
    let draggedItem = null;

    window.handleDragStart = (e, id) => {
        draggedItem = id;
        e.target.classList.add("dragging");
    };

    window.handleDragEnd = (e) => {
        e.target.classList.remove("dragging");
        document
            .querySelectorAll(".card")
            .forEach((c) => c.classList.remove("drag-over"));
    };

    window.handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("drag-over");
    };

    window.handleDragLeave = (e) => {
        e.currentTarget.classList.remove("drag-over");
    };

    window.handleDrop = (e, targetId) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");

        if (draggedItem && draggedItem !== targetId) {
            const items = state.todos;
            const dragIdx = items.findIndex((i) => i.id === draggedItem);
            const targetIdx = items.findIndex((i) => i.id === targetId);

            const [removed] = items.splice(dragIdx, 1);
            items.splice(targetIdx, 0, removed);

            save(render);
        }
        draggedItem = null;
    };
};
