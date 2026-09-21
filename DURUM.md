# Can Psikoloji — 21 Eylül 2026

## İstek ve kapsam

Kaan, canpsikoloji.com'un masaüstündeki gerçek fotoğraflarla, modern ve hareketli tasarımla, WhatsApp yönlendirmesi ve yönetim paneliyle yeniden hazırlanmasını istedi. Eski sitenin adresini Google Haritalar'dan doğrulama talebi uygulandı.

Yeni proje `/Users/bekaans/Desktop/Yazılım/CanPsikoloji` içinde. Astra / websitem vitrini ve mevcut değişiklikleri korunmuştur. Yerel Git deposu oluşturuldu; commit, push ve canlı yayın yapılmadı.

## Çalışan adresler

- Site: http://127.0.0.1:5184/
- Yönetim: http://127.0.0.1:5184/admin
- Başlatma: `npm run dev`.
- Yönetici kullanıcı adı Kaan'ın isteğiyle `admin` olarak değiştirildi; parola korunmuştur. Yeni kurulumlarda da varsayılan kullanıcı adı `admin` olur. Kaynaklarda parola yok; `.env` içinde bcrypt özeti bulunur. Yenileme: `npm run admin:setup -- --reset`, ardından sunucuyu yeniden başlatın.

## Tamamlananlar

- Krem / koyu zeytin renkleri, Cormorant Garamond / Manrope tipografisi, yeni SVG marka işareti.
- Masaüstündeki beş fotoğraf ve mevcut siteden iki uzman portresi WebP olarak yerelde sunuluyor.
- GSAP giriş ve kaydırma animasyonları; fotoğraf paralaksı, kelime renk geçişleri, dönen şekiller, hareketli rozet, kart etkileşimleri. Masaüstünde Lenis, telefonda doğal kaydırma. Sistem hareket azaltma ve sakin görünüm destekli.
- Hizmet / uzman ayrıntı pencereleri, beş fotoğraflı galeri, fotoğraf büyütme, sorular akordeonu, mobil menü, klavye/odak desteği.
- WhatsApp **905541406244**. Hizmet seçimi mesaj taslağına eklenir; site randevu/sağlık verisi saklamaz.
- Adres: **Osman Yılmaz Mah. Atatürk Cad. No: 44, Üstündağ Apartmanı, Kat: 1, Daire: 1, Gebze / Kocaeli**. Google işletme CID: `5928577831289690245`. Kaynak ve fotoğraf eşlemeleri `docs/kaynaklar.md`.
- React yönetim: ana sayfa metni / fotoğrafı, hizmetler, uzmanlar, galeri, sorular, iletişim bilgileri. Ekleme / sıralama / silme, fotoğraf yükleme, kalıcı yayın, çakışma denetimi ve 30 sürümlük geçmiş.
- Express + Passport + bcrypt 12 + SQLite: kalıcı oturumlar, HttpOnly / Secure / SameSite çerezleri, CSRF / Origin / rol denetimi, istek ve giriş sınırları, Helmet / CSP. Dosyalar gerçek içerikle doğrulanıp yeniden WebP kodlanır; UUID adıyla web kökü dışında tutulur.
- Eski WordPress sayfaları yeni bölümlere 301 yönlendirilir. robots / sitemap vardır. Yönetim noindex.

## Dosya haritası

- `src/Site.tsx`, `styles.css`, `readability.css`: ziyaretçi arayüzü ve responsive düzen.
- `src/useMotion.ts`: GSAP / Lenis yaşam döngüsü ve azaltılmış hareket.
- `src/Admin.tsx`, `admin.css`: oturum açma ve içerik yönetimi.
- `shared/content.ts`: içerik tipleri, sunucu/istemci Zod şeması, başlangıç içeriği, WhatsApp URL üretimi.
- `server/app.ts`: API, auth, güvenlik, yayın, geçmiş ve yükleme.
- `server/database.ts`: SQLite veritabanı ve oturum deposu.
- `server/index.ts`: Vite geliştirme / derlenmiş üretim sunucusu.
- `scripts/setup-admin.ts`: yönetici kurulumu ve parola sıfırlama.
- `tests/server.test.ts`: güvenlik ve kalıcı içerik API testleri.
- `tests/browser.spec.ts`, `fixture-server.ts`: derlenmiş uygulamayı geçici HTTPS sunucusunda test eder; gerçek proje verisini değiştirmez.

## Doğrulama ve yayın

TypeScript kontrolü ve üretim derlemesi geçti. Sunucu testleri 7/7, tarayıcı senaryoları 4/4 geçti. Tarayıcı kontrolleri masaüstü, 320/390/430/768/844 piksel ekranlar, hizmet / uzman / galeri / WhatsApp, hareket tercihi, yönetici girişi, yayın, sürüm geri dönüşü, dosya yükleme, çıkış ve güvenli çerezleri kapsar. Ana sayfa / mobil menü / ayrıntı penceresi / yönetim erişilebilirlik kontrolleri geçti. Yönetimin sekiz sekmesindeki ek axe kontrolünde ihlal yok. Bunlar otomatik Chromium kontrolleridir; gerçek iOS/Safari testi değildir.

`npm audit` açık bildirmedi. `git diff --check` temiz. `.env`, veritabanı, yüklemeler ve test çıktıları Git dışında.

Ekran görüntüleri ve raporlar `artifacts/`: `final-desktop.png`, `final-mobile.png`, `final-fullpage.png`, `admin-dashboard.png`, `admin-mobile.png`, `browser-results.json`, `admin-accessibility.json`. Testler bağımsız headless Chromium kullanır; kişisel tarayıcı profillerine dokunulmadı.

Canlı yayın için Node sunucusu, kalıcı `data/` diski, HTTPS ve alan adı bağlantısı gerekir. Uygulama tek süreç için yapılandırıldı; yatay ölçekleme / geçici serverless disk hedeflenmiyor. Üretim env ve çalıştırma adımları README'de. Henüz canpsikoloji.com'a dağıtılmadı.
