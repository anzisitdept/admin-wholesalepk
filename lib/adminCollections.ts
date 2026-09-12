export interface SubCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  subcategories: SubCategoryOption[];
}

export const ADMIN_COLLECTIONS: CategoryOption[] = [
  {
    id: "necklaces",
    name: "Necklaces",
    slug: "necklaces",
    subcategories: [
      { id: "pendant-necklaces", name: "Pendants & Chains", slug: "pendant-necklaces" },
      { id: "chokers", name: "Chokers", slug: "chokers" },
    ],
  },
  {
    id: "rings",
    name: "Rings",
    slug: "rings",
    subcategories: [
      { id: "diamond-rings", name: "Diamond Rings", slug: "diamond-rings" },
      { id: "bands", name: "Bands & Stacks", slug: "bands" },
    ],
  },
  {
    id: "bracelets",
    name: "Bracelets",
    slug: "bracelets",
    subcategories: [
      { id: "bangles", name: "Bangles & Cuffs", slug: "bangles" },
    ],
  },
  {
    id: "firefighters",
    name: "Firefighters",
    slug: "firefighters",
    subcategories: [
      { id: "firefighter-equipment", name: "Equipment & Gear", slug: "firefighter-equipment" },
    ],
  },
];
