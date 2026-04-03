import { toast } from "react-toastify";
import endpointsPath from "../../../constants/EndpointsPath";
import requestHandler from "../../../utils/requestHandler";

export const fetchTaggedProducts = async (search = "", page = 1, limit = 10) => {
  try {
    const res = await requestHandler.get(
      `${endpointsPath.taggedProduct}?search=${search}&page=${page}&limit=${limit}`,
      true
    );
    if (res.statusCode === 200) {
      return {
        data: res.result.data || [],
        totalPages: res.result.totalPages || 1, // Adjust to your actual API response
      };
    } else {
      toast.error(res.result.message || "Failed to fetch taggedProducts.");
    }
  } catch (err) {
    console.error("fetchTaggedProducts error:", err);
    return { data: [], totalPages: 1 };
  }
};

export const fetchTagsByProductId = async (id = "") => {
  try {
    const res = await requestHandler.get(
      `${endpointsPath.tag}/product/${id}`,
      true
    );
    if (res.statusCode === 200) {
      return {
        data: res.result.data || [],
        totalPages: res.result.totalPages || 1, // Adjust to your actual API response
      };
    } else {
      toast.error(res.result.message || "Failed to fetch taggedProducts.");
    }
  } catch (err) {
    console.error("fetchTaggedProducts error:", err);
    return { data: [], totalPages: 1 };
  }
};


export const deleteTaggedProduct = async (tagId, productId) => {
  try {
    const res = await requestHandler.deleteReq(`${endpointsPath.tag}/remove-from-product?tagId=${tagId}&productId=${productId}`, true);
    if (res.statusCode === 200) {
      return {
      statusCode: res.statusCode,
        data: null,
        message: res.result.message || "Tag deleted"
      };
    } else {
      return {
      statusCode: res.statusCode,
        data: null,
        message: res.result.message || "Failed to delete tagged product."
      };
    }
  } catch (err) {
    console.error("deleteTaggedProduct error:", err);
    return {
      statusCode: 400,
        data: null,
        message: "Tag not deleted"
      };
  }
};
