import { state, save } from "../state.js";

export const layouts = [
    { id: "grid", label: "Grid", icon: "⊞" },
    { id: "list", label: "List", icon: "☰" },
    { id: "1x1-h", label: "1x1 Horizontal", icon: "▭" },
    { id: "1x1-v", label: "1x1 Vertical", icon: "▯" },
    { id: "2x2", label: "2x2 Grid", icon: "田" },
    { id: "2x3", label: "2x3 Grid", icon: "⊟" },
    { id: "3x2", label: "3x2 Grid", icon: "mps" },
    { id: "4x4", label: "4x4 Grid", icon: "▦" },
    { id: "5x5", label: "5x5 Grid", icon: "▩" },
    { id: "3x5", label: "3x5 Trading", icon: "▤" },
];

const defaultLayouts = {
    todos: "1x1-v",
    securities: "list",
    videos: "grid",
    books: "grid",
    notes: "grid",
};

export const renderLayoutSelector = (renderCallback) => {
    const currentLayout =
        state.layout[state.tab] || defaultLayouts[state.tab] || "grid";

    return `
        <div class="layout-selector">
            <button class="btn-icon" onclick="document.getElementById('layoutDropdown').classList.toggle('show')" title="Change Layout">
                ${layouts.find((l) => l.id === currentLayout)?.icon || "⊞"}
            </button>
            <div id="layoutDropdown" class="dropdown-menu">
                ${layouts
                    .map(
                        (l) => `
                    <button class="dropdown-item ${
                        currentLayout === l.id ? "active" : ""
                    }" 
                            onclick="window.changeLayout('${l.id}')">
                        <span class="icon">${l.icon}</span>
                        <span>${l.label}</span>
                    </button>
                `
                    )
                    .join("")}
            </div>
        </div>
    `;
};

export const getLayoutClasses = () => {
    const currentLayout =
        state.layout[state.tab] || defaultLayouts[state.tab] || "grid";
    return `layout-${currentLayout}`;
};

export const setupLayoutActions = (render) => {
    window.changeLayout = (layoutId) => {
        state.layout[state.tab] = layoutId;
        save(render);

        // Close dropdown
        const dropdown = document.getElementById("layoutDropdown");
        if (dropdown) dropdown.classList.remove("show");
    };

    // Close dropdown when clicking outside
    window.addEventListener("click", (e) => {
        if (!e.target.closest(".layout-selector")) {
            const dropdown = document.getElementById("layoutDropdown");
            if (dropdown && dropdown.classList.contains("show")) {
                dropdown.classList.remove("show");
            }
        }
    });
};
