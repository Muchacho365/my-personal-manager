import { state, loadData, save } from "./state.js";
import { renderTodos, setupTodoActions } from "./components/Todos.js";
import {
    renderPasswords,
    setupPasswordActions,
} from "./components/Passwords.js";
import { renderVideos, setupVideoActions } from "./components/Videos.js";
import { renderBooks, setupBookActions } from "./components/Books.js";
import { renderNotes, setupNoteActions } from "./components/Notes.js";
import { showToast } from "./utils.js";

const render = async () => {
    const app = document.getElementById("app");

    // Header and Tabs
    const headerHtml = `
      <header class="header">
        <h1>Muchacho Personal Manager</h1>
        <p>Todo • Passwords • Videos • Books • Notes</p>
      </header>
    `;

    const tabsHtml = `
      <div class="tabs">
        ${["todos", "passwords", "videos", "books", "notes"]
            .map(
                (t) => `
          <button class="tab-btn ${
              state.tab === t ? "active" : ""
          }" onclick="window.changeTab('${t}')">
            <span>${
                {
                    todos: "📝",
                    passwords: "🔐",
                    videos: "🎬",
                    books: "📚",
                    notes: "📒",
                }[t]
            } ${t.charAt(0).toUpperCase() + t.slice(1)}</span>
          </button>
        `
            )
            .join("")}
      </div>
    `;

    // Toolbar
    const toolbarHtml = `
      <div class="toolbar">
        <div class="search-box">
          <input type="text" class="search-input" placeholder="Search..." value="${
              state.search
          }"
                 oninput="window.debounceSearch(this.value)"
                 ${state.search ? "autofocus" : ""}>
          ${
              state.search
                  ? `<button class="clear-search" onclick="state.search=''; render()">✕</button>`
                  : ""
          }
        </div>
        <button class="theme-toggle" onclick="window.toggleTheme()" title="Toggle Dark/Light Mode">
          ${state.theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button class="sync-btn ${
            state.syncStatus === "syncing" ? "syncing" : ""
        }" onclick="window.handleSync()">
          <span class="sync-icon">☁️</span> Sync
        </button>
        <div class="save-indicator ${state.saveStatus}">
          ${state.saveStatus === "saving" ? "💾 Saving..." : "✓ Saved"}
        </div>
      </div>
    `;

    // Content
    let contentHtml = "";
    switch (state.tab) {
        case "todos":
            contentHtml = renderTodos(render);
            break;
        case "passwords":
            contentHtml = await renderPasswords(render);
            break;
        case "videos":
            contentHtml = renderVideos(render);
            break;
        case "books":
            contentHtml = renderBooks(render);
            break;
        case "notes":
            contentHtml = renderNotes(render);
            break;
    }

    app.innerHTML =
        headerHtml +
        tabsHtml +
        toolbarHtml +
        `<div class="content">${contentHtml}</div>`;

    // Restore focus if needed (simple implementation)
    const searchInput = document.querySelector(".search-input");
    if (searchInput && state.search) {
        searchInput.focus();
        const len = state.search.length;
        searchInput.setSelectionRange(len, len);
    }
};

// Expose render globally
window.render = render;

// Global Actions
window.changeTab = (tab) => {
    state.tab = tab;
    state.search = "";
    state.selectedBook = null;
    render();
};

window.toggleTheme = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", state.theme);
    localStorage.setItem("theme", state.theme);
    render();
};

window.handleSync = () => {
    state.syncStatus = "syncing";
    render();
    setTimeout(() => {
        state.syncStatus = "idle";
        showToast("Sync feature coming soon!");
        render();
    }, 1500);
};

let searchTimeout = null;
window.debounceSearch = (value) => {
    clearTimeout(searchTimeout);
    state.search = value;
    searchTimeout = setTimeout(() => {
        render();
    }, 300);
};

// Setup Keyboard Shortcuts
document.onkeydown = (e) => {
    if (e.ctrlKey || e.metaKey) {
        const tabs = ["todos", "passwords", "videos", "books", "notes"];
        if (e.key >= "1" && e.key <= "5") {
            e.preventDefault();
            window.changeTab(tabs[parseInt(e.key) - 1]);
        }
    }
};

// Initialize
const init = async () => {
    // Setup component actions
    setupTodoActions(render);
    setupPasswordActions(render);
    setupVideoActions(render);
    setupBookActions(render);
    setupNoteActions(render);

    // Load data
    await loadData(render);

    // Listen for tray events
    if (window.electronAPI) {
        window.electronAPI.onChangeTab((tab) => {
            window.changeTab(tab);
        });
    }
};

init();
