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

    const toolbar = `
        <div class="editor-toolbar">
            <button class="btn-icon" onclick="document.execCommand('bold', false, null)" title="Bold"><b>B</b></button>
            <button class="btn-icon" onclick="document.execCommand('italic', false, null)" title="Italic"><i>I</i></button>
            <button class="btn-icon" onclick="document.execCommand('underline', false, null)" title="Underline"><u>U</u></button>
            <div class="toolbar-separator"></div>
            <button class="btn-icon" onclick="document.execCommand('insertUnorderedList', false, null)" title="Bullet List">•</button>
            <button class="btn-icon" onclick="document.execCommand('insertOrderedList', false, null)" title="Numbered List">1.</button>
            <div class="toolbar-separator"></div>
            <button class="btn-icon" onclick="document.execCommand('justifyLeft', false, null)" title="Align Left">⇤</button>
            <button class="btn-icon" onclick="document.execCommand('justifyCenter', false, null)" title="Align Center">↔</button>
            <button class="btn-icon" onclick="document.execCommand('justifyRight', false, null)" title="Align Right">⇥</button>
            <div class="toolbar-separator"></div>
            <button class="btn-icon" onclick="document.execCommand('hiliteColor', false, '#fef08a')" title="Highlight" style="background: #fef08a; color: black;">H</button>
        </div>
    `;

    return `
      <style>
        .editor-toolbar {
            display: flex;
            gap: 4px;
            padding: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-bottom: none;
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            flex-wrap: wrap;
        }
        .toolbar-separator {
            width: 1px;
            background: var(--border);
            margin: 0 4px;
        }
        .rich-editor {
            min-height: 120px;
            max-height: 400px;
            overflow-y: auto;
            padding: 12px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            color: var(--text-primary);
            outline: none;
        }
        .rich-editor:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .rich-editor ul, .rich-editor ol {
            padding-left: 20px;
        }
        .rich-editor blockquote {
            border-left: 3px solid var(--accent);
            padding-left: 10px;
            color: var(--text-muted);
        }
      </style>

      <div class="card form-card">
        <h2>📒 Add Note</h2>
        <div class="form-group">
          <input id="noteTitle" placeholder="Title">
        </div>
        <div class="form-group">
            ${toolbar}
            <div id="noteContent" class="rich-editor" contenteditable="true" placeholder="Content..."></div>
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
                    n.pinned ? "#648ca3ff" : "#64748b"
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
        const content = document.getElementById("noteContent").innerHTML;
        const category = document.getElementById("noteCategory").value;

        if (!title && (!content || content === "<br>")) {
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

        const toolbar = `
            <div class="editor-toolbar" style="background: var(--bg-primary);">
                <button class="btn-icon" onclick="document.execCommand('bold', false, null)" title="Bold"><b>B</b></button>
                <button class="btn-icon" onclick="document.execCommand('italic', false, null)" title="Italic"><i>I</i></button>
                <button class="btn-icon" onclick="document.execCommand('underline', false, null)" title="Underline"><u>U</u></button>
                <div class="toolbar-separator"></div>
                <button class="btn-icon" onclick="document.execCommand('insertUnorderedList', false, null)" title="Bullet List">•</button>
                <button class="btn-icon" onclick="document.execCommand('insertOrderedList', false, null)" title="Numbered List">1.</button>
                <div class="toolbar-separator"></div>
                <button class="btn-icon" onclick="document.execCommand('justifyLeft', false, null)" title="Align Left">⇤</button>
                <button class="btn-icon" onclick="document.execCommand('justifyCenter', false, null)" title="Align Center">↔</button>
                <button class="btn-icon" onclick="document.execCommand('justifyRight', false, null)" title="Align Right">⇥</button>
                <div class="toolbar-separator"></div>
                <button class="btn-icon" onclick="document.execCommand('hiliteColor', false, '#fef08a')" title="Highlight" style="background: #fef08a; color: black;">H</button>
            </div>
        `;

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
                        ${toolbar}
                        <div id="editNoteContent" class="rich-editor" contenteditable="true" 
                             style="flex: 1; resize: none; font-size: 1.2rem; padding: 16px; line-height: 1.6; border-radius: 0 0 var(--radius-md) var(--radius-md); border-top: none;">
                             ${n.content || ""}
                        </div>
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
        n.content = document.getElementById("editNoteContent").innerHTML;
        n.category = document.getElementById("editNoteCategory").value;
        n.updatedAt = new Date().toISOString();

        // Move to top
        state.notes.splice(index, 1);
        state.notes.unshift(n);

        save(render);
        closeModal();
    };
};
