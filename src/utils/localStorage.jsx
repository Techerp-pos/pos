// src/utils/localStorage.js

export const saveImageToLocalStorage = (id, imageData) => {
    localStorage.setItem(`image-${id}`, imageData);
};

export const getImageFromLocalStorage = (id) => {
    return localStorage.getItem(`image-${id}`);
};
