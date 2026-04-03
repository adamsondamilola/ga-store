export const formatImagePath = (imgPath) => {
    try{
      if (imgPath.length <= 1) {
        return imgPath;
      }
      return imgPath.replaceAll("\\", "/")
      .replaceAll("C:/Users/adams/Desktop/Cpromoter_Store/cpromoter_store/Backend/uploads", "/api/files")
      .replaceAll("/root/api/files", "/api/files")
      .replaceAll("/root/gatuga_endpoints/uploads", "/api/files");
    }
    catch{
      return imgPath;
    }
  };