type WorkspaceQuickAction = {
  label: string;
  href: string;
};

type WorkspaceQuickActionsProps = {
  actions: WorkspaceQuickAction[];
};

export function WorkspaceQuickActions({ actions }: WorkspaceQuickActionsProps) {
  return (
    <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((action) => (
        <a
          key={action.href}
          className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-accent-deep transition-transform hover:-translate-y-0.5"
          href={action.href}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}