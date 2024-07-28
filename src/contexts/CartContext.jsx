// src/context/CartContext.js
import React, { createContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const initialState = JSON.parse(localStorage.getItem('cart')) || [];

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      return [...state, action.payload];
    case 'REMOVE_FROM_CART':
      return state.filter(item => item.id !== action.payload.id);
    case 'UPDATE_CART':
      return state.map(item => item.id === action.payload.id ? action.payload : item);
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext, CartProvider };
