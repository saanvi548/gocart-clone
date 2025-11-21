'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, PackageCheckIcon, PackageXIcon, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { format } from 'date-fns';

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images[0]);

    // 🎯 REVISED STOCK AND AVAILABILITY LOGIC 🎯
    // Only set to unavailable if the status is explicitly 'STOCK_UNAVAILABLE'.
    // Stock of 0 is acceptable for 'BY_PROXY' and 'AVAILABLE'.
    const isExplicitlyUnavailable = product.stockStatus === 'STOCK_UNAVAILABLE';
    
    // Check if the item is in physical stock (for display purposes)
    const isInStock = product.stock > 0 && product.stockStatus === 'STOCK_AVAILABLE';
    const isAvailableByProxy = product.stockStatus === 'STOCK_AVAILABLE_BY_PROXY';

    // Button text changes based on stock and cart status
    let buttonText = isExplicitlyUnavailable 
        ? 'Unavailable' 
        : (isAvailableByProxy ? 'Pre-Order Now' : (cart[productId] ? 'View Cart' : 'Add to Cart'));

    // Handle price calculation
    const totalRating = product.rating.reduce((acc, item) => acc + item.rating, 0);
    const averageRating = product.rating.length > 0 ? totalRating / product.rating.length : 0;
    const ratingCount = product.rating.length;
    
    // Format dates (ensure date-fns is installed: npm install date-fns)
    const availableFrom = product.availableFrom ? format(new Date(product.availableFrom), 'MMM d, yyyy') : 'N/A';
    const availableTo = product.availableTo ? format(new Date(product.availableTo), 'MMM d, yyyy') : 'N/A';


    const addToCartHandler = () => {
        if (!isExplicitlyUnavailable) {
            dispatch(addToCart({ productId }))
        }
    }
    
    // Determine the primary button action
    const handlePrimaryAction = () => {
        if (cart[productId]) {
            router.push('/cart');
        } else if (!isExplicitlyUnavailable) {
            addToCartHandler();
        }
    }

    // --- Conditional Stock Display Content ---
    let stockDisplay;
    if (isExplicitlyUnavailable) {
        stockDisplay = (
            <p className="flex items-center gap-2 text-lg font-bold text-red-600">
                <PackageXIcon size={20} />
                Unavailable
            </p>
        );
    } else if (isAvailableByProxy) {
        stockDisplay = (
            <p className="flex items-center gap-2 text-lg font-bold text-yellow-600">
                <PackageCheckIcon size={20} />
                Available by Proxy (Pre-Order)
            </p>
        );
    } else if (isInStock) {
        stockDisplay = (
            <p className="flex items-center gap-2 text-lg font-bold text-green-600">
                <PackageCheckIcon size={20} />
                In Stock: {product.stock} units
            </p>
        );
    } else {
         // Case: Stock is 0 AND status is 'STOCK_AVAILABLE' (shouldn't happen often, but acts as a safety net)
         stockDisplay = (
            <p className="flex items-center gap-2 text-lg font-bold text-red-600">
                <PackageXIcon size={20} />
                Out of Stock
            </p>
        );
    }
    // ------------------------------------------

    return (
        <div className="flex max-lg:flex-col gap-12">
            
            {/* 1. Image Gallery (omitted for brevity) */}
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {product.images.map((image, index) => (
                        <div 
                            key={index} 
                            onClick={() => setMainImage(product.images[index])} 
                            className="bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer border-2 transition"
                            style={{ borderColor: mainImage === image ? '#3b82f6' : 'transparent' }} 
                        >
                            <Image src={image} className="group-hover:scale-103 group-active:scale-95 transition" alt={`Product thumbnail ${index + 1}`} width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg ">
                    <Image src={mainImage} alt={product.name} width={250} height={250} />
                </div>
            </div>
            
            {/* 2. Product Information and Action */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                
                {/* Rating */}
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{ratingCount} Reviews</p>
                </div>
                
                {/* Price & Discount (omitted for brevity) */}
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {currency}{product.price.toFixed(2)} </p>
                    <p className="text-xl text-slate-500 line-through">{currency}{product.mrp.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <TagIcon size={14} />
                    <p>Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}% right now</p>
                </div>
                
                <hr className="border-gray-300 my-5" />

                {/* 🎯 UPDATED STOCK STATUS 🎯 */}
                <div className="flex flex-col gap-3">
                    
                    {/* Stock Status */}
                    {stockDisplay}

                    {/* Availability Dates */}
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarIcon size={16} />
                        Available: <span className="font-medium text-slate-700">{availableFrom}</span> to <span className="font-medium text-slate-700">{availableTo}</span>
                    </p>
                </div>

                <hr className="border-gray-300 my-5" />

                {/* 3. Action Buttons */}
                <div className="flex items-end gap-5 mt-10">
                    {
                        // Show counter only if product is in cart AND NOT unavailable
                        cart[productId] && !isExplicitlyUnavailable && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }
                    <button 
                        onClick={handlePrimaryAction} 
                        disabled={isExplicitlyUnavailable} // 🛑 Only disable when EXPLICITLY UNAVAILABLE 🛑
                        className={`px-10 py-3 text-sm font-medium rounded transition 
                            ${isExplicitlyUnavailable 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95'
                            }`}
                    >
                        {buttonText}
                    </button>
                </div>

                <hr className="border-gray-300 my-5" />
                
                {/* Shipping and Payment Info (omitted for brevity) */}
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails