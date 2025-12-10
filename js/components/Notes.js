import { state, save } from "../state.js";
import {
    uuid,
    formatDate,
    showConfirm,
    closeModal,
    showToast,
} from "../utils.js";

export const renderNotes = (renderCallback) => {
    const filtered = (items, fields) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) =>
            fields.some((f) => i[f]?.toLowerCase().includes(q))
        );
    };

    const notes = filtered(state.notes, ["title", "content"]);

    return `
      <div class="card form-card">
        <h2>📒 Add Note</h2>
        <div class="form-group">
          <input id="noteTitle" placeholder="Title">
        </div>
        <div class="form-group">
          <textarea id="noteContent" placeholder="Content..." rows="4"></textarea>
        </div>
        <div class="form-group">
          <input id="noteCategory" placeholder="Category (optional)">
        </div>
        <button class="btn btn-primary" onclick="window.addNote()">💾 Save Note</button>
      </div>

      <div class="notes-canvas" id="notesCanvas">
        ${notes
            .map(
                (n) => `
          <div class="note-card ${n.pinned ? "pinned" : ""}"
               style="background-color: ${n.color}30;">
            <div class="note-header">
              <h3>${n.title || "Untitled"}</h3>
              <div style="display: flex; gap: 4px;">
                <button class="btn-icon" onclick="event.stopPropagation(); window.togglePin('${
                    n.id
                }')" title="Pin" style="color: ${
                    n.pinned ? "#f59e0b" : "#64748b"
                };">📌</button>
                <button class="btn-icon" onclick="event.stopPropagation(); window.editNote('${
                    n.id
                }')" title="Edit">✏️</button>
                <button class="btn-icon danger" onclick="event.stopPropagation(); window.confirmDeleteNote('${
                    n.id
                }')" title="Delete">🗑️</button>
              </div>
            </div>
            <div class="note-content">${n.content}</div>
            <div class="note-footer">
              <span class="note-date">${formatDate(
                  n.date || n.updatedAt
              )}</span>
              ${
                  n.category
                      ? `<span class="note-category">${n.category}</span>`
                      : ""
              }
            </div>
          </div>
        `
            )
            .join("")}
      </div>
    `;
};

export const setupNoteActions = (render) => {
    window.addNote = () => {
        const title = document.getElementById("noteTitle").value;
        const content = document.getElementById("noteContent").value;
        const category = document.getElementById("noteCategory").value;

        if (!title && !content) {
            showToast("Please add a title or content!");
            return;
        }

        state.notes.unshift({
            id: uuid(),
            title,
            content,
            category,
            color: state.noteColor,
            pinned: false,
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
        });
        save(render);
    };

    window.togglePin = (id) => {
        const n = state.notes.find((n) => n.id === id);
        if (n) {
            n.pinned = !n.pinned;
            save(render);
        }
    };

    window.confirmDeleteNote = (id) => {
        showConfirm("Are you sure you want to delete this note?", () => {
            state.notes = state.notes.filter((n) => n.id !== id);
            save(render);
        });
    };

    window.editNote = (id) => {
        const n = state.notes.find((n) => n.id === id);
        if (!n) return;
        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal full-screen-modal" style="max-width: 95%; width: 95%; height: 95%; display: flex; flex-direction: column;">
                    <div class="modal-header">
                        <h2>✏️ Edit Note</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <input id="editNoteTitle" value="${
                            n.title || ""
                        }" placeholder="Title" style="font-size: 1.8rem; font-weight: bold; padding: 16px;">
                    </div>
                    <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
                        <textarea id="editNoteContent" style="flex: 1; resize: none; font-family: monospace; font-size: 1.2rem; padding: 16px; line-height: 1.6;" placeholder="Content...">${
                            n.content || ""
                        }</textarea>
                    </div>
                    <div class="form-group">
                        <input id="editNoteCategory" value="${
                            n.category || ""
                        }" placeholder="Category" style="padding: 12px;">
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" style="flex:1; padding: 12px;" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1; padding: 12px;" onclick="window.saveNoteEdit('${id}')">💾 Save Changes</button>
                    </div>
                </div>
            </div>
        `;
    };

    window.saveNoteEdit = (id) => {
        const index = state.notes.findIndex((n) => n.id === id);
        if (index === -1) return;

        const n = state.notes[index];
        n.title = document.getElementById("editNoteTitle").value;
        n.content = document.getElementById("editNoteContent").value;
        n.category = document.getElementById("editNoteCategory").value;
        n.updatedAt = new Date().toISOString();

        // Move to top
        state.notes.splice(index, 1);
        state.notes.unshift(n);

        save(render);
        closeModal();
    };
};
