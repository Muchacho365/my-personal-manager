import { state, save } from "../state.js";
import {
    uuid,
    formatDate,
    showConfirm,
    closeModal,
    showToast,
} from "../utils.js";
import { renderMarkdown } from "../utils/markdown.js";

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
        ${notes
            .map(
                (n) => `
          <div class="note-card ${n.pinned ? "pinned" : ""}"
               style="background-color: ${n.color}30;"
               onclick="window.viewNote('${n.id}')">
            <div class="note-header">
              <h3>${n.title || "Untitled"}</h3>
              <div style="display: flex; gap: 4px;">
                <button class="btn-icon" onclick="event.stopPropagation(); window.editNote('${
                    n.id
                }')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="event.stopPropagation(); window.togglePin('${
                    n.id
                }')" title="Pin" style="color: ${
                    n.pinned ? "#648ca3ff" : "#64748b"
                };">📌</button>
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

      <button class="fab" onclick="window.openAddNoteModal()">+</button>
    `;
};

export const setupNoteActions = (render) => {
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

    window.openAddNoteModal = () => {
        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal full-screen-modal" style="max-width: 95%; width: 95%; height: 95%; display: flex; flex-direction: column;">
                    <div class="modal-header">
                        <h2>📒 Add Note</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <input id="newNoteTitle" placeholder="Title" style="font-size: 1.8rem; font-weight: bold; padding: 16px;">
                    </div>
                    <div class="form-group" style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
                        ${toolbar}
                        <div id="newNoteContent" class="rich-editor" contenteditable="true" placeholder="Content..."
                             style="flex: 1; resize: none; font-size: 1.2rem; padding: 16px; line-height: 1.6; border-radius: 0 0 var(--radius-md) var(--radius-md); border-top: none; overflow-y: auto;"></div>
                    </div>
                    <div class="form-group">
                        <input id="newNoteCategory" placeholder="Category (optional)" style="padding: 12px;">
                    </div>
                    <div style="padding: 8px; font-size: 0.9rem; color: var(--text-muted);">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="newNoteIsMarkdown">
                            Render as Markdown
                        </label>
                    </div>
                    <button class="btn btn-primary" style="padding: 12px;" onclick="window.addNote()">💾 Save Note</button>
                </div>
            </div>
        `;
    };

    window.addNote = () => {
        const title = document.getElementById("newNoteTitle").value;
        const content = document.getElementById("newNoteContent").innerHTML;
        const category = document.getElementById("newNoteCategory").value;
        const isMarkdown = document.getElementById("newNoteIsMarkdown").checked;

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
            isMarkdown,
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
        });
        save(render);
        closeModal();
    };

    window.viewNote = (id) => {
        const n = state.notes.find((n) => n.id === id);
        if (!n) return;

        const stripHtml = (html) => {
            const tmp = document.createElement("DIV");
            // Replace block tags with newlines to preserve structure
            let clean = html
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/div>/gi, "\n")
                .replace(/<\/p>/gi, "\n\n");
            tmp.innerHTML = clean;
            let text = tmp.textContent || tmp.innerText || "";
            // Replace non-breaking spaces with normal spaces and trim
            return text.replace(/\u00A0/g, " ").trim();
        };

        const isMarkdown = n.isMarkdown || false;
        const content = isMarkdown
            ? renderMarkdown(stripHtml(n.content))
            : n.content;

        const aiSummaryHtml = n.aiSummary
            ? `
            <div class="ai-summary-box" style="margin-bottom: 20px; padding: 16px; background: var(--accent-soft); border-left: 4px solid var(--accent); border-radius: var(--radius-sm);">
                <div style="font-size: 0.8rem; font-weight: bold; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>🤖 AI SUMMARY</span>
                </div>
                <div style="font-size: 1rem; line-height: 1.5; color: var(--text-primary);">${n.aiSummary}</div>
            </div>
        `
            : "";

        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal full-screen-modal" style="max-width: 800px; width: 95%; height: 90%; display: flex; flex-direction: column;">
                    <div class="modal-header">
                        <h2>${n.title || "Untitled"}</h2>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-icon" onclick="window.toggleMarkdown('${id}')" title="${
            isMarkdown ? "Show Raw" : "Render Markdown"
        }">
                                ${isMarkdown ? "👁️" : "📝"}
                            </button>
                            <button class="btn-icon" onclick="window.editNote('${id}')" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="closeModal()">✕</button>
                        </div>
                    </div>
                    <div class="note-view-content ${
                        isMarkdown ? "markdown-body" : ""
                    }" style="flex: 1; overflow-y: auto; padding: 24px; font-size: 1.2rem; line-height: 1.6; min-height: 0;">
                        ${aiSummaryHtml}
                        ${content}
                    </div>
                    <div style="padding: 16px; border-top: 1px solid var(--border); background: var(--bg-secondary); display: flex; gap: 12px; align-items: center;">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">AI ACTIONS:</span>
                        <button class="btn btn-secondary btn-sm" onclick="window.aiSummarizeNote('${id}')">✨ Summarize</button>
                        <button class="btn btn-secondary btn-sm" onclick="window.aiFindSimilar('${id}')">🔍 Find Similar</button>
                        <div style="margin-left: auto; display: flex; gap: 16px; color: var(--text-muted); font-size: 0.85rem;">
                            <span>${n.category || "No Category"}</span>
                            <span>${formatDate(n.date || n.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    window.toggleMarkdown = (id) => {
        const n = state.notes.find((n) => n.id === id);
        if (n) {
            n.isMarkdown = !n.isMarkdown;
            save(() => window.viewNote(id));
        }
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
                    <div class="form-group" style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
                        ${toolbar}
                        <div id="editNoteContent" class="rich-editor" contenteditable="true" 
                             style="flex: 1; resize: none; font-size: 1.2rem; padding: 16px; line-height: 1.6; border-radius: 0 0 var(--radius-md) var(--radius-md); border-top: none; overflow-y: auto;">
                             ${n.content || ""}
                        </div>
                        <div style="padding: 8px; font-size: 0.9rem; color: var(--text-muted);">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="editNoteIsMarkdown" ${
                                    n.isMarkdown ? "checked" : ""
                                }>
                                Render as Markdown
                            </label>
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
        n.isMarkdown = document.getElementById("editNoteIsMarkdown").checked;
        n.updatedAt = new Date().toISOString();

        // Clear AI summary if content changed significantly
        delete n.aiSummary;

        // Move to top
        state.notes.splice(index, 1);
        state.notes.unshift(n);

        save(render);
        closeModal();
    };

    window.aiSummarizeNote = async (id) => {
        showToast("AI is summarizing...");
        await aiManager.summarizeNote(id);
        window.viewNote(id); // Refresh view
    };

    window.aiFindSimilar = async (id) => {
        showToast("AI is searching for similar notes...");
        const similarities = await aiManager.findSimilarNotes(id);
        if (similarities.length === 0) {
            showToast("No similar notes found.");
        } else {
            showToast(`Found ${similarities.length} similar notes!`);
            console.log("Similarities:", similarities);
        }
    };
};
