export function LoadingState({ text = "Cargando..." }) {
  return <div className="status-box">{text}</div>;
}

export function EmptyState({ text }) {
  return <div className="status-box">{text}</div>;
}

export function ErrorState({ error }) {
  if (!error) {
    return null;
  }

  return <div className="alert alert-danger mb-4">{error.message || String(error)}</div>;
}
