import { state, save } from "../state.js";
import { uuid, showConfirm, closeModal, showToast } from "../utils.js";

export const renderCalendar = (renderCallback) => {
    const { calendarView, selectedDate, events } = state;
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    // Helper to get days in month
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    // Navigation handlers
    window.prevPeriod = () => {
        const d = new Date(state.selectedDate);
        if (state.calendarView === "month") d.setMonth(d.getMonth() - 1);
        else if (state.calendarView === "week") d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        state.selectedDate = d.toISOString();
        renderCallback();
    };

    window.nextPeriod = () => {
        const d = new Date(state.selectedDate);
        if (state.calendarView === "month") d.setMonth(d.getMonth() + 1);
        else if (state.calendarView === "week") d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        state.selectedDate = d.toISOString();
        renderCallback();
    };

    window.setCalendarView = (view) => {
        state.calendarView = view;
        renderCallback();
    };

    window.today = () => {
        state.selectedDate = new Date().toISOString();
        renderCallback();
    };

    // Render Header
    const header = `
        <div class="calendar-header">
            <div class="calendar-nav">
                <button class="btn-icon" onclick="window.prevPeriod()">‹</button>
                <button class="btn-icon" onclick="window.nextPeriod()">›</button>
                <h2 style="min-width: 200px; text-align: center;">
                    ${date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                    })}
                </h2>
                <button class="btn btn-secondary" onclick="window.today()">Today</button>
            </div>
            <div class="view-switcher">
                <button class="btn ${
                    calendarView === "month" ? "btn-primary" : "btn-secondary"
                }" onclick="window.setCalendarView('month')">Month</button>
                <button class="btn ${
                    calendarView === "week" ? "btn-primary" : "btn-secondary"
                }" onclick="window.setCalendarView('week')">Week</button>
                <button class="btn ${
                    calendarView === "day" ? "btn-primary" : "btn-secondary"
                }" onclick="window.setCalendarView('day')">Day</button>
            </div>
            <button class="btn btn-primary" onclick="window.openEventModal()">+ Event</button>
        </div>
    `;

    // Render Grid
    let gridHtml = "";

    if (calendarView === "month") {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(`<div class="calendar-day empty"></div>`);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDay = new Date(year, month, i);
            const isToday = currentDay.toDateString() === today.toDateString();
            const dayEvents = events.filter((e) => {
                const eDate = new Date(e.start);
                return (
                    eDate.getDate() === i &&
                    eDate.getMonth() === month &&
                    eDate.getFullYear() === year
                );
            });

            days.push(`
                <div class="calendar-day ${
                    isToday ? "today" : ""
                }" onclick="window.openEventModal('${currentDay.toISOString()}')">
                    <div class="day-number">${i}</div>
                    <div class="day-events">
                        ${dayEvents
                            .map(
                                (e) => `
                            <div class="event-chip ${e.type}" 
                                 style="background: ${e.color}20; color: ${e.color}; border-left: 2px solid ${e.color};"
                                 onclick="event.stopPropagation(); window.editEvent('${e.id}')">
                                ${e.title}
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            `);
        }

        gridHtml = `
            <div class="calendar-grid month-view">
                <div class="weekday">Sun</div>
                <div class="weekday">Mon</div>
                <div class="weekday">Tue</div>
                <div class="weekday">Wed</div>
                <div class="weekday">Thu</div>
                <div class="weekday">Fri</div>
                <div class="weekday">Sat</div>
                ${days.join("")}
            </div>
        `;
    } else if (calendarView === "week") {
        // Simple week view implementation
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const isToday = d.toDateString() === today.toDateString();

            const dayEvents = events.filter((e) => {
                const eDate = new Date(e.start);
                return eDate.toDateString() === d.toDateString();
            });

            days.push(`
                <div class="calendar-col ${
                    isToday ? "today" : ""
                }" onclick="window.openEventModal('${d.toISOString()}')">
                    <div class="col-header">
                        <div class="weekday">${d.toLocaleString("default", {
                            weekday: "short",
                        })}</div>
                        <div class="day-number">${d.getDate()}</div>
                    </div>
                    <div class="col-events">
                        ${dayEvents
                            .map(
                                (e) => `
                            <div class="event-card" 
                                 style="background: ${
                                     e.color
                                 }20; border-left: 3px solid ${e.color};"
                                 onclick="event.stopPropagation(); window.editEvent('${
                                     e.id
                                 }')">
                                <div class="event-time">${new Date(
                                    e.start
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}</div>
                                <div class="event-title">${e.title}</div>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            `);
        }

        gridHtml = `<div class="calendar-grid week-view">${days.join(
            ""
        )}</div>`;
    } else {
        // Day view
        const dayEvents = events
            .filter((e) => {
                const eDate = new Date(e.start);
                return eDate.toDateString() === date.toDateString();
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        gridHtml = `
            <div class="calendar-day-view">
                <div class="day-header">
                    <h1>${date.toLocaleString("default", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                    })}</h1>
                </div>
                <div class="day-timeline">
                    ${
                        dayEvents.length
                            ? dayEvents
                                  .map(
                                      (e) => `
                        <div class="timeline-event" 
                             style="border-left: 4px solid ${
                                 e.color
                             }; background: ${e.color}10;"
                             onclick="window.editEvent('${e.id}')">
                            <div class="event-time">${new Date(
                                e.start
                            ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}</div>
                            <div class="event-details">
                                <h3>${e.title}</h3>
                                <p>${e.description || ""}</p>
                            </div>
                        </div>
                    `
                                  )
                                  .join("")
                            : '<div class="empty-state">No events for today</div>'
                    }
                </div>
            </div>
        `;
    }

    return `
        <style>
            .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .calendar-nav { display: flex; align-items: center; gap: 12px; }
            .view-switcher { display: flex; background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-md); }
            .view-switcher .btn { padding: 6px 12px; font-size: 0.8rem; }
            
            .calendar-grid.month-view {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 1px;
                background: var(--border);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }
            
            .weekday {
                background: var(--bg-secondary);
                padding: 10px;
                text-align: center;
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .calendar-day {
                background: var(--bg-card);
                min-height: 120px;
                padding: 8px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .calendar-day:hover { background: var(--bg-hover); }
            .calendar-day.empty { background: var(--bg-secondary); cursor: default; }
            .calendar-day.today { background: var(--accent-soft); }
            
            .day-number { font-weight: 600; margin-bottom: 4px; font-size: 0.9rem; }
            .day-events { display: flex; flex-direction: column; gap: 2px; }
            
            .event-chip {
                font-size: 0.75rem;
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
            }
            
            .calendar-grid.week-view {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 1px;
                background: var(--border);
                height: 600px;
            }
            
            .calendar-col {
                background: var(--bg-card);
                display: flex;
                flex-direction: column;
                cursor: pointer;
            }
            .calendar-col:hover { background: var(--bg-hover); }
            .col-header { padding: 12px; text-align: center; border-bottom: 1px solid var(--border); }
            .col-events { padding: 8px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
            
            .event-card {
                padding: 8px;
                border-radius: var(--radius-sm);
                font-size: 0.8rem;
            }
            
            .calendar-day-view { max-width: 800px; margin: 0 auto; }
            .timeline-event {
                display: flex;
                gap: 16px;
                padding: 16px;
                margin-bottom: 12px;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: transform 0.2s;
            }
            .timeline-event:hover { transform: translateX(4px); }
        </style>
        ${header}
        ${gridHtml}
    `;
};

export const setupCalendarActions = (render) => {
    window.openEventModal = (dateStr = new Date().toISOString()) => {
        const date = new Date(dateStr);
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const defaultDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);

        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>📅 New Event</h2>
                        <button class="btn-icon" onclick="closeModal()">✕</button>
                    </div>
                    <div class="form-group">
                        <input id="eventTitle" placeholder="Event Title" autofocus>
                    </div>
                    <div class="form-row cols-2">
                        <div class="form-group">
                            <label>Start</label>
                            <input type="datetime-local" id="eventStart" value="${defaultDate}">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select id="eventType">
                                <option value="schedule">Schedule</option>
                                <option value="reminder">Reminder</option>
                                <option value="task">Task</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea id="eventDesc" placeholder="Description (optional)"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Color</label>
                        <div style="display: flex; gap: 8px;">
                            ${[
                                "#3b82f6",
                                "#ef4444",
                                "#10b981",
                                "#f59e0b",
                                "#8b5cf6",
                            ]
                                .map(
                                    (c) => `
                                <div onclick="document.getElementById('eventColor').value='${c}'; this.style.transform='scale(1.2)'" 
                                     style="width: 24px; height: 24px; border-radius: 50%; background: ${c}; cursor: pointer; border: 2px solid var(--bg-card);"></div>
                            `
                                )
                                .join("")}
                            <input type="hidden" id="eventColor" value="#3b82f6">
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%" onclick="window.saveEvent()">Save Event</button>
                </div>
            </div>
        `;
    };

    window.saveEvent = () => {
        const title = document.getElementById("eventTitle").value;
        const start = document.getElementById("eventStart").value;
        const type = document.getElementById("eventType").value;
        const desc = document.getElementById("eventDesc").value;
        const color = document.getElementById("eventColor").value;

        if (!title || !start) {
            showToast("Title and date are required");
            return;
        }

        state.events.push({
            id: uuid(),
            title,
            start,
            type,
            description: desc,
            color,
            created: new Date().toISOString(),
        });

        save(render);
        closeModal();
    };

    window.editEvent = (id) => {
        const e = state.events.find((ev) => ev.id === id);
        if (!e) return;

        const startDate = new Date(e.start);
        const startStr = new Date(
            startDate.getTime() - startDate.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);

        const modals = document.getElementById("modals");
        modals.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Edit Event</h2>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-icon danger" onclick="window.deleteEvent('${id}')">🗑️</button>
                            <button class="btn-icon" onclick="closeModal()">✕</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <input id="editEventTitle" value="${
                            e.title
                        }" placeholder="Event Title">
                    </div>
                    <div class="form-row cols-2">
                        <div class="form-group">
                            <label>Start</label>
                            <input type="datetime-local" id="editEventStart" value="${startStr}">
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select id="editEventType">
                                <option value="schedule" ${
                                    e.type === "schedule" ? "selected" : ""
                                }>Schedule</option>
                                <option value="reminder" ${
                                    e.type === "reminder" ? "selected" : ""
                                }>Reminder</option>
                                <option value="task" ${
                                    e.type === "task" ? "selected" : ""
                                }>Task</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea id="editEventDesc" placeholder="Description">${
                            e.description || ""
                        }</textarea>
                    </div>
                    <button class="btn btn-primary" style="width: 100%" onclick="window.updateEvent('${id}')">Update Event</button>
                </div>
            </div>
        `;
    };

    window.updateEvent = (id) => {
        const index = state.events.findIndex((e) => e.id === id);
        if (index === -1) return;

        const e = state.events[index];
        e.title = document.getElementById("editEventTitle").value;
        e.start = document.getElementById("editEventStart").value;
        e.type = document.getElementById("editEventType").value;
        e.description = document.getElementById("editEventDesc").value;

        save(render);
        closeModal();
    };

    window.deleteEvent = (id) => {
        showConfirm("Delete this event?", () => {
            state.events = state.events.filter((e) => e.id !== id);
            save(render);
        });
    };
};
