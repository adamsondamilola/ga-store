export default function base64ToBinary(base64String) {

      const padLength = base64String.length % 4;
      if (padLength > 0) {
        base64String += '='.repeat(4 - padLength);
      }
     base64String = base64Data.split(",")[1];

    //base64String = base64String.replace(/[^A-Za-z0-9+/=]/g, '');
    // Decode the base64 string
    const binaryString = atob(base64String);
    
    // Convert the binary string to an array of 8-bit unsigned integers
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    
    for (let i = 0; i < binaryLen; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a Blob object to represent the binary data
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    
    return blob;
  }