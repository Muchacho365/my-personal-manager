import { state, save } from "../state.js";
import {
    uuid,
    formatDate,
    isOverdue,
    showConfirm,
    showToast,
} from "../utils.js";

export const renderTodos = (renderCallback) => {
    const subTab = state.todoSubTab || "tasks";

    const renderSubTabs = () => `
        <div class="sub-tabs">
            <button class="sub-tab ${
                subTab === "tasks" ? "active" : ""
            }" onclick="state.todoSubTab='tasks'; render()">Board</button>
            <button class="sub-tab ${
                subTab === "schedule" ? "active" : ""
            }" onclick="state.todoSubTab='schedule'; render()">Schedule</button>
            <button class="sub-tab ${
                subTab === "reminders" ? "active" : ""
            }" onclick="state.todoSubTab='reminders'; render()">Reminders</button>
        </div>
    `;

    let content = "";
    if (subTab === "tasks") {
        content = renderKanbanBoard(renderCallback);
    } else if (subTab === "schedule") {
        content = renderSchedule(renderCallback);
    } else if (subTab === "reminders") {
        content = renderReminders(renderCallback);
    }

    return `
        ${renderSubTabs()}
        ${content}
    `;
};

// --- Kanban Board ---
const renderKanbanBoard = (renderCallback) => {
    // Filter todos
    const filtered = (items) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) => i.text.toLowerCase().includes(q));
    };

    const allTodos = filtered(state.todos);

    // Group by status
    // Migration: if no status, use 'done' property
    const todoItems = allTodos.filter(
        (t) => t.status === "todo" || (!t.status && !t.done)
    );
    const inProgressItems = allTodos.filter((t) => t.status === "in-progress");
    const doneItems = allTodos.filter(
        (t) => t.status === "done" || (!t.status && t.done)
    );

    const renderColumn = (title, items, statusId, colorClass) => `
        <div class="kanban-column" 
             ondragover="window.handleDragOver(event)" 
             ondrop="window.handleDropColumn(event, '${statusId}')">
            <div class="kanban-header ${colorClass}">
                <h3>${title}</h3>
                <span class="count">${items.length}</span>
            </div>
            <div class="kanban-items">
                ${items.map((t) => renderKanbanCard(t)).join("")}
                ${
                    statusId === "todo"
                        ? `
                    <div class="add-card-btn" onclick="window.showAddTodoModal()">
                        + Add Card
                    </div>
                `
                        : ""
                }
            </div>
        </div>
    `;

    return `
        <div class="kanban-board">
            ${renderColumn("To Do", todoItems, "todo", "header-todo")}
            ${renderColumn(
                "In Progress",
                inProgressItems,
                "in-progress",
                "header-progress"
            )}
            ${renderColumn("Done", doneItems, "done", "header-done")}
        </div>

        <!-- Add Todo Modal (Hidden by default) -->
        <div id="addTodoModal" class="modal-overlay" style="display: none;" onclick="if(event.target===this) window.closeAddTodoModal()">
            <div class="modal">
                <div class="modal-header">
                    <h2>Add Card</h2>
                    <button class="btn-icon" onclick="window.closeAddTodoModal()">✕</button>
                </div>
                <div class="form-group">
                    <textarea id="newTodoText" placeholder="What needs to be done?" rows="3" autofocus></textarea>
                </div>
                <div class="form-row cols-2">
                    <input id="newTodoDate" type="date" style="color-scheme: dark;">
                    <select id="newTodoPriority">
                        <option value="low">Low Priority</option>
                        <option value="medium" selected>Medium Priority</option>
                        <option value="high">High Priority</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="window.addTodoFromModal()">Add Card</button>
            </div>
        </div>
    `;
};

const renderKanbanCard = (t) => `
    <div class="card kanban-card"
         draggable="true"
         ondragstart="window.handleDragStart(event, '${t.id}')">
        <div class="kanban-card-content">
            ${
                state.editing[t.id]
                    ? `
                <textarea id="edit-${t.id}" onblur="window.saveEdit('${t.id}')">${t.text}</textarea>
            `
                    : `
                <div class="kanban-text" onclick="state.editing['${t.id}']=true; render()">${t.text}</div>
            `
            }
        </div>
        <div class="kanban-meta">
            ${
                t.priority
                    ? `<span class="todo-badge priority-${t.priority}">${t.priority}</span>`
                    : ""
            }
            ${
                t.dueDate
                    ? `<span class="todo-badge ${
                          isOverdue(t.dueDate) && t.status !== "done"
                              ? "overdue"
                              : "due-date"
                      }">${formatDate(t.dueDate)}</span>`
                    : ""
            }
            <button class="btn-icon danger small" onclick="window.confirmDeleteTodo('${
                t.id
            }')" title="Delete">×</button>
        </div>
    </div>
