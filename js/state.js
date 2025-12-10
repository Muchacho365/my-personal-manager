// State Management

export const state = {
    tab: "todos",
    search: "",
    todos: [],
    passwords: [],
    videos: [],
    books: [],
    notes: [],
    editing: {},
    showPwd: {},
    showDone: false,
    saveStatus: "saved",
    newTodoPriority: "medium",
    noteColor: "#fbbf24",
    syncStatus: "idle",
    theme: "dark",
    selectedBook: null,
    bookColorFilter: null,
    bookNotesSearch: "",
    editingBookNote: null,
    newNoteColor: "#fbbf24",
    calendarMonth: undefined,
    calendarYear: undefined,
};

// Make state globally available for inline handlers (legacy support)
window.state = state;

export const save = async (renderCallback) => {
    state.saveStatus = "saving";
    if (renderCallback) renderCallback();

    const dataToSave = {
        todos: state.todos,
        passwords: state.passwords,
        videos: state.videos,
        books: state.books,
        notes: state.notes,
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
    if (window.electronAPI) {
        data = await window.electronAPI.loadData();
    }

    // Migration from localStorage if no file data
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
            if (window.electronAPI) {
                await window.electronAPI.saveData(data);
            }
        }
    }

    if (data) {
        state.todos = data.todos || [];
        state.passwords = data.passwords || [];
        state.videos = data.videos || [];
        state.books = data.books || [];
        state.notes = data.notes || [];
        state.theme = data.theme || "dark";
        state.tab = data.tab || "todos";
    }

    document.body.setAttribute("data-theme", state.theme);
    if (renderCallback) renderCallback();
};
