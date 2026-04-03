import { toast } from "react-toastify";
import endpointsPath from "../../../constants/EndpointsPath";
import requestHandler from "../../../utils/requestHandler";

export const fetchTags = async (search = "", page = 1, limit = 10) => {
  try { 
    const res = await requestHandler.get(
      `${endpointsPath.tag}?search=${search}&page=${page}&limit=${limit}`,
      true
    );
    if (res.statusCode === 200) {
      return {
        data: res.result.data || [],
        totalPages: res.result.totalPages || 1, // Adjust to your actual API response
      };
    } else {
      toast.error(res.result.message || "Failed to fetch tags.");
    }
  } catch (err) {
    console.error("fetchTags error:", err);
    return { data: [], totalPages: 1 };
  }
};

export const createTag = async (data) => {
  try {
    const res = await requestHandler.post(endpointsPath.tag, data, true);
    if (res.statusCode === 201 || res.statusCode === 200) {
      return res.result;
    } else {
      toast.error(res.result.message || "Failed to create tag.");
    }
  } catch (err) {
    console.error("createTag error:", err);
    throw err;
  }
};

export const updateTag = async (id, data) => {
  try {
    data.id = id; 
    const res = await requestHandler.put(`${endpointsPath.tag}`, data, true);
    if (res.statusCode === 200) {
      toast.success(res.result.message || "Tag updated.");
      return res.result;
    } else {
      toast.error(res.result.message || "Failed to update tag.");
    }
  } catch (err) {
    console.error("updateTag error:", err);
    throw err;
  }
};

export const deleteTag = async (id) => {
  try {
    const res = await requestHandler.deleteReq(`${endpointsPath.tag}/${id}`, true);
    if (res.statusCode === 200) {
      return res.result.message;
    } else {
      toast.error(res.result.message || "Failed to delete tag.");
    }
  } catch (err) {
    console.error("deleteTag error:", err);
    throw err;
  }
};
