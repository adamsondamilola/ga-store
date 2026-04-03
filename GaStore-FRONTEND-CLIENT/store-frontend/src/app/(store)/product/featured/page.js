import FeaturedProductListMain from "@/components/products/FeaturedProductListMain";
import endpointsPath from "@/constants/EndpointsPath";
import Styles from "@/constants/Styles";

export default async function FeaturedProducts() {
  return (
      <main className="">
        <div className="container mx-auto md:px-4 px-4">
            <h4 className={Styles.pageTitle}>Featured Products</h4></div>
       <FeaturedProductListMain endpointsPath={endpointsPath.featuredProduct} search={''} />
      </main>
  );
}
