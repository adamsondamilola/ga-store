import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import Pagination from '../Pagination';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import { toast } from 'react-toastify';
import dateTimeToWord from '../../utils/dateTimeToWord';
import ProductWorkspaceShell, { ProductSurface } from './ProductWorkspaceShell';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.featuredProduct}?searchTerm=${searchTerm}&pageNumber=${page}&pageSize=${pageSize}`,
        true
      );
      if (response.statusCode === 200 && response.result?.data) {
        setProducts(response.result.data);
        setTotalPages(response.result.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, page, pageSize]);

  const stats = useMemo(() => {
    const visibleCount = products.filter((item) => item.isAvailable || item?.product?.isAvailable).length;
    return [
      { label: 'Featured records', value: products.length, helper: 'This page' },
      { label: 'Visible now', value: visibleCount, helper: 'Available' },
      { label: 'Search state', value: searchTerm ? 'Filtered' : 'All', helper: `${totalPages} pages` },
    ];
  }, [products, searchTerm, totalPages]);

  return (
    <ProductWorkspaceShell
      eyebrow="Products"
      title="Featured products"
      description="Review spotlighted catalog items and jump straight into the product detail view for edits, approvals, or merchandising changes."
      stats={stats}
      actions={
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
        >
          Back to products
        </Link>
      }
    >
      <ProductSurface>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Merchandising queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search current featured records and open the linked product to make further updates.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search featured products..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Visibility</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {products.map((product) => (
                  <tr key={product?.id || product?.product?.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-sm text-slate-500">{dateTimeToWord(product?.dateCreated)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                          <Star className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{product?.name || product?.product?.name}</p>
                          <p className="text-xs text-slate-500">Featured placement</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.isAvailable || product?.product?.isAvailable
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {product.isAvailable || product?.product?.isAvailable ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:text-orange-600"
                        to={`/products/${product?.product?.id}/details`}
                      >
                        Open product
                      </Link>
                    </td>
                  </tr>
                ))}
                {!loading && products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">
                      No featured products found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </ProductSurface>

      <ProductSurface className="pt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </ProductSurface>
    </ProductWorkspaceShell>
  );
};

export default FeaturedProducts;
