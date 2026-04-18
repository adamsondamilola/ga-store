"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiSettings,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiLock,
} from "react-icons/fi";
import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";

const primaryItems = [
  { href: "/customer", label: "Dashboard", icon: FiGrid },
  { href: "/customer/orders", label: "Orders", icon: FiBox },
  { href: "/customer/addresses", label: "Addresses", icon: FiMapPin },
  { href: "/customer/transactions", label: "Transactions", icon: FiCreditCard },
  { href: "/customer/reviews", label: "Reviews", icon: FiStar },
  { href: "/customer/referrals", label: "Referrals", icon: FiUsers },
  { href: "/customer/wallet", label: "Commission", icon: FiDollarSign },
  { href: "/customer/vendor", label: "Vendor Hub", icon: FiShield },
  { href: "/customer/vendor/earnings", label: "Vendor Earnings", icon: FiTrendingUp },
  { href: "/customer/vendor/products", label: "Vendor Products", icon: FiPackage },
];

const secondaryItems = [
  { href: "/customer/profile", label: "Account", icon: FiUser },
  { href: "/customer/password-update", label: "Security", icon: FiLock },
  { href: "/", label: "Store", icon: FiHome },
];

const supportItems = [
  { href: "/contact", label: "Help", icon: FiHelpCircle },
  //{ href: "/customer/profile", label: "Settings", icon: FiSettings },
];

const matchPath = (pathname, href) => {
  if (href === "/customer") {
    return pathname === href;
  }

  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const NavLink = ({ item, pathname }) => {
  const Icon = item.icon;
  const active = matchPath(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all duration-200 ${
        active
          ? "bg-[#ff8a1c] text-white shadow-[0_14px_28px_rgba(255,138,28,0.32)]"
          : "text-[#6b6b6b] hover:bg-[#fff3e8] hover:text-[#272727]"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            active
              ? "bg-white/20 text-white"
              : "bg-[#f7f3ee] text-[#7d7d7d] group-hover:bg-white group-hover:text-[#ff8a1c]"
          }`}
        >
          <Icon className="text-[1.05rem]" />
        </span>
        <span className="font-medium">{item.label}</span>
      </span>
      <FiChevronRight
        className={`text-sm transition ${
          active ? "text-white/90" : "text-[#c8c8c8] group-hover:text-[#8b8b8b]"
        }`}
      />
    </Link>
  );
};

const AsideComponent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await requestHandler.get(`${endpointsPath.auth}/logged-in-user-details`, true);
        if (response.statusCode === 200) {
          setUser(response.result?.data || null);
        }
      } catch (error) {
        console.error("dashboard sidebar user fetch failed", error);
      }
    };

    loadUser();
  }, []);

  const visiblePrimaryItems = useMemo(
    () =>
      primaryItems.filter((item) => {
        const vendorOnlyRoute =
          item.href === "/customer/vendor/earnings" || item.href === "/customer/vendor/products";
        return vendorOnlyRoute ? Boolean(user?.isVendor) : true;
      }),
    [user]
  );

  const activeLabel = useMemo(() => {
    const allItems = [...visiblePrimaryItems, ...secondaryItems];
    return allItems.find((item) => matchPath(pathname, item.href))?.label || "Dashboard";
  }, [pathname, visiblePrimaryItems]);

  const logOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <aside className="h-full w-full bg-[#fcfbf9] text-left">
      <div className="flex h-full flex-col px-5 py-6">
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(32,26,18,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff8a1c] text-white shadow-[0_10px_20px_rgba(255,138,28,0.25)]">
              <FiGrid className="text-lg" />
            </div>
            <div>
              <p className="text-[1.05rem] font-semibold text-[#202020]">My Account</p>
              <p className="text-xs text-[#8b8b8b]">{activeLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4b4b4]">
            Main Menu
          </p>
          <div className="mt-3 space-y-1.5">
            {visiblePrimaryItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="mt-7 border-t border-[#ece6df] pt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4b4b4]">
            Account
          </p>
          <div className="mt-3 space-y-1.5">
            {secondaryItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4 border-t border-[#ece6df] pt-6">
          <div className="space-y-1.5">
            {supportItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <button
            type="button"
            onClick={logOut}
            className="flex w-full items-center justify-between rounded-2xl border border-[#efe7de] bg-white px-3 py-3 text-sm text-[#6b6b6b] transition hover:border-[#ffd3a8] hover:bg-[#fff6ee] hover:text-[#272727]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f3ee] text-[#7d7d7d]">
                <FiLogOut className="text-[1.05rem]" />
              </span>
              <span className="font-medium">Logout</span>
            </span>
            <FiChevronRight className="text-sm text-[#c8c8c8]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AsideComponent;
