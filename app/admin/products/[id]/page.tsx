"use client";
import { use, useEffect, useState } from "react";
import { getProduct } from "@/lib/firestoreServices";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/types/admin";
import { Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={32} color="var(--accent)" className="spin" />
      </div>
    );
  }

  if (!product) {
    return <p style={{ padding: 40, color: "var(--red)" }}>Product not found.</p>;
  }

  return <ProductForm productId={id} initialData={product} />;
}