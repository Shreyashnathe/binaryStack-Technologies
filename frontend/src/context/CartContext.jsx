import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
} from '../api/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // Fetch cart items from database when user is a STUDENT
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      apiGetCart(user.userId)
        .then((res) => {
          const items = res.data?.data || [];
          setCartItems(items);
        })
        .catch((err) => {
          console.error('Failed to fetch cart items:', err);
        });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartItems([]);
    }
  }, [user]);

  const addToCart = async (course) => {
    if (!user) return;
    try {
      await apiAddToCart(user.userId, course.id);
      setCartItems((prev) => {
        if (prev.some((item) => item.id === course.id)) return prev;
        return [...prev, course];
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const removeFromCart = async (courseId) => {
    if (!user) return;
    try {
      await apiRemoveFromCart(user.userId, courseId);
      setCartItems((prev) => prev.filter((item) => item.id !== courseId));
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (courseId) => {
    return cartItems.some((item) => item.id === courseId);
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
