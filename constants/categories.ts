export interface SubCategory {
  id: string;
  slug: string;
  name: string;
  urduName?: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  urduName?: string;
  description?: string;
  image?: string;
  itemCount?: number;
  subcategories?: SubCategory[];
}

export const MASTER_CATEGORIES: Category[] = [
  {
    id: "necklaces",
    slug: "necklaces",
    name: "Necklaces",
    description: "Elegant necklaces, pendants, and chokers crafted for every occasion.",
    itemCount: 0,
    subcategories: [
      { id: "pendant-necklaces", slug: "pendant-necklaces", name: "Pendants & Chains", itemCount: 0 },
      { id: "chokers", slug: "chokers", name: "Chokers", itemCount: 0 },
    ],
  },
  {
    id: "earrings",
    slug: "earrings",
    name: "Earrings",
    description: "Stunning earrings, studs, hoops, and drop earrings.",
    itemCount: 0,
    subcategories: [
      { id: "studs", slug: "studs", name: "Studs", itemCount: 0 },
      { id: "hoops", slug: "hoops", name: "Hoops", itemCount: 0 },
      { id: "drops", slug: "drops", name: "Drops & Danglers", itemCount: 0 },
    ],
  },
  {
    id: "rings",
    slug: "rings",
    name: "Rings",
    description: "Statement rings, diamond rings, and stackable bands.",
    itemCount: 0,
    subcategories: [
      { id: "diamond-rings", slug: "diamond-rings", name: "Diamond Rings", itemCount: 0 },
      { id: "bands", slug: "bands", name: "Bands & Stacks", itemCount: 0 },
    ],
  },
  {
    id: "bracelets",
    slug: "bracelets",
    name: "Bracelets",
    description: "Bracelets, bangles, and cuffs to adorn your wrist.",
    itemCount: 0,
    subcategories: [
      { id: "bangles", slug: "bangles", name: "Bangles & Cuffs", itemCount: 0 },
    ],
  },
  {
    id: "firelighters",
    slug: "firelighters",
    name: "FireLighters",
    description: "Premium lighters and essentials.",
    itemCount: 0,
    subcategories: [],
  },
  {
    id: "watches",
    slug: "watches",
    name: "Watches",
    description: "Luxury and everyday watches.",
    itemCount: 0,
    subcategories: [],
  },
];
