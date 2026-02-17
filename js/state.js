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
    events: [], // Unified schedule & reminders
    calendarView: "month", // month, week, day
    selectedDate: new Date().toISOString(),
    layout: {}, // Per-tab layout preferences: { notes: 'grid', todos: 'kanban' }
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
    aiAnalysis: null, // AI Strategy Analysis results
    prioritizedTodos: null,
    securityHealth: null,
    dailyBriefing: null,
};

// Make state globally available for inline handlers (legacy support)
window.state = state;

export const getDataSnapshot = () => ({
    todos: state.todos,
    passwords: state.passwords,
    apis: state.apis,
    cards: state.cards,
    videos: state.videos,
    books: state.books,
    notes: state.notes,
    events: state.events,
    layout: state.layout,
    theme: state.theme,
    tab: state.tab,
    aiAnalysis: state.aiAnalysis,
    prioritizedTodos: state.prioritizedTodos,
    securityHealth: state.securityHealth,
    dailyBriefing: state.dailyBriefing,
});

export const save = async (renderCallback) => {
    state.saveStatus = "saving";
    if (renderCallback) renderCallback();

    const dataToSave = getDataSnapshot();

    if (window.electronAPI) {
        await window.electronAPI.saveData(dataToSave);
        window.electronAPI.broadcastStateChange(dataToSave);
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
    // Only use localStorage if we didn't get data from the file
    if (!data) {
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

        // Migration: Unified events
        if (data.events) {
            state.events = data.events;
        } else {
            // Migrate legacy schedule and reminders
            const legacySchedule = data.schedule || [];
            const legacyReminders = data.reminders || [];

            state.events = [
                ...legacySchedule.map((s) => ({
                    id: crypto.randomUUID(),
                    title: s.task || s.activity,
                    start: s.time
                        ? new Date().toISOString().split("T")[0] + "T" + s.time
                        : new Date().toISOString(),
                    end: null,
                    type: "schedule",
                    description: s.description || "",
                    color: "#3b82f6",
                })),
                ...legacyReminders.map((r) => ({
                    id: crypto.randomUUID(),
                    title: r.text,
                    start: r.date || new Date().toISOString(),
                    type: "reminder",
                    completed: r.done || false,
                    color: "#ef4444",
                })),
            ];
        }

        state.layout = data.layout || {};
        state.theme = data.theme || "dark";
        state.tab = data.tab || "todos";
        state.aiAnalysis = data.aiAnalysis || null;
        state.prioritizedTodos = data.prioritizedTodos || null;
        state.securityHealth = data.securityHealth || null;
        state.dailyBriefing = data.dailyBriefing || null;

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

export const initSync = (renderCallback) => {
    if (window.electronAPI) {
        window.electronAPI.onStateChange((data) => {
            // Merge incoming state
            state.todos = data.todos || [];
            state.passwords = data.passwords || [];
            state.apis = data.apis || [];
            state.cards = data.cards || [];
            state.videos = data.videos || [];
            state.books = data.books || [];
            state.notes = data.notes || [];
            state.events = data.events || [];
            state.layout = data.layout || {};

            // Don't sync UI state like tab or search
            // state.tab = data.tab;

            if (renderCallback) renderCallback();
        });
    }
};
