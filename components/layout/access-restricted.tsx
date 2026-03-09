export function AccessRestricted({ title = "Access restricted", message = "You do not have permission to view this page." }: { title?: string; message?: string }) {
  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}
