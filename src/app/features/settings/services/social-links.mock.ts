import type { SocialLinksDocument } from '../models/social-links.model';

const descriptionAr =
  'نقدم في كود التقنية حلول رقمية متكاملة تشمل تصميم وتطوير المواقع والتطبيقات، مع التركيز على تجربة المستخدم والجودة التقنية.';

const descriptionEn =
  'At CodeTech we deliver end-to-end digital solutions including website and app design and development, with a focus on UX and technical quality.';

export const SOCIAL_LINKS_SEED: SocialLinksDocument = {
  site: {
    description: { ar: descriptionAr, en: descriptionEn },
    phone: '+966 55 298 3389',
    email: 'CodeTech@Gmail.com',
    imageName: 'codetech-logo.svg',
    imageUrl: 'images/codeTech.svg',
  },
  location: {
    name: { ar: 'المملكة العربية السعودية', en: 'Kingdom of Saudi Arabia' },
    mapUrl: 'WWW.CodeTech.Com',
  },
  // Order matches Figma RTL grid: LinkedIn|Facebook, X|Instagram, Snapchat|TikTok, WhatsApp.
  channels: [
    {
      id: 'ch-linkedin',
      platform: 'linkedin',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.Linkedin.Com/Company/Codetech',
        en: 'Https://Www.Linkedin.Com/Company/Codetech',
      },
    },
    {
      id: 'ch-facebook',
      platform: 'facebook',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.Facebook.Com/Codetech',
        en: 'Https://Www.Facebook.Com/Codetech',
      },
    },
    {
      id: 'ch-twitter',
      platform: 'twitter',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.X.Com/Codetech',
        en: 'Https://Www.X.Com/Codetech',
      },
    },
    {
      id: 'ch-instagram',
      platform: 'instagram',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.Instagram.Com/Codetech',
        en: 'Https://Www.Instagram.Com/Codetech',
      },
    },
    {
      id: 'ch-snapchat',
      platform: 'snapchat',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.Snapchat.Com/Add/Codetech',
        en: 'Https://Www.Snapchat.Com/Add/Codetech',
      },
    },
    {
      id: 'ch-tiktok',
      platform: 'tiktok',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Www.Tiktok.Com/@Codetech',
        en: 'Https://Www.Tiktok.Com/@Codetech',
      },
    },
    {
      id: 'ch-whatsapp',
      platform: 'whatsapp',
      enabled: true,
      status: 'published',
      url: {
        ar: 'Https://Wa.Me/966552983389',
        en: 'Https://Wa.Me/966552983389',
      },
    },
  ],
  updatedAt: '2026-09-19',
};
