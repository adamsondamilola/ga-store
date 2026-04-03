export const stringToSLug = (str) => {
    try{
      if (str.length <= 1) {
        return str;
      }
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')    // Remove all non-word chars
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/--+/g, '-');       // Replace multiple - with single -
    
    }
    catch{
      return str;
    }
  };