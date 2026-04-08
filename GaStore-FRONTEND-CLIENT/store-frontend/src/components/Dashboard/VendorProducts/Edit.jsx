"use client";

import ProductForm from "./ProductForm";

export default function VendorProductEdit({ productId }) {
  return <ProductForm mode="edit" productId={productId} />;
}
