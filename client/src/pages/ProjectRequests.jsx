import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, Linkedin } from "lucide-react";
import api from "../api/client.js";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkillBadges from "../components/SkillBadges.jsx";
import { getSkillMatch } from "../utils/skillMatch.js";

export default function ProjectRequests() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState("");

  async function load() {
    const res = await api.get(`/projects/${id}/requests`);
    setProject(res.data.project);
    setRequests(res.data.requests);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err.response?.data?.message || "Failed to load requests"))
      .finally(() => setLoading(false));
  }, [id]);

  async function decide(requestId, action) {
    setActingId(requestId);
    setError("");
    try {
      await api.put(`/join-requests/${requestId}/${action}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActingId("");
    }
  }

  if (loading) return <Loader label="Loading requests..." />;
  if (!project && error) {
    return <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>;
  }

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={14} /> Back to project
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Join Requests</h1>
        {project && (
          <p className="mt-1 text-slate-500">
            <span className="font-medium text-slate-700">{project.title}</span> ·{" "}
            {project.members?.length}/{project.teamSize} members filled
          </p>
        )}
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      {/* Pending requests */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Pending</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {pending.length} waiting
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <EmptyState
            title="No pending requests"
            subtitle="When students apply to join your project, they'll appear here."
          />
        ) : (
          <div className="space-y-4">
            {pending.map((request) => {
              const student = request.studentId;
              const match = getSkillMatch(student?.skills || [], project?.requiredSkills || []);
              const isActing = actingId === request._id;

              return (
                <div
                  key={request._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-slate-300"
                >
                  {/* Top row: avatar + info + actions */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700">
                        {student?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{student?.name || "Unknown"}</p>
                        <p className="text-sm text-slate-500">
                          {student?.college || "—"}
                          {student?.branch ? ` · ${student.branch}` : ""}
                          {student?.year ? ` · Year ${student.year}` : ""}
                        </p>
                        {/* Match % */}
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            match.percent >= 70
                              ? "text-emerald-600"
                              : match.percent >= 40
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {match.percent}% skill match
                        </p>
                      </div>
                    </div>

                    {/* Accept / Reject */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        disabled={isActing}
                        onClick={() => decide(request._id, "accept")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        {isActing ? "..." : "Accept"}
                      </button>
                      <button
                        disabled={isActing}
                        onClick={() => decide(request._id, "reject")}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition-colors"
                      >
                        {isActing ? "..." : "Reject"}
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  {student?.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                      {student.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {student?.skills?.length > 0 && (
                    <div className="mt-3">
                      <SkillBadges skills={student.skills} />
                    </div>
                  )}

                  {/* Links */}
                  {(student?.github || student?.linkedin) && (
                    <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3">
                      {student.github && (
                        <a
                          href={student.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Github size={13} /> GitHub
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {student.linkedin && (
                        <a
                          href={student.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Linkedin size={13} /> LinkedIn
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Applied at */}
                  <p className="mt-2 text-xs text-slate-400">
                    Applied {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Processed requests */}
      {processed.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Processed</h2>
          <ul className="space-y-2">
            {processed.map((request) => (
              <li
                key={request._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {request.studentId?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{request.studentId?.name || "Unknown"}</p>
                    <p className="text-xs text-slate-400">{request.studentId?.college || ""}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    request.status === "accepted"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {request.status === "accepted" ? "✓ " : "✕ "}
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
