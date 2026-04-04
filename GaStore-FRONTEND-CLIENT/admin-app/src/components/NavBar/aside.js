import { Sidebar, SidebarCollapse, SidebarItem } from "flowbite-react";
import {
  ChartPie,
  BadgePercent,
  Inbox,
  List,
  ListOrdered,
  Logs,
  MapPin,
  Ticket,
  Users,
  Users2
} from "lucide-react";
import {
  Home,
  Password,
  Person,
  Logout,
  Sell,
  LocalShipping,
  Payments,
  Category,
  BrandingWatermark,
  ViewCarousel,
  PhotoAlbum,
  Photo,
  Tag,
  LocalShippingTwoTone
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

const AsideComponent = () => {
  const router = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [userId, setUserId] = useState(localStorage.getItem('userId') || '')
  useEffect(() => {
      const loggedInUser =  async () => { 
        const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        if(resp.statusCode === 200){
          const UserId = resp.result.data[0].userId;
            setUserId(UserId)
            localStorage.setItem('userId', UserId);

            /*const roles = resp.result.data
            const hasAdmin = roles.some(role => role.name === "Admin");
            if(!hasAdmin){
             router("/login");
             }*/
        }
        else {
         // router("/login")
        }
    }
    loggedInUser();
    },[])

  const logOut = () => {
    localStorage.removeItem("token");
    //router("/");
    window.location.href="/"
  };

  const isActive = (path) =>
    currentPath === path ? "text-blue-500 dark:text-blue-400 font-semibold" : "";

  return (
    <Sidebar aria-label="Sidebar with multi-level dropdown example" className="text-start">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          {/*<Sidebar.Item href="/" icon={Home} className={isActive("/")}>
            Home
          </Sidebar.Item>*/}

          <Sidebar.Item href="/dashboard" icon={ChartPie} className={isActive("/dashboard")}>
            Dashboard
          </Sidebar.Item>

          <SidebarCollapse icon={Sell} label="Products" className={isActive("/products")}>
            <SidebarItem href="/products" className={isActive("/products")}>Manage Products</SidebarItem>
            <SidebarItem href="/products/new" className={isActive("/products/new")}>Add Product</SidebarItem>
            <SidebarItem href="/products/featured" className={isActive("/products/featured")}>Featured Products</SidebarItem>
            <SidebarItem href="/products/limited-offers" className={isActive("/products/limited-offers")}>
              <div className="flex items-center gap-2">
                <BadgePercent size={16} />
                <span>Limited Offers</span>
              </div>
            </SidebarItem>
            <SidebarItem href="/products/vat" className={isActive("/products/vat")}>Vat</SidebarItem>
            {/*<SidebarItem href="#">Pricing Tiers</SidebarItem>*/}
          </SidebarCollapse>

          <SidebarCollapse icon={Category} label="Categories" className={isActive("/categories")}>
            <SidebarItem href="/categories" className={isActive("/categories")}>Manage Categories</SidebarItem>
            {/*<SidebarItem href="/categories/new" className={isActive("/categories/new")}>Add Category</SidebarItem>*/}
            <SidebarItem href="/sub-categories" className={isActive("/sub-categories")}>Sub-Categories</SidebarItem>
            <SidebarItem href="/sub-categories/product-types" className={isActive("/sub-categories/product-types")}>Types</SidebarItem>
            <SidebarItem href="/sub-categories/product-types/product-sub-types" className={isActive("/sub-categories/product-sub-types")}>Sub-Types</SidebarItem>
            {/*<SidebarItem href="/sub-categories/new" className={isActive("/sub-categories/new")}>Add Sub-Category</SidebarItem>*/}
          </SidebarCollapse>

          <Sidebar.Item href="/brands" icon={BrandingWatermark} className={isActive("/brands")}>
            Brands
          </Sidebar.Item>

          <Sidebar.Item href="/tags" icon={Tag} className={isActive("/tags")}>
            Tags/Collections
          </Sidebar.Item>

          <Sidebar.Item href="/coupon" icon={List} className={isActive("/coupon")}>
            Coupons
          </Sidebar.Item>

          <Sidebar.Item href="/orders" icon={ListOrdered} className={isActive("/orders")}>
            Orders
          </Sidebar.Item>

          <Sidebar.Item href="/shipping" icon={LocalShipping} className={isActive("/shipping")}>
            Shipping
          </Sidebar.Item>

          <Sidebar.Item href="/shipping/providers" icon={LocalShippingTwoTone} className={isActive("/shipping/providers")}>
            Shipping Providers
          </Sidebar.Item>

          <Sidebar.Item href="/shipping/locations" icon={MapPin} className={isActive("/shipping/locations")}>
            Delivery Location
          </Sidebar.Item>

          <Sidebar.Item href="/transactions" icon={Payments} className={isActive("/transactions")}>
            Transactions
          </Sidebar.Item>

          <Sidebar.Item href="/manual-payment-accounts" icon={Payments} className={isActive("/manual-payment-accounts")}>
            Payment Settings
          </Sidebar.Item>

          <Sidebar.Item href="/vouchers" icon={Ticket} className={isActive("/vouchers")}>
            Vouchers
          </Sidebar.Item>

           <SidebarCollapse icon={ViewCarousel} label="Sliders" className={isActive("/sliders")}>
            <SidebarItem href="/sliders" className={isActive("/sliders")}>Manage Sliders</SidebarItem>
          </SidebarCollapse>

          <SidebarCollapse icon={Photo} label="Banners" className={isActive("/banners")}>
            <SidebarItem href="/banners" className={isActive("/banners")}>Manage Banners</SidebarItem>
          </SidebarCollapse>

          <SidebarCollapse icon={Users} label="Users" className={isActive("/users")}>
            <Sidebar.Item href="/users" className={isActive("/users")}>
            Manage Users
          </Sidebar.Item>
          <Sidebar.Item href="/users/referral-commission" className={isActive("/users/referral-commission")}>
            Referral Commission
          </Sidebar.Item>
          </SidebarCollapse>


          <Sidebar.Item href="/audit-logs" icon={Logs} className={isActive("/audit-logs")}>
            Audit Logs
          </Sidebar.Item>

          <Sidebar.Item href="/subscribers" icon={Users2} className={isActive("/subscribers")}>
            Subscribers
          </Sidebar.Item>

          <Sidebar.Item href={`/profile/${userId}`} icon={Person} className={isActive("/profile")}>
            Profile
          </Sidebar.Item>

          <Sidebar.Item href="/profile/password-update" icon={Password} className={isActive("/profile/password-update")}>
            Update Password
          </Sidebar.Item>

          <Sidebar.Item onClick={logOut} icon={Logout}>
            Logout
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
};

export default AsideComponent;
