import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/projects/${id}`} className="text-sm font-medium text-indigo-600">
          Back to project
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Join requests</h1>
        <p className="mt-1 text-slate-500">
          {project?.title} · {project?.members?.length}/{project?.teamSize} members
        </p>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Pending</h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No pending requests" subtitle="When students apply, they will show up here." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((request) => {
              const student = request.studentId;
              const match = getSkillMatch(student?.skills || [], project.requiredSkills || []);
              return (
                <div key={request._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{student?.name}</p>
                      <p className="text-sm text-slate-500">
                        {student?.college} {student?.branch ? `· ${student.branch}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-medium text-indigo-600">{match.percent}% Skill Match</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={actingId === request._id}
                        onClick={() => decide(request._id, "accept")}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        disabled={actingId === request._id}
                        onClick={() => decide(request._id, "reject")}
                        className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <SkillBadges skills={student?.skills} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {others.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Processed</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {others.map((request) => (
              <li key={request._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{request.studentId?.name}</span>
                <span className="capitalize text-slate-500">{request.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
