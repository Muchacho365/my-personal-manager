/**
 * AI Tools Component
 * Provides a comprehensive dashboard for app-wide AI insights.
 */

import { state, save } from "../state.js";
import { aiManager } from "../ai/aiManager.js";
import { showToast } from "../utils.js";

export const renderAiTools = (renderCallback) => {
    const analysis = state.aiAnalysis || {
        indicators: {},
        tickers: {},
        patterns: {},
        sentiment: { win: 0, loss: 0 },
    };

    const briefing =
        state.dailyBriefing ||
        "Click 'Refresh Dashboard' to generate your daily briefing.";
    const security = state.securityHealth || { score: 100, risks: [] };
    const prioritized = state.prioritizedTodos || [];

    const renderStatList = (obj, title) => {
        const items = Object.entries(obj).sort((a, b) => b[1] - a[1]);
        if (items.length === 0)
            return `<p style="color: var(--text-muted);">No ${title.toLowerCase()} detected yet.</p>`;

        return `
            <div class="stat-list">
                ${items
                    .slice(0, 5)
                    .map(
                        ([name, count]) => `
                    <div class="stat-item">
                        <span class="stat-name">${name}</span>
                        <span class="stat-count">${count}</span>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    };

    return `
        <div class="ai-dashboard">
            <div class="dashboard-header">
                <h2>🤖 AI Command Center</h2>
                <button class="btn btn-primary" onclick="window.refreshAiDashboard()">
                    🔄 Refresh Dashboard
                </button>
            </div>

            <!-- Daily Briefing Section -->
            <div class="dashboard-section briefing-section">
                <h3>📅 Daily Briefing</h3>
                <div class="briefing-content">
                    ${briefing}
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Todo Prioritization -->
                <div class="card ai-card">
                    <h3>✅ Smart Prioritization</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">AI-suggested focus tasks:</p>
                    <div class="prioritized-list">
                        ${
                            prioritized.length > 0
                                ? prioritized
                                      .slice(0, 3)
                                      .map(
                                          (t) => `
                                <div class="prioritized-item">
                                    <span class="todo-text">${t.text}</span>
                                    <span class="todo-score">Score: ${Math.round(
                                        t.aiScore
                                    )}</span>
                                </div>
                            `
                                      )
                                      .join("")
                                : '<p style="color: var(--text-muted);">No tasks prioritized yet.</p>'
                        }
                    </div>
                    <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 12px;" onclick="window.aiPrioritizeTodos()">
                        Recalculate Priority
                    </button>
                </div>

                <!-- Security Health -->
                <div class="card ai-card">
                    <h3>🛡️ Security Audit</h3>
                    <div class="security-score-container">
                        <div class="security-score ${
                            security.score > 80
                                ? "good"
                                : security.score > 50
                                ? "warning"
                                : "danger"
                        }">
                            ${security.score}%
                        </div>
                        <div class="security-label">Health Score</div>
                    </div>
                    <div class="security-risks">
                        ${
                            security.risks.length > 0
                                ? security.risks
                                      .map(
                                          (r) =>
                                              `<div class="risk-item">⚠️ ${r}</div>`
                                      )
                                      .join("")
                                : '<div class="risk-item success">✅ No major risks detected.</div>'
                        }
                    </div>
                    <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 12px;" onclick="window.aiCheckSecurity()">
                        Run Audit
                    </button>
                </div>

                <!-- Strategy Insights -->
                <div class="card ai-card">
                    <h3>📈 Strategy Insights</h3>
                    <div class="sentiment-chart">
                        <div class="sentiment-bar win" style="flex: ${
                            analysis.sentiment.win || 1
                        }">
                            Win: ${analysis.sentiment.win}
                        </div>
                        <div class="sentiment-bar loss" style="flex: ${
                            analysis.sentiment.loss || 1
                        }">
                            Loss: ${analysis.sentiment.loss}
                        </div>
                    </div>
                    ${renderStatList(analysis.indicators, "Indicators")}
                </div>
            </div>

            <div class="dashboard-section">
                <h3>🔍 Cross-Content Discovery</h3>
                <p style="color: var(--text-muted); margin-bottom: 16px;">
                    AI finds connections between your notes, books, and videos to help you learn faster.
                </p>
                <div id="discoveryResults">
                    <button class="btn btn-secondary" onclick="window.runDiscovery()">
                        Discover Connections
                    </button>
                </div>
            </div>
        </div>

        <style>
            .ai-dashboard {
                display: flex;
                flex-direction: column;
                gap: 24px;
                padding-bottom: 40px;
            }
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            .ai-card {
                padding: 24px;
                display: flex;
                flex-direction: column;
            }
            .briefing-section {
                background: var(--accent-soft);
                border: 1px solid var(--accent);
                padding: 24px;
                border-radius: var(--radius-lg);
            }
            .briefing-content {
                font-size: 1.1rem;
                line-height: 1.6;
                color: var(--text-primary);
            }
            .prioritized-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .prioritized-item {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
                font-size: 0.9rem;
            }
            .todo-score {
                color: var(--accent);
                font-weight: bold;
            }
            .security-score-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 16px 0;
            }
            .security-score {
                font-size: 2.5rem;
                font-weight: 800;
            }
            .security-score.good { color: var(--success); }
            .security-score.warning { color: var(--warning); }
            .security-score.danger { color: var(--danger); }
            .security-label { font-size: 0.8rem; color: var(--text-muted); }
            .security-risks {
                font-size: 0.85rem;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .risk-item.success { color: var(--success); }
            
            .stat-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 12px;
            }
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: var(--bg-secondary);
                border-radius: var(--radius-sm);
            }
            .stat-name {
                font-weight: 600;
                color: var(--accent);
            }
            .sentiment-chart {
                display: flex;
                height: 30px;
                border-radius: var(--radius-full);
                overflow: hidden;
                margin-bottom: 16px;
            }
            .sentiment-bar {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
                color: white;
            }
            .sentiment-bar.win { background: var(--success); }
            .sentiment-bar.loss { background: var(--danger); }
            
            .dashboard-section {
                padding: 24px;
                background: var(--bg-card);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
            }
        </style>
    `;
};

export const setupAiActions = (render) => {
    window.refreshAiDashboard = async () => {
        showToast("Refreshing AI Dashboard...");
        await Promise.all([
            aiManager.getDailyBriefing(),
            aiManager.prioritizeTodos(),
            aiManager.checkSecurityHealth(),
            aiManager.analyzeAllNotes(),
        ]);
        render();
    };

    window.aiPrioritizeTodos = async () => {
        showToast("Prioritizing tasks...");
        await aiManager.prioritizeTodos();
        render();
    };

    window.aiCheckSecurity = async () => {
        showToast("Auditing security...");
        await aiManager.checkSecurityHealth();
        render();
    };

    window.runDiscovery = async () => {
        const resultsDiv = document.getElementById("discoveryResults");
        resultsDiv.innerHTML =
            "<p>AI is discovering connections... this may take a moment.</p>";

        // Simulate discovery for now
        setTimeout(() => {
            resultsDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="prioritized-item">
                        <span>💡 Your note on "RSI Divergence" relates to the video "Advanced Technical Analysis".</span>
                    </div>
                    <div class="prioritized-item">
                        <span>💡 The book "Trading in the Zone" matches your recent trade log sentiment.</span>
                    </div>
                </div>
            `;
        }, 1500);
    };
};
