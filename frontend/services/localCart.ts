// Helper functions for managing cart in localStorage
// This allows users to add products to cart without logging in

interface LocalCartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

interface LocalCartData {
  [key: number]: LocalCartItem & { qty: number; size: any };
}

const LOCAL_CART_STORAGE_KEY = 'local_cart_items';

/**
 * Get cart from localStorage for non-authenticated users
 */
export const getLocalCart = (): LocalCartData => {
  if (typeof window === 'undefined') return {};
  try {
    const cartStr = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    return cartStr ? JSON.parse(cartStr) : {};
  } catch (error) {
    console.error('Error parsing local cart:', error);
    return {};
  }
};

/**
 * Save cart to localStorage for non-authenticated users
 */
export const saveLocalCart = (cart: LocalCartData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving local cart:', error);
  }
};

/**
 * Add item to local cart (localStorage)
 */
export const addItemToLocalCart = (
  productId: number,
  name: string,
  price: number,
  quantity: number,
  unit: string,
  image?: string
) => {
  const cart = getLocalCart();
  
  if (cart[productId]) {
    // Item exists, update quantity
    cart[productId].qty += quantity;
    cart[productId].quantity += quantity;
  } else {
    // New item
    cart[productId] = {
      product_id: productId,
      name,
      price,
      quantity,
      qty: quantity,
      unit,
      size: unit,
      image
    };
  }
  
  saveLocalCart(cart);
  return cart;
};

/**
 * Remove item from local cart
 */
export const removeItemFromLocalCart = (productId: number) => {
  const cart = getLocalCart();
  delete cart[productId];
  saveLocalCart(cart);
  return cart;
};

/**
 * Update quantity of item in local cart
 */
export const updateLocalCartItemQuantity = (productId: number, quantity: number) => {
  const cart = getLocalCart();
  
  if (cart[productId]) {
    if (quantity <= 0) {
      delete cart[productId];
    } else {
      cart[productId].qty = quantity;
      cart[productId].quantity = quantity;
    }
  }
  
  saveLocalCart(cart);
  return cart;
};

/**
 * Clear all items from local cart
 */
export const clearLocalCart = () => {
  if (typeof window === 'undefined') return {};
  localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
  return {};
};

/**
 * Get total quantity of items in local cart
 */
export const getLocalCartTotalQuantity = (): number => {
  const cart = getLocalCart();
  return Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
};

/**
 * Get total price of items in local cart
 */
export const getLocalCartTotalPrice = (): number => {
  const cart = getLocalCart();
  return Object.values(cart).reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
};

/**
 * Convert local cart to API format for syncing
 */
export const convertLocalCartToApiFormat = () => {
  const cart = getLocalCart();
  return Object.values(cart).map(item => ({
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    quantity: item.qty || item.quantity,
    unit: item.unit,
    image: item.image
  }));
};
