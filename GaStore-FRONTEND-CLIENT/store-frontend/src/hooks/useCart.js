import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';
import { useCallback, useEffect, useState } from 'react';

export default function useCart() {
  const [cart, setCart] = useState({ items: [], count: 0, subtotal: 0 });

  const getTieredPrice = useCallback((tiers, quantity) => {
    if (!tiers?.length) return 0;
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    return sorted.find(t => quantity >= t.minQuantity)?.pricePerUnit 
      || sorted.at(-1)?.pricePerUnit 
      || 0;
  }, []);

  const updateCart = useCallback(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const items = savedCart.map(item => ({
        ...item,
        unitPrice: getTieredPrice(item.pricingTiers, item.quantity),
      }));
      setCart({
        items,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
      });
    } catch (error) {
      console.error('Error reading cart:', error);
      setCart({ items: [], count: 0, subtotal: 0 });
    }
  }, [getTieredPrice]);

  const updateQuantity = useCallback((id, newQty) => {
    setCart(prev => {
      const updated = prev.items.reduce((acc, item) => {
        if (item.id === id) {
          if (newQty > 0) {
            const finalQuantity = Math.min(newQty, item.stockQuantity || Infinity);
            acc.push({
              ...item,
              quantity: finalQuantity,
              unitPrice: getTieredPrice(item.pricingTiers, finalQuantity),
            });
            //update backend cart
            const payload = {
              variantId: item.variantId,
              quantity: finalQuantity,
            };
            requestHandler.post(`${endpointsPath.cart}/add`, payload, true);
            
          }
        } else {
          acc.push(item);
          //alert("Item not found in cart");
        };
        return acc;
      }, []);
      localStorage.setItem('cart', JSON.stringify(updated));
      window.dispatchEvent(new Event('cart-updated'));
      return {
        items: updated,
        count: updated.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: updated.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0),
      };
    });
  }, [getTieredPrice]);

  useEffect(() => {
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, [updateCart]); 

  return { cart, updateCart, updateQuantity };
}