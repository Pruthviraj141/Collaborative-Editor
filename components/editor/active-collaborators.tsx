import type { CollaboratorPresence } from "@/types/editor";

interface ActiveCollaboratorsProps {
  users: CollaboratorPresence[];
}

function initials(name: string) {
  const chunks = name.trim().split(/\s+/).slice(0, 2);
  return chunks.map((item) => item[0]?.toUpperCase() ?? "").join("") || "G";
}

export function ActiveCollaborators({ users }: ActiveCollaboratorsProps) {
  if (users.length === 0) {
    return <p className="text-xs text-muted-foreground">No collaborators yet</p>;
  }

  const visible = users.slice(0, 5);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <span
            key={user.id}
            title={user.name}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:z-10 hover:scale-105"
            style={{ backgroundColor: user.color }}
          >
            {initials(user.name)}
          </span>
        ))}
      </div>
      {overflow > 0 ? <span className="text-xs text-muted-foreground">+{overflow} more</span> : null}
    </div>
  );
}
