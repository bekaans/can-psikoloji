import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './readability.css';
import './astra-type.css';

const Site = lazy(() => import('./Site'));
const Admin = lazy(() => import('./Admin'));
function App() {
  return (
    <Suspense
      fallback={
        <div className="loading-screen">
          <span className="loading-mark">
            can<span>psikoloji</span>
          </span>
          <i />
        </div>
      }
    >
      {location.pathname.startsWith('/admin') ? <Admin /> : <Site />}
    </Suspense>
  );
}
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="load-error">
        <h1>Birazdan yeniden buluşalım.</h1>
        <p>Sayfa yüklenirken bir sorun oluştu.</p>
        <button className="button" onClick={() => location.reload()}>
          Yeniden dene
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
