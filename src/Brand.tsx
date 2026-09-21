export function LeafMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 54V29M32 40C12 42 6 20 12 12c15 0 23 11 20 28ZM32 34C29 18 39 6 53 8c3 17-5 27-21 26Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M32 40 18 20M32 34 47 15" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
export function Brand() {
  return (
    <a className="brand" href={import.meta.env.BASE_URL} aria-label="Can Psikoloji ana sayfa">
      <LeafMark />
      <span>
        can<span className="brand-small">psikoloji</span>
      </span>
    </a>
  );
}
export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m4 20 1-4a8.5 8.5 0 1 1 3 3Z" />
      <path d="M8.3 7.5c-.8.4-.7 1.5-.3 2.5 1 2.7 3 4.6 5.8 5.5 1.4.4 2.4-.2 2.6-1.4l-2.6-1.3-1 1c-1.6-.7-2.6-1.7-3.3-3.2l.9-1-1.3-2.2Z" />
    </svg>
  );
}
