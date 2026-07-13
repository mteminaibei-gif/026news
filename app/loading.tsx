export default function Loading() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--bg-base)',
      }}
    >
      <div className="page-spinner" role="status" aria-label="Loading" />
      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
        Loading…
      </p>
    </div>
  )
}
