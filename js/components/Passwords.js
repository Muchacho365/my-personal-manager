import { state, save } from "../state.js";
import {
    uuid,
    encrypt,
    decrypt,
    copyToClipboard,
    showConfirm,
    showToast,
    closeModal,
} from "../utils.js";

export const renderPasswords = async (renderCallback) => {
    const filtered = (items, fields) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) =>
            fields.some((f) => i[f]?.toLowerCase().includes(q))
        );
    };

    const passwords = filtered(state.passwords, ["title", "user"]);
    const isSearching = state.search.length > 0;

    let passwordCards = "";
    for (const p of passwords) {
        const decryptedPass = state.showPwd[p.id]
            ? await decrypt(p.pass)
            : "••••••••••";

        let questionsHtml = "";
        if (p.qs?.some((q) => q.q)) {
            questionsHtml = `<div class="security-questions">`;
            for (let i = 0; i < p.qs.length; i++) {
                const q = p.qs[i];
                if (q.q) {
                    const decryptedAns = q.a ? await decrypt(q.a) : "";
                    questionsHtml += `
              <div class="security-question">
                <div class="question">Q${i + 1}: ${q.q}</div>
                <div class="answer">A: ${decryptedAns}</div>
              </div>
            `;
                }
            }
            questionsHtml += `</div>`;
        }

        passwordCards += `
        <div class="card password-card">
          <div class="password-header">
            <div>
              <h3>${p.title}</h3>
              ${
                  p.user
                      ? `<p style="color: var(--text-muted); font-size: 0.9rem;">👤 ${p.user}</p>`
                      : ""
              }
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn-icon" onclick="window.editPassword('${
                  p.id
              }')" title="Edit">✏️</button>
              <button class="btn-icon danger" onclick="window.confirmDeletePassword('${
                  p.id
              }')" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="password-field">
            <span class="password-value">${decryptedPass}</span>
            <button class="btn-icon" onclick="state.showPwd['${
                p.id
            }']=!state.showPwd['${p.id}']; render()" title="Show/Hide">
              ${state.showPwd[p.id] ? "👁️" : "👁️‍🗨️"}
            </button>
            <button class="btn-icon" onclick="window.copyPassword('${
                p.id
            }')" title="Copy">📋</button>
          </div>
          ${questionsHtml}
          ${
              p.notes
                  ? `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">📝 ${p.notes}</p>`
                  : ""
          }
        </div>
      `;
    }

    return `
      ${
          !isSearching
              ? `
      <div class="card form-card">
        <h2>🔐 Add Password</h2>
        <div class="form-group">
          <input id="pwdTitle" placeholder="Title *">
        </div>
        <div class="form-group">
          <input id="pwdUser" placeholder="Username">
        </div>
        <div class="form-row cols-2" style="align-items: flex-end;">
          <input id="pwdPass" type="password" placeholder="Password *">
          <button class="btn btn-secondary" onclick="window.showPasswordGenerator()">🎲 Generate</button>
        </div>
        <h3 style="margin: 16px 0 8px; font-size: 0.95rem;">Security Questions</h3>
        ${[0, 1, 2]
            .map(
                (i) => `
          <div class="form-row cols-2">
            <input id="q${i}" placeholder="Question ${i + 1}">
            <input id="a${i}" placeholder="Answer ${i + 1}">
          </div>
        `
            )
            .join("")}
        <div class="form-group">
          <textarea id="pwdNotes" placeholder="Notes" rows="2"></textarea>
        </div>
        <button class="btn btn-primary" onclick="window.addPassword()">💾 Save Password</button>
      </div>
      `
              : `<p class="search-results-info">🔍 Found ${
                    passwords.length
                } result${passwords.length !== 1 ? "s" : ""}</p>`
      }

      ${passwordCards}
    `;
};

export const setupPasswordActions = (render) => {
    window.addPassword = async () => {
        const title = document.getElementById("pwdTitle").value;
        const pass = document.getElementById("pwdPass").value;
        if (!title || !pass) {
            showToast("Title and password required!");
            return;
        }

        const qs = [];
        for (let i = 0; i < 3; i++) {
            const q = document.getElementById(`q${i}`).value;
            const a = document.getElementById(`a${i}`).value;
            qs.push({
                q,
                a: a ? await encrypt(a) : "",
            });
        }

        state.passwords.unshift({
            id: uuid(),
            title,
            user: document.getElementById("pwdUser").value,
            pass: await encrypt(pass),
            qs,
            notes: document.getElementById("pwdNotes").value,
            updatedAt: new Date().toISOString(),
        });
        save(render);
    };

    window.copyPassword = async (id) => {
        const p = state.passwords.find((p) => p.id === id);
        const decrypted = await decrypt(p.pass);
        copyToClipboard(decrypted);
    };

    window.confirmDeletePassword = (id) => {
        showConfirm("Are you sure you want to delete this password?", () => {
            state.passwords = state.passwords.filter((p) => p.id !== id);
            save(render);
        });
    };

    window.editPassword = (id) => {
        const p = state.passwords.find((p) => p.id === id);
        if (!p) return;
        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal full-screen-modal" style="max-width: 800px; width: 90%;">
                    <div class="modal-header">
                        <h2>✏️ Edit Password</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input id="editPwdTitle" value="${
                            p.title
                        }" placeholder="Title *" style="font-size: 1.2rem; padding: 12px;">
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input id="editPwdUser" value="${
                            p.user || ""
                        }" placeholder="Username" style="padding: 12px;">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="editPwdNotes" placeholder="Notes" rows="10" style="padding: 12px; font-size: 1rem;">${
                            p.notes || ""
                        }</textarea>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button class="btn btn-secondary" style="flex:1; padding: 12px;" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1; padding: 12px;" onclick="window.savePasswordEdit('${id}')">💾 Save Changes</button>
                    </div>
                </div>
            </div>
        `;
    };

    window.savePasswordEdit = (id) => {
        const index = state.passwords.findIndex((p) => p.id === id);
        if (index === -1) return;

        const p = state.passwords[index];
        p.title = document.getElementById("editPwdTitle").value;
        p.user = document.getElementById("editPwdUser").value;
        p.notes = document.getElementById("editPwdNotes").value;
        p.updatedAt = new Date().toISOString();

        // Move to top
        state.passwords.splice(index, 1);
        state.passwords.unshift(p);

        save(render);
        closeModal();
    };

    window.showPasswordGenerator = () => {
        const modals = document.getElementById("modals");
        modals.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>🔐 Password Generator</h2>
            <button class="btn-icon" onclick="closeModal()">✕</button>
          </div>
          <div class="password-preview" id="generatedPassword">Click Generate</div>
          <div class="length-slider">
            <label>Length: <span id="lengthValue">16</span></label>
            <input type="range" min="8" max="64" value="16" oninput="document.getElementById('lengthValue').textContent=this.value">
          </div>
          <div class="generator-options">
            <label><input type="checkbox" id="genUppercase" checked> Uppercase (A-Z)</label>
            <label><input type="checkbox" id="genLowercase" checked> Lowercase (a-z)</label>
            <label><input type="checkbox" id="genNumbers" checked> Numbers (0-9)</label>
            <label><input type="checkbox" id="genSymbols" checked> Symbols (!@#$...)</label>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="btn btn-secondary" style="flex:1" onclick="window.generatePassword()">🔄 Generate</button>
            <button class="btn btn-primary" style="flex:1" onclick="window.useGeneratedPassword()">✓ Use This</button>
          </div>
        </div>
      </div>
    `;
        window.generatePassword();
    };

    window.generatePassword = async () => {
        const length = parseInt(
            document.querySelector(".length-slider input").value
        );
        const options = {
            length,
            uppercase: document.getElementById("genUppercase").checked,
            lowercase: document.getElementById("genLowercase").checked,
            numbers: document.getElementById("genNumbers").checked,
            symbols: document.getElementById("genSymbols").checked,
        };

        let password;
        if (window.electronAPI) {
            password = await window.electronAPI.generatePassword(options);
        } else {
            let chars = "";
            if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
            if (options.numbers) chars += "0123456789";
            if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
            if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
            password = Array.from(
                { length },
                () => chars[Math.floor(Math.random() * chars.length)]
            ).join("");
        }

        document.getElementById("generatedPassword").textContent = password;
    };

    window.useGeneratedPassword = () => {
        const password =
            document.getElementById("generatedPassword").textContent;
        const pwdInput = document.getElementById("pwdPass");
        if (pwdInput) pwdInput.value = password;
        closeModal();
    };
};
