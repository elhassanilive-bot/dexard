export const site = {
  name: 'دريبدو',
  nameEn: 'Dribdo',
  description:
    'دريبدو منصة اجتماعية عربية متكاملة تجمع النشر والتفاعل والدردشة والفيديو والمجتمعات والمساحات، مع خدمات إضافية مثل السوق والعقارات والوظائف والمذكرات داخل تجربة واحدة واضحة ومنظمة.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dribdo.com',
  socials: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || '',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || '',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL || '',
  },
};
