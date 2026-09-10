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
      { id: "necklaces", name: "All Necklaces", slug: "necklaces" },
      { id: "pendant-necklaces", name: "Pendants & Chains", slug: "pendant-necklaces" },
      { id: "chokers", name: "Chokers", slug: "chokers" },
    ],
  },
  {
    id: "rings",
    name: "Rings",
    slug: "rings",
    subcategories: [
      { id: "rings", name: "All Rings", slug: "rings" },
      { id: "diamond-rings", name: "Diamond Rings", slug: "diamond-rings" },
      { id: "bands", name: "Bands & Stacks", slug: "bands" },
    ],
  },
  {
    id: "earrings",
    name: "Earrings",
    slug: "earrings",
    subcategories: [
      { id: "earrings", name: "All Earrings", slug: "earrings" },
      { id: "studs", name: "Stud Earrings", slug: "studs" },
      { id: "hoops", name: "Hoop Earrings", slug: "hoops" },
      { id: "drops", name: "Drop & Dangle", slug: "drops" },
    ],
  },
  {
    id: "bracelets",
    name: "Bracelets",
    slug: "bracelets",
    subcategories: [
      { id: "bracelets", name: "All Bracelets", slug: "bracelets" },
      { id: "bangles", name: "Bangles & Cuffs", slug: "bangles" },
      { id: "chain-bracelets", name: "Chain Bracelets", slug: "chain-bracelets" },
    ],
  },
  {
    id: "jewelry-sets",
    name: "Jewelry Sets",
    slug: "jewelry-sets",
    subcategories: [
      { id: "bridal-sets", name: "Bridal Sets", slug: "bridal-sets" },
      { id: "casual-sets", name: "Everyday Sets", slug: "casual-sets" },
    ],
  },
  {
    id: "custom-design",
    name: "Custom Design",
    slug: "custom-design",
    subcategories: [],
  },
  {
    id: "apparel",
    name: "Apparel",
    slug: "apparel",
    subcategories: [
      { id: "men-fashion", name: "Men Fashion", slug: "men-fashion" },
      { id: "women-fashion", name: "Women Fashion", slug: "women-fashion" },
      { id: "kids-fashion", name: "Kids Fashion", slug: "kids-fashion" },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    subcategories: [
      { id: "mobile-accessories", name: "Mobile Accessories", slug: "mobile-accessories" },
      { id: "audio", name: "Audio & Wearables", slug: "audio" },
    ],
  },
  {
    id: "home-living",
    name: "Home & Living",
    slug: "home-living",
    subcategories: [
      { id: "kitchen-products", name: "Kitchen Products", slug: "kitchen-products" },
      { id: "decor", name: "Home Decor", slug: "decor" },
    ],
  },
  {
    id: "grocery",
    name: "Grocery & Essentials",
    slug: "grocery",
    subcategories: [],
  },
  {
    id: "beauty-care",
    name: "Beauty & Care",
    slug: "beauty-care",
    subcategories: [],
  },
  {
    id: "best-selling",
    name: "Best Selling",
    slug: "best-selling",
    subcategories: [],
  },
  {
    id: "bundles",
    name: "Value Bundles",
    slug: "bundles",
    subcategories: [],
  },
];
