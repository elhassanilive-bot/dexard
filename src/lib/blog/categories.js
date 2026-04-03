export const BLOG_CATEGORY_TREE = [
  {
    name: "التكنولوجيا",
    children: ["الذكاء الاصطناعي", "أجهزة الكمبيوتر والإلكترونيات"],
  },
  {
    name: "التاريخ",
    children: [],
  },
  {
    name: "الاستثمار",
    children: ["اقتصاد", "المال والأعمال"],
  },
  {
    name: "الرياضة",
    children: ["الرياضة البدنية", "اليوجا"],
  },
  {
    name: "السفر",
    children: [],
  },
  {
    name: "السياسة",
    children: ["شرق أوسط", "عالم"],
  },
  {
    name: "الفنون",
    children: ["ثقافة", "منوعات"],
  },
  {
    name: "الحيوانات",
    children: [],
  },
  {
    name: "البيئة",
    children: [],
  },
  {
    name: "تطوير الذات",
    children: ["الصحة النفسية", "التعليم والتواصل"],
  },
  {
    name: "الصحة",
    children: ["صحة الأم", "النوم والراحة", "الوجبات والتغذية"],
  },
  {
    name: "المرأة",
    children: ["حقوق المرأة", "اهتمامات المرأة", "إعدادات المرأة"],
  },
  {
    name: "الطبخ",
    children: [],
  },
];

function normalizeName(value) {
  return String(value || "").trim();
}

export function mergeCategoryTree(baseTree = BLOG_CATEGORY_TREE, extraItems = []) {
  const grouped = new Map();

  (baseTree || []).forEach((group) => {
    const parent = normalizeName(group?.name);
    if (!parent) return;

    const children = [...new Set((group?.children || []).map(normalizeName).filter(Boolean))];
    grouped.set(parent, children);
  });

  (extraItems || []).forEach((item) => {
    const parent = normalizeName(item?.categoryParent || item?.parent || item?.name);
    const child = normalizeName(item?.category || item?.child);
    if (!parent) return;

    if (!grouped.has(parent)) {
      grouped.set(parent, []);
    }

    if (child && child !== parent) {
      const currentChildren = grouped.get(parent) || [];
      if (!currentChildren.includes(child)) {
        grouped.set(parent, [...currentChildren, child]);
      }
    }
  });

  return [...grouped.entries()].map(([name, children]) => ({
    name,
    children,
  }));
}

export function getParentCategoryOptions(tree = BLOG_CATEGORY_TREE) {
  return mergeCategoryTree(tree).map((item) => item.name);
}

export function getChildCategoryOptions(parentCategory, tree = BLOG_CATEGORY_TREE) {
  const parent = normalizeName(parentCategory);
  if (!parent) return [];

  return mergeCategoryTree(tree).find((item) => item.name === parent)?.children || [];
}

export function flattenBlogCategories(tree = BLOG_CATEGORY_TREE) {
  return mergeCategoryTree(tree).flatMap((item) => [item.name, ...item.children]);
}

export function resolveCategorySelection(parentCategory, childCategory, customParentCategory = "", customChildCategory = "") {
  const customParent = normalizeName(customParentCategory);
  const selectedParent = normalizeName(parentCategory);
  const parent = customParent || selectedParent;

  const customChild = normalizeName(customChildCategory);
  const selectedChild = normalizeName(childCategory);
  const category = customChild || selectedChild || parent;

  if (!parent) {
    return {
      categoryParent: null,
      category: null,
    };
  }

  return {
    categoryParent: parent,
    category,
  };
}
