import { Link } from "react-router-dom";

export default function DashboardOverviewComponent({
  totalProducts = 0,
  totalOrders = 0,
  pendingShipping = 0,
  registeredUsers = 0,
}) {
  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      color: "bg-sky-900",
      link: "/products",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      color: "bg-purple-800",
      link: "/orders",
    },
    {
      title: "Pending Shipping",
      value: pendingShipping,
      color: "bg-yellow-500",
      link: "/shipping",
    },
    {
      title: "Registered Users",
      value: registeredUsers,
      color: "bg-green-800",
      link: "/users",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 text-white">
      {stats.map((item, index) => (
        <Link
          key={index}
          to={item.link}
          className={`flex justify-between items-center mt-4 p-4 rounded-lg ${item.color}`}
        >
          <div className="text-start">
            <p className="text-sm">{item.title}</p>
            <p className="text-lg font-bold">{item.value}</p>
          </div>
          {/* Optional icon placeholder */}
          <div className="text-2xl">📊</div>
        </Link>
      ))}
    </div>
  );
}
