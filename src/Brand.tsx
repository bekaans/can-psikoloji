export function Brand() {
  return (
    <a
      className="brand brand-lockup"
      href={import.meta.env.BASE_URL}
      aria-label="Özel Sağlık Meslek Hizmet Birimi Klinik Psikolog Nurcan Ayday ana sayfa"
    >
      <span className="brand-unit">Özel Sağlık Meslek Hizmet Birimi</span>
      <span className="brand-name">Klinik Psikolog Nurcan Ayday</span>
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
