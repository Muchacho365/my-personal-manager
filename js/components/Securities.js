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

export const renderSecurities = async (renderCallback) => {
    const subTab = state.securitiesSubTab || "passwords";

    const renderSubTabs = () => `
        <div class="sub-tabs">
            <button class="sub-tab ${
                subTab === "passwords" ? "active" : ""
            }" onclick="state.securitiesSubTab='passwords'; render()">Passwords</button>
            <button class="sub-tab ${
                subTab === "apis" ? "active" : ""
            }" onclick="state.securitiesSubTab='apis'; render()">API Keys</button>
            <button class="sub-tab ${
                subTab === "cards" ? "active" : ""
            }" onclick="state.securitiesSubTab='cards'; render()">Cards</button>
        </div>
    `;

    let content = "";
    if (subTab === "passwords") {
        content = await renderPasswordList(renderCallback);
    } else if (subTab === "apis") {
        content = await renderApiList(renderCallback);
    } else if (subTab === "cards") {
        content = await renderCardList(renderCallback);
    }

    return `
        ${renderSubTabs()}
        ${content}
    `;
};

// --- Passwords ---
const renderPasswordList = async (renderCallback) => {
    // ... (Existing password rendering logic, slightly adapted)
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

// --- APIs ---
const renderApiList = async (renderCallback) => {
    const apis = state.apis || [];
    let apiCards = "";

    for (const api of apis) {
        const decryptedKey = state.showPwd[api.id]
            ? await decrypt(api.key)
            : "••••••••••••••••";
        const decryptedSecret =
            api.secret && state.showPwd[api.id + "_secret"]
                ? await decrypt(api.secret)
                : "••••••••••••••••";

        apiCards += `
        <div class="card">
            <div class="password-header">
                <h3>${api.name}</h3>
                <button class="btn-icon danger" onclick="window.deleteApi('${
                    api.id
                }')">🗑️</button>
            </div>
            <div class="form-group">
                <label>API Key</label>
                <div class="password-field">
                    <span class="password-value">${decryptedKey}</span>
                    <button class="btn-icon" onclick="state.showPwd['${
                        api.id
                    }']=!state.showPwd['${api.id}']; render()">
                        ${state.showPwd[api.id] ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <button class="btn-icon" onclick="window.copyApi('${
                        api.id
                    }', 'key')">📋</button>
                </div>
            </div>
            ${
                api.secret
                    ? `
            <div class="form-group">
                <label>API Secret</label>
                <div class="password-field">
                    <span class="password-value">${decryptedSecret}</span>
                    <button class="btn-icon" onclick="state.showPwd['${
                        api.id
                    }_secret']=!state.showPwd['${api.id}_secret']; render()">
                        ${state.showPwd[api.id + "_secret"] ? "👁️" : "👁️‍🗨️"}
                    </button>
                    <button class="btn-icon" onclick="window.copyApi('${
                        api.id
                    }', 'secret')">📋</button>
                </div>
            </div>`
                    : ""
            }
        </div>`;
    }

    return `
        <div class="card form-card">
            <h2>🔌 Add API Key</h2>
            <div class="form-group">
                <input id="apiName" placeholder="Service Name (e.g. OpenAI)">
            </div>
            <div class="form-group">
                <input id="apiKey" type="password" placeholder="API Key">
            </div>
            <div class="form-group">
                <input id="apiSecret" type="password" placeholder="API Secret (Optional)">
            </div>
            <button class="btn btn-primary" onclick="window.addApi()">💾 Save API</button>
        </div>
        ${apiCards}
    `;
};

// --- Cards ---
const renderCardList = async (renderCallback) => {
    const cards = state.cards || [];
    let cardCards = "";

    for (const card of cards) {
        const decryptedNum = state.showPwd[card.id]
            ? await decrypt(card.number)
            : `•••• •••• •••• ${card.last4}`;
        const decryptedCvv = state.showPwd[card.id]
            ? await decrypt(card.cvv)
            : "•••";

        cardCards += `
        <div class="card" style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155;">
            <div class="password-header">
                <h3>${card.name}</h3>
                <button class="btn-icon danger" onclick="window.deleteCard('${
                    card.id
                }')">🗑️</button>
            </div>
            <div style="font-family: monospace; font-size: 1.2rem; margin: 12px 0; letter-spacing: 2px;">
                ${decryptedNum}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">EXP</div>
                    <div>${card.exp}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">CVV</div>
                    <div>${decryptedCvv}</div>
                </div>
                <button class="btn-icon" onclick="state.showPwd['${
                    card.id
                }']=!state.showPwd['${card.id}']; render()">
                    ${state.showPwd[card.id] ? "👁️ Show Details" : "👁️‍🗨️ Hide"}
                </button>
            </div>
        </div>`;
    }

    return `
        <div class="card form-card">
            <h2>💳 Add Card</h2>
            <div class="form-group">
                <input id="cardName" placeholder="Card Name (e.g. Chase Sapphire)">
            </div>
            <div class="form-group">
                <input id="cardNumber" placeholder="Card Number" maxlength="19">
            </div>
            <div class="form-row cols-2">
                <input id="cardExp" placeholder="MM/YY" maxlength="5">
                <input id="cardCvv" placeholder="CVV" maxlength="4">
            </div>
            <button class="btn btn-primary" onclick="window.addCard()">💾 Save Card</button>
        </div>
        ${cardCards}
    `;
};

export const setupSecurityActions = (render) => {
    // --- Password Actions ---
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

    // --- API Actions ---
    window.addApi = async () => {
        const name = document.getElementById("apiName").value;
        const key = document.getElementById("apiKey").value;
        const secret = document.getElementById("apiSecret").value;

        if (!name || !key) {
            showToast("Name and API Key required!");
            return;
        }

        state.apis.unshift({
            id: uuid(),
            name,
            key: await encrypt(key),
            secret: secret ? await encrypt(secret) : null,
            updatedAt: new Date().toISOString(),
        });
        save(render);
    };

    window.deleteApi = (id) => {
        showConfirm("Delete this API key?", () => {
            state.apis = state.apis.filter((a) => a.id !== id);
            save(render);
        });
    };

    window.copyApi = async (id, field) => {
        const api = state.apis.find((a) => a.id === id);
        if (api && api[field]) {
            const val = await decrypt(api[field]);
            copyToClipboard(val);
        }
    };

    // --- Card Actions ---
    window.addCard = async () => {
        const name = document.getElementById("cardName").value;
        const number = document.getElementById("cardNumber").value;
        const exp = document.getElementById("cardExp").value;
        const cvv = document.getElementById("cardCvv").value;

        if (!name || !number || !exp || !cvv) {
            showToast("All card details required!");
            return;
        }

        state.cards.unshift({
            id: uuid(),
            name,
            number: await encrypt(number),
            last4: number.slice(-4),
            exp,
            cvv: await encrypt(cvv),
            updatedAt: new Date().toISOString(),
        });
        save(render);
    };

    window.deleteCard = (id) => {
        showConfirm("Delete this card?", () => {
            state.cards = state.cards.filter((c) => c.id !== id);
            save(render);
        });
    };
};
