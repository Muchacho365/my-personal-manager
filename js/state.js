// State Management

export const state = {
    tab: "todos",
    search: "",
    todos: [],
    passwords: [],
    apis: [], // New: API Keys
    cards: [], // New: Credit Cards
    videos: [],
    books: [],
    notes: [],
    schedule: [], // New: Timetable
    reminders: [], // New: Reminders
    editing: {},
    showPwd: {},
    showDone: false,
    saveStatus: "saved",
    newTodoPriority: "medium",
    newTodoText: "", // New: Persist input text
    noteColor: "#fbbf24",
    syncStatus: "idle",
    theme: "dark",
    sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
    selectedBook: null,
    bookColorFilter: null,
    bookNotesSearch: "",
    editingBookNote: null,
    newNoteColor: "#fbbf24",
    calendarMonth: undefined,
    calendarYear: undefined,
    todoSubTab: "tasks", // tasks, schedule, reminders
    securitiesSubTab: "passwords", // passwords, apis, cards
};

// Make state globally available for inline handlers (legacy support)
window.state = state;

export const save = async (renderCallback) => {
    state.saveStatus = "saving";
    if (renderCallback) renderCallback();

    const dataToSave = {
        todos: state.todos,
        passwords: state.passwords,
        apis: state.apis,
        cards: state.cards,
        videos: state.videos,
        books: state.books,
        notes: state.notes,
        schedule: state.schedule,
        reminders: state.reminders,
        theme: state.theme,
        tab: state.tab,
    };

    if (window.electronAPI) {
        await window.electronAPI.saveData(dataToSave);
    } else {
        localStorage.setItem("appData", JSON.stringify(dataToSave));
    }

    setTimeout(() => {
        state.saveStatus = "saved";
        if (renderCallback) renderCallback();
    }, 500);
};

export const loadData = async (renderCallback) => {
    let data = null;
    let recoveredFromStorage = false;

    // 1. Try to load from file first
    if (window.electronAPI) {
        data = await window.electronAPI.loadData();
    }

    // 2. Check for "appData" in localStorage (where data might be stuck)
    const localAppData = localStorage.getItem("appData");
    if (localAppData) {
        try {
            const parsedLocalData = JSON.parse(localAppData);
            // If we have local data, we should probably use it, especially if file data is null
            // or if the user is reporting data loss (implying file data is stale/empty).
            // For now, let's assume local data is the "latest" if it exists,
            // effectively recovering the session.
            data = parsedLocalData;
            recoveredFromStorage = true;
            console.log("Recovered data from localStorage['appData']");
        } catch (e) {
            console.error("Failed to parse localStorage['appData']", e);
        }
    }

    // 3. Legacy migration (only if we still have no data)
    if (!data) {
        const localTodos = JSON.parse(localStorage.getItem("todos") || "[]");
        if (localTodos.length > 0) {
            data = {
                todos: localTodos,
                passwords: JSON.parse(
                    localStorage.getItem("passwords") || "[]"
                ),
                videos: JSON.parse(localStorage.getItem("videos") || "[]"),
                books: JSON.parse(localStorage.getItem("books") || "[]"),
                notes: JSON.parse(localStorage.getItem("notes") || "[]"),
                theme: localStorage.getItem("theme") || "dark",
                tab: "todos",
            };
            recoveredFromStorage = true;
        }
    }

    // 4. Apply data to state
    if (data) {
        state.todos = data.todos || [];
        state.passwords = data.passwords || [];
        state.apis = data.apis || [];
        state.cards = data.cards || [];
        state.videos = data.videos || [];
        state.books = data.books || [];
        state.notes = data.notes || [];
        state.schedule = data.schedule || [];
        state.reminders = data.reminders || [];
        state.theme = data.theme || "dark";
        state.tab = data.tab || "todos";

        // If we recovered data from localStorage, save it to file immediately
        // to ensure persistence for next time.
        if (recoveredFromStorage && window.electronAPI) {
            await window.electronAPI.saveData(data);
            // Optional: Clear appData to avoid confusion later?
            // Better to keep it as a backup for now until confirmed safe.
            // localStorage.removeItem("appData");
        }
    }

    document.body.setAttribute("data-theme", state.theme);
    if (renderCallback) renderCallback();
};
