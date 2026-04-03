export default function camelCaseToTitleCase(camelCaseString) {
    // Split the string by uppercase letters and rejoin with spaces
    const spacedString = camelCaseString.replace(/([a-z])([A-Z])/g, "$1 $2");
    // Capitalize the first letter
    return spacedString.charAt(0).toUpperCase() + spacedString.slice(1);
  }