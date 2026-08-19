import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import api from "../api/client.js";
import Loader from "../components/Loader.jsx";
import SkillBadges from "../components/SkillBadges.jsx";
import { getSkillMatch } from "../utils/skillMatch.js";

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [me, setMe] = useState(null);
  const [joinRequest, setJoinRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [projectRes, meRes] = await Promise.all([api.get(`/projects/${id}`), api.get("/users/me")]);
    setProject(projectRes.data.project);
    setJoinRequest(projectRes.data.joinRequest);
    setMe(meRes.data.user);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err.response?.data?.message || "Failed to load project"))
      .finally(() => setLoading(false));
  }, [id]);

  async function requestJoin() {
    setActing(true);
    setError("");
    try {
      await api.post(`/projects/${id}/join`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request");
    } finally {
      setActing(false);
    }
  }

  if (loading) return <Loader label="Loading project..." />;
  if (!project) return <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error || "Project not found"}</p>;

  const myId = me?._id;
  const isOwner = project.creatorId?._id === myId;
  const isMember = project.members?.some((m) => m._id === myId);
  const match = getSkillMatch(me?.skills || [], project.requiredSkills || []);

  let action = null;
  if (isOwner) {
    action = (
      <div className="flex flex-wrap gap-3">
        <span className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">You are the Owner</span>
        <Link
          to={`/projects/${id}/requests`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          Manage requests
        </Link>
      </div>
    );
  } else if (isMember) {
    action = <span className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">You're a Member</span>;
  } else if (joinRequest?.status === "pending") {
    action = <span className="rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-800">Request Pending</span>;
  } else if (joinRequest?.status === "accepted") {
    action = <span className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">You're a Member</span>;
  } else {
    action = (
      <button
        onClick={requestJoin}
        disabled={acting || !project.isOpen}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {acting ? "Sending..." : project.isOpen ? "Request to Join" : "Team is full"}
      </button>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {project.category}
              </span>
              <h1 className="mt-3 text-3xl font-semibold">{project.title}</h1>
            </div>
            {action}
          </div>
          {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{project.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Users size={16} /> {project.members.length}/{project.teamSize} members
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} /> Deadline {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Team</h2>
          <ul className="mt-4 space-y-3">
            {project.members.map((member) => (
              <li key={member._id} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="font-medium">
                  {member.name} {member._id === project.creatorId?._id ? "(Owner)" : ""}
                </p>
                <p className="text-sm text-slate-500">{member.college || member.email}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{match.percent}% Skill Match</h2>
          <p className="mt-1 text-sm text-slate-500">Exact match against the project's required skills.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${match.percent}%` }} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Matched</p>
            <SkillBadges skills={match.matched} tone="emerald" />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Missing</p>
            <SkillBadges skills={match.missing} tone="rose" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Required skills</h2>
          <div className="mt-3">
            <SkillBadges skills={project.requiredSkills} />
          </div>
        </div>
      </aside>
    </div>
  );
}
