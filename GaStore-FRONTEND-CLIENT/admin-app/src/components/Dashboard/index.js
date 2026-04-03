import { useEffect, useState } from "react";
import PageTitleComponent from "../PageTitle";
import DashboardOverviewComponent from "./overview";
import RecentOrdersComponent from "./recentOrders";
import requestHandler from "../../utils/requestHandler";
import endpointsPath from "../../constants/EndpointsPath";

export default function DashboardComponent() {

  const [totalProducts, setTotalProducts] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingShipping, setPendingShipping] = useState(0)
  const [registeredUsers, setRegisteredUsers] = useState(0)

  useEffect(()=>{ 
    const getStats = async () => {
      const products = await requestHandler.get(`${endpointsPath.product}`, true);
      if(products.statusCode === 200) setTotalProducts(products.result.totalRecords)
        const users = await requestHandler.get(`${endpointsPath.user}`, true);
      if(products.statusCode === 200) setRegisteredUsers(users.result.totalRecords)
        const orders = await requestHandler.get(`${endpointsPath.order}?pageSize=10&pageNumber=1`, true);
      if(products.statusCode === 200) setTotalOrders(orders.result.totalRecords)
        const pShipping = await requestHandler.get(`${endpointsPath.shipping}?status=Pending`, true);
      if(products.statusCode === 200) setPendingShipping(pShipping.result.totalRecords)
    }
    getStats();
  },[])

  return (
   <div>
      <PageTitleComponent title='Dashboard'/>
<DashboardOverviewComponent 
totalProducts={totalProducts} 
totalOrders={totalOrders}
registeredUsers={registeredUsers}
pendingShipping={pendingShipping} />
<RecentOrdersComponent/>
 </div>
  );
}