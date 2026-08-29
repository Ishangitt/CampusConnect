import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, ExternalLink, X } from "lucide-react";
import api from "../api/client.js";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [acting, setActing] = useState(""); // requestId currently being processed
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  // ── Fetch pending notifications ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/users/me/notifications");
      setNotifications(res.data.notifications || []);
      setCount(res.data.count || 0);
    } catch {
      // Silently fail for background polling
    }
  }, []);

  // Initial fetch + polling every 30 s
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Re-fetch on window focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => fetchNotifications();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Accept / Reject ───────────────────────────────────────────────────────
  async function decide(requestId, action) {
    setActing(requestId);
    setError("");
    try {
      await api.put(`/join-requests/${requestId}/${action}`);
      await fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActing("");
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count} pending)` : ""}`}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notification-panel absolute right-0 top-11 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Join Requests</h3>
              <p className="text-xs text-slate-500">
                {count === 0 ? "No pending requests" : `${count} pending`}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="mx-3 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Bell size={32} className="text-slate-200" />
                <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
                <p className="text-xs text-slate-400">New join requests will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notif) => {
                  const student = notif.studentId;
                  const isActing = acting === notif._id;

                  return (
                    <li key={notif._id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        {/* Avatar + info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {student?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {student?.name || "Unknown student"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {student?.college || student?.email}
                              {student?.branch ? ` · ${student.branch}` : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-indigo-600 font-medium">
                              Wants to join{" "}
                              <Link
                                to={`/projects/${notif.projectId}/requests`}
                                className="underline underline-offset-2 hover:text-indigo-800"
                                onClick={() => setOpen(false)}
                              >
                                {notif.projectTitle}
                                <ExternalLink size={10} className="inline ml-0.5" />
                              </Link>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-shrink-0 gap-1.5">
                          <button
                            disabled={isActing}
                            onClick={() => decide(notif._id, "accept")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            title="Accept"
                          >
                            {isActing ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            disabled={isActing}
                            onClick={() => decide(notif._id, "reject")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all on Dashboard →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
