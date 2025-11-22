'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
            <p className="p-1">{cartItems[productId]}</p>
            <button onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter


// 'use client'
// import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
// import { useDispatch, useSelector } from "react-redux";

// const Counter = ({ productId }) => {
//   const { cartItems } = useSelector(state => state.cart);
//   const dispatch = useDispatch();

//   const quantity = cartItems[productId] || 1;
//   const MAX_QTY = 20; // ✅ max set to 20

//   const addToCartHandler = () => {
//     if (quantity < MAX_QTY) {
//       dispatch(addToCart({ productId }));
//     }
//   };

//   const removeFromCartHandler = () => {
//     if (quantity > 1) {
//       dispatch(removeFromCart({ productId }));
//     }
//   };

//   const handleInputChange = (e) => {
//     let value = parseInt(e.target.value) || 1;
//     if (value < 1) value = 1;
//     if (value > MAX_QTY) value = MAX_QTY;
//     dispatch(addToCart({ productId, quantity: value - quantity })); // adjust quantity in Redux
//   };

//   return (
//     <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
//       <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
//       <input
//         type="number"
//         min="1"
//         max={MAX_QTY}
//         value={quantity}
//         onChange={handleInputChange}
//         className="w-16 text-center border rounded px-1"
//       />
//       <button onClick={addToCartHandler} className="p-1 select-none">+</button>
//     </div>
//   )
// };

// export default Counter;
