import { state, save } from "../state.js";
import { uuid, showConfirm, closeModal } from "../utils.js";

export const renderVideos = (renderCallback) => {
    const filtered = (items, fields) => {
        if (!state.search) return items;
        const q = state.search.toLowerCase();
        return items.filter((i) =>
            fields.some((f) => i[f]?.toLowerCase().includes(q))
        );
    };

    const videos = filtered(state.videos, ["title"]);
    const isSearching = state.search.length > 0;

    return `
      ${
          !isSearching
              ? `
      <div class="card form-card">
        <h2>🎬 Add Video</h2>
        <div class="form-group">
          <input id="vidTitle" placeholder="Title *">
        </div>
        <div class="form-row cols-3">
          <input id="vidSeason" placeholder="Season">
          <input id="vidEpisode" placeholder="Episode">
          <input id="vidTime" placeholder="Time (e.g., 1:23:45)">
        </div>
        <div class="form-group">
          <textarea id="vidNotes" placeholder="Notes" rows="2"></textarea>
        </div>
        <button class="btn btn-primary" onclick="window.addVideo()">💾 Save</button>
      </div>
      `
              : `<p class="search-results-info">🔍 Found ${
                    videos.length
                } result${videos.length !== 1 ? "s" : ""}</p>`
      }

      ${videos
          .map(
              (v) => `
        <div class="card media-card">
          <div class="media-info">
            <h3>${v.title}</h3>
            <div class="media-meta">
              ${v.season ? `<span>📺 S${v.season}</span>` : ""}
              ${v.episode ? `<span>E${v.episode}</span>` : ""}
              ${v.time ? `<span>⏱️ ${v.time}</span>` : ""}
            </div>
            ${
                v.notes
                    ? `<p style="color: var(--text-muted); margin-top: 8px; font-size: 0.9rem;">${v.notes}</p>`
                    : ""
            }
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon" onclick="window.editVideo('${
                v.id
            }')" title="Edit">✏️</button>
            <button class="btn-icon danger" onclick="window.confirmDeleteVideo('${
                v.id
            }')" title="Delete">🗑️</button>
          </div>
        </div>
      `
          )
          .join("")}
    `;
};

export const setupVideoActions = (render) => {
    window.addVideo = () => {
        const title = document.getElementById("vidTitle").value;
        if (!title) return;
        state.videos.unshift({
            id: uuid(),
            title,
            season: document.getElementById("vidSeason").value,
            episode: document.getElementById("vidEpisode").value,
            time: document.getElementById("vidTime").value,
            notes: document.getElementById("vidNotes").value,
            updatedAt: new Date().toISOString(),
        });
        save(render);
    };

    window.confirmDeleteVideo = (id) => {
        showConfirm("Are you sure you want to delete this video?", () => {
            state.videos = state.videos.filter((v) => v.id !== id);
            save(render);
        });
    };

    window.editVideo = (id) => {
        const v = state.videos.find((v) => v.id === id);
        if (!v) return;
        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal full-screen-modal" style="max-width: 800px; width: 90%;">
                    <div class="modal-header">
                        <h2>✏️ Edit Video</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input id="editVidTitle" value="${
                            v.title
                        }" placeholder="Title *" style="font-size: 1.2rem; padding: 12px;">
                    </div>
                    <div class="form-row cols-3">
                        <div class="form-group">
                            <label>Season</label>
                            <input id="editVidSeason" value="${
                                v.season || ""
                            }" placeholder="Season" style="padding: 12px;">
                        </div>
                        <div class="form-group">
                            <label>Episode</label>
                            <input id="editVidEpisode" value="${
                                v.episode || ""
                            }" placeholder="Episode" style="padding: 12px;">
                        </div>
                        <div class="form-group">
                            <label>Time</label>
                            <input id="editVidTime" value="${
                                v.time || ""
                            }" placeholder="Time" style="padding: 12px;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="editVidNotes" placeholder="Notes" rows="10" style="padding: 12px; font-size: 1rem;">${
                            v.notes || ""
                        }</textarea>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button class="btn btn-secondary" style="flex:1; padding: 12px;" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-primary" style="flex:1; padding: 12px;" onclick="window.saveVideoEdit('${id}')">💾 Save Changes</button>
                    </div>
                </div>
            </div>
        `;
    };

    window.saveVideoEdit = (id) => {
        const index = state.videos.findIndex((v) => v.id === id);
        if (index === -1) return;

        const v = state.videos[index];
        v.title = document.getElementById("editVidTitle").value;
        v.season = document.getElementById("editVidSeason").value;
        v.episode = document.getElementById("editVidEpisode").value;
        v.time = document.getElementById("editVidTime").value;
        v.notes = document.getElementById("editVidNotes").value;
        v.updatedAt = new Date().toISOString();

        // Move to top
        state.videos.splice(index, 1);
        state.videos.unshift(v);

        save(render);
        closeModal();
    };
};
