'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import EditProductModal from "@/components/EditProductModal"

export default function StoreManageProducts() {

    const {getToken}=useAuth()
    const{ user} =useUser() 

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])    
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    const fetchProducts = async () => {
        setLoading(true) 
        try{
            const token =await getToken()
            const{ data}= await axios.get('/api/store/product',{headers:{Authorization:`Bearer ${token}`}})
            setProducts(data.products.sort((a,b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) 
        }catch(error)
        {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
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
            if (originalInStock !== null) {
                setProducts(prevProducts => prevProducts.map(product =>
                    product.id === productId ? { ...product, inStock: originalInStock } : product
                ));
            }
            toast.error(error?.response?.data?.error || error.message)
        }
    }
    
    const handleEditClick = (product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleCloseModal = (refreshNeeded) => {
        setIsModalOpen(false)
        setSelectedProduct(null)
        if (refreshNeeded) fetchProducts()
    }
    
    const handleSave = async (dataToSave) => {
        try {
            const token = await getToken();
            const response = await axios.post('/api/store/product/update', dataToSave, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.message || "Product updated successfully!");
            handleCloseModal(true); 
        } catch (error) {
            toast.error(error?.response?.data?.error || "Failed to save changes. Please try again.");
        }
    };

    useEffect(() => {
        if(user?.id){fetchProducts()} 
    }, [user, getToken]) 

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            
            {/* Styled Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-500 border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-slate-600">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden md:table-cell">Price / MRP</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Stock Status</th>
                            <th className="px-4 py-3">In Stock</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="bg-white rounded-lg shadow-sm hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-3 items-center">
                                        <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt={product.name} />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{product.name}</span>
                                            <span className="text-xs text-slate-400 truncate max-w-[150px]">{product.description}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="text-green-600 font-semibold">{currency} {product.price.toLocaleString()}</span>
                                    <br/>
                                    <span className="text-slate-400 line-through text-xs">{currency} {product.mrp.toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-3 font-semibold">{product.stock}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        product.stockStatus === 'STOCK_AVAILABLE' ? 'bg-green-100 text-green-800' :
                                        product.stockStatus === 'STOCK_UNAVAILABLE' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {product.stockStatus.replace(/_/g, ' ')}
                                    </span>
                                </td>
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
            </div>

            {/* Modal */}
            {isModalOpen && selectedProduct && (
                <EditProductModal 
                    product={selectedProduct} 
                    currency={currency} 
                    onClose={handleCloseModal} 
                    onSave={handleSave} 
                    getToken={getToken} 
                />
            )}
        </>
    )
}
