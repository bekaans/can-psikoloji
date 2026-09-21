import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Menu,
  X,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  Heart,
  UserRound,
  Sparkles,
  Maximize2,
  VolumeX,
  MoveUpRight,
} from 'lucide-react';
import { type SiteContent, type ContentEnvelope, whatsappLink } from '../shared/content';
import { Brand, LeafMark, WhatsAppIcon } from './Brand';
import { request } from './api';
import { useMotion, scrollToId } from './useMotion';
import { Glints } from './Glints';
import { LiquidHero } from './LiquidHero';

type ModalContent =
  | { kind: 'service'; index: number }
  | { kind: 'team'; index: number }
  | { kind: 'gallery'; index: number }
  | { kind: 'privacy' };
const icons = { person: UserRound, sprout: Sprout, heart: Heart, sparkles: Sparkles };
const nav = [
  ['Yaklaşımımız', 'yaklasim'],
  ['Çalışma alanları', 'alanlar'],
  ['Uzmanlarımız', 'uzmanlar'],
  ['Merkezimiz', 'merkez'],
];
function External({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function Site() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<ModalContent | null>(null);
  const [faq, setFaq] = useState<string | null>('ilk-gorusme');
  const [activePhoto, setActivePhoto] = useState(0);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [calm, setCalm] = useState(() => {
    try {
      return localStorage.getItem('can-calm') === 'true';
    } catch {
      return false;
    }
  });
  const [topic, setTopic] = useState('');
  const menuRef = useRef<HTMLDialogElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const reduced = calm || systemReduced;
  useMotion(!!content, reduced);
  useEffect(() => {
    const controller = new AbortController();
    const base = import.meta.env.BASE_URL;
    const load = import.meta.env.VITE_STATIC
      ? request<ContentEnvelope['content']>(base + 'content.json', {
          signal: controller.signal,
        }).then((c) =>
          JSON.parse(JSON.stringify(c).replaceAll('"/images/', '"' + base + 'images/')),
        )
      : request<ContentEnvelope>('/api/content', { signal: controller.signal }).then(
          (data) => data.content,
        );
    load
      .then((c) => setContent(c))
      .catch((e) => {
        if (e.name !== 'AbortError') setError('Sayfa yüklenemedi. Lütfen yeniden deneyin.');
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(q.matches);
    q.addEventListener('change', change);
    return () => q.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.calm = String(reduced);
    try {
      localStorage.setItem('can-calm', String(calm));
    } catch {}
  }, [calm, reduced]);
  useEffect(() => {
    const dialog = menuRef.current;
    if (menu && !dialog?.open) dialog?.showModal();
    else if (!menu && dialog?.open) dialog.close();
  }, [menu]);
  useEffect(() => {
    const dialog = modalRef.current;
    if (modal && !dialog?.open) dialog?.showModal();
    else if (!modal && dialog?.open) dialog.close();
  }, [modal]);
  useEffect(() => {
    if (!menu && !modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menu, modal]);
  useEffect(() => {
    const resize = () => {
      if (innerWidth > 1000) setMenu(false);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  if (error)
    return (
      <main className="load-error">
        <LeafMark />
        <h1>Birazdan yeniden buluşalım.</h1>
        <p>{error}</p>
        <button className="button" onClick={() => location.reload()}>
          Yeniden dene
        </button>
      </main>
    );
  if (!content)
    return (
      <div className="loading-screen">
        <span className="loading-mark">
          can<span>psikoloji</span>
        </span>
        <i />
      </div>
    );
  const wa = whatsappLink(content);
  const gallery = content.gallery[activePhoto % content.gallery.length];
  const changePhoto = (direction: number) =>
    setActivePhoto((p) => (p + direction + content.gallery.length) % content.gallery.length);
  return (
    <>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <Glints still={reduced} />
      <div className="scroll-progress" aria-hidden="true" />
      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Ana gezinme">
          {nav.map(([label, id]) => (
            <a key={id} href={'#' + id}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <External href={wa} className="header-appointment">
            Birlikte başlayalım <ArrowUpRight size={17} />
          </External>
          <button
            className="menu-toggle icon-button"
            aria-label="Menüyü aç"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero" id="baslangic">
          <div className="hero-copy">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>
              {content.hero.title}
              <br />
              <em>{content.hero.accent}</em>
            </h1>
            <p className="hero-description">{content.hero.description}</p>
            <div className="hero-ctas">
              <External className="button" href={wa}>
                İlk adımı atalım <ArrowUpRight size={20} />
              </External>
              <a className="text-link" href="#yaklasim">
                Bizi tanıyın <ArrowDown size={15} />
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <LiquidHero still={reduced} />
            <div className="hero-image-frame">
              <img
                className="hero-photo"
                src={content.hero.image}
                alt="Can Psikoloji merkezinin gün ışığı alan görüşme odası"
                fetchPriority="high"
                width="1600"
                height="1200"
                data-parallax
              />
              <div className="image-shade" />
              <div className="image-location">
                <MapPin size={14} />
                {content.contact.city}
              </div>
            </div>
          </div>
        </section>
        <section id="yaklasim" className="about-section section-pad">
          <div className="section-side" data-reveal>
            <span className="eyebrow">Yaklaşımımız</span>
          </div>
          <div className="about-body">
            <h2 className="manifesto">
              {content.about.title.split(' ').map((word, i) => (
                <span className="story-word" key={i}>
                  {word}{' '}
                </span>
              ))}
            </h2>
            <div className="about-details" data-reveal>
              <p>{content.about.description}</p>
              <div>
                <p className="about-note">{content.about.note}</p>
              </div>
            </div>
          </div>
        </section>
        <section id="alanlar" className="services-section section-pad">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">Çalışma alanlarımız</p>
              <h2>Hangi konuda destek arıyorsunuz?</h2>
            </div>
            <p>Dört alanda çalışıyoruz. Ayrıntı için kartlara tıklayabilirsiniz.</p>
          </div>
          <div className="services-grid">
            {content.services.map((service, i) => {
              return (
                <button
                  key={service.id}
                  className={'service-card service-' + i}
                  onClick={() => setModal({ kind: 'service', index: i })}
                  data-reveal
                >
                  <p className="small-label">{service.subtitle}</p>
                  <h3>{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                  <div className="service-bottom">
                    <span>Ayrıntılı bilgi</span>
                    <span className="circle-arrow">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <section className="pause-section">
          <img
            className="pause-photo"
            src={content.gallery[2]?.image ?? content.hero.image}
            alt=""
            loading="lazy"
            width="1600"
            height="1200"
          />
          <div className="pause-copy" data-reveal>
            <h2>
              Görüşmeler randevu ile,
              <br />
              sakin bir ortamda yapılır.
            </h2>
          </div>
        </section>
        <section id="merkez" className="space-section section-pad">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">Merkezimiz</p>
              <h2>Merkezi yakından görün.</h2>
            </div>
            <p>Fotoğraflar Gebze’deki merkezimizden.</p>
          </div>
          <div className="gallery-stage" data-reveal>
            <button
              className="gallery-main"
              onClick={() => setModal({ kind: 'gallery', index: activePhoto })}
              aria-label={gallery.caption + ' fotoğrafını büyüt'}
            >
              <img
                key={gallery.image}
                src={gallery.image}
                alt={gallery.caption}
                loading="lazy"
                width="1600"
                height="1200"
              />
              <div className="gallery-overlay">
                <h3>{gallery.title}</h3>
                <span className="expand-button">
                  <Maximize2 size={19} />
                </span>
              </div>
            </button>
            <div className="gallery-side">
              <p>{gallery.caption}</p>
              <div className="gallery-thumbnails">
                {content.gallery.map((item, i) => (
                  <button
                    key={item.id}
                    className={i === activePhoto ? 'active' : ''}
                    onClick={() => setActivePhoto(i)}
                    aria-label={item.caption}
                    aria-pressed={i === activePhoto}
                  >
                    <img src={item.image} alt="" loading="lazy" width="100" height="80" />
                  </button>
                ))}
              </div>
              <div className="gallery-navigation">
                <span>
                  <b>0{activePhoto + 1}</b> / 0{content.gallery.length}
                </span>
                <div>
                  <button
                    className="icon-button"
                    onClick={() => changePhoto(-1)}
                    aria-label="Önceki fotoğraf"
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => changePhoto(1)}
                    aria-label="Sonraki fotoğraf"
                  >
                    <ArrowRight />
                  </button>
                </div>
              </div>
              <External href={content.contact.mapUrl} className="text-link">
                Yol tarifi alın <ArrowUpRight size={17} />
              </External>
            </div>
          </div>
        </section>
        <section id="uzmanlar" className="team-section section-pad">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">Uzmanlarımız</p>
              <h2>Sizinle çalışacak uzmanlar.</h2>
            </div>
            <p>Ayrıntılı bilgi için uzman kartına tıklayabilirsiniz.</p>
          </div>
          <div className="team-grid">
            {content.team.map((member, i) => (
              <button
                key={member.id}
                className="team-card"
                onClick={() => setModal({ kind: 'team', index: i })}
                data-reveal
              >
                <div className="team-photo">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    width="900"
                    height="1000"
                  />
                  <span className="team-focus">{member.focus}</span>
                  <span className="team-plus">
                    <Plus size={22} />
                  </span>
                </div>
                <div className="team-meta">
                  <div>
                    <p className="small-label">{member.role}</p>
                    <h3>{member.name}</h3>
                  </div>
                  <ArrowUpRight size={25} />
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="journey-section section-pad">
          <div data-reveal>
            <p className="eyebrow">Randevu süreci</p>
            <h2>Nasıl başlarız?</h2>
            <External className="button" href={wa}>
              WhatsApp’tan yazın <WhatsAppIcon />
            </External>
          </div>
          <div className="journey-steps">
            {[
              [
                'Bize yazın.',
                'WhatsApp’tan yazın ya da telefonla arayın. Konuyu kısaca anlatmanız yeterli.',
              ],
              ['Görüşme planlanır.', 'Uygunluğunuza göre ilk görüşme için gün ve saat belirlenir.'],
              [
                'Görüşmeler başlar.',
                'İlk görüşmede ihtiyacınızı dinler, süreci birlikte planlarız.',
              ],
            ].map(([title, description], i) => (
              <div className="journey-step" key={title} data-reveal>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ArrowUpRight size={20} />
              </div>
            ))}
          </div>
        </section>
        <section id="sorular" className="faq-section section-pad">
          <div data-reveal>
            <p className="eyebrow">Sık sorulanlar</p>
            <h2>Başlamadan önce</h2>
          </div>
          <div className="faq-list">
            {content.faqs.map((item, i) => (
              <div
                className={'faq-item ' + (faq === item.id ? 'open' : '')}
                key={item.id}
                data-reveal
              >
                <h3>
                  <button
                    onClick={() => setFaq((p) => (p === item.id ? null : item.id))}
                    aria-expanded={faq === item.id}
                    aria-controls={'faq-' + item.id}
                  >
                    <span className="faq-number">0{i + 1}</span>
                    <span>{item.question}</span>
                    {faq === item.id ? <Minus size={20} /> : <Plus size={20} />}
                  </button>
                </h3>
                <div id={'faq-' + item.id} className="faq-answer" hidden={faq !== item.id}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="iletisim" className="contact-section section-pad">
          <div className="contact-heading" data-reveal>
            <p className="eyebrow">İletişim</p>
            <h2>Randevu için bize yazın.</h2>
            <p>WhatsApp’tan yazabilir ya da telefonla arayabilirsiniz.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.open(
                  whatsappLink(content, topic || undefined),
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
            >
              <label htmlFor="topic">Hangi konuda bilgi almak istersiniz?</label>
              <div className="contact-form-row">
                <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="">Birlikte karar verelim</option>
                  {content.services.map((s) => (
                    <option key={s.id}>{s.title}</option>
                  ))}
                </select>
                <button className="button button-light" type="submit">
                  WhatsApp’ta görüşelim <WhatsAppIcon />
                </button>
              </div>
              <span className="form-note">
                Mesajınız WhatsApp’ta açılır; göndermeden önce düzenleyebilirsiniz.
              </span>
            </form>
          </div>
          <div className="contact-info" data-reveal>
            <div>
              <span className="small-label">Telefon</span>
              <a className="contact-phone" href={'tel:+' + content.contact.phone}>
                {content.contact.phoneDisplay}
                <ArrowUpRight size={24} />
              </a>
            </div>
            <div>
              <span className="small-label">Adres</span>
              <address>{content.contact.address}</address>
              <External href={content.contact.mapUrl} className="text-link">
                Google Haritalar’da aç <ArrowUpRight size={16} />
              </External>
            </div>
            <p className="contact-hours">{content.contact.hours}</p>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Brand />
          <a href="#baslangic" className="back-to-top">
            Yukarı dön <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Can Psikoloji</span>
          <div>
            <button onClick={() => setModal({ kind: 'privacy' })}>Gizlilik</button>
            <button
              className="motion-toggle"
              aria-pressed={calm}
              onClick={() => setCalm((p) => !p)}
            >
              <VolumeX size={13} />
              {reduced ? 'Sakin görünüm açık' : 'Sakin görünüm'}
            </button>
          </div>
          <span>Özenle, insan için.</span>
        </div>
      </footer>
      <External href={wa} className="floating-whatsapp">
        <WhatsAppIcon />
        <span>Bir merhaba ile başlayın</span>
        <ArrowUpRight size={16} />
      </External>
      <dialog
        ref={menuRef}
        className="mobile-menu"
        aria-label="Gezinme menüsü"
        onCancel={() => setMenu(false)}
        onClose={() => setMenu(false)}
      >
        <div className="mobile-menu-top">
          <Brand />
          <button className="icon-button" onClick={() => setMenu(false)} aria-label="Menüyü kapat">
            <X />
          </button>
        </div>
        <nav aria-label="Mobil gezinme">
          {[...nav, ['Sorularınız', 'sorular'], ['İletişim', 'iletisim']].map(([label, id], i) => (
            <a
              href={'#' + id}
              key={id}
              onClick={(e) => {
                e.preventDefault();
                setMenu(false);
                // Menü kapanıp kaydırma kilidi kalkınca hedefe git.
                setTimeout(() => scrollToId(id, reduced), 120);
              }}
            >
              <span>0{i + 1}</span>
              {label}
              <ArrowUpRight />
            </a>
          ))}
        </nav>
        <External className="button" href={wa}>
          Birlikte başlayalım <WhatsAppIcon />
        </External>
        <span className="small-label">{content.contact.city}</span>
      </dialog>
      <dialog
        ref={modalRef}
        className={'detail-modal ' + (modal?.kind === 'gallery' ? 'photo-modal' : '')}
        aria-label={
          modal?.kind === 'gallery'
            ? 'Merkezimiz fotoğraf galerisi'
            : modal?.kind === 'privacy'
              ? 'Gizlilik hakkında'
              : 'Ayrıntılı bilgi'
        }
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const rect = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            )
              setModal(null);
          }
        }}
      >
        <button
          className="modal-close icon-button"
          onClick={() => setModal(null)}
          aria-label="Pencereyi kapat"
        >
          <X />
        </button>
        {modal?.kind === 'service' &&
          (() => {
            const s = content.services[modal.index];
            const Icon = icons[s.icon];
            return (
              <div className="modal-body">
                <Icon className="modal-symbol" size={40} strokeWidth={1} />
                <p className="eyebrow">{s.subtitle}</p>
                <h2>{s.title}</h2>
                <p>{s.description}</p>
                <div className="tags">
                  {s.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <External className="button" href={whatsappLink(content, s.title)}>
                  Bilgi al & randevu planla <ArrowUpRight size={18} />
                </External>
              </div>
            );
          })()}
        {modal?.kind === 'team' &&
          (() => {
            const m = content.team[modal.index];
            return (
              <div className="member-detail">
                <img src={m.image} alt={m.name} />
                <div className="modal-body">
                  <p className="eyebrow">{m.role}</p>
                  <h2>{m.name}</h2>
                  <p>{m.bio}</p>
                  <p className="small-label">{m.focus}</p>
                  <External
                    className="button"
                    href={whatsappLink(content, m.name + ' ile görüşme')}
                  >
                    Randevu hakkında bilgi alın <ArrowUpRight size={18} />
                  </External>
                </div>
              </div>
            );
          })()}
        {modal?.kind === 'gallery' && (
          <div className="photo-detail">
            <img
              src={content.gallery[modal.index].image}
              alt={content.gallery[modal.index].caption}
            />
            <div>
              <button
                className="icon-button"
                aria-label="Önceki büyük fotoğraf"
                onClick={() =>
                  setModal({
                    kind: 'gallery',
                    index: (modal.index - 1 + content.gallery.length) % content.gallery.length,
                  })
                }
              >
                <ArrowLeft />
              </button>
              <p>
                {content.gallery[modal.index].caption} · {modal.index + 1}/{content.gallery.length}
              </p>
              <button
                className="icon-button"
                aria-label="Sonraki büyük fotoğraf"
                onClick={() =>
                  setModal({ kind: 'gallery', index: (modal.index + 1) % content.gallery.length })
                }
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        )}
        {modal?.kind === 'privacy' && (
          <div className="modal-body">
            <p className="eyebrow">MAHREMİYETİNİZE ÖZEN</p>
            <h2>Gizlilik hakkında</h2>
            <p>
              Bu sitede randevu veya sağlık bilgisi toplayan bir form bulunmaz. İletişim düğmeleri
              sizi WhatsApp, telefon uygulamanız veya Google Haritalar’a yönlendirir. Bu hizmetlerin
              kendi gizlilik koşulları geçerlidir.
            </p>
            <p>
              Sakin görünüm tercihiniz yalnızca tarayıcınızda saklanır. Yönetim paneline giriş
              yapıldığında oturumun korunması için gerekli bir oturum çerezi kullanılır. Siteye
              reklam veya ziyaretçi analizi aracı eklenmemiştir.
            </p>
            <p>
              Görüşmelerin gizliliği ve kişisel verilerin işlenmesiyle ilgili sorularınız için
              merkeze doğrudan ulaşabilirsiniz.
            </p>
            <a className="text-link" href={'tel:+' + content.contact.phone}>
              <Phone size={16} />
              {content.contact.phoneDisplay}
            </a>
          </div>
        )}
      </dialog>
    </>
  );
}
