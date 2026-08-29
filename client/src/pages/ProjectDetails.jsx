import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, ExternalLink, Phone, Trash2, Users } from "lucide-react";
import api from "../api/client.js";
import Loader from "../components/Loader.jsx";
import SkillBadges from "../components/SkillBadges.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { getSkillMatch } from "../utils/skillMatch.js";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [me, setMe] = useState(null);
  const [joinRequest, setJoinRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function deleteProject() {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loader label="Loading project..." />;
  if (!project) return <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error || "Project not found"}</p>;

  const myId = me?._id?.toString();
  const ownerId = (project.creatorId?._id || project.creatorId)?.toString();
  const isOwner = Boolean(myId && ownerId && myId === ownerId);
  const isMember = Boolean(myId && project.members?.some((m) => (m._id || m)?.toString() === myId));
  const match = getSkillMatch(me?.skills || [], project.requiredSkills || []);
  const spotsLeft = project.teamSize - project.members.length;

  let action = null;
  if (isOwner) {
    action = (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          👑 Owner
        </span>
        <Link
          to={`/projects/${id}/requests`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Manage requests
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    );
  } else if (isMember) {
    action = <span className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">✓ You're a Member</span>;
  } else if (joinRequest?.status === "pending") {
    action = <span className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">⏳ Request Pending</span>;
  } else if (joinRequest?.status === "accepted") {
    action = <span className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">✓ You're a Member</span>;
  } else if (joinRequest?.status === "rejected") {
    action = (
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">Request Rejected</span>
        <button
          onClick={requestJoin}
          disabled={acting || !project.isOpen}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {acting ? "Sending..." : "Apply Again"}
        </button>
      </div>
    );
  } else {
    action = (
      <button
        onClick={requestJoin}
        disabled={acting || !project.isOpen}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {acting ? "Sending..." : project.isOpen ? "Request to Join" : "Team is Full"}
      </button>
    );
  }

  return (
    <>
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete this project?"
          message={`"${project.title}" will be permanently deleted along with all join requests. This action cannot be undone.`}
          confirmLabel="Yes, Delete Project"
          onConfirm={deleteProject}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
          danger
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Main card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {project.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      project.isOpen
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {project.isOpen ? `Open · ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : "Closed"}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{project.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  by{" "}
                  <span className="font-medium text-slate-700">
                    {project.creatorId?.name || "Unknown"}
                  </span>
                  {project.creatorId?.college ? ` · ${project.creatorId.college}` : ""}
                </p>
              </div>
              <div className="flex-shrink-0">{action}</div>
            </div>

            {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

            <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{project.description}</p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                <Users size={15} className="text-slate-400" />
                {project.members.length}/{project.teamSize} members
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                <Calendar size={15} className="text-slate-400" />
                Deadline: {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Team members */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <ul className="mt-4 space-y-3">
              {project.members.map((member) => {
                const memberId = (member._id || member)?.toString();
                const creatorIdStr = (project.creatorId?._id || project.creatorId)?.toString();
                const isCreator = memberId === creatorIdStr;
                return (
                  <li
                    key={member._id || member}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-slate-900">
                        {member.name || "Unknown"}
                        {isCreator && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            OWNER
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.college || member.email}
                        {member.branch ? ` · ${member.branch}` : ""}
                      </p>
                    </div>
                    {(member.github || member.linkedin) && (
                      <div className="flex gap-2 text-slate-400">
                        {member.github && (
                          <a href={member.github} target="_blank" rel="noreferrer" className="hover:text-slate-700">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* WhatsApp — members only */}
          {isMember && project.whatsappNumber ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
                <Phone size={18} /> WhatsApp Group
              </h2>
              <p className="mt-2 text-sm text-emerald-700">{project.whatsappNumber}</p>
              <a
                href={`https://wa.me/${project.whatsappNumber.replace(/[^\d+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Open WhatsApp
              </a>
            </div>
          ) : null}

          {/* Skill match */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Skill Match</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-sm font-bold ${
                  match.percent >= 70
                    ? "bg-emerald-50 text-emerald-700"
                    : match.percent >= 40
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {match.percent}%
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Based on your profile skills.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  match.percent >= 70 ? "bg-emerald-500" : match.percent >= 40 ? "bg-amber-500" : "bg-indigo-500"
                }`}
                style={{ width: `${match.percent}%` }}
              />
            </div>
            {match.matched.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">You have</p>
                <SkillBadges skills={match.matched} tone="emerald" />
              </div>
            )}
            {match.missing.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing</p>
                <SkillBadges skills={match.missing} tone="rose" />
              </div>
            )}
          </div>

          {/* Required skills */}
          {project.requiredSkills?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Required Skills</h2>
              <div className="mt-3">
                <SkillBadges skills={project.requiredSkills} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