`;

// --- Schedule & Reminders (Keep existing) ---
const renderSchedule = (renderCallback) => {
    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];
    const schedule = state.schedule || [];

    return `
        <div class="card form-card">
            <h2>📅 Add to Schedule</h2>
            <div class="form-row cols-2">
                <input id="schedTitle" placeholder="Class / Activity">
                <select id="schedDay" style="padding: 12px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 8px;">
                    ${days
                        .map((d) => `<option value="${d}">${d}</option>`)
                        .join("")}
                </select>
            </div>
            <div class="form-row cols-2">
                <input id="schedTime" type="time" style="color-scheme: dark;">
                <button class="btn btn-primary" onclick="window.addSchedule()">➕ Add</button>
            </div>
        </div>

        <div class="schedule-grid">
            ${days
                .map((day) => {
                    const dayItems = schedule
                        .filter((s) => s.day === day)
                        .sort((a, b) => a.time.localeCompare(b.time));
                    return `
                    <div class="card schedule-day">
                        <h3>${day}</h3>
                        ${
                            dayItems.length
                                ? dayItems
                                      .map(
                                          (item) => `
                            <div class="schedule-item">
                                <span class="time">${item.time}</span>
                                <span class="title">${item.title}</span>
                                <button class="btn-icon danger small" onclick="window.deleteSchedule('${item.id}')">×</button>
                            </div>
                        `
                                      )
                                      .join("")
                                : `<div style="color: #64748b; font-size: 0.9rem;">No items</div>`
                        }
                    </div>
                `;
                })
                .join("")}
        </div>
    `;
};

const renderReminders = (renderCallback) => {
    const reminders = state.reminders || [];

    return `
        <div class="card form-card">
            <h2>⏰ Add Reminder</h2>
            <div class="form-row cols-2">
                <input id="remText" placeholder="Remind me to...">
                <input id="remTime" type="datetime-local" style="color-scheme: dark;">
            </div>
            <button class="btn btn-primary" onclick="window.addReminder()">➕ Set Reminder</button>
        </div>

        <div class="reminders-list">
            ${reminders
                .map(
                    (r) => `
                <div class="card reminder-item">
                    <div class="reminder-content">
                        <div class="reminder-text">${r.text}</div>
                        <div class="reminder-time">📅 ${new Date(
                            r.time
                        ).toLocaleString()}</div>
                    </div>
                    <button class="btn-icon danger" onclick="window.deleteReminder('${
                        r.id
                    }')">🗑️</button>
                </div>
            `
                )
                .join("")}
            ${
                !reminders.length
                    ? `<p style="text-align: center; color: #64748b;">No active reminders</p>`
                    : ""
            }
        </div>
    `;
};

export const setupTodoActions = (render) => {
    // --- Kanban Actions ---
    window.showAddTodoModal = () => {
        document.getElementById("addTodoModal").style.display = "flex";
        setTimeout(() => document.getElementById("newTodoText").focus(), 50);
    };

    window.closeAddTodoModal = () => {
        document.getElementById("addTodoModal").style.display = "none";
    };

    window.addTodoFromModal = () => {
        const text = document.getElementById("newTodoText").value.trim();
        if (!text) return;

        state.todos.unshift({
            id: uuid(),
            text,
            status: "todo", // Default status
            done: false,
            priority: document.getElementById("newTodoPriority").value,
            dueDate: document.getElementById("newTodoDate").value || null,
            updatedAt: new Date().toISOString(),
        });

        save(render);
        window.closeAddTodoModal();
    };

    window.saveEdit = (id) => {
        const input = document.getElementById(`edit-${id}`);
        const todo = state.todos.find((t) => t.id === id);
        if (todo && input) {
            todo.text = input.value;
            todo.updatedAt = new Date().toISOString();
            delete state.editing[id];
            save(render);
        }
    };

    window.confirmDeleteTodo = (id) => {
        showConfirm("Delete this card?", () => {
            state.todos = state.todos.filter((t) => t.id !== id);
            save(render);
        });
    };

    // Drag and Drop (Kanban)
    let draggedId = null;

    window.handleDragStart = (e, id) => {
        draggedId = id;
        e.dataTransfer.effectAllowed = "move";
        e.target.style.opacity = "0.5";
    };

    window.handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    window.handleDropColumn = (e, status) => {
        e.preventDefault();
        if (draggedId) {
            const todo = state.todos.find((t) => t.id === draggedId);
            if (todo) {
                todo.status = status;
                todo.done = status === "done"; // Sync legacy done status
                todo.updatedAt = new Date().toISOString();
                save(render);
            }
        }
        draggedId = null;
    };

    // --- Schedule & Reminders Actions (Keep existing) ---
    window.addSchedule = () => {
        const title = document.getElementById("schedTitle").value;
        const day = document.getElementById("schedDay").value;
        const time = document.getElementById("schedTime").value;
        if (!title || !time) {
            showToast("Title and time required!");
            return;
        }
        state.schedule.push({ id: uuid(), title, day, time });
        save(render);
    };

    window.deleteSchedule = (id) => {
        state.schedule = state.schedule.filter((s) => s.id !== id);
        save(render);
    };

    window.addReminder = () => {
        const text = document.getElementById("remText").value;
        const time = document.getElementById("remTime").value;
        if (!text || !time) {
            showToast("Text and time required!");
            return;
        }
        state.reminders.push({ id: uuid(), text, time });
        save(render);
    };

    window.deleteReminder = (id) => {
        state.reminders = state.reminders.filter((r) => r.id !== id);
        save(render);
    };
};
