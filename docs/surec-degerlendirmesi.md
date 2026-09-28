# Can Psikoloji Web Sitesi – Test Süreci Değerlendirmesi

Bu belge, siteye yayına almadan önce uyguladığımız otomatik testleri isim isim ve ne
amaçla çalıştırıldıklarını açıklayacak şekilde listeler. Her test, gerçek bir tarayıcı
veya gerçek bir sunucu üzerinde uçtan uca çalışır; sahte (mock) veri kullanılmaz.

Testler iki grupta toplanır:

1. **Sunucu ve güvenlik testleri** (`tests/server.test.ts`) — arka planda çalışan
   Express/SQLite sunucusunu, sahte ağ isteği göndererek test eder.
2. **Tarayıcı testleri** (`tests/browser.spec.ts`) — Playwright ile gerçek bir Chromium
   tarayıcısı açılır, siteye gerçek bir kullanıcı gibi tıklanır, kaydırılır ve yazılır.

Yayına almadan önce her iki grup da çalıştırılır; tek bir test bile kırmızı (başarısız)
ise yayın yapılmaz.

---

## 1. Sunucu ve Güvenlik Testleri (`tests/server.test.ts`)

### 1.1 "Herkese açık içerik, güvenlik başlıkları ve yetkisiz erişim"
Ne doğrular: Sitenin herkese açık içerik API'sinin (`/api/content`) doğru veri
döndürdüğünü; eski `canpsikoloji.com` adresindeki linklerin (`/index.php/bize-ulasin/`
gibi) yeni siteye doğru yönlendirildiğini (301 yönlendirme); tarayıcıyı saldırılara karşı
koruyan güvenlik başlıklarının (`X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, `Content-Security-Policy`) sunucu tarafından gönderildiğini; ve giriş
yapmadan admin API'lerine (`içerik değiştirme`, `fotoğraf yükleme`, `sürüm geçmişi`)
erişmeye çalışan birinin 401 (yetkisiz) hatası aldığını.

### 1.2 "Origin ve CSRF kontrolü; oturum yenileme"
Ne doğrular: Giriş isteğinin yalnızca sitenin kendi adresinden (`Origin`) geldiğinde
kabul edildiğini — başka bir siteden (`evil.example`) gönderilen giriş isteğinin
reddedildiğini (CSRF/Origin saldırısı koruması); yanlış CSRF jetonuyla (token) yapılan
isteklerin reddedildiğini; yanlış şifreyle girişin 401 döndüğünü; doğru girişte oturum
çerezinin `HttpOnly` (JavaScript ile okunamaz) ve `SameSite=Strict` (başka sitelerden
gönderilemez) olarak ayarlandığını; ve her girişte CSRF jetonunun yenilendiğini.

### 1.3 "Sunucuda alan doğrulaması, XSS ve dosya yolu koruması"
Ne doğrular: Admin panelinden gönderilen içeriğin sunucu tarafında da kontrol edildiğini
— sadece tarayıcıdaki forma güvenilmediğini. Şu saldırı/hata senaryolarının tek tek
reddedildiğini test eder:
- Başlık alanına `<script>` etiketi yazılması (XSS – siteye kötü amaçlı kod enjekte
  etme girişimi),
- İletişim harita linkine `javascript:` protokolü yazılması (link tıklanınca kod
  çalıştırma girişimi),
- İletişim harita linkinin izin verilmeyen bir alan adına (`evil.example`) yönlendirilmesi,
- Fotoğraf yoluna `../../.env` gibi bir "dizin gezinme" (path traversal) ifadesi
  yazılarak sunucudaki gizli dosyalara (`.env` — şifreler, anahtarlar) erişilmeye
  çalışılması,
- Geçersiz bir telefon numarası formatı girilmesi,
- Aynı hizmetin listeye iki kez eklenmesi (veri bütünlüğü),
- Var olmayan bir fotoğraf dosyasına referans verilmesi,
- Geçersiz CSRF jetonuyla içerik kaydetme girişimi.

### 1.4 "Fotoğraf MIME, gerçek içerik ve boyut denetimi"
Ne doğrular: Fotoğraf yükleme sisteminin, dosya uzantısına değil dosyanın **gerçek
içeriğine** baktığını. Şu senaryoları test eder:
- `.png` uzantılı ama içi gerçekte SVG/HTML kodu (`<svg onload="alert(1)">`) olan bir
  dosyanın reddedilmesi (uzantı sahteciliğiyle kötü amaçlı dosya yükleme girişimi),
- Beyan edilen tür (`image/jpeg`) ile dosyanın gerçek türü (aslında PNG) uyuşmadığında
  reddedilmesi,
- 5 MB sınırını aşan dosyaların reddedilmesi,
- Geçerli bir fotoğrafın kabul edilip otomatik olarak güvenli `.webp` formatına
  dönüştürüldüğünün ve doğru `image/webp` türüyle sunucudan geri alınabildiğinin
  doğrulanması.

### 1.5 "Yayın, çakışma koruması, sürüm geçmişi ve kalıcılık"
Ne doğrular: Admin panelinden yapılan bir değişikliğin kaydedildiğini ve sürüm
numarasının arttığını; **iki kişinin aynı anda** eski bir sürüm üzerinden kaydetmeye
çalışması durumunda ikincisinin "409 çakışma" hatası alıp verinin üzerine
yazılmadığını (veri kaybı koruması); her kaydın bir "sürüm geçmişi" kaydı
oluşturduğunu ve eski bir sürümün geri okunabildiğini; geçersiz bir sürüm numarasıyla
istek yapıldığında hata döndüğünü; ve en önemlisi — sunucu yeniden başlatılmış gibi
davranan **ikinci, bağımsız bir sunucu örneğinin** aynı veriyi diskten okuyup
gösterebildiğini (yani içeriğin belleğe değil, kalıcı olarak diske/veritabanına
yazıldığını).

### 1.6 "Çıkış oturumu iptal eder; giriş denemeleri sınırlandırılır"
Ne doğrular: Çıkış yapıldığında oturumun sunucu tarafında da geçersiz kılındığını
(çerez tarayıcıda kalsa bile artık işe yaramadığını); ve art arda 6 kez yanlış şifreyle
giriş denendiğinde sistemin "429 çok fazla deneme" hatası verip belirli bir süre
boyunca yeni denemeleri engellediğini (kaba kuvvet / brute-force saldırısı koruması).

---

## 2. Tarayıcı Testleri (`tests/browser.spec.ts`)

### 2.1 "Erişilebilirlik: ana sayfa, menü, ayrıntılar ve yönetim"
Ne doğrular: Sitenin görme, işitme veya hareket kısıtlılığı olan ziyaretçiler için
de kullanılabilir olduğunu. Uluslararası **WCAG 2.0/2.1 AA** erişilebilirlik
standardına göre (axe-core motoruyla) şu ekranların **hiçbir ihlal içermediğini**
tek tek denetler: ana sayfa, bir hizmet detayı açıkken, mobil menü açıkken, admin
giriş ekranı, admin paneli içi ve admin ana sayfa düzenleme ekranı. Ayrıca hareket
azaltma tercihi (`reduced motion` — bazı kullanıcıların işletim sisteminde
animasyonları kısan ayar) açıkken sitenin buna saygı gösterdiğini kontrol eder.

### 2.2 "Masaüstü: gezinme, hizmetler, uzmanlar, galeri, sorular ve WhatsApp"
Ne doğrular: Masaüstü (büyük ekran) ziyaretçisinin tüm ana yolculuğunu uçtan uca
simüle eder:
- Ana başlığın doğru metinle göründüğünü,
- Sayfadaki tüm ana bölümlere (yaklaşım, hizmet alanları, merkez, uzmanlar, sorular,
  iletişim) kaydırıldığında sayfanın konsola hiçbir JavaScript hatası basmadığını,
- Bir hizmet kartına tıklandığında doğru detay penceresinin (`Bireysel terapi`) açılıp
  `Esc` tuşuyla kapandığını,
- Bir uzman kartına tıklandığında doğru uzman bilgisinin göründüğünü,
- Fotoğraf galerisinde "sonraki fotoğraf" gezinmesinin doğru çalıştığını,
- Sık sorulan soruların açılıp kapandığını (akordeon),
- İletişim formunda bir konu (`Çift & aile`) seçildiğinde, **"Bize WhatsApp'tan
  yazabilirsiniz"** butonuna basınca doğru WhatsApp numarasına (905541406244) ve
  seçilen konuyu içeren doğru mesaj metniyle yönlendirme yapıldığını,
- Google Haritalar linkinin doğru işletme kaydına gittiğini,
- Gizlilik bilgilendirmesinin doğru açıldığını.

### 2.3 "Mobil: dar ekranlar, menü, odak ve hareket tercihi"
Ne doğrular: Sitenin 5 farklı mobil/tablet genişliğinde (320, 390, 430, 768, 844 piksel
— en küçük telefondan tablete kadar) **yatay taşma olmadan** (yatay kaydırma çubuğu
çıkmadan) düzgün göründüğünü. Ayrıca:
- Mobil menünün açılıp `Esc` ile kapandığını ve kapanınca odağın (klavye/ekran okuyucu
  odağı) doğru şekilde menü düğmesine geri döndüğünü (erişilebilirlik),
- Mobil menüden bir bölüme (`#alanlar`) tıklanınca menünün kapanıp doğru bölüme
  kaydırıldığını,
- "Sakin görünüm" (hareket azaltma) düğmesinin çalıştığını ve sayfa yenilendiğinde bu
  tercihin hatırlandığını,
- Metin renginin okunabilirlik için beklenen koyu tonda (`rgb(33, 30, 28)`)
  olduğunu — yani metinlerin soluk/şeffaf görünmediğini.

### 2.4 "Yönetim: güvenli giriş, kalıcı yayın, sürüm geri yükleme, fotoğraf yükleme ve çıkış"
Ne doğrular: Admin panelinin tüm günlük kullanım akışını uçtan uca simüle eder:
- Kullanıcı adı/şifreyle giriş yapılabildiğini; oturum çerezinin güvenli bayraklarla
  (`HttpOnly`, `Secure`, `SameSite=Strict`) geldiğini,
- Ana sayfa başlığının değiştirilip "Değişiklikleri yayınla" ile kaydedildiğini ve
  sayfa yenilendiğinde değişikliğin kalıcı olduğunu,
- Yayınlanan değişikliğin **gerçek herkese açık sitede** (yeni bir sekmede açılan
  `publicPage`) de göründüğünü — yani admin panelinin gerçekten canlı içeriği
  değiştirdiğini,
- "İçerik geçmişi" ekranından eski bir sürümün geri yüklenebildiğini,
- Fotoğraf galerisine yeni bir fotoğraf yüklenip açıklamasının girilip yayınlanabildiğini,
- Panelin mobil genişlikte de (390px) yatay taşma olmadan kullanılabildiğini,
- Çıkış yapıldıktan sonra artık admin API'lerine erişilemediğini (401).

---

## Sonuç

Toplamda **11 ayrı senaryo** (6 sunucu/güvenlik + 5 tarayıcı) her yayın öncesi otomatik
olarak çalıştırılır. Bu senaryolar; güvenlik açıklarını (XSS, CSRF, dosya yolu
sızıntısı, kaba kuvvet girişimi, sahte dosya yükleme), veri kaybı risklerini (eşzamanlı
kayıt çakışması, kalıcılık), erişilebilirlik standartlarını (WCAG 2.1 AA) ve gerçek
kullanıcı yolculuklarını (mobil/masaüstü gezinme, randevu/WhatsApp akışı, admin panel
kullanımı) kapsar. Son çalıştırmada 11 testin **tamamı başarılı** sonuçlanmıştır.
