import { z } from 'zod';

const text = (max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((v) => !/[<>\u0000-\u0008]/.test(v), 'HTML etiketleri kullanılamaz.');
const id = z.string().regex(/^[a-z0-9-]{1,80}$/);
const image = z.string().regex(/^\/(?:images\/[a-z0-9-]+\.webp|media\/[a-f0-9-]+\.webp)$/);
export const contentSchema = z
  .object({
    hero: z.object({
      eyebrow: text(100),
      title: text(100),
      accent: text(100),
      description: text(500),
      image,
    }),
    about: z.object({ title: text(150), description: text(1200), note: text(200) }),
    contact: z.object({
      phone: z.string().regex(/^90\d{10}$/),
      phoneDisplay: text(40),
      address: text(300),
      city: text(100),
      hours: text(200),
      mapUrl: z
        .string()
        .url()
        .max(1000)
        .refine((v) => {
          const u = new URL(v);
          return (
            u.protocol === 'https:' &&
            ['www.google.com', 'maps.google.com', 'maps.app.goo.gl'].includes(u.hostname)
          );
        }, 'Google Haritalar bağlantısı girin.'),
    }),
    services: z
      .array(
        z.object({
          id,
          title: text(100),
          subtitle: text(100),
          description: text(800),
          tags: z.array(text(60)).min(1).max(5),
          icon: z.enum(['person', 'sprout', 'heart', 'sparkles']),
        }),
      )
      .min(1)
      .max(12),
    team: z
      .array(
        z.object({
          id,
          name: text(100),
          role: text(100),
          bio: text(2000),
          image,
          focus: text(200),
        }),
      )
      .min(1)
      .max(12),
    gallery: z
      .array(z.object({ id, image, title: text(100), caption: text(200) }))
      .min(1)
      .max(24),
    faqs: z
      .array(z.object({ id, question: text(200), answer: text(1000) }))
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((content, ctx) => {
    for (const key of ['services', 'team', 'gallery', 'faqs'] as const) {
      const ids = content[key].map((item) => item.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Kayıt kimlikleri benzersiz olmalı.',
        });
    }
  });

export type SiteContent = z.infer<typeof contentSchema>;
export type ContentEnvelope = { content: SiteContent; version: number; updatedAt: string };
export const defaultContent: SiteContent = {
  hero: {
    eyebrow: 'Can Psikoloji',
    title: 'Gebze’de psikolojik',
    accent: 'danışmanlık merkezi.',
    description:
      'Bireysel terapi, çocuk ve ergen, çift ve aile görüşmeleri ile psikolojik test ve değerlendirme. Randevu için WhatsApp’tan yazabilirsiniz.',
    image: '/images/merkez-ana.webp',
  },
  about: {
    title: 'Görüşmeler, ihtiyacınıza ve hızınıza göre planlanır.',
    description:
      'Can Psikoloji’de yetişkinlerle, çocuk ve ergenlerle, çiftler ve ailelerle çalışıyoruz. İlk görüşmede sizi buraya getiren konuyu dinler, nasıl bir süreç izleyeceğimizi birlikte belirleriz.',
    note: '2018’den beri Gebze’de.',
  },
  contact: {
    phone: '905541406244',
    phoneDisplay: '0554 140 62 44',
    address:
      'Osman Yılmaz Mah. Atatürk Cad. No: 44, Üstündağ Apartmanı, Kat: 1, Daire: 1, Gebze / Kocaeli',
    city: 'Gebze, Kocaeli',
    hours: 'Görüşmeler randevu ile planlanır.',
    mapUrl: 'https://www.google.com/maps?cid=5928577831289690245',
  },
  services: [
    {
      id: 'bireysel-terapi',
      title: 'Bireysel terapi',
      subtitle: 'Yetişkinler için',
      description:
        'Duygularınıza, düşüncelerinize ve yaşamınızdaki ilişkilere birlikte bakabileceğimiz bir alan. Sizi zorlayan deneyimleri anlamlandırmak ve ihtiyaçlarınızı keşfetmek için yanınızdayız.',
      tags: ['Duygular', 'Kendini tanıma', 'Yaşam geçişleri'],
      icon: 'person',
    },
    {
      id: 'cocuk-ergen',
      title: 'Çocuk & ergen',
      subtitle: 'Çocuklar ve gençler için',
      description:
        'Her çocuğun ve gencin dünyası kendine özgüdür. Gelişim dönemine ve ihtiyaçlarına uygun bir yaklaşım içinde, aileyle iş birliğini önemseyerek ilerliyoruz.',
      tags: ['Oyun terapisi', 'Ergenlik', 'Ebeveynlik'],
      icon: 'sprout',
    },
    {
      id: 'cift-aile',
      title: 'Çift & aile',
      subtitle: 'Çiftler ve aileler için',
      description:
        'İlişkilerde yaşanan güçlükleri, iletişim biçimlerini ve karşılıklı ihtiyaçları birlikte ele alıyoruz. Her bireyin kendini ifade edebileceği bir görüşme ortamı sunuyoruz.',
      tags: ['İletişim', 'İlişkiler', 'Aile dinamikleri'],
      icon: 'heart',
    },
    {
      id: 'test-degerlendirme',
      title: 'Test & değerlendirme',
      subtitle: 'Psikolojik değerlendirme',
      description:
        'İhtiyaç doğrultusunda seçilen psikolojik değerlendirme araçlarıyla süreci destekliyoruz. Uygun test ve değerlendirme planı, uzman görüşmesi sonrasında belirlenir.',
      tags: ['Dikkat', 'Gelişim', 'Değerlendirme'],
      icon: 'sparkles',
    },
  ],
  team: [
    {
      id: 'nurcan-ayday',
      name: 'Nurcan İlkan Ayday',
      role: 'Klinik Psikolog',
      image: '/images/nurcan-ayday.webp',
      focus: 'Bireysel · Çocuk · Ergen',
      bio: 'Atatürk Üniversitesi Psikolojik Danışmanlık ve Rehberlik lisansının ardından İstanbul Kent Üniversitesi’nde Klinik Psikoloji yüksek lisansını tamamladı. Bütüncül psikoterapi, deneyimsel oyun terapisi ve çocuk merkezli oyun terapisi alanlarında eğitimler aldı. 2018 yılında Can Psikoloji’yi kurdu.',
    },
    {
      id: 'basak-canturk',
      name: 'Başak Cantürk',
      role: 'Psikolog',
      image: '/images/basak-canturk.webp',
      focus: 'Çocuk · Ergen · Oyun terapisi',
      bio: 'Abant İzzet Baysal Üniversitesi Psikoloji Bölümü mezunudur. Çocuk merkezli oyun terapisi, deneyimsel oyun terapisi, çocuk ve ergenlerle EMDR ve psikolojik değerlendirme alanlarında eğitimler aldı.',
    },
  ],
  gallery: [
    {
      id: 'gorusme',
      image: '/images/merkez-ana.webp',
      title: 'Görüşme alanı',
      caption: 'Görüşme alanımız',
    },
    {
      id: 'oda',
      image: '/images/gorusme-odasi.webp',
      title: 'Danışmanlık odası',
      caption: 'Danışmanlık odamız',
    },
    {
      id: 'karsilama',
      image: '/images/merkez-karsilama.webp',
      title: 'Karşılama alanı',
      caption: 'Karşılama alanımız',
    },
    {
      id: 'dis',
      image: '/images/merkez-dis.webp',
      title: 'Merkezimiz',
      caption: 'Merkezimiz',
    },
    {
      id: 'koridor',
      image: '/images/merkez-koridor.webp',
      title: 'Koridor',
      caption: 'Merkezimizden bir detay',
    },
  ],
  faqs: [
    {
      id: 'ilk-gorusme',
      question: 'İlk görüşmede beni ne bekliyor?',
      answer:
        'İlk görüşme, tanışmak ve sizi buraya getiren ihtiyacı anlamak için bir başlangıçtır. Beklentilerinizi paylaşabilir, süreçle ilgili sorularınızı sorabilirsiniz. Birlikte nasıl ilerleyeceğimiz bu görüşmede ele alınır.',
    },
    {
      id: 'randevu',
      question: 'Nasıl randevu alabilirim?',
      answer:
        'WhatsApp üzerinden bize yazabilir veya telefonla arayabilirsiniz. İhtiyacınıza uygun görüşme ve müsaitlik bilgisi için sizinle birlikte planlama yaparız.',
    },
    {
      id: 'sure',
      question: 'Görüşmeler ne kadar sürüyor?',
      answer:
        'Görüşme süresi ve sıklığı; başvuru nedenine, görüşmenin türüne ve ihtiyaçlarınıza göre uzmanınızla birlikte belirlenir. Randevu planlarken ayrıntılı bilgi alabilirsiniz.',
    },
    {
      id: 'online',
      question: 'Çevrim içi görüşme yapabilir miyim?',
      answer:
        'Çevrim içi görüşme seçenekleri ve uygunluk hakkında bilgi almak için bize ulaşabilirsiniz. Görüşme biçimi, ihtiyaçlarınız ve uzman değerlendirmesi doğrultusunda birlikte planlanır.',
    },
    {
      id: 'gizlilik',
      question: 'Görüşmelerin gizliliği nasıl korunuyor?',
      answer:
        'Mahremiyet, çalışma yaklaşımımızın temelidir. Gizliliğin kapsamı ve yasal sınırları hakkında ilk görüşmede uzmanınızdan ayrıntılı bilgi alabilirsiniz.',
    },
  ],
};

export function whatsappLink(content: SiteContent, topic?: string) {
  return `https://wa.me/${content.contact.phone}?text=${encodeURIComponent(topic ? `Merhaba, ${topic} hakkında bilgi almak ve randevu planlamak istiyorum.` : 'Merhaba, ön bilgilendirme almak ve randevu planlamak istiyorum.')}`;
}
