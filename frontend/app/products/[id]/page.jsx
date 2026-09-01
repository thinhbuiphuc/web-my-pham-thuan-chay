"use client";

import ProductDetail from "@/components/product/ProductDetail";

export default function ProductDetailPage({ params }) {
  return <ProductDetail productId={params.id} />;
}
