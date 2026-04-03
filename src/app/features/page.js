export const metadata = {
  title: 'مميزات دريبدو',
  description: 'استكشف مميزات دريبدو الأساسية والأقسام التي تجمع النشر والتواصل والخدمات داخل تجربة واحدة منظمة.',
  alternates: { canonical: '/features' },
};

const featureGroups = [
  {
    title: 'النشر والمحتوى',
    intro: 'منظومة نشر مرنة تناسب الاستخدام اليومي وصنّاع المحتوى والحسابات المهنية.',
    items: [
      { title: 'منشورات متعددة الأنواع', description: 'انشر نصوصًا، صورًا، فيديوهات، تسجيلات صوتية، مستندات، ومحتوى تفاعلي ضمن نفس التجربة.' },
      { title: 'القصص', description: 'شارك لحظاتك اليومية بصيغة سريعة سواء كانت صورة أو فيديو أو خلفية نصية مخصصة.' },
      { title: 'التفاعلات والتعليقات', description: 'تفاعل مع المحتوى عبر مجموعة واسعة من التفاعلات، وأرسل تعليقات نصية أو مرئية أو صوتية.' },
      { title: 'التحكم في الرؤية', description: 'اختر من يمكنه رؤية المنشور أو التعليق عليه، وعدّل الإعدادات وفق طبيعة كل محتوى.' },
    ],
  },
  {
    title: 'الفيديو والتصفح',
    intro: 'تجربة مشاهدة حديثة تسهّل التنقل بين المقاطع والوصول إلى المحتوى المرئي بسرعة.',
    items: [
      { title: 'قسم فيديوهات تسلسلي', description: 'تصفح المقاطع بطريقة عمودية سلسة، وانتقل من فيديو إلى آخر بسرعة ووضوح.' },
      { title: 'نسخ ومشاركة وإبلاغ', description: 'تحكم في الفيديو عبر نسخ الرابط والمشاركة والتنزيل والإبلاغ من واجهة موحدة.' },
      { title: 'عرض أخف للمحتوى المرئي', description: 'واجهة تركز على الفيديو نفسه بدل تشتيت الانتباه بعناصر زائدة أو توزيع غير مريح.' },
    ],
  },
  {
    title: 'الدردشة والرسائل',
    intro: 'قناة تواصل مباشرة للأحاديث الفردية والجماعية مع دعم أنواع متعددة من الرسائل.',
    items: [
      { title: 'محادثات فردية وجماعية', description: 'أنشئ محادثة مباشرة أو غرفة جماعية وتابع الطلبات والردود من قسم منظم.' },
      { title: 'وسائط وملفات', description: 'أرسل صورًا، فيديوهات، مستندات، ورسائل صوتية داخل الدردشة بدون الحاجة لخدمة خارجية.' },
      { title: 'طلبات المراسلة', description: 'راجع الطلبات الجديدة قبل قبولها وتحكم في من يمكنه الوصول إلى محادثاتك.' },
    ],
  },
  {
    title: 'المجتمعات والمساحات',
    intro: 'أدوات مخصصة لبناء الحضور العام وإدارة المجتمعات والاهتمامات المشتركة.',
    items: [
      { title: 'المساحات', description: 'أنشئ مساحة لعلامتك التجارية أو مشروعك أو حضورك العام وانشر فيها بطريقة احترافية.' },
      { title: 'المجتمعات', description: 'ابنِ مجتمعك الخاص واسمح للأعضاء بالنشر والتفاعل والنقاش ضمن إطار منظم.' },
      { title: 'القنوات', description: 'قدّم محتواك لمتابعيك في واجهة مناسبة للمبدعين والجهات والعلامات.' },
    ],
  },
  {
    title: 'الأقسام الخدمية',
    intro: 'دريبدو لا يكتفي بالتواصل، بل يضم أقسامًا عملية توسع قيمة التطبيق في الحياة اليومية.',
    items: [
      { title: 'السوق', description: 'اعرض المنتجات والخدمات وتواصل مع المشترين أو البائعين داخل واجهة واضحة.' },
      { title: 'العقارات', description: 'انشر عروض البيع أو الإيجار وتصفح الإعلانات العقارية ضمن قسم مخصص.' },
      { title: 'الوظائف', description: 'ابحث عن فرص عمل أو انشر إعلانًا مهنيًا لجذب المرشحين المناسبين.' },
      { title: 'بيت الحلال', description: 'قسم مخصص للتعارف الجاد والبحث عن شريك حياة ضمن بيئة أكثر وضوحًا واحترامًا.' },
      { title: 'الصدقات', description: 'قدّم المساعدة أو اطلبها بطريقة تحفظ الكرامة وتسمح بتنظيم التبرع والاحتياج.' },
    ],
  },
  {
    title: 'الإنتاجية والأدوات',
    intro: 'مساحات إضافية تساعد المستخدم على تنظيم يومه والاستفادة من التطبيق خارج النشر والتواصل فقط.',
    items: [
      { title: 'المذكرات والتذكيرات', description: 'سجّل يومياتك ومهامك وخططك وتذكيراتك الدراسية أو العملية أو الشخصية.' },
      { title: 'الجداول', description: 'أنشئ جداول وخططًا بسيطة لتنظيم البيانات والمخططات داخل التطبيق.' },
      { title: 'أدوات إضافية', description: 'استفد من أدوات مساندة مثل الحاسبة والتلفاز والقرآن وأوقات الصلاة والتسبيح وغيرها.' },
    ],
  },
  {
    title: 'الخصوصية والأمان',
    intro: 'بنية إعدادات تمنح المستخدم سيطرة أوضح على الحساب والمحتوى والتفاعل.',
    items: [
      { title: 'إدارة الحساب', description: 'تحكم في البريد وكلمة المرور وتسجيل الدخول والحذف أو إلغاء التنشيط ومراجعة البيانات الأساسية.' },
      { title: 'إعدادات الخصوصية', description: 'اضبط خصوصية الحساب، والرؤية، والتعليقات، والمتابعة، والحظر، والإخفاء.' },
      { title: 'المحفوظات والأرشيف', description: 'راجع العناصر المحفوظة وأرشيف القصص وبعض السجلات المرتبطة باستخدامك.' },
    ],
  },
];

