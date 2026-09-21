# Can Psikoloji

Can Psikoloji için krem ve zeytin yeşili tonlarında, fotoğraf ve tipografi odaklı web sitesi; kalıcı içerik yönetim paneliyle birlikte. Astra projesinden bağımsızdır.

## Yerelde çalıştırma

Node.js 22.13 veya üzeri gerekir. Proje Node.js 26.5.1 üzerinde doğrulanmıştır.

```sh
npm ci
npm run admin:setup
npm run dev
```

Site: http://127.0.0.1:5184/ · Yönetim: http://127.0.0.1:5184/admin

Bu makinede ilk kurulum tamamlandı. Yeniden çalıştırırken yalnızca `npm run dev` yeterli.

Kurulum komutu rastgele yönetici parolası üretir ve **bir kez terminalde gösterir**. Kullanıcı adı varsayılan olarak `admin` olarak belirlenir. Parolanın bcrypt özeti ve oturum anahtarı yalnızca Git dışında tutulan `.env` dosyasındadır. Parolayı yenilemek için `npm run admin:setup -- --reset` çalıştırın ve sunucuyu yeniden başlatın; mevcut oturumlar geçersizleşir. İçerik silinmez.

## İçerik yönetimi

- Karşılama başlığı, açıklaması, fotoğrafı ve yaklaşım metni.
- Çalışma alanları: ekleme, düzenleme, silme, sıralama, simge ve etiketler.
- Uzmanlar: öz geçmiş, unvan, çalışma alanı ve fotoğraf.
- Galeri: masaüstünden aktarılan beş fotoğraf, yeni fotoğraf yükleme ve sıralama.
- Soru ve yanıtlar; telefon, WhatsApp numarası, adres ve harita bağlantısı.
- Değişiklikleri yayınlama, kaydedilmemiş düzenlemelerden vazgeçme, son 30 yayının önceki içeriğine dönüş.

Düzenlemeler **Değişiklikleri yayınla** düğmesine basılınca ziyaretçilere yansır. Önceki sürümü geri yüklemek önce düzenleme alanına alır; kendiliğinden yayınlamaz. Aynı içeriği iki oturumun değiştirmesi durumunda sürüm kontrolü sessizce üzerine yazmayı engeller.

Veriler `data/can-psikoloji.sqlite`, yeni yüklemeler `data/media/` içinde kalıcıdır. Tarayıcıda yalnızca sakin görünüm tercihi saklanır. Randevu talebi WhatsApp'ta mesaj taslağı açar; site danışan veya sağlık verisi toplamaz.

## Hareket ve kullanım

GSAP ScrollTrigger ile giriş geçişleri, kaydırmaya bağlı fotoğraf derinliği, kelime renk geçişleri ve dönen halkalar; CSS ile kart hareketleri ve nefes ritminde dekoratif hareketler. Masaüstünde Lenis yumuşak kaydırma, telefonda doğal kaydırma kullanılır. Hareket azaltma sistem tercihi ve kalıcı **Sakin görünüm** düğmesi desteklenir. Menü ve pencereler native dialog kullanır; Escape, odak dönüşü ve arka plan kaydırma kilidi vardır.

Fotoğraflar WebP olarak optimize edilmiştir. Yazı tipleri aynı sunucudan yüklenir. Ziyaretçi sayfası, yönetim panelini ayrı bir paket olarak yükler.

## Doğrulama

```sh
npm run check
npm test
npm run build
npm run test:browser
npm audit
```

`npm test`: geçici veritabanında oturum/CSRF/Origin korumaları, yetkisiz erişim, giriş sınırı, sunucu doğrulaması, XSS, dosya türü ve boyutu, kalıcı yayın, sürüm çakışması ve geçmiş.

Tarayıcı testleri derlenmiş siteyi, gerçek HTTPS ve güvenli çerezlerle geçici bir sunucuda çalıştırır. Ayrı geçici veritabanı kullanır; yerel proje içeriğini değiştirmez. Bu Mac'te bağımsız Chromium kullanılır. Başka makinelerde önce `npx playwright install chromium` çalıştırın. Testler için `openssl` gerekir. Kişisel tarayıcı profilleri kullanılmaz. Ekran görüntüleri ve raporlar `artifacts/` içine yazılır.

## Canlı yayın

Henüz canpsikoloji.com'a dağıtılmadı. Bu uygulama sunucu gerektirir; yönetim paneli nedeniyle yalnızca statik hosting yeterli değildir.

1. Node.js destekleyen **tek uygulama süreci** ve kalıcı disk kullanın. `data/` klasörünü kalıcı bir diske bağlayın; yedeklemesini sağlayın. SQLite ile yatay ölçekleme veya geçici serverless disk kullanmayın.
2. `npm ci` ve `npm run build` çalıştırın. Çalıştırma komutu `npm start`tır. `tsx` çalışma zamanı bağımlılığıdır; `npm ci --omit=dev` sonrası da uygulama çalışır.
3. `.env` değerlerinde `APP_ORIGIN=https://canpsikoloji.com`, güçlü `SESSION_SECRET`, yönetici adı ve bcrypt parola özeti kullanın. `.env.example` boş şablondur. Gerçek `.env` dosyasını Git'e veya `dist/` içine koymayın.
4. HTTPS sonlandıran tek güvenilir reverse proxy arkasında `TRUST_PROXY=1` kullanın; uygulama portunu internete doğrudan açmayın. Gerekirse `HOST=0.0.0.0` ayarlayın. Proxy, `X-Forwarded-Proto` ve istemci IP başlıklarını doğru yönetmelidir.
5. Alan adı/SSL ve kalıcı disk bağlandıktan sonra giriş, fotoğraf yükleme, içerik yayını ve WhatsApp bağlantısını canlı ortamda doğrulayın.

Üretim sunucusu HTTPS origin olmadan açılmaz. Passport + SQLite oturum deposu, bcrypt 12, HttpOnly/Secure/SameSite çerezleri, bir saatlik oturum, Origin ve CSRF doğrulaması, rol kontrolü, hız sınırları ve Helmet başlıkları uygulanır. Yüklenen dosyalar boyut/MIME/uzantı ve gerçek görüntü içeriğiyle doğrulanır, yeniden kodlanır, EXIF'ten arındırılır ve UUID adıyla web kökü dışında saklanır. Hız sınırları tek uygulama süreci içindir.

Kaynaklar ve doğrulanan işletme bilgileri: [docs/kaynaklar.md](docs/kaynaklar.md).
