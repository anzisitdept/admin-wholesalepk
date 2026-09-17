import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { uploadToImgBB } from "./imgbbUpload";
import type {
  Product,
  Category,
  SubCategory,
  Order,
  Review,
  StoreContent,
  StoreSettings,
  OrderStatus,
  ReviewStatus,
} from "@/types/admin";

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
}

export async function createProduct(data: Omit<Product, "id">): Promise<string> {
  const r = await addDoc(collection(db, "products"), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return r.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, "products", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}



// ─────────────────────────────────────────────
// CATEGORIES & SUB-CATEGORIES
// ─────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      subcategories: [],
      ...data,
    } as unknown as Category;
  });
}

export function subscribeCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(collection(db, "categories"), (snap) => {
    const cats = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        subcategories: [],
        ...data,
      } as unknown as Category;
    });
    callback(cats);
  });
}


export async function getCategory(id: string): Promise<Category | null> {
  const snap = await getDoc(doc(db, "categories", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    subcategories: [],
    ...data,
  } as unknown as Category;
}

export async function createCategory(data: Omit<Category, "id">): Promise<string> {
  const r = await addDoc(collection(db, "categories"), {
    ...data,
    subcategories: data.subcategories || [],
  });
  return r.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, "categories", id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}

export async function addSubCategory(categoryId: string, subCategory: SubCategory): Promise<void> {
  const cat = await getCategory(categoryId);
  if (!cat) throw new Error("Category not found");
  const subcategories = cat.subcategories || [];
  const updated = [...subcategories, subCategory];
  await updateDoc(doc(db, "categories", categoryId), { subcategories: updated });
}

export async function updateSubCategory(categoryId: string, subCategoryId: string, data: Partial<SubCategory>): Promise<void> {
  const cat = await getCategory(categoryId);
  if (!cat) throw new Error("Category not found");
  const subcategories = (cat.subcategories || []).map((s) =>
    s.id === subCategoryId ? { ...s, ...data } : s
  );
  await updateDoc(doc(db, "categories", categoryId), { subcategories });
}

export async function deleteSubCategory(categoryId: string, subCategoryId: string): Promise<void> {
  const cat = await getCategory(categoryId);
  if (!cat) throw new Error("Category not found");
  const subcategories = (cat.subcategories || []).filter((s) => s.id !== subCategoryId);
  await updateDoc(doc(db, "categories", categoryId), { subcategories });
}

// ─────────────────────────────────────────────
// ORDERS  (real-time subscribe)
// ─────────────────────────────────────────────
export function subscribeOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    callback(orders);
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, "orders", id), { orderStatus: status });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
export async function getReviews(): Promise<Review[]> {
  const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  await updateDoc(doc(db, "reviews", id), { status });
}

export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, "reviews", id));
}

// ─────────────────────────────────────────────
// STORE CONTENT & SETTINGS
// ─────────────────────────────────────────────
export async function getStoreContent(): Promise<StoreContent | null> {
  const snap = await getDoc(doc(db, "store_content", "homepage"));
  return snap.exists() ? (snap.data() as StoreContent) : null;
}

export async function updateStoreContent(data: Partial<StoreContent>): Promise<void> {
  const ref2 = doc(db, "store_content", "homepage");
  const cleanData = JSON.parse(JSON.stringify(data));
  await setDoc(ref2, cleanData, { merge: true });
}


export async function getStoreSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(db, "store_settings", "general"));
  if (snap.exists()) {
    return snap.data() as StoreSettings;
  }
  const homeSnap = await getDoc(doc(db, "store_content", "homepage"));
  if (homeSnap.exists() && homeSnap.data()?.shippingFee !== undefined) {
    const data = homeSnap.data()!;
    return {
      storeName: data.storeName || "Waada Jewels",
      storeEmail: data.storeEmail || "info@waadajewels.com",
      storePhone: data.storePhone || "+92 300 0000000",
      freeShippingThreshold: Number(data.freeShippingThreshold) ?? 2999,
      shippingFee: Number(data.shippingFee) ?? 0,
    };
  }
  return {
    storeName: "Waada Jewels",
    storeEmail: "info@waadajewels.com",
    storePhone: "+92 300 0000000",
    freeShippingThreshold: 2999,
    shippingFee: 0,
  };
}

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<void> {
  const cleanData = JSON.parse(JSON.stringify(data));
  await setDoc(doc(db, "store_settings", "general"), cleanData, { merge: true });
  await setDoc(doc(db, "store_content", "homepage"), cleanData, { merge: true });
  await setDoc(doc(db, "settings", "store"), cleanData, { merge: true });
}


// ─────────────────────────────────────────────
// STORAGE / IMGBB UPLOAD
// ─────────────────────────────────────────────

export async function uploadImage(
  file: File,
  path: string = "uploads",
  onProgress?: (pct: number) => void
): Promise<string> {
  // If ImgBB API Key is configured, use ImgBB (Free, No Firebase Blaze required)
  if (process.env.NEXT_PUBLIC_IMGBB_API_KEY) {
    return uploadToImgBB(file, onProgress);
  }

  // Fallback to Firebase Storage if key is not configured
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      (error) => {
        console.error("Firebase Storage task error:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          console.error("Failed to get download URL:", err);
          reject(err);
        }
      }
    );
  });
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
export async function getDashboardStats() {
  const [ordersSnap, productsSnap, reviewsSnap] = await Promise.all([
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "products")),
    getDocs(query(collection(db, "reviews"), where("status", "==", "pending"))),
  ]);
  const orders = ordersSnap.docs.map((d) => d.data() as Order);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === "Pending").length;
  return {
    totalOrders: ordersSnap.size,
    totalRevenue,
    totalProducts: productsSnap.size,
    pendingReviews: reviewsSnap.size,
    pendingOrders,
  };
}
