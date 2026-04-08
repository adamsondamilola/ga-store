import VendorProductEdit from "@/components/Dashboard/VendorProducts/Edit";

export default function VendorProductEditPage({ params }) {
  return <VendorProductEdit productId={params.productId} />;
}
