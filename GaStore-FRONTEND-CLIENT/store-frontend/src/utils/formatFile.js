export const formatFile = (filePath) => {
    try{
      if (filePath.length <= 1) {
        return filePath;
      }
      let file = filePath.replaceAll("\\", "/")
      .replaceAll("/root/api/files", "/api/files")
      .replaceAll("/root/gatuga_endpoints/uploads", "/api/files");
      return file
    }
    catch{
      return filePath;
    }
  };