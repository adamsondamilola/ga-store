"use client"
import { useEffect, useState } from "react";
import endpointsPath from "../../../../constants/EndpointsPath";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, FloatingLabel, Spinner } from "flowbite-react";
import requestHandler from "../../../../utils/requestHandler";

const PropertyAdminActionsComponent = (props) => {
    const {id} = useParams();
    const [property, setProperty] = useState(null);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false); // Separate loading for actions
  
    const handleDelete = async () => {
      const confirmDelete = window.confirm("Are you sure you want to delete this property?");
      if (!confirmDelete) return;
  
      setActionLoading(true);
      try {
        const response = await requestHandler.deleteReq(`${endpointsPath.propertyAdmin}/${id}`, true);
        if (response.statusCode === 200) {
          toast.success(response.result.message || "Property deleted successfully");
          router.push("/admin/properties");
        } else {
          toast.error(response.result.message || "Failed to delete property");
        }
      } catch (error) {
        toast.error("Error deleting property");
        console.log(error);
      } finally {
        setActionLoading(false);
      }
    };
  
    const handleStatusUpdate = async (status) => {
      const statusMessages = {
        1: "approve",
        2: "reject",
        0: "set as pending",
      };
      const confirmAction = window.confirm(`Are you sure you want to ${statusMessages[status]} this property?`);
      if (!confirmAction) return;
  
      setActionLoading(true);
      try {
        const response = await requestHandler.patch(
          `${endpointsPath.propertyAdmin}/${id}`,
          { status },
          true
        );
        if (response.statusCode === 200) {
          toast.success(response.result.message || "Operation successful");
          fetchProperty();
        } else {
          toast.error(response.result.message || "Operation failed");
        }
      } catch (error) {
        toast.error("Error performing operation");
        console.log(error);
      } finally {
        setActionLoading(false);
      }
    };
  
    const [brand, setBrand] = useState('')
    const [updateBrand, setUpdateBrand] = useState(false)
    const handleBrandUpdate = async () => {
  
      setActionLoading(true);
      try {
        const response = await requestHandler.patch(
          `${endpointsPath.propertyAdmin}/${id}`,
          { brand: brand },
          true 
        );
        if (response.statusCode === 200) {
          toast.success(response.result.message || "Operation successful");
          fetchProperty();
          setUpdateBrand(false)
        } else {
          toast.error(response.result.message || "Operation failed");
        }
      } catch (error) {
        toast.error("Error performing operation");
        console.log(error);
      } finally {
        setActionLoading(false);
      } 
    };

    const fetchProperty = async () => {
        setLoading(true);
        try {
          const response = await requestHandler.get(`${endpointsPath.propertyAdmin}/${id}`, true);
          setProperty(response.statusCode === 200 ? response.result.data : null);
        } catch (error) {
          console.log("Error fetching property details:", error);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        if (id) fetchProperty();
      }, [id]);

    return (
        <Card className="mt-5">
            <h4 className="text-xl font-semibold">Actions</h4>
            <div className="flex gap-4 mt-4">
              {property?.status === 0 && (
                <Button onClick={() => handleStatusUpdate(1)} color="green" disabled={actionLoading}>
                  {actionLoading ? <Spinner size="sm" /> : "Approve"}
                </Button>
              )}
              {property?.status === 1 && (
                <Button onClick={() => handleStatusUpdate(2)} color="red" disabled={actionLoading}>
                  {actionLoading ? <Spinner size="sm" /> : "Reject"}
                </Button>
              )}
              {property?.status === 2 && (
                <Button onClick={() => handleStatusUpdate(1)} color="green" disabled={actionLoading}>
                  {actionLoading ? <Spinner size="sm" /> : "Approve"}
                </Button>
              )}
              <Button onClick={handleDelete} color="red" disabled={actionLoading}>
                {actionLoading ? <Spinner size="sm" /> : "Delete"}
              </Button>
            </div>

            <div className="flex">
                <span style={{display: updateBrand? 'none' : 'flex'}} className="text-blue-500" onClick={()=>setUpdateBrand(true)}>Edit Brand</span>
                <div className="h-12 mt-3" style={{display: updateBrand? 'flex' : 'none'}}>
                <FloatingLabel
                variant="outlined"
                label="Brand name"
                value={brand}
                onChange={(e)=>setBrand(e.target.value)}
                />
                <Button disabled={actionLoading} color="green" onClick={handleBrandUpdate}>Update</Button>
                </div>
              </div>

          </Card>
    );


}

export default PropertyAdminActionsComponent