export const nullToEmpty = (text) => {
    if(!text){
      return '';
    }  
    if (text == "" || text == null) {
      return '';
    }
    if (text == "null" || text == "undefined") {
      return '';
    }
    return '';
  };
  