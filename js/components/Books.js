import { state, save } from "../state.js";
import {
    uuid,
    formatDateTime,
    showConfirm,
    showToast,
    closeModal,
} from "../utils.js";

export const renderBooks = (renderCallback) => {
    const filtered = (items, fields) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) =>
            fields.some((f) => i[f]?.toLowerCase().includes(q))
        );
    };

    const books = filtered(state.books, ["title"]);
    const selectedBook = state.selectedBook
        ? state.books.find((b) => b.id === state.selectedBook)
        : null;

    const highlightColors = [
        { color: "#fbbf24", name: "Yellow" },
        { color: "#f87171", name: "Red" },
        { color: "#60a5fa", name: "Blue" },
        { color: "#34d399", name: "Green" },
        { color: "#a78bfa", name: "Purple" },
        { color: "#fb923c", name: "Orange" },
    ];

    // If viewing a specific book's notes
    if (selectedBook) {
        const bookNotes = (selectedBook.notes || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return `
              <div class="book-reader">
                  <div class="book-header">
                      <button class="btn btn-secondary" onclick="state.selectedBook=null; render()">
                          ← Library
                      </button>
                      <div class="book-tabs">
                          <button class="tab-btn active">📝 Notes (${
                              bookNotes.length
                          })</button>
                      </div>
                  </div>

                  <div class="book-title-bar">
                      <div>
                          <h2>${selectedBook.title}</h2>
                          ${
                              selectedBook.totalPages > 0
                                  ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 4px;">
                                      Progress: ${Math.round(
                                          ((selectedBook.currentPage || 0) /
                                              selectedBook.totalPages) *
                                              100
                                      )}%
                                      (${selectedBook.currentPage || 0} / ${
                                        selectedBook.totalPages
                                    } pages)
                                     </div>`
                                  : ""
                          }
                      </div>
                      <div style="display: flex; gap: 8px; align-items: center;">
                          ${
                              selectedBook.totalPages > 0
                                  ? `<button class="btn btn-secondary btn-sm" onclick="window.updateBookProgress('${selectedBook.id}')">
                                      📖 Update Progress
                                     </button>`
                                  : ""
                          }
                          <button class="btn-icon danger" onclick="window.confirmDeleteBook('${
                              selectedBook.id
                          }')" title="Delete Book">🗑️</button>
                      </div>
                  </div>

                  <div class="book-notes-panel">
                      <div class="notes-search-bar">
                          <input type="text" placeholder="🔍 Search notes..." class="notes-search" oninput="state.bookNotesSearch=this.value; render()">
                      </div>

                      <div class="highlight-colors">
                          <span style="font-size: 0.85rem; color: var(--text-muted);">Filter:</span>
                          <button class="color-filter ${
                              !state.bookColorFilter ? "active" : ""
                          }" onclick="state.bookColorFilter=null; render()">⊘</button>
                          ${highlightColors
                              .map(
                                  (c) => `
                              <button class="color-filter ${
                                  state.bookColorFilter === c.color
                                      ? "active"
                                      : ""
                              }"
                                      style="background: ${c.color};"
                                      onclick="state.bookColorFilter='${
                                          c.color
                                      }'; render()"
                                      title="${c.name}"></button>
                          `
                              )
                              .join("")}
                      </div>

                      <div class="book-notes-list">
                          ${bookNotes
                              .filter((n) => {
                                  if (
                                      state.bookColorFilter &&
                                      n.highlightColor !== state.bookColorFilter
                                  )
                                      return false;
                                  if (state.bookNotesSearch) {
                                      const q =
                                          state.bookNotesSearch.toLowerCase();
                                      return (
                                          n.highlight
                                              ?.toLowerCase()
                                              .includes(q) ||
                                          n.note?.toLowerCase().includes(q)
                                      );
                                  }
                                  return true;
                              })
                              .map(
                                  (n) => `
                              <div class="book-note-card ${
                                  n.isImportant ? "important" : ""
                              }" style="border-left-color: ${
                                      n.highlightColor || "#fbbf24"
                                  }">
                                  <div class="note-header-row">
                                      <span class="note-date-time">${formatDateTime(
                                          n.createdAt
                                      )}</span>
                                      <span class="note-page">p.${
                                          n.page || "?"
                                      }</span>
                                      <button class="btn-icon danger" onclick="window.deleteBookNote('${
                                          selectedBook.id
                                      }', '${n.id}')" title="Delete">🗑️</button>
                                  </div>

                                  ${
                                      n.highlight
                                          ? `
                                      <div class="note-highlight" style="border-left-color: ${
                                          n.highlightColor || "#fbbf24"
                                      }">
                                          ${n.highlight}
                                      </div>
                                  `
                                          : ""
                                  }

                                  ${
                                      state.editingBookNote === n.id
                                          ? `
                                      <div class="edit-note-form">
                                          <textarea id="editNoteText-${
                                              n.id
                                          }" rows="5" placeholder="Your note..." style="width: 100%; font-size: 1rem; padding: 8px;">${
                                                n.note || ""
                                            }</textarea>
                                          <div class="edit-actions">
                                              <label class="important-toggle">
                                                  <input type="checkbox" id="editImportant-${
                                                      n.id
                                                  }" ${
                                                n.isImportant ? "checked" : ""
                                            }>
                                                  ⭐ Important
                                              </label>
                                              <button class="btn btn-primary btn-sm" onclick="window.saveBookNoteEdit('${
                                                  selectedBook.id
                                              }', '${n.id}')">Save</button>
                                              <button class="btn btn-secondary btn-sm" onclick="state.editingBookNote=null; render()">Cancel</button>
                                          </div>
                                      </div>
                                  `
                                          : `
                                      ${
                                          n.note
                                              ? `<div class="note-text">${n.note}</div>`
                                              : ""
                                      }
                                      <button class="add-note-btn" onclick="state.editingBookNote='${
                                          n.id
                                      }'; render()">
                                          ✏️ Edit note
                                      </button>
                                  `
                                  }
                              </div>
                          `
                              )
                              .join("")}

                          <!-- Add New Note Form -->
                          <div class="add-note-card">
                              <h4>➕ Add New Note</h4>
                              <div class="form-row cols-2">
                                  <input id="newNotePage" type="number" placeholder="Page #" style="width: 100px;">
                                  <div class="highlight-colors" style="flex:1">
                                      ${highlightColors
                                          .map(
                                              (c) => `
                                          <button class="color-option ${
                                              (state.newNoteColor ||
                                                  "#fbbf24") === c.color
                                                  ? "selected"
                                                  : ""
                                          }"
                                                  style="background: ${
                                                      c.color
                                                  };"
                                                  onclick="state.newNoteColor='${
                                                      c.color
                                                  }'; render()"
                                                  title="${c.name}"></button>
                                      `
                                          )
                                          .join("")}
                                  </div>
                              </div>
                              <textarea id="newNoteHighlight" placeholder="Highlighted text / quote from book..." rows="2"></textarea>
                              <textarea id="newNoteText" placeholder="Your personal note..." rows="2"></textarea>
                              <div class="form-actions">
                                  <label class="important-toggle">
                                      <input type="checkbox" id="newNoteImportant">
                                      ⭐ Mark as Important
                                  </label>
                                  <button class="btn btn-primary" onclick="window.addBookNote('${
                                      selectedBook.id
                                  }')">💾 Save Note</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
    }

    // Library View - List of Books
    return `
          <div class="books-library">
              ${
                  books.length === 0
                      ? `
                  <div class="empty-state">
                      <span style="font-size: 3rem;">📚</span>
                      <p>No books yet. Add your first book!</p>
                  </div>
              `
                      : ""
              }
              ${books
                  .map((b) => {
                      const noteCount = (b.notes || []).length;
                      const importantCount = (b.notes || []).filter(
                          (n) => n.isImportant
                      ).length;
                      const progress =
                          b.totalPages > 0
                              ? Math.round(
                                    ((b.currentPage || 0) / b.totalPages) * 100
                                )
                              : 0;
                      return `
                      <div class="book-card" onclick="state.selectedBook='${
                          b.id
                      }'; render()">
                          <div class="book-cover">📖</div>
                          <div class="book-info">
                              <h3>${b.title}</h3>
                              ${
                                  b.author
                                      ? `<p class="book-author">by ${b.author}</p>`
                                      : ""
                              }
                              ${
                                  b.totalPages > 0
                                      ? `<div class="book-progress">
                                          <div class="progress-bar">
                                              <div class="progress-fill" style="width: ${progress}%"></div>
                                          </div>
                                          <span class="progress-text">${
                                              b.currentPage || 0
                                          }/${
                                            b.totalPages
                                        } (${progress}%)</span>
                                      </div>`
                                      : ""
                              }
                              <div class="book-meta">
                                  <span class="note-count">📝 ${noteCount} note${
                          noteCount !== 1 ? "s" : ""
                      }</span>
                                  ${
                                      importantCount > 0
                                          ? `<span class="important-count">⭐ ${importantCount}</span>`
                                          : ""
                                  }
                              </div>
                          </div>
                          <button class="btn-icon danger" onclick="event.stopPropagation(); window.confirmDeleteBook('${
                              b.id
                          }')" title="Delete">🗑️</button>
                      </div>
                  `;
                  })
                  .join("")}
          </div>
          
          <button class="fab" onclick="window.openAddBookModal()">+</button>
      `;
};

export const setupBookActions = (render) => {
    window.openAddBookModal = () => {
        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2>📚 Add Book</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <input id="bookTitle" placeholder="Book Title *" style="font-size: 1.1rem; padding: 12px;">
                    </div>
                    <div class="form-group">
                        <input id="bookAuthor" placeholder="Author">
                    </div>
                    <div class="form-row cols-2">
                        <input id="bookCurrentPage" type="number" placeholder="Current Page" min="0">
                        <input id="bookTotalPages" type="number" placeholder="Total Pages" min="1">
                    </div>
                    <button class="btn btn-primary" style="width: 100%; padding: 12px;" onclick="window.addBook()">📚 Add to Library</button>
                </div>
            </div>
        `;
        setTimeout(() => document.getElementById("bookTitle").focus(), 100);
    };

    window.addBook = () => {
        const title = document.getElementById("bookTitle").value;
        if (!title) {
            showToast("Please enter a book title!");
            return;
        }
        const authorEl = document.getElementById("bookAuthor");
        const currentPageEl = document.getElementById("bookCurrentPage");
        const totalPagesEl = document.getElementById("bookTotalPages");
        state.books.unshift({
            id: uuid(),
            title,
            author: authorEl ? authorEl.value : "",
            currentPage: currentPageEl ? parseInt(currentPageEl.value) || 0 : 0,
            totalPages: totalPagesEl ? parseInt(totalPagesEl.value) || 0 : 0,
            notes: [],
            updatedAt: new Date().toISOString(),
        });
        save(render);
        closeModal();
    };

    window.updateBookProgress = (id) => {
        const book = state.books.find((b) => b.id === id);
        if (!book) return;

        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2>📖 Update Progress</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; color: var(--text-secondary);">Current Page</label>
                        <input id="updatePageInput" type="number" value="${
                            book.currentPage || 0
                        }" min="0" max="${book.totalPages}">
                    </div>
                    <div class="form-group">
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            Total Pages: ${book.totalPages}
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1" onclick="window.saveBookProgress('${id}')">💾 Save</button>
                    </div>
                </div>
            </div>
        `;
        setTimeout(
            () => document.getElementById("updatePageInput").focus(),
            100
        );
    };

    window.saveBookProgress = (id) => {
        const book = state.books.find((b) => b.id === id);
        if (!book) return;

        const newPage =
            parseInt(document.getElementById("updatePageInput").value) || 0;
        if (newPage > book.totalPages) {
            showToast("Page cannot exceed total pages!");
            return;
        }

        book.currentPage = newPage;
        book.updatedAt = new Date().toISOString();
        save(render);
        closeModal();
    };

    window.addBookNote = (bookId) => {
        const book = state.books.find((b) => b.id === bookId);
        if (!book) return;

        const page = document.getElementById("newNotePage")?.value || "";
        const highlight =
            document.getElementById("newNoteHighlight")?.value || "";
        const note = document.getElementById("newNoteText")?.value || "";
        const isImportant =
            document.getElementById("newNoteImportant")?.checked || false;

        if (!highlight && !note) {
            showToast("Please add a highlight or note!");
            return;
        }

        if (!book.notes) book.notes = [];
        book.notes.unshift({
            id: uuid(),
            page,
            highlight,
            highlightColor: state.newNoteColor || "#fbbf24",
            note,
            isImportant,
            createdAt: new Date().toISOString(),
        });
        book.updatedAt = new Date().toISOString();
        save(render);
    };

    window.saveBookNoteEdit = (bookId, noteId) => {
        const book = state.books.find((b) => b.id === bookId);
        if (!book) return;

        const bookNoteIndex = book.notes.findIndex((n) => n.id === noteId);
        if (bookNoteIndex === -1) return;

        const bookNote = book.notes[bookNoteIndex];
        const noteText =
            document.getElementById(`editNoteText-${noteId}`)?.value || "";
        const isImportant =
            document.getElementById(`editImportant-${noteId}`)?.checked ||
            false;

        bookNote.note = noteText;
        bookNote.isImportant = isImportant;
        book.updatedAt = new Date().toISOString();

        // Move to top
        book.notes.splice(bookNoteIndex, 1);
        book.notes.unshift(bookNote);

        state.editingBookNote = null;
        save(render);
    };

    window.deleteBookNote = (bookId, noteId) => {
        showConfirm("Are you sure you want to delete this note?", () => {
            const book = state.books.find((b) => b.id === bookId);
            if (!book) return;
            book.notes = book.notes.filter((n) => n.id !== noteId);
            book.updatedAt = new Date().toISOString();
            save(render);
        });
    };

    window.confirmDeleteBook = (id) => {
        showConfirm(
            "Are you sure you want to delete this book and all its notes?",
            () => {
                state.books = state.books.filter((b) => b.id !== id);
                state.selectedBook = null;
                save(render);
            }
        );
    };
};
