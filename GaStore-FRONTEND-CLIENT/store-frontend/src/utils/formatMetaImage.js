export const formatMetaImage = (filePath) => {
    try{
      if (filePath.length <= 1) {
        return filePath;
      }
      const imageApiRoot = process.env.baseUrl+'files'
      let file = filePath.replaceAll("\\", "/")
      .replaceAll("C:/Users/adams/Desktop/Cpromoter_Store/cpromoter_store/Backend/uploads", imageApiRoot)
      .replaceAll("/home/cprottoi/gatuga-api.cpromoter.com/uploads", imageApiRoot);
      return file
    }
    catch{
      return filePath;
    }
  };