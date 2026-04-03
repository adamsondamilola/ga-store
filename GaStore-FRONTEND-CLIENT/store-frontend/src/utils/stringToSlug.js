export const stringToSLug = (str) => {
  try {
    if (!str || str.length <= 1) return str;
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/--+/g, '-');    // Replace multiple - with single -
  } catch {
    return str;
  }
};

export const slugToString = (slug) => {
  try {
    if (!slug || slug.length <= 1) return slug;
    return slug
      .split('-') // Split words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each
      .join(' '); // Join with spaces
  } catch {
    return slug;
  }
};