function FeatureIcon({ index }) {
  const icons = [
    <path key="1" d="M5 19h14M7 16V8m5 8V5m5 11v-6" strokeLinecap="round" strokeLinejoin="round" />,
    <path key="2" d="M4 12h16M12 4v16" strokeLinecap="round" />,
    <path key="3" d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />,
    <path key="4" d="M6 18 18 6M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />,
    <>
      <path key="5" d="M5 12a7 7 0 1 1 7 7" strokeLinecap="round" />
      <path key="5b" d="M12 9v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    <path key="6" d="M6 8h12M6 12h12M6 16h8" strokeLinecap="round" />,
    <path key="7" d="M6 6h12v12H6z" strokeLinecap="round" strokeLinejoin="round" />,
  ];

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-black" fill="none" stroke="currentColor" strokeWidth="1.8">
      {icons[index % icons.length]}
    </svg>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f1] text-black">
      <section className="border-b border-black/8">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 text-right">
              <p className="text-sm font-semibold uppercase tracking-[0.45em] text-black/35">المميزات</p>
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">كل ما يقدمه دريبدو داخل تجربة واحدة متماسكة</h1>
              <p className="max-w-3xl text-lg leading-8 text-black/65">
                تم تصميم دريبدو ليجمع النشر والتواصل والدردشة والفيديو والمجتمعات والخدمات اليومية في منتج واحد
                واضح ومنظم، بحيث لا يضطر المستخدم للتنقل بين تطبيقات كثيرة من أجل مهام متفرقة.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-black/35">نظرة سريعة</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  'منشورات وصور وفيديو وصوت ومستندات',
                  'قصص ودردشة ورسائل جماعية',
                  'مساحات ومجتمعات وقنوات',
                  'سوق وعقارات ووظائف وبيت الحلال',
                ].map((item, index) => (
                  <article key={item} className="rounded-[1.5rem] bg-[#faf8f6] p-5">
                    <div className="mb-4"><FeatureIcon index={index} /></div>
                    <p className="text-sm leading-7 text-black/70">{item}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {featureGroups.map((group, groupIndex) => (
            <article key={group.title} className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm">
              <div className="mb-8 text-right">
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-black/35">مجال الميزة</p>
                <h2 className="mt-3 text-3xl font-black text-black">{group.title}</h2>
                <p className="mt-4 max-w-4xl text-base leading-8 text-black/65">{group.intro}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((item, itemIndex) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-black/10 bg-[#fcfbf9] p-5">
                    <div className="mb-4"><FeatureIcon index={groupIndex + itemIndex} /></div>
                    <h3 className="text-xl font-bold text-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-8 text-black/65">{item.description}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
