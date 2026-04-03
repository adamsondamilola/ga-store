"use client";

import ProductListMain from "@/components/products/ProductsListMain";
import endpointsPath from "@/constants/EndpointsPath";
import Styles from "@/constants/Styles";
import requestHandler from "@/utils/requestHandler";
import { slugToString } from "@/utils/stringToSlug";
import { ChevronRight } from "@mui/icons-material";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CollectionsPage({ params, searchParams }) {
  const { slug } = params;
  const [desc, setDesc] = useState("");

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await requestHandler.get(
          `${endpointsPath.tag}?search=${slugToString(slug)}`,
          true
        );
        if (res.statusCode === 200 && res.result?.data?.length) {
          setDesc(res.result.data[0].description || "");
        }
      } catch (err) {
        console.error("fetchTags error:", err);
      }
    };
    loadTags();
  }, [slug]);

  return (
    <main>
      <div className="container mx-auto md:px-4 px-4">
        <h4 className={Styles.pageTitle}>
          {slugToString(slug)} Collections
        </h4>
        {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-600 space-x-2 mb-4">
                  <Link href="/">Home</Link>
                  <ChevronRight fontSize="small" />
                  <span>{slugToString(slug)}</span>
                </div>
        {/*desc && <p className="text-gray-600 mb-6">{desc}</p>*/}
      </div>
      <ProductListMain endpointsPath={endpointsPath.product} search={slug} />
    </main>
  );
}
