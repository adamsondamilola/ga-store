import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFoundPage from './screens/layouts/PageNotFound';
import LoginScreen from './screens/auth/LoginScreen';
import { ToastContainer } from 'react-toastify';
import AuthLayout from './screens/layouts/AuthLayout';
import PasswordResetScreen from './screens/auth/PasswordResetScreen';
import SignupScreen from './screens/auth/SignupScreen';
import DashboardLayout from './screens/layouts/DashboardLayout';
import DashboardScreen from './screens/dashboard/Main';
import CategoriesScreen from './screens/categories';
import CreateCategoryScreen from './screens/categories/create';
import BrandsScreen from './screens/brands';
import CreateProductScreen from './screens/products/create';
import ProductsScreen from './screens/products';
import UpdateProductScreen from './screens/products/update';
import ProductDetailsScreen from './screens/products/view';
import OrdersScreen from './screens/orders';
import OrderDetailsScreen from './screens/orders/view';
import ShippingScreen from './screens/shipping';
import TransactionsScreen from './screens/transactions';
import UsersScreen from './screens/users';
import ProfileScreen from './screens/profile';
import PasswordUpdateScreen from './screens/profile/updatePassword';
import SubCategories from './components/SubCategories';
import CreateSubCategoryScreen from './screens/categories/create';
import SlidersScreen from './screens/sliders';
import CreateSliderScreen from './screens/sliders/create';
import FeaturedProductsScreen from './screens/products/featured';
import DeliveryLocationsScreen from './screens/shipping/deliveryLocations';
import BannersScreen from './screens/banners';
import CreateBannerScreen from './screens/sliders/create';
import VatScreen from './screens/vat';
import SubscribersScreen from './screens/subscribers';
import ReferralCommissionScreen from './screens/referralCommission';
import CreateNewUserScreen from './screens/users/createUser';
import Coupons from './components/Coupon/Coupons';
import CouponsScreen from './screens/coupon';
import CouponDetailsScreen from './screens/coupon/view';
import TagsScreen from './screens/tags';
import UserPasswordUpdateScreen from './screens/profile/updateUserPassword';
import ProductTypesScreen from './screens/product-type';
import ProductSubTypesScreen from './screens/product-sub-type';
import ShippingProvidersScreen from './screens/shipping/shippingProviders';
import AuditLogsScreen from './screens/auditlogs';
import ManualPaymentAccountsScreen from './screens/manual-payment-accounts';
import LimitedOffersScreen from './screens/limited-offers';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>

      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LoginScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/reset-password" element={<PasswordResetScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/categories" element={<DashboardLayout />}>
        <Route index element={<CategoriesScreen />} />
        <Route path="/categories/new" element={<CreateCategoryScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/sub-categories" element={<DashboardLayout />}>
        <Route index element={<SubCategories />} />
        <Route path="/sub-categories/new" element={<CreateSubCategoryScreen />} />
        <Route path="/sub-categories/product-types" element={<ProductTypesScreen />} />
        <Route path="/sub-categories/product-types/product-sub-types" element={<ProductSubTypesScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>
        

        <Route path="/sliders" element={<DashboardLayout />}>
        <Route index element={<SlidersScreen />} />
        <Route path="/sliders/new" element={<CreateSliderScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/banners" element={<DashboardLayout />}>
        <Route index element={<BannersScreen />} />
        <Route path="/banners/new" element={<CreateBannerScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/brands" element={<DashboardLayout />}>
        <Route index element={<BrandsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/tags" element={<DashboardLayout />}>
        <Route index element={<TagsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/products" element={<DashboardLayout />}>
        <Route index element={<ProductsScreen />} />
        <Route path="/products/new" element={<CreateProductScreen />} />
        <Route path="/products/:productId/details" element={<ProductDetailsScreen />} />
        <Route path="/products/:productId/update" element={<UpdateProductScreen />} />
        <Route path="/products/featured" element={<FeaturedProductsScreen />} />
        <Route path="/products/limited-offers" element={<LimitedOffersScreen />} />
        <Route path="/products/vat" element={<VatScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/orders" element={<DashboardLayout />}>
        <Route index element={<OrdersScreen />} />
        <Route path="/orders/:orderId" element={<OrderDetailsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/shipping" element={<DashboardLayout />}>
        <Route index element={<ShippingScreen />} />
        <Route path='/shipping/locations' element={<DeliveryLocationsScreen />} />
        <Route path='/shipping/providers' element={<ShippingProvidersScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/transactions" element={<DashboardLayout />}>
        <Route index element={<TransactionsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/manual-payment-accounts" element={<DashboardLayout />}>
        <Route index element={<ManualPaymentAccountsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/audit-logs" element={<DashboardLayout />}>
        <Route index element={<AuditLogsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/users" element={<DashboardLayout />}>
        <Route index element={<UsersScreen />} />
        <Route path="/users/new" element={<CreateNewUserScreen />} />
        <Route path="/users/referral-commission" element={<ReferralCommissionScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/subscribers" element={<DashboardLayout />}>
        <Route index element={<SubscribersScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>


        <Route path="/profile" element={<DashboardLayout />}>
        <Route index element={<ProfileScreen />} />
        <Route path="/profile/:userId" element={<ProfileScreen />} />
        <Route path="/profile/password-update" element={<PasswordUpdateScreen />} />
        <Route path="/profile/:userId/password-update" element={<UserPasswordUpdateScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

        <Route path="/coupon" element={<DashboardLayout />}>
        <Route index element={<CouponsScreen />} />
                <Route path="/coupon/:id" element={<CouponDetailsScreen />} />
        <Route path='*' element={<NotFoundPage/>} />
        </Route>

      </Routes>
      <ToastContainer/>
      </BrowserRouter>
      </div>
  );
}

export default App;
