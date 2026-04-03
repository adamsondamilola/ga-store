import { toast } from "react-toastify";
import endpointsPath from "../../../constants/EndpointsPath";
import requestHandler from "../../../utils/requestHandler";

export const fetchBrands = async (search = "", page = 1, limit = 10) => {
  try {
    const res = await requestHandler.get(
      `${endpointsPath.brand}?search=${search}&page=${page}&limit=${limit}`,
      true
    );
    if (res.statusCode === 200) {
      return {
        data: res.result.data || [],
        totalPages: res.result.totalPages || 1, // Adjust to your actual API response
      };
    } else {
      toast.error(res.result.message || "Failed to fetch brands.");
    }
  } catch (err) {
    console.error("fetchBrands error:", err);
    return { data: [], totalPages: 1 };
  }
};

export const createBrand = async (data) => {
  try {
    const res = await requestHandler.post(endpointsPath.brand, data, true);
    if (res.statusCode === 201 || res.statusCode === 200) {
      return res.result;
    } else {
      toast.error(res.result.message || "Failed to create brand.");
    }
  } catch (err) {
    console.error("createBrand error:", err);
    throw err;
  }
};

export const updateBrand = async (id, data) => {
  try {
    data.id = id; 
    const res = await requestHandler.put(`${endpointsPath.brand}/${id}`, data, true);
    if (res.statusCode === 200) {
      toast.success(res.result.message || "Brand updated.");
      return res.result;
    } else {
      toast.error(res.result.message || "Failed to update brand.");
    }
  } catch (err) {
    console.error("updateBrand error:", err);
    throw err;
  }
};

export const deleteBrand = async (id) => {
  try {
    const res = await requestHandler.deleteReq(`${endpointsPath.brand}/${id}`, true);
    if (res.statusCode === 200) {
      return res.result.message;
    } else {
      toast.error(res.result.message || "Failed to delete brand.");
    }
  } catch (err) {
    console.error("deleteBrand error:", err);
    throw err;
  }
};
