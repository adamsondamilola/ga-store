import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";

export async function addToCart(product, quantity = 1, isLoggedIn = false) {
  try {
    if (!isLoggedIn) {
      // ------------------------------
      // Guest: Save to localStorage
      // ------------------------------
      const raw = localStorage.getItem("cart");
      const cart = raw ? JSON.parse(raw) : [];

      const found = cart.find((i) => i.variantId === product.variantId);

      if (found) {
        found.quantity = Math.min(
          found.quantity + quantity,
          product.stockQuantity || Infinity
        );
      } else {
        cart.push({
          productId: product.productId,
          variantId: product.variantId,
          name: product.name,
          variantName: product.variantName,
          image: product.image,
          pricingTiers: product.pricingTiers,
          stockQuantity: product.stockQuantity,
          quantity,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      return { success: true, message: "Added to cart (guest)" };
    }

    // ------------------------------
    // Logged-In User → Send to Backend API
    // ------------------------------
    const payload = {
      variantId: product.variantId,
      quantity,
    };

    const response = await requestHandler.post(`${endpointsPath.cart}/add`, payload, true);

    if (response.statusCode === 200) {
      window.dispatchEvent(new Event("cart-updated"));
      return { success: true, message: "Added to cart" };
    }

    return { success: false, message: response.message };
  } catch (err) {
    console.error("Add to cart error:", err);
    return { success: false, message: "Unable to add to cart" };
  }
}
