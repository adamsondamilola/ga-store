import ProductListMain from "@/components/products/ProductsListMain";
import endpointsPath from "@/constants/EndpointsPath";
import Styles from "@/constants/Styles";

export default async function ProductsPage({ searchParams }) {
  const search = searchParams?.search || '';

  return (
    <main>
      <div className="container mx-auto md:px-4 px-4">
        <h4 className={Styles.pageTitle}>Products</h4>
      </div>
      <ProductListMain endpointsPath={endpointsPath.product} search={search} />
    </main>
  );
}
