import { state, loadData, save } from "./state.js";
import { renderTodos, setupTodoActions } from "./components/Todos.js";
import {
    renderSecurities,
    setupSecurityActions,
} from "./components/Securities.js";
import { renderVideos, setupVideoActions } from "./components/Videos.js";
import { renderBooks, setupBookActions } from "./components/Books.js";
import { renderNotes, setupNoteActions } from "./components/Notes.js";
import { showToast } from "./utils.js";

const render = async () => {
    const app = document.getElementById("app");

    const tabs = [
        { id: "todos", icon: "📝", label: "Todos", desc: "Manage your tasks" },
        {
            id: "securities",
            icon: "🛡️",
            label: "Securities",
            desc: "Vault & Keys",
        },
        { id: "videos", icon: "🎬", label: "Videos", desc: "Watch list" },
        { id: "books", icon: "📚", label: "Books", desc: "Reading list" },
        { id: "notes", icon: "📒", label: "Notes", desc: "Thoughts & ideas" },
    ];

    // Sidebar
    const sidebarHtml = `
      <aside class="sidebar ${state.sidebarCollapsed ? "collapsed" : ""}">
        <button class="sidebar-toggle" onclick="window.toggleSidebar()">
            ‹
        </button>
        <div class="sidebar-header">
          <h1>Personal Manager</h1>
          <p>Welcome back, Muchacho</p>
        </div>
        
        <nav class="nav-links">
          ${tabs
              .map(
                  (t) => `
            <button class="nav-item ${state.tab === t.id ? "active" : ""}" 
                    onclick="window.changeTab('${t.id}')">
              <span class="nav-icon">${t.icon}</span>
              <div class="nav-text">
                <span class="nav-label">${t.label}</span>
                <span class="nav-desc">${t.desc}</span>
              </div>
            </button>
          `
              )
              .join("")}
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" onclick="window.toggleTheme()">
            <span class="nav-icon">${
                state.theme === "dark" ? "☀️" : "🌙"
            }</span>
            <div class="nav-text">
                <span class="nav-label">${
                    state.theme === "dark" ? "Light Mode" : "Dark Mode"
                }</span>
            </div>
          </button>
          <button class="nav-item" onclick="window.checkForUpdates()">
            <span class="nav-icon">🔄</span>
            <div class="nav-text">
                <span class="nav-label">Check Updates</span>
            </div>
          </button>
          <button class="nav-item" onclick="window.handleSync()">
            <span class="nav-icon">☁️</span>
            <div class="nav-text">
                <span class="nav-label">Sync Data</span>
            </div>
          </button>
        </div>
      </aside>
    `;

    // Toolbar (Simplified for main content)
    const toolbarHtml = `
      <div class="toolbar">
        <div class="search-box">
          <input type="text" class="search-input" placeholder="Search ${
              state.tab
          }..." value="${state.search}"
                 oninput="window.debounceSearch(this.value)"
                 ${state.search ? "autofocus" : ""}>
          ${
              state.search
                  ? `<button class="clear-search" onclick="state.search=''; render()">✕</button>`
                  : ""
          }
        </div>
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
        case "securities":
            contentHtml = await renderSecurities(render);
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

    app.innerHTML = `
      ${sidebarHtml}
      <main class="main-content">
        ${toolbarHtml}
        <div class="content">${contentHtml}</div>
      </main>
    `;

    // Restore focus if needed
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

window.toggleSidebar = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem("sidebarCollapsed", state.sidebarCollapsed);
    render();
};

window.toggleTheme = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", state.theme);
    localStorage.setItem("theme", state.theme);
    render();
};

window.checkForUpdates = () => {
    showToast("Checking for updates...");
    if (window.electronAPI) {
        window.electronAPI.checkForUpdates();
    }
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
        const tabs = ["todos", "securities", "videos", "books", "notes"];
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
    setupSecurityActions(render);
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

        // Update listeners
        window.electronAPI.onUpdateAvailable(() => {
            showToast("Update available! Downloading...");
        });

        window.electronAPI.onUpdateNotAvailable(() => {
            showToast("You are on the latest version.");
        });

        window.electronAPI.onUpdateError((err) => {
            console.error(err);
            showToast("Error checking for updates.");
        });
    }
};

init();
