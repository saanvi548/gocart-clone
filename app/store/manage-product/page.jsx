'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
// ℹ️ ASSUME you have this component in '@/components/EditProductModal'
import EditProductModal from "@/components/EditProductModal" 

export default function StoreManageProducts() {

    const {getToken}=useAuth()
    const{ user} =useUser() 

    // Assuming NEXT_PUBLIC_CURRENCY_SYMBOL is correctly set
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    
    // 👇 STATE FOR MODAL MANAGEMENT
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    // 👆

    const fetchProducts = async () => {
        setLoading(true) 
        try{
            const token =await getToken()
            const{ data}= await axios.get('/api/store/product',{headers:{Authorization:`Bearer ${token}`}})
            // Sort by creation date descending (newest first)
            setProducts(data.products.sort((a,b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) 
        }catch(error)
        {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        // Optimistic UI update: Toggle state immediately for fast feedback
        const productToUpdate = products.find(p => p.id === productId);
        const originalInStock = productToUpdate ? productToUpdate.inStock : null;
        
        setProducts(prevProducts =>prevProducts.map(product=> 
            product.id ===productId ? {...product,inStock:!product.inStock}:product
        ))

        try{
            const token =await getToken()
            const {data}=await axios.post('/api/store/stock-toggle',{productId},{headers:{Authorization:`Bearer ${token}`}})
            
            toast.success(data.message)

        }catch(error)
        {
            // Revert state if the API call fails
            if (originalInStock !== null) {
                setProducts(prevProducts => prevProducts.map(product =>
                    product.id === productId ? { ...product, inStock: originalInStock } : product
                ));
            }
            toast.error(error?.response?.data?.error || error.message)
        }
    }
    
    // 👇 Open Edit Modal
    const handleEditClick = (product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    // 👇 Close Modal and Refresh Data
    const handleCloseModal = (refreshNeeded) => {
        setIsModalOpen(false)
        setSelectedProduct(null)
        if (refreshNeeded) {
            fetchProducts() // Re-fetch products to show updated data
        }
    }
    
    // 🌟 NEW FUNCTION: Handle Product Save from Modal
    const handleSave = async (dataToSave) => {
        try {
            const token = await getToken();
            
            const response = await axios.post('/api/store/product/update', dataToSave, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(response.data.message || "Product updated successfully!");
            // Close modal and refresh the list
            handleCloseModal(true); 

        } catch (error) {
            // Display error if API call fails
            toast.error(error?.response?.data?.error || "Failed to save changes. Please try again.");
            // Keep the modal open so the user can fix the data
        }
    };
    // 👆

    // FIX: Included getToken as a dependency for better adherence to React rules
    useEffect(() => {
        // Ensure user object is loaded before fetching to guarantee getToken works
        if(user?.id){fetchProducts()} 
            
    }, [user, getToken]) 

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            
            {/* Table Structure */}
            <table className="w-full max-w-6xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Price / MRP</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3 hidden lg:table-cell">Stock Status</th>
                        <th className="px-4 py-3">In Stock</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                    <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt={product.name} />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{product.name}</span>
                                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{product.description}</span>
                                    </div>
                                </div>
                            </td>
                            {/* Price/MRP */}
                            <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-green-600 font-semibold">{currency} {product.price.toLocaleString()}</span>
                                <br/>
                                <span className="text-slate-500 line-through text-xs">{currency} {product.mrp.toLocaleString()}</span>
                            </td>
                            
                            {/* Stock */}
                            <td className="px-4 py-3 font-semibold">
                                {product.stock}
                            </td>
                            
                            {/* Stock Status */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    product.stockStatus === 'STOCK_AVAILABLE' ? 'bg-green-100 text-green-800' :
                                    product.stockStatus === 'STOCK_UNAVAILABLE' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {product.stockStatus.replace(/_/g, ' ')}
                                </span>
                            </td>

                            {/* In Stock Toggle */}
                            <td className="px-4 py-3 text-center">
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating stock status..." })} 
                                        checked={product.inStock} 
                                    />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </td>

                            {/* Actions Column (Edit) */}
                            <td className="px-4 py-3">
                                <button 
                                    onClick={() => handleEditClick(product)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 👇 MODAL COMPONENT (now passes onSave) */}
            {isModalOpen && selectedProduct && (
                <EditProductModal 
                    product={selectedProduct} 
                    currency={currency} // Pass currency prop for modal UI
                    onClose={handleCloseModal} 
                    onSave={handleSave} // <--- This connects the modal's Save button to the API
                    getToken={getToken} 
                />
            )}
            {/* 👆 */}
        </>
    )
}