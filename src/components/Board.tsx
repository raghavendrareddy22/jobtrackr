"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { STAGES, type StageId } from "@/lib/stages";
import { moveJob } from "@/app/actions/jobs";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  stage: string;
  appliedAt: string | null;
  score: number | null;
  matchScore: number | null;
};

export function Board({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const byStage = (id: StageId) => jobs.filter((j) => j.stage === id);
  const dragJob = dragId ? jobs.find((j) => j.id === dragId) : null;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function bulkAction(action: string, stage?: string) {
    if (!selected.size) return;
    setBulkBusy(true);
    try {
      await fetch("/api/jobs/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected], action, stage }),
      });
      if (action === "delete") {
        setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
      } else if (action === "archive") {
        setJobs((prev) => prev.map((j) => selected.has(j.id) ? { ...j, stage: "rejected" } : j));
      } else if (action === "move" && stage) {
        setJobs((prev) => prev.map((j) => selected.has(j.id) ? { ...j, stage } : j));
      }
      exitSelect();
    } finally {
      setBulkBusy(false);
    }
  }

  function onDragStart(e: DragStartEvent) {
    if (selectMode) return;
    setDragId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setDragId(null);
    if (selectMode) return;
    const overId = e.over?.id;
    if (!overId) return;
    const jobId = String(e.active.id);
    const stage = String(overId) as StageId;
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.stage === stage) return;
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, stage } : j)));
    startTransition(() => { moveJob(jobId, stage); });
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-6 pb-4">
        {!selectMode ? (
          <button className="btn-secondary caption" style={{ padding: "5px 12px" }} onClick={() => setSelectMode(true)}>
            Select
          </button>
        ) : (
          <>
            <span className="caption" style={{ color: "var(--ink-subtle)" }}>
              {selected.size} selected
            </span>
            <div className="flex gap-2 flex-wrap">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  className="btn-secondary caption"
                  style={{ padding: "5px 12px" }}
                  disabled={bulkBusy || !selected.size}
                  onClick={() => bulkAction("move", s.id)}
                >
                  → {s.label}
                </button>
              ))}
              <button
                className="btn-secondary caption"
                style={{ padding: "5px 12px", color: "#ffb86b" }}
                disabled={bulkBusy || !selected.size}
                onClick={() => bulkAction("archive")}
              >
                Archive
              </button>
              <button
                className="btn-secondary caption"
                style={{ padding: "5px 12px", color: "#ff7676" }}
                disabled={bulkBusy || !selected.size}
                onClick={() => {
                  if (confirm(`Delete ${selected.size} job(s)? This cannot be undone.`)) bulkAction("delete");
                }}
              >
                Delete
              </button>
            </div>
            <button className="caption" style={{ color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer" }} onClick={exitSelect}>
              Cancel
            </button>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board-grid grid gap-4 px-6 pb-10" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
          {STAGES.map((s) => (
            <Column key={s.id} id={s.id} label={s.label} jobs={byStage(s.id)}
              selectMode={selectMode} selected={selected} onToggle={toggleSelect} />
          ))}
        </div>
        <DragOverlay>
          {dragJob ? <JobCard job={dragJob} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ id, label, jobs, selectMode, selected, onToggle }: {
  id: StageId; label: string; jobs: Job[];
  selectMode: boolean; selected: Set<string>; onToggle: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="panel flex flex-col gap-3"
      style={{
        padding: 16, minHeight: 400,
        borderColor: isOver ? "var(--hairline-strong)" : "var(--hairline)",
        background: id === "offer" ? "color-mix(in oklab, var(--surface-1), var(--success) 4%)" : "var(--surface-1)",
      }}
    >
      <div className="flex items-center justify-between" style={{ paddingBottom: 4 }}>
        <span className="eyebrow" style={{ color: "var(--ink-muted)" }}>{label}</span>
        <span className="caption" style={{ background: "var(--surface-2)", color: "var(--ink-muted)", borderRadius: 9999, padding: "2px 8px" }}>
          {jobs.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {jobs.map((j) => (
          selectMode ? (
            <SelectableCard key={j.id} job={j} checked={selected.has(j.id)} onToggle={() => onToggle(j.id)} />
          ) : (
            <DraggableCard key={j.id} job={j} />
          )
        ))}
        {jobs.length === 0 && (
          <div className="caption" style={{ color: "var(--ink-tertiary)", border: "1px dashed var(--hairline)", borderRadius: 8, padding: 12, textAlign: "center" }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function SelectableCard({ job, checked, onToggle }: { job: Job; checked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="card"
      style={{
        padding: 14, cursor: "pointer",
        background: checked ? "color-mix(in oklab,var(--surface-2),var(--primary) 12%)" : "var(--surface-1)",
        border: checked ? "1px solid var(--primary)" : "1px solid var(--hairline)",
      }}
    >
      <div className="flex items-center gap-2">
        <div style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: checked ? "var(--primary)" : "transparent",
          border: checked ? "none" : "1.5px solid var(--hairline-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {checked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
          <div className="caption" style={{ color: "var(--ink-subtle)" }}>{job.company}</div>
        </div>
      </div>
    </div>
  );
}

function DraggableCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <JobCard job={job} />
    </div>
  );
}

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

function JobCard({ job, dragging = false }: { job: Job; dragging?: boolean }) {
  return (
    <Link
      href={`/job/${job.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className="card block"
      style={{
        padding: 14,
        background: dragging ? "var(--surface-2)" : "var(--surface-1)",
        boxShadow: dragging ? "0 0 0 2px rgba(94,105,210,0.5)" : "none",
        cursor: dragging ? "grabbing" : "pointer",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
          {job.title}
        </div>
        {job.matchScore != null && (
          <span
            className="caption"
            style={{
              flexShrink: 0, borderRadius: 9999, padding: "1px 8px",
              background: job.matchScore >= 75 ? "color-mix(in oklab,var(--surface-2),var(--success) 20%)" : job.matchScore >= 50 ? "color-mix(in oklab,var(--surface-2),#c9621f 12%)" : "var(--surface-2)",
              color: job.matchScore >= 75 ? "var(--success)" : job.matchScore >= 50 ? "#ffb86b" : "var(--ink-subtle)",
            }}
          >
            {job.matchScore}%
          </span>
        )}
      </div>
      <div className="caption" style={{ color: "var(--ink-subtle)" }}>
        {job.company}{job.location ? ` · ${job.location}` : ""}
      </div>
      {job.appliedAt && (
        <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 6 }}>
          applied {daysAgo(job.appliedAt)}
        </div>
      )}
    </Link>
  );
}
