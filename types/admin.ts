// ============================================================
// types/admin.ts — Full TypeScript Type Definitions
// ============================================================

export interface ProductVariant {
  id: string;
  name: string;             // e.g. "Large", "Red", "Pack of 12", "128GB", "500g"
  price: number;            // Variant price in PKR
  originalPrice?: number;   // Optional strike-through price
  sku?: string;             // Optional variant SKU
  inStock?: boolean;        // In-stock toggle
}

export interface ProductSpecification {
  key: string;              // e.g. "Material", "Brand", "Warranty", "Dimensions", "Origin"
  value: string;            // e.g. "Stainless Steel", "Samsung", "1 Year", "China"
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  urduName: string;
  category: string;
  categoryName: string;
  subCategory?: string;
  subCategoryName?: string;

  // Wholesale Attributes
  brand?: string;           // Manufacturer or Brand
  sku?: string;             // Model / SKU / Barcode
  unit?: string;            // e.g. "Piece", "Pair", "Set", "Gram"
  moq?: number;             // Minimum Order Quantity (default 1)
  stockQuantity?: number;   // Warehouse inventory count

  // Product-Specific Attributes
  material?: string;        // e.g. "Gold", "Silver", "Platinum", "Rose Gold", "Stainless Steel"
  metalPurity?: string;     // e.g. "18K", "22K", "24K", "925 Silver"
  gemstone?: string;        // e.g. "Diamond", "Ruby", "Emerald", "Pearl"
  gemstoneQuality?: string; // e.g. "VS1", "VVS2", "AA", "AAA"
  weightGrams?: number;     // Weight in grams
  chainLength?: string;     // e.g. "18 inch", "20 inch" for necklaces/bracelets
  ringSize?: string;        // e.g. "6", "7", "8", "Adjustable"
  hallmark?: string;        // e.g. "BIS 916", "BIS 750"
  certification?: string;   // e.g. "IGI Certified", "GIA Certified"
  shortDescription?: string; // Subtitle text for horizontal cards & popup overlay
  specialInstructionsNote?: string; // Customer instructions prompt

  // Pricing
  originalPrice: number;
  price: number;
  wholesalePrice?: number;  // Tiered / bulk discount unit price
  discountBadge: string;

  // Flags & Visibility
  isBestSeller: boolean;
  isNew: boolean;
  inStock: boolean;
  showInAllProducts?: boolean;

  // Media
  image: string;
  hoverImage: string;
  images: string[];

  // Variants (e.g. sizes, gemstone options)
  variants?: ProductVariant[];

  // Product Content
  description: string;
  highlights?: string[];                   // Key bullet points
  specifications?: ProductSpecification[]; // Dynamic key-value attributes

  // Legacy fields (optional for backward compatibility)
  weights?: string[];
  weightPrices?: Record<string, number>;
  ingredients?: string;
  benefits?: string;

  rating: number;
  reviewsCount: number;
  updatedAt?: any;
}

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
  urduName: string;
  description: string;
  image: string;
  itemCount: number;
  subcategories?: SubCategory[];
}

export interface OrderItem {
  productId: string;
  name: string;
  selectedWeight: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  orderId: string;
  createdAt: any;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  orderStatus: OrderStatus;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  reviewId: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  status: ReviewStatus;
  createdAt: any;
}

export interface HeroSlide {
  id: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  link?: string;
}

export interface Banner {
  id: string;
  image: string;
  link: string;
  alt: string;
}

export interface ShopByCategorySection {
  title: string;
  categoryIds: string[];
}

export interface ProductCuratedSection {
  title: string;
  productIds: string[];
}

export interface StoreContent {
  topBarMessages: string[];
  heroSlides: HeroSlide[];
  shopByCategory?: ShopByCategorySection;
  bestSellers: ProductCuratedSection;
  newArrivals: ProductCuratedSection;
  midBanners: Banner[];
  bundleOffers: ProductCuratedSection;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingReviews: number;
  pendingOrders: number;
}
