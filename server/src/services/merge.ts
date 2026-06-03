// LWW (Last-Writer-Wins) merge strategy with version tracking.
// In a production system this would use CRDT or OT, but for MVP
// LWW with version conflict detection is sufficient.

export interface MergeableDoc {
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

export interface MergeResult {
  merged: MergeableDoc;
  resolved: boolean;
  conflicts: string[];
}

export function mergeLWW(
  base: MergeableDoc,
  local: MergeableDoc,
  remote: MergeableDoc,
): MergeResult {
  const conflicts: string[] = [];
  let finalTitle = base.title;
  let finalContent = base.content;

  if (local.title !== remote.title) {
    conflicts.push('title');
    finalTitle = local.updatedAt >= remote.updatedAt ? local.title : remote.title;
  }

  if (local.content !== remote.content) {
    conflicts.push('content');
    finalContent = local.updatedAt >= remote.updatedAt ? local.content : remote.content;
  }

  return {
    merged: {
      title: finalTitle,
      content: finalContent,
      version: Math.max(local.version, remote.version) + 1,
      updatedAt: new Date().toISOString(),
    },
    resolved: true,
    conflicts,
  };
}
