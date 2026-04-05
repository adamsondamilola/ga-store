import {
  BadgePercent,
  ChartPie,
  ChevronDown,
  ChevronRight,
  Inbox,
  List,
  ListOrdered,
  Logs,
  MapPin,
  Ticket,
  Users,
  Users2,
} from "lucide-react";
import {
  BrandingWatermark,
  Category,
  LocalShipping,
  LocalShippingTwoTone,
  Logout,
  Password,
  Payments,
  Person,
  Photo,
  Sell,
  Tag,
  ViewCarousel,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

const primaryItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartPie },
  {
    label: "Products",
    icon: Sell,
    children: [
      { href: "/products", label: "Manage Products" },
      { href: "/products/pending-review", label: "Pending Review" },
      { href: "/products/new", label: "Add Product" },
      { href: "/products/featured", label: "Featured Products" },
      { href: "/products/limited-offers", label: "Limited Offers", icon: BadgePercent },
      { href: "/products/vat", label: "VAT" },
    ],
  },
  {
    label: "Vendor Moderation",
    icon: Users,
    children: [
      { href: "/marketplace/kyc", label: "Pending KYC" },
      { href: "/marketplace/products", label: "Pending Products" },
    ],
  },
  {
    label: "Categories",
    icon: Category,
    children: [
      { href: "/categories", label: "Manage Categories" },
      { href: "/sub-categories", label: "Sub-Categories" },
      { href: "/sub-categories/product-types", label: "Types" },
      {
        href: "/sub-categories/product-types/product-sub-types",
        label: "Sub-Types",
      },
    ],
  },
  { href: "/brands", label: "Brands", icon: BrandingWatermark },
  { href: "/tags", label: "Tags/Collections", icon: Tag },
  { href: "/coupon", label: "Coupons", icon: List },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/shipping", label: "Shipping", icon: LocalShipping },
  { href: "/shipping/providers", label: "Shipping Providers", icon: LocalShippingTwoTone },
  { href: "/shipping/locations", label: "Delivery Location", icon: MapPin },
  { href: "/transactions", label: "Transactions", icon: Payments },
  { href: "/manual-payment-accounts", label: "Payment Settings", icon: Payments },
  {
    label: "Website Content",
    icon: Inbox,
    children: [
      { href: "/website-content", label: "Website Settings" },
      { href: "/website-content/faqs", label: "FAQs" },
      { href: "/website-content/policies", label: "Policies and Legal Content" },
    ],
  },
  { href: "/vouchers", label: "Vouchers", icon: Ticket },
  {
    label: "Sliders",
    icon: ViewCarousel,
    children: [{ href: "/sliders", label: "Manage Sliders" }],
  },
  {
    label: "Banners",
    icon: Photo,
    children: [{ href: "/banners", label: "Manage Banners" }],
  },
  {
    label: "Users",
    icon: Users,
    children: [
      { href: "/users", label: "Manage Users" },
      { href: "/users/referral-commission", label: "Referral Commission" },
    ],
  },
  { href: "/audit-logs", label: "Audit Logs", icon: Logs },
  { href: "/subscribers", label: "Subscribers", icon: Users2 },
];

const matchPath = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

const NavLink = ({ item, pathname, nested = false }) => {
  const Icon = item.icon;
  const active = matchPath(pathname, item.href);

  return (
    <Link
      to={item.href}
      className={`group flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all duration-200 ${
        active
          ? "bg-[#ff8a1c] text-white shadow-[0_14px_28px_rgba(255,138,28,0.32)]"
          : nested
            ? "text-[#6b6b6b] hover:bg-white hover:text-[#272727]"
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
          {Icon ? <Icon className="text-[1.05rem]" /> : <ChevronRight className="text-[1.05rem]" />}
        </span>
        <span className="font-medium">{item.label}</span>
      </span>
      <ChevronRight
        className={`text-sm transition ${
          active ? "text-white/90" : "text-[#c8c8c8] group-hover:text-[#8b8b8b]"
        }`}
      />
    </Link>
  );
};

const CollapsibleSection = ({ item, pathname }) => {
  const Icon = item.icon;
  const active = item.children.some((child) => matchPath(pathname, child.href));
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) {
      setOpen(true);
    }
  }, [active]);

  return (
    <div className="rounded-[24px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition-all duration-200 ${
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
        <ChevronDown
          className={`text-sm transition ${open ? "rotate-180" : ""} ${
            active ? "text-white/90" : "text-[#c8c8c8] group-hover:text-[#8b8b8b]"
          }`}
        />
      </button>

      {open ? (
        <div className="mt-2 space-y-1.5 rounded-[24px] bg-[#f8f4ef] p-2">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} nested />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const AsideComponent = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");

  useEffect(() => {
    const loggedInUser = async () => {
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if (resp.statusCode === 200) {
        const nextUserId = resp.result.data[0].userId;
        setUserId(nextUserId);
        localStorage.setItem("userId", nextUserId);
      }
    };

    loggedInUser();
  }, []);

  const accountItems = useMemo(
    () => [
      { href: userId ? `/profile/${userId}` : "/profile", label: "Profile", icon: Person },
      { href: "/profile/password-update", label: "Update Password", icon: Password },
    ],
    [userId]
  );

  const activeLabel = useMemo(() => {
    const flatItems = [
      ...primaryItems.flatMap((item) => (item.children ? item.children : item)),
      ...accountItems,
    ];

    return flatItems.find((item) => item.href && matchPath(pathname, item.href))?.label || "Dashboard";
  }, [accountItems, pathname]);

  const logOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <aside className="h-full w-full bg-[#fcfbf9] text-left">
      <div className="flex h-full flex-col px-5 py-6">
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(32,26,18,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff8a1c] text-white shadow-[0_10px_20px_rgba(255,138,28,0.25)]">
              <ChartPie className="text-lg" />
            </div>
            <div>
              <p className="text-[1.05rem] font-semibold text-[#202020]">Admin Console</p>
              <p className="text-xs text-[#8b8b8b]">{activeLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4b4b4]">
            Main Menu
          </p>
          <div className="mt-3 space-y-1.5">
            {primaryItems.map((item) =>
              item.children ? (
                <CollapsibleSection key={item.label} item={item} pathname={pathname} />
              ) : (
                <NavLink key={item.href} item={item} pathname={pathname} />
              )
            )}
          </div>
        </div>

        <div className="mt-7 border-t border-[#ece6df] pt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4b4b4]">
            Account
          </p>
          <div className="mt-3 space-y-1.5">
            {accountItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-[#ece6df] pt-6">
          <button
            type="button"
            onClick={logOut}
            className="flex w-full items-center justify-between rounded-2xl border border-[#efe7de] bg-white px-3 py-3 text-sm text-[#6b6b6b] transition hover:border-[#ffd3a8] hover:bg-[#fff6ee] hover:text-[#272727]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f3ee] text-[#7d7d7d]">
                <Logout className="text-[1.05rem]" />
              </span>
              <span className="font-medium">Logout</span>
            </span>
            <ChevronRight className="text-sm text-[#c8c8c8]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AsideComponent;
