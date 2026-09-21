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
import { MASTER_CATEGORIES } from "@/constants/categories";
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

export async function syncCategoriesToFirestore(
  masterList: Category[] = MASTER_CATEGORIES
): Promise<{ added: number; updated: number; total: number }> {
  const snap = await getDocs(collection(db, "categories"));
  const existingMap = new Map<string, { id: string; data: Record<string, any> }>();

  snap.docs.forEach((d) => {
    const data = d.data();
    existingMap.set(d.id.toLowerCase(), { id: d.id, data });
    if (data.slug) {
      existingMap.set(String(data.slug).toLowerCase(), { id: d.id, data });
    }
  });

  let added = 0;
  let updated = 0;

  for (const cat of masterList) {
    const targetKey = (cat.id || cat.slug).toLowerCase();
    const slugKey = (cat.slug || "").toLowerCase();
    const existing = existingMap.get(targetKey) || (slugKey ? existingMap.get(slugKey) : undefined);

    const docId = existing ? existing.id : (cat.id || cat.slug);
    const existingData = existing ? existing.data : {};

    // Build merged subcategories
    const masterSubs = cat.subcategories || [];
    const existingSubs: SubCategory[] = Array.isArray(existingData.subcategories)
      ? existingData.subcategories
      : [];

    const mergedSubs: SubCategory[] = masterSubs.map((ms) => {
      const existingSub = existingSubs.find(
        (es) =>
          (es.id && es.id.toLowerCase() === ms.id.toLowerCase()) ||
          (es.slug && es.slug.toLowerCase() === ms.slug.toLowerCase())
      );
      return {
        id: ms.id || ms.slug,
        slug: ms.slug,
        name: ms.name,
        urduName: ms.urduName || existingSub?.urduName || "",
        description: ms.description || existingSub?.description || "",
        image: ms.image || existingSub?.image || "",
        itemCount: ms.itemCount ?? (existingSub?.itemCount || 0),
      };
    });

    // Also include any custom existing subcategories that weren't in masterSubs
    existingSubs.forEach((es) => {
      const alreadyIncluded = mergedSubs.some(
        (ms) =>
          (ms.id && ms.id.toLowerCase() === es.id?.toLowerCase()) ||
          (ms.slug && ms.slug.toLowerCase() === es.slug?.toLowerCase())
      );
      if (!alreadyIncluded && es.name && es.slug) {
        mergedSubs.push({
          id: es.id || es.slug,
          slug: es.slug,
          name: es.name,
          urduName: es.urduName || "",
          description: es.description || "",
          image: es.image || "",
          itemCount: es.itemCount || 0,
        });
      }
    });

    const categoryPayload: Record<string, any> = {
      slug: cat.slug,
      name: cat.name,
      urduName: cat.urduName || existingData.urduName || "",
      description: cat.description || existingData.description || "",
      image: cat.image || existingData.image || "",
      itemCount: existingData.itemCount ?? (cat.itemCount || 0),
      subcategories: mergedSubs,
      updatedAt: serverTimestamp(),
    };

    if (!existing) {
      categoryPayload.createdAt = serverTimestamp();
    }

    await setDoc(doc(db, "categories", docId), categoryPayload, { merge: true });

    if (existing) {
      updated++;
    } else {
      added++;
    }
  }

  return { added, updated, total: masterList.length };
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
