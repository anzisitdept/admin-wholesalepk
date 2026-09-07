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

  // Universal Wholesale Attributes
  brand?: string;           // Manufacturer or Brand
  sku?: string;             // Model / SKU / Barcode
  unit?: string;            // e.g. "Piece", "Box", "Carton", "Pack of 12", "Dozen", "Set", "Kg"
  moq?: number;             // Minimum Order Quantity (default 1)
  stockQuantity?: number;   // Warehouse inventory count

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

  // Universal Variants (replaces niche-specific weight variants)
  variants?: ProductVariant[];

  // Universal Specifications & Narrative (replaces ingredients & benefits)
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
  specialItems: ProductCuratedSection;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingReviews: number;
  pendingOrders: number;
}
