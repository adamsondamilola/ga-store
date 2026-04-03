"use client"
import { Sidebar, SidebarCollapse, SidebarItem } from "flowbite-react";
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
  PieChartOutlineSharp,
  ListOutlined,
  ShoppingBag,
  Wallet,
  Reviews
} from "@mui/icons-material";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import { FiMapPin, FiUsers } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";

const AsideComponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname;

  const [userId, setUserId] = useState('')
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
             router.push("/login");
             }*/
        }
        else {
         // router.push("/login")
        }
    }
    loggedInUser();
    },[])

  const logOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const isActive = (path) =>
    currentPath === path ? "text-blue-500 dark:text-blue-400 font-semibold" : "";

  return (
    <Sidebar aria-label="Sidebar with multi-level dropdown example" className="text-start">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item href="/" icon={ShoppingBag} className={isActive("/")}>
            Store
          </Sidebar.Item>

          {/*<Sidebar.Item href="/customer" icon={PieChartOutlineSharp} className={isActive("/dashboard")}>
            Dashboard
          </Sidebar.Item>*/}

         <Sidebar.Item href="/customer/orders" icon={ListOutlined} className={isActive("/customer/orders")}>
            Orders
          </Sidebar.Item>

          {/*<Sidebar.Item href="/shipping" icon={LocalShipping} className={isActive("/shipping")}>
            Shipping
          </Sidebar.Item>*/}

          <Sidebar.Item href="/customer/addresses" icon={FiMapPin} className={isActive("/customer/addresses")}>
            Addresses
          </Sidebar.Item>

          <Sidebar.Item href="/customer/transactions" icon={Payments} className={isActive("/customer/transactions")}>
            Transactions
          </Sidebar.Item>

          <Sidebar.Item href={`/customer/reviews`} icon={Reviews} className={isActive("/customer/reviews")}>
            Product Reviews
          </Sidebar.Item>

          <Sidebar.Item href={`/customer/referrals`} icon={FiUsers} className={isActive("/customer/referrals")}>
            Referrals
          </Sidebar.Item>

          <Sidebar.Item href={`/customer/wallet`} icon={Wallet} className={isActive("/customer/wallet")}>
            Referral Commission
          </Sidebar.Item>

          <Sidebar.Item href={`/customer/profile`} icon={Person} className={isActive("/customer/profile")}>
            Account
          </Sidebar.Item>

          <Sidebar.Item href="/customer/password-update" icon={Password} className={isActive("/customer/password-update")}>
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
