import HelpCenterPageView from '@/components/HelpCenterPageView';

export const metadata = {
  title: 'مركز المساعدة | دريبدو',
  description: 'ابحث في مركز المساعدة عن إجابات واضحة حول التسجيل، النشر، الدردشة، الخصوصية، الأقسام الإضافية، والمشاكل التقنية في دريبدو.',
  alternates: { canonical: '/help-center' },
};

export default function HelpCenterPage() {
  return <HelpCenterPageView />;
}
