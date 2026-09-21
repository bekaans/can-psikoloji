import { useState, useEffect, useCallback, type ReactNode, type FormEvent } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Images,
  Settings,
  LogOut,
  ArrowUpRight,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  Leaf,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { Brand, LeafMark } from './Brand';
import { request } from './api';
import { contentSchema, type SiteContent, type ContentEnvelope } from '../shared/content';
import './admin.css';

type Session = { user: { username: string; role: string } | null; csrf: string };
type Tab = 'overview' | 'page' | 'services' | 'team' | 'gallery' | 'faqs' | 'settings' | 'history';
const tabs: { id: Tab; title: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', title: 'Genel bakış', icon: LayoutDashboard },
  { id: 'page', title: 'Ana sayfa', icon: FileText },
  { id: 'services', title: 'Çalışma alanları', icon: Leaf },
  { id: 'team', title: 'Uzmanlar', icon: Users },
  { id: 'gallery', title: 'Fotoğraf galerisi', icon: Images },
  { id: 'faqs', title: 'Sık sorulan sorular', icon: HelpCircle },
  { id: 'settings', title: 'İletişim bilgileri', icon: Settings },
  { id: 'history', title: 'İçerik geçmişi', icon: History },
];
const descriptions: Record<Tab, string> = {
  overview: 'Merkezinizin dijital alanı, sizin kontrolünüzde.',
  page: 'Ziyaretçilerinizi karşılayan metinleri ve fotoğrafı düzenleyin.',
  services: 'Çalışma alanlarınızı ve açıklamalarını yönetin.',
  team: 'Uzman profillerini, öz geçmişleri ve fotoğrafları güncelleyin.',
  gallery: 'Merkezinizin atmosferini gerçek fotoğraflarla paylaşın.',
  faqs: 'Ziyaretçilerinizin merak ettiği soruları yanıtlayın.',
  settings: 'Telefon, WhatsApp, adres ve harita bilgilerinizi güncelleyin.',
  history: 'Önceki içerikleri inceleyin ve gerektiğinde geri yükleyin.',
};
const dateFormat = (date: string) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );
function Field({
  label,
  value,
  onChange,
  large = false,
  maxLength = 500,
  help,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  large?: boolean;
  maxLength?: number;
  help?: string;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {large ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      )}
      {help && <small>{help}</small>}
    </label>
  );
}
function Panel({
  title,
  children,
  description,
}: {
  title: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}
function ItemControls({
  index,
  length,
  onMove,
  onDelete,
  canDelete,
}: {
  index: number;
  length: number;
  onMove: (direction: number) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div className="item-controls">
      <span>{String(index + 1).padStart(2, '0')}</span>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label="Yukarı taşı"
      >
        <ArrowUp size={15} />
      </button>
      <button
        type="button"
        disabled={index === length - 1}
        onClick={() => onMove(1)}
        aria-label="Aşağı taşı"
      >
        <ArrowDown size={15} />
      </button>
      <button
        type="button"
        disabled={!canDelete}
        onClick={onDelete}
        aria-label="Kaydı kaldır"
        className="danger-icon"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
function ImageField({
  value,
  onChange,
  csrf,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  csrf: string;
  options: { image: string; title: string }[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Fotoğraf en fazla 5 MB olabilir.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const result = await request<{ url: string }>('/api/admin/media', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf },
        body: form,
      });
      onChange(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-image-field">
      <img src={value} alt="Seçili fotoğraf" />
      <div>
        <label className="admin-field">
          <span>Fotoğraf seçimi</span>
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {!options.some((o) => o.image === value) && (
              <option value={value}>Yüklenen fotoğraf</option>
            )}
            {options.map((option) => (
              <option key={option.image} value={option.image}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label className={'upload-button ' + (busy ? 'disabled' : '')}>
          <Upload size={16} />
          {busy ? 'Yükleniyor…' : 'Yeni fotoğraf yükle'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <small>JPEG, PNG veya WebP · En fazla 5 MB</small>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<ContentEnvelope | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sidebar, setSidebar] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [revisions, setRevisions] = useState<{ id: number; createdAt: string; actor: string }[]>(
    [],
  );
  const dirty = !!draft && !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.content);
  useEffect(() => {
    document.title = 'Yönetim · Can Psikoloji';
    document.documentElement.dataset.calm = 'true';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.append(meta);
    return () => meta.remove();
  }, []);
  const boot = useCallback(async () => {
    setBooting(true);
    setError('');
    try {
      const s = await request<Session>('/api/session');
      setSession(s);
      if (s.user) {
        const c = await request<ContentEnvelope>('/api/content');
        setSnapshot(c);
        setDraft(structuredClone(c.content));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBooting(false);
    }
  }, []);
  useEffect(() => {
    void boot();
  }, [boot]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => {
    if (tab === 'history' && session?.user)
      request<typeof revisions>('/api/admin/revisions')
        .then(setRevisions)
        .catch((e) => setError(e.message));
  }, [tab, session?.user, snapshot?.version]);
  const login = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoggingIn(true);
    setError('');
    try {
      const s = await request<Session>('/api/login', {
        method: 'POST',
        headers: { 'X-CSRF-Token': session.csrf },
        body: JSON.stringify({ username, password }),
      });
      setSession(s);
      setPassword('');
      const c = await request<ContentEnvelope>('/api/content');
      setSnapshot(c);
      setDraft(structuredClone(c.content));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoggingIn(false);
    }
  };
  const logout = async () => {
    if (dirty && !confirm('Yayınlanmamış değişiklikler var. Çıkış yapılsın mı?')) return;
    try {
      await request('/api/logout', { method: 'POST', headers: { 'X-CSRF-Token': session!.csrf } });
      setDraft(null);
      setSnapshot(null);
      setNotice('');
      await boot();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    if (!draft || !snapshot || !session) return;
    setSaving(true);
    setError('');
    setNotice('');
    const valid = contentSchema.safeParse(draft);
    if (!valid.success) {
      setError(
        'Lütfen eksik veya geçersiz alanları kontrol edin: ' +
          valid.error.issues
            .map((i) => i.path.join(' → '))
            .slice(0, 4)
            .join(', '),
      );
      setSaving(false);
      return;
    }
    try {
      const updated = await request<ContentEnvelope>('/api/admin/content', {
        method: 'PUT',
        headers: { 'X-CSRF-Token': session.csrf },
        body: JSON.stringify({ content: valid.data, version: snapshot.version }),
      });
      setSnapshot(updated);
      setDraft(structuredClone(updated.content));
      setNotice('Değişiklikler yayınlandı. Siteniz güncel.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
    setNotice('');
  }
  function move(key: 'services' | 'team' | 'gallery' | 'faqs', i: number, d: number) {
    if (!draft) return;
    const arr = [...draft[key]];
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    update(key, arr as never);
  }
  function remove(key: 'services' | 'team' | 'gallery' | 'faqs', i: number) {
    if (!draft) return;
    if (confirm('Bu kayıt yayınlanacak içerikten kaldırılsın mı?'))
      update(key, draft[key].filter((_, j) => i !== j) as never);
  }
  const restore = async (id: number) => {
    if (dirty && !confirm('Mevcut düzenlemelerin yerine önceki sürüm yüklensin mi?')) return;
    try {
      const data = await request<{ content: SiteContent }>(`/api/admin/revisions/${id}`);
      setDraft(data.content);
      setNotice('Önceki sürüm düzenleme alanına alındı. Kontrol ettikten sonra yayınlayın.');
      setTab('page');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (booting)
    return (
      <div className="loading-screen">
        <Brand />
        <p>Yönetim alanınız hazırlanıyor…</p>
      </div>
    );
  if (!session?.user)
    return (
      <main className="admin-login">
        <div className="login-art">
          <Brand />
          <div>
            <p className="eyebrow">CAN PSİKOLOJİ / YÖNETİM</p>
            <h1>
              İyi bir alan,
              <br />
              <em>özen ister.</em>
            </h1>
            <p>
              Merkezinizin dijital kapısını
              <br />
              birlikte açık tutuyoruz.
            </p>
          </div>
          <LeafMark className="login-leaf" />
          <span className="small-label">ÖZENLE, İNSAN İÇİN.</span>
        </div>
        <div className="login-form-side">
          <a href="/" className="admin-back-link">
            Siteye dön <ArrowUpRight size={15} />
          </a>
          <form className="login-form" onSubmit={login}>
            <span className="login-symbol">
              <LeafMark />
            </span>
            <p className="eyebrow">YENİDEN HOŞ GELDİNİZ</p>
            <h2>Yönetim paneli</h2>
            <p>Sitenizi düzenlemek için güvenli giriş yapın.</p>
            <label className="admin-field">
              <span>Kullanıcı adı</span>
              <input
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={100}
              />
            </label>
            <label className="admin-field">
              <span>Parola</span>
              <span className="password-wrap">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={200}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error && (
              <div className="admin-alert error" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="button login-submit" disabled={loggingIn || !session}>
              {loggingIn ? 'Giriş yapılıyor…' : 'Giriş yap'}
              <ArrowUpRight size={18} />
            </button>
            {!session && (
              <button type="button" className="admin-link" onClick={() => void boot()}>
                Bağlantıyı yeniden dene
              </button>
            )}
            <small>Bu alan yalnızca yetkili yöneticiler içindir.</small>
          </form>
        </div>
      </main>
    );
  if (!draft || !snapshot)
    return (
      <main className="load-error">
        <p>{error || 'İçerik yüklenemedi.'}</p>
        <button className="button" onClick={() => void boot()}>
          Yeniden dene
        </button>
      </main>
    );
  const imageOptions = Array.from(
    new Map(
      [
        ...draft.gallery.map((g) => ({ image: g.image, title: g.caption })),
        ...draft.team.map((m) => ({ image: m.image, title: m.name })),
        { image: draft.hero.image, title: 'Açılış fotoğrafı' },
      ].map((o) => [o.image, o]),
    ).values(),
  );
  return (
    <div className="admin-app">
      <aside className={'admin-sidebar ' + (sidebar ? 'visible' : '')}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="sidebar-close"
            aria-label="Yönetim menüsünü kapat"
            onClick={() => setSidebar(false)}
          >
            <X size={20} />
          </button>
        </div>
        <span className="sidebar-label">İÇERİK YÖNETİMİ</span>
        <nav aria-label="Yönetim gezinmesi">
          {tabs.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSidebar(false);
                setError('');
              }}
              className={tab === id ? 'active' : ''}
              aria-current={tab === id ? 'page' : undefined}
            >
              <Icon size={17} />
              {title}
              {id === tab && <span />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            Siteyi aç <ArrowUpRight size={16} />
          </a>
          <div className="admin-user">
            <span>{session.user.username.slice(0, 1).toLocaleUpperCase('tr')}</span>
            <div>
              <strong>{session.user.username}</strong>
              <small>Yönetici</small>
            </div>
            <button onClick={() => void logout()} aria-label="Çıkış yap">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <button
              className="admin-menu-button"
              aria-label="Yönetim menüsünü aç"
              onClick={() => setSidebar(true)}
            >
              <Menu size={21} />
            </button>
            <span>Can Psikoloji</span>
            <span className="topbar-slash">/</span>
            <strong>{tabs.find((t) => t.id === tab)?.title}</strong>
          </div>
          <span className={'publish-state ' + (dirty ? 'unsaved' : '')}>
            <i />
            {dirty ? 'Yayınlanmamış değişiklikler' : 'Site güncel'}
          </span>
        </header>
        <main className="admin-main">
          <div className="admin-title-row">
            <div>
              <p className="eyebrow">YÖNETİM PANELİ</p>
              <h1>
                {tab === 'overview'
                  ? `Merhaba, ${session.user.username}.`
                  : tabs.find((t) => t.id === tab)?.title}
              </h1>
              <p>{descriptions[tab]}</p>
            </div>
            <div className="admin-page-actions">
              {dirty && (
                <button
                  className="admin-secondary"
                  onClick={() => {
                    if (confirm('Yayınlanmamış tüm değişiklikler geri alınsın mı?')) {
                      setDraft(structuredClone(snapshot.content));
                      setError('');
                      setNotice('');
                    }
                  }}
                >
                  <RefreshCw size={14} />
                  Vazgeç
                </button>
              )}
              <button
                className="button admin-save"
                disabled={!dirty || saving}
                onClick={() => void save()}
              >
                <Save size={16} />
                {saving ? 'Yayınlanıyor…' : 'Değişiklikleri yayınla'}
              </button>
            </div>
          </div>
          {error && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="admin-alert success" role="status">
              <Check size={19} />
              <span>{notice}</span>
            </div>
          )}
          {tab === 'overview' && (
            <>
              <div className="overview-banner">
                <div>
                  <p className="eyebrow">DİJİTAL ALANINIZ</p>
                  <h2>
                    Kendinize açılan
                    <br />
                    <em>bir alan.</em>
                  </h2>
                  <p>
                    Metinlerinizi güncelleyin, fotoğraflarınızı yenileyin.
                    <br />
                    Değişiklikleriniz yayınladığınızda görünür.
                  </p>
                  <button className="admin-light-button" onClick={() => setTab('page')}>
                    Ana sayfayı düzenle <ArrowUpRight size={16} />
                  </button>
                </div>
                <img src={draft.hero.image} alt="Merkeziniz" />
              </div>
              <div className="admin-stats">
                {[
                  {
                    label: 'Çalışma alanı',
                    value: draft.services.length,
                    icon: Leaf,
                    tab: 'services',
                  },
                  { label: 'Uzman profili', value: draft.team.length, icon: Users, tab: 'team' },
                  {
                    label: 'Galeri fotoğrafı',
                    value: draft.gallery.length,
                    icon: Images,
                    tab: 'gallery',
                  },
                  {
                    label: 'Soru & yanıt',
                    value: draft.faqs.length,
                    icon: MessageCircle,
                    tab: 'faqs',
                  },
                ].map(({ label, value, icon: Icon, tab: target }) => (
                  <button onClick={() => setTab(target as Tab)} className="stat-card" key={label}>
                    <Icon size={20} />
                    <span>{value}</span>
                    <p>{label}</p>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
              <div className="overview-bottom">
                <Panel title="Son yayın" description="Sitenizde şu anda görüntülenen içerik.">
                  <div className="last-publish">
                    <span className="publish-check">
                      <Check size={22} />
                    </span>
                    <div>
                      <strong>{dateFormat(snapshot.updatedAt)}</strong>
                      <p>İçerik sürümü {snapshot.version}</p>
                    </div>
                    <button className="admin-link" onClick={() => setTab('history')}>
                      Geçmişi gör <ArrowUpRight size={14} />
                    </button>
                  </div>
                </Panel>
                <Panel title="Hızlı erişim">
                  <div className="quick-links">
                    <button onClick={() => setTab('gallery')}>
                      <Images size={18} />
                      Fotoğrafları yönet
                      <ArrowUpRight size={16} />
                    </button>
                    <button onClick={() => setTab('settings')}>
                      <Settings size={18} />
                      İletişim bilgileri
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </Panel>
              </div>
            </>
          )}
          {tab === 'page' && (
            <>
              <Panel
                title="Karşılama alanı"
                description="Ana sayfanın ilk bölümündeki başlık ve açıklamalar."
              >
                <div className="admin-fields-grid">
                  <Field
                    label="Üst etiket"
                    value={draft.hero.eyebrow}
                    maxLength={100}
                    onChange={(v) => update('hero', { ...draft.hero, eyebrow: v })}
                  />
                  <Field
                    label="Ana başlık"
                    value={draft.hero.title}
                    maxLength={100}
                    onChange={(v) => update('hero', { ...draft.hero, title: v })}
                  />
                  <Field
                    label="Vurgulu başlık"
                    value={draft.hero.accent}
                    maxLength={100}
                    onChange={(v) => update('hero', { ...draft.hero, accent: v })}
                  />
                </div>
                <Field
                  label="Karşılama açıklaması"
                  large
                  value={draft.hero.description}
                  onChange={(v) => update('hero', { ...draft.hero, description: v })}
                />
                <ImageField
                  value={draft.hero.image}
                  onChange={(v) => update('hero', { ...draft.hero, image: v })}
                  csrf={session.csrf}
                  options={imageOptions}
                />
              </Panel>
              <Panel title="Yaklaşımımız">
                <Field
                  label="Bölüm başlığı"
                  value={draft.about.title}
                  maxLength={150}
                  onChange={(v) => update('about', { ...draft.about, title: v })}
                />
                <Field
                  label="Yaklaşım metni"
                  large
                  value={draft.about.description}
                  maxLength={1200}
                  onChange={(v) => update('about', { ...draft.about, description: v })}
                />
                <Field
                  label="Kısa not"
                  value={draft.about.note}
                  maxLength={200}
                  onChange={(v) => update('about', { ...draft.about, note: v })}
                />
              </Panel>
            </>
          )}
          {tab === 'services' && (
            <>
              {draft.services.map((item, i) => (
                <Panel key={item.id} title={item.title}>
                  <ItemControls
                    index={i}
                    length={draft.services.length}
                    canDelete={draft.services.length > 1}
                    onMove={(d) => move('services', i, d)}
                    onDelete={() => remove('services', i)}
                  />
                  <div className="admin-fields-grid">
                    <Field
                      label="Alan adı"
                      value={item.title}
                      maxLength={100}
                      onChange={(v) =>
                        update(
                          'services',
                          draft.services.map((s, j) => (j === i ? { ...s, title: v } : s)),
                        )
                      }
                    />
                    <Field
                      label="Üst başlık"
                      value={item.subtitle}
                      maxLength={100}
                      onChange={(v) =>
                        update(
                          'services',
                          draft.services.map((s, j) => (j === i ? { ...s, subtitle: v } : s)),
                        )
                      }
                    />
                    <label className="admin-field">
                      <span>Simge</span>
                      <select
                        value={item.icon}
                        onChange={(e) =>
                          update(
                            'services',
                            draft.services.map((s, j) =>
                              j === i ? { ...s, icon: e.target.value as typeof item.icon } : s,
                            ),
                          )
                        }
                      >
                        <option value="person">Birey</option>
                        <option value="sprout">Gelişim</option>
                        <option value="heart">İlişkiler</option>
                        <option value="sparkles">Değerlendirme</option>
                      </select>
                    </label>
                  </div>
                  <Field
                    label="Açıklama"
                    large
                    value={item.description}
                    maxLength={800}
                    onChange={(v) =>
                      update(
                        'services',
                        draft.services.map((s, j) => (j === i ? { ...s, description: v } : s)),
                      )
                    }
                  />
                  <Field
                    label="Etiketler"
                    value={item.tags.join(', ')}
                    maxLength={300}
                    help="Virgülle ayırın. En fazla 5 etiket."
                    onChange={(v) =>
                      update(
                        'services',
                        draft.services.map((s, j) =>
                          j === i ? { ...s, tags: v.split(',').map((t) => t.trim()) } : s,
                        ),
                      )
                    }
                  />
                </Panel>
              ))}
              <button
                className="add-item"
                disabled={draft.services.length >= 12}
                onClick={() =>
                  update('services', [
                    ...draft.services,
                    {
                      id: crypto.randomUUID(),
                      title: 'Yeni çalışma alanı',
                      subtitle: 'SİZİN İÇİN',
                      description: 'Çalışma alanı açıklamasını buraya yazın.',
                      tags: ['Danışmanlık'],
                      icon: 'sprout',
                    },
                  ])
                }
              >
                <Plus size={18} />
                Çalışma alanı ekle
              </button>
            </>
          )}
          {tab === 'team' && (
            <>
              {draft.team.map((item, i) => (
                <Panel key={item.id} title={item.name}>
                  <ItemControls
                    index={i}
                    length={draft.team.length}
                    canDelete={draft.team.length > 1}
                    onMove={(d) => move('team', i, d)}
                    onDelete={() => remove('team', i)}
                  />
                  <ImageField
                    value={item.image}
                    onChange={(v) =>
                      update(
                        'team',
                        draft.team.map((s, j) => (j === i ? { ...s, image: v } : s)),
                      )
                    }
                    csrf={session.csrf}
                    options={imageOptions}
                  />
                  <div className="admin-fields-grid">
                    <Field
                      label="Ad soyad"
                      value={item.name}
                      maxLength={100}
                      onChange={(v) =>
                        update(
                          'team',
                          draft.team.map((s, j) => (j === i ? { ...s, name: v } : s)),
                        )
                      }
                    />
                    <Field
                      label="Unvan"
                      value={item.role}
                      maxLength={100}
                      onChange={(v) =>
                        update(
                          'team',
                          draft.team.map((s, j) => (j === i ? { ...s, role: v } : s)),
                        )
                      }
                    />
                  </div>
                  <Field
                    label="Çalışma alanları"
                    value={item.focus}
                    maxLength={200}
                    onChange={(v) =>
                      update(
                        'team',
                        draft.team.map((s, j) => (j === i ? { ...s, focus: v } : s)),
                      )
                    }
                  />
                  <Field
                    label="Öz geçmiş"
                    large
                    value={item.bio}
                    maxLength={2000}
                    onChange={(v) =>
                      update(
                        'team',
                        draft.team.map((s, j) => (j === i ? { ...s, bio: v } : s)),
                      )
                    }
                  />
                </Panel>
              ))}
              <button
                className="add-item"
                disabled={draft.team.length >= 12}
                onClick={() =>
                  update('team', [
                    ...draft.team,
                    {
                      id: crypto.randomUUID(),
                      name: 'Yeni uzman',
                      role: 'Psikolog',
                      focus: 'Çalışma alanları',
                      bio: 'Uzmanın öz geçmişini buraya yazın.',
                      image: draft.hero.image,
                    },
                  ])
                }
              >
                <Plus size={18} />
                Uzman ekle
              </button>
            </>
          )}
          {tab === 'gallery' && (
            <>
              <div className="admin-gallery-grid">
                {draft.gallery.map((item, i) => (
                  <Panel key={item.id} title={item.caption}>
                    <ItemControls
                      index={i}
                      length={draft.gallery.length}
                      canDelete={draft.gallery.length > 1}
                      onMove={(d) => move('gallery', i, d)}
                      onDelete={() => remove('gallery', i)}
                    />
                    <ImageField
                      value={item.image}
                      onChange={(v) =>
                        update(
                          'gallery',
                          draft.gallery.map((s, j) => (j === i ? { ...s, image: v } : s)),
                        )
                      }
                      csrf={session.csrf}
                      options={imageOptions}
                    />
                    <Field
                      label="Fotoğraf başlığı"
                      value={item.title}
                      maxLength={100}
                      onChange={(v) =>
                        update(
                          'gallery',
                          draft.gallery.map((s, j) => (j === i ? { ...s, title: v } : s)),
                        )
                      }
                    />
                    <Field
                      label="Fotoğraf açıklaması"
                      value={item.caption}
                      maxLength={200}
                      onChange={(v) =>
                        update(
                          'gallery',
                          draft.gallery.map((s, j) => (j === i ? { ...s, caption: v } : s)),
                        )
                      }
                    />
                  </Panel>
                ))}
              </div>
              <button
                className="add-item"
                disabled={draft.gallery.length >= 24}
                onClick={() =>
                  update('gallery', [
                    ...draft.gallery,
                    {
                      id: crypto.randomUUID(),
                      title: 'Merkezimizden.',
                      caption: 'Yeni fotoğraf',
                      image: draft.hero.image,
                    },
                  ])
                }
              >
                <Plus size={18} />
                Fotoğraf ekle
              </button>
            </>
          )}
          {tab === 'faqs' && (
            <>
              {draft.faqs.map((item, i) => (
                <Panel key={item.id} title={`Soru ${i + 1}`}>
                  <ItemControls
                    index={i}
                    length={draft.faqs.length}
                    canDelete={draft.faqs.length > 1}
                    onMove={(d) => move('faqs', i, d)}
                    onDelete={() => remove('faqs', i)}
                  />
                  <Field
                    label="Soru"
                    value={item.question}
                    maxLength={200}
                    onChange={(v) =>
                      update(
                        'faqs',
                        draft.faqs.map((s, j) => (j === i ? { ...s, question: v } : s)),
                      )
                    }
                  />
                  <Field
                    label="Yanıt"
                    large
                    value={item.answer}
                    maxLength={1000}
                    onChange={(v) =>
                      update(
                        'faqs',
                        draft.faqs.map((s, j) => (j === i ? { ...s, answer: v } : s)),
                      )
                    }
                  />
                </Panel>
              ))}
              <button
                className="add-item"
                disabled={draft.faqs.length >= 20}
                onClick={() =>
                  update('faqs', [
                    ...draft.faqs,
                    {
                      id: crypto.randomUUID(),
                      question: 'Yeni soru',
                      answer: 'Yanıtı buraya yazın.',
                    },
                  ])
                }
              >
                <Plus size={18} />
                Soru ekle
              </button>
            </>
          )}
          {tab === 'settings' && (
            <>
              <Panel title="Telefon & WhatsApp">
                <div className="admin-fields-grid">
                  <Field
                    label="WhatsApp numarası"
                    value={draft.contact.phone}
                    maxLength={12}
                    help="Ülke koduyla, yalnızca rakam: 905541406244"
                    onChange={(v) => update('contact', { ...draft.contact, phone: v })}
                  />
                  <Field
                    label="Görüntülenen telefon"
                    value={draft.contact.phoneDisplay}
                    maxLength={40}
                    onChange={(v) => update('contact', { ...draft.contact, phoneDisplay: v })}
                  />
                </div>
              </Panel>
              <Panel title="Adres & çalışma bilgileri">
                <Field
                  label="İlçe / şehir"
                  value={draft.contact.city}
                  maxLength={100}
                  onChange={(v) => update('contact', { ...draft.contact, city: v })}
                />
                <Field
                  label="Açık adres"
                  large
                  value={draft.contact.address}
                  maxLength={300}
                  onChange={(v) => update('contact', { ...draft.contact, address: v })}
                />
                <Field
                  label="Google Haritalar bağlantısı"
                  value={draft.contact.mapUrl}
                  maxLength={1000}
                  onChange={(v) => update('contact', { ...draft.contact, mapUrl: v })}
                />
                <Field
                  label="Randevu / çalışma saatleri notu"
                  value={draft.contact.hours}
                  maxLength={200}
                  onChange={(v) => update('contact', { ...draft.contact, hours: v })}
                />
              </Panel>
            </>
          )}
          {tab === 'history' && (
            <Panel
              title="Önceki yayınlar"
              description="Son 30 yayından önceki içerik saklanır. Geri yüklemek, seçilen sürümü düzenlemeye açar; yayınlamak için üstteki düğmeyi kullanın."
            >
              {revisions.length === 0 ? (
                <div className="empty-history">
                  <History size={36} />
                  <p>İlk güncellemenizin ardından içerik geçmişi burada görünecek.</p>
                </div>
              ) : (
                <div className="revision-list">
                  {revisions.map((r) => (
                    <div key={r.id}>
                      <History size={19} />
                      <div>
                        <strong>{dateFormat(r.createdAt)}</strong>
                        <span>{r.actor} tarafından yapılan yayından önceki içerik</span>
                      </div>
                      <button className="admin-secondary" onClick={() => void restore(r.id)}>
                        Geri yükle <RefreshCw size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
          <div className="admin-bottom-note">
            <LeafMark />
            <span>
              Can Psikoloji · İçeriğinize gösterdiğiniz özen, ilk karşılaşmanın bir parçası.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
