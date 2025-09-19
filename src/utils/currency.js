// utils/currency.js

export const formatLKR = (n) =>
    `LKR ${Number(n || 0).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
