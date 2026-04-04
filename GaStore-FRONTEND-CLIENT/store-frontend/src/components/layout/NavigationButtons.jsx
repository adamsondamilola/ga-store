import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  FiUser, 
  FiShoppingCart, 
  FiX, 
  FiChevronDown, 
  FiMinus, 
  FiPlus, 
  FiHelpCircle 
} from 'react-icons/fi';
import endpointsPath from '@/constants/EndpointsPath';
import formatNumberToCurrency from '@/utils/numberToMoney';
import requestHandler from '@/utils/requestHandler';
import useCart from '@/hooks/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Helper function to check if a value is null/undefined or "null" string
const isNullOrEmpty = (value) => {
  return value === null || value === undefined || value === "null" || value === "";
};

// Custom hook for dropdown functionality
const useDropdown = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = {
    account: useRef(null),
    help: useRef(null)
  };

  const toggleDropdown = useCallback((dropdownName) => {
    setActiveDropdown(prev => prev === dropdownName ? null : dropdownName);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && 
          !dropdownRefs[activeDropdown]?.current?.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeDropdown]);

  return { activeDropdown, dropdownRefs, toggleDropdown };
};

export default function NavigationButtons() {
  const [showModal, setShowModal] = useState(false);
  const { activeDropdown, dropdownRefs, toggleDropdown } = useDropdown();
  const { cart, updateCart, updateQuantity } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = useParams();
  const router = useRouter();

  useEffect(() => {
    const loggedInUser = async () => { 
      try {
        const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        if(resp?.statusCode === 200) {
          setIsLoggedIn(true);
        } else {
          const redirectUrl = router.asPath || window.location.pathname + window.location.search;
          if(!isNullOrEmpty(redirectUrl)) {
            localStorage.setItem("redirect_url", redirectUrl);
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    loggedInUser();
  }, []);

  // Filter cart items to remove any with null/empty values
  const filteredCartItems = cart?.items?.filter(item => {
    return !isNullOrEmpty(item.id) && 
           !isNullOrEmpty(item.name) && 
           !isNullOrEmpty(item.unitPrice) && 
           !isNullOrEmpty(item.image);
  }) || [];

  // Calculate cart stats based on filtered items
  const cartStats = {
    items: filteredCartItems,
    count: filteredCartItems.length,
    subtotal: filteredCartItems.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0)
  };

  // Sub-components for better organization
  const DropdownButton = ({ name, icon: Icon, label }) => {
    if (isNullOrEmpty(name) || !Icon || isNullOrEmpty(label)) return null;
    
    return (
      <button 
        onClick={() => toggleDropdown(name)}
        className="flex items-center gap-1 text-white hover:text-white/85 transition-colors"
        aria-expanded={activeDropdown === name}
        aria-haspopup="true"
        aria-controls={`${name}-dropdown`}
      >
        <Icon className="text-xl text-white transition-colors" />
        <span className="hidden md:inline text-lg text-white">{label}</span>
        <FiChevronDown className={`hidden md:block text-sm mt-0.5 text-white/80 transition-transform ${activeDropdown === name ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  const DropdownMenu = ({ name, items }) => {
    if (isNullOrEmpty(name) || !Array.isArray(items)) return null;
    
    // Filter out null/empty items and ensure valid href and label
    const validItems = items.filter(item => {
      if (item.divider) return true;
      return !isNullOrEmpty(item.href) && !isNullOrEmpty(item.label);
    });

    if (validItems.length === 0) return null;

    return (
      <div 
        id={`${name}-dropdown`}
        className={`absolute right-0 md:left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 
                   ${activeDropdown === name ? 'block' : 'hidden'}`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby={`${name}-button`}
      >
        {validItems.map((item, index) => (
          item.divider ? (
            <div key={`divider-${index}`} className="border-t border-gray-100 my-1"></div>
          ) : (
            <Link 
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              {item.label}
            </Link>
          )
        ))}
      </div>
    );
  };

  const CartItem = ({ item }) => {
    if (!item || isNullOrEmpty(item.id) || isNullOrEmpty(item.name)) return null;
    
    const itemId = item.id || '';
    const itemName = item.name || '';
    const unitPrice = Number(item.unitPrice) || 0;
    const quantity = Number(item.quantity) || 1;
    const imageUrl = !isNullOrEmpty(item.image) ? item.image : '/default-image.jpg';
    const stockQuantity = !isNullOrEmpty(item.stockQuantity) ? Number(item.stockQuantity) : Infinity;
    const variantName = !isNullOrEmpty(item.variantName) ? item.variantName : '';
    
    const isMaxQuantity = quantity >= stockQuantity;
    
    return (
      <li className="p-4 border-b flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          <Image 
            src={imageUrl}
            alt={itemName}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/default-image.jpg';
            }}
          />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium">{itemName}</h3>
          <p className="text-gray-600">{formatNumberToCurrency(unitPrice)}</p>
          
          {!isNullOrEmpty(variantName) && (
            <p className="text-sm text-gray-500">
              {variantName}
            </p>
          )}
          
          <div className="flex items-center mt-2">
            <button
              onClick={() => updateQuantity(itemId, quantity - 1)}
              className="p-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              <FiMinus size={14} />
            </button>
            <span className="mx-2 w-8 text-center">{quantity}</span>
            <button
              onClick={() => updateQuantity(itemId, quantity + 1)}
              className={`p-1 rounded ${isMaxQuantity ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
              aria-label="Increase quantity"
              disabled={isMaxQuantity}
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-medium">
            {formatNumberToCurrency(unitPrice * quantity)}
          </p>
          <button
            onClick={() => updateQuantity(itemId, 0)}
            className="text-red-500 text-sm hover:text-red-700 mt-1"
            aria-label="Remove item"
          >
            Remove
          </button>
        </div>
      </li>
    );
  };

  return (
    <>
      <div className="flex items-center gap-4 md:gap-6">
        {/* Account Dropdown */}
        <div className="relative" ref={dropdownRefs.account}>
          <DropdownButton name="account" icon={FiUser} label="Account" />
          <DropdownMenu 
            name="account"
            items={[
              { href: "/customer", label: "My Account" },
              { href: "/customer/orders", label: "Orders" },
              { divider: true },
              isLoggedIn ? { href: "/logout", label: "Sign out" } : {href: "/login", label: "Sign In"}
            ]}
          />
        </div>

        {/* Help Dropdown */}
        <div className="relative" ref={dropdownRefs.help}>
          <DropdownButton name="help" icon={FiHelpCircle} label="Help" />
          <DropdownMenu 
            name="help"
            items={[
              { href: "/contact", label: "Contact Us" },
              { href: "/faq", label: "FAQs" }
            ]}
          />
        </div>

        {/* Cart Icon */}
        <div className="relative">
          <button 
            onClick={() => setShowModal(true)}
            className="p-2 hover:bg-white/15 rounded-full transition-all relative text-white"
            aria-label={`Cart (${cartStats.count} items)`}
            aria-live="polite"
          >
            <FiShoppingCart 
              className="text-xl text-white transition-colors"
            />
            {cartStats.count > 0 && (
              <span 
                className="absolute -top-2 -right-2 bg-black text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center"
                aria-hidden="true"
              >
                {cartStats.count > 9 ? '9+' : cartStats.count}
              </span>
            )}
          </button>
          <div className="sr-only" aria-atomic="true">
            {cartStats.count > 0 ? `${cartStats.count} items in cart` : 'Cart is empty'}
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 text-black flex justify-end z-50" 
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white w-full max-w-md h-screen flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Cart ({cartStats.count})</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close cart"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cartStats.items.length > 0 ? (
                <ul>
                  {cartStats.items.map(item => (
                    <CartItem key={`${item.id}-${item.variantId || ''}`} item={item} />
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Your cart is empty
                </div>
              )}
            </div>

            {cartStats.items.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatNumberToCurrency(cartStats.subtotal)}</span>
                </div>
                <Link 
                  href="/checkout" 
                  className="block w-full py-3 bg-black text-white text-center rounded hover:bg-gray-800 transition"
                  onClick={() => setShowModal(false)}
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
