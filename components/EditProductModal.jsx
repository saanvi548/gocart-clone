'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Helper function to safely get a number, defaulting to 0 if null/undefined
const getSafeNumber = (value) => {
    // Check if the value is null, undefined, or NaN, return 0 in those cases.
    if (value === null || value === undefined || isNaN(value)) {
        return 0;
    }
    return value;
};

// Helper function to format ISO date string (YYYY-MM-DD) for HTML date input
const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function EditProductModal({ product, currency, onClose, onSave, getToken }) {
    
    const stockStatuses = ['STOCK_AVAILABLE', 'STOCK_UNAVAILABLE', 'STOCK_AVAILABLE_BY_PROXY'];
    
    const [formData, setFormData] = useState({
        // 🌟 FIX: Use getSafeNumber for all potential numerical fields
        mrp: getSafeNumber(product.mrp),
        price: getSafeNumber(product.price),
        stock: getSafeNumber(product.stock),
        stockStatus: product.stockStatus,
        availableFrom: formatDateForInput(product.availableFrom),
        availableTo: formatDateForInput(product.availableTo),
    });

    useEffect(() => {
        setFormData({
            mrp: getSafeNumber(product.mrp),
            price: getSafeNumber(product.price),
            stock: getSafeNumber(product.stock),
            stockStatus: product.stockStatus,
            availableFrom: formatDateForInput(product.availableFrom),
            availableTo: formatDateForInput(product.availableTo),
        });
    }, [product]); 

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        // Ensure that number inputs are parsed, but handle empty string by converting it to 0
        const isNumeric = name === 'mrp' || name === 'price' || name === 'stock';
        let newValue = value;

        if (isNumeric) {
             newValue = value === '' ? 0 : parseFloat(value);
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: newValue
        }));
    };

    // Note: The handleSubmit logic is correct assuming onSave is passed from the parent.
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // --- Validation ---
        if (formData.price > formData.mrp) {
            toast.error("Offer Price cannot be higher than the MRP.");
            return;
        }

        const dateFrom = new Date(formData.availableFrom);
        const dateTo = new Date(formData.availableTo);

        if (dateFrom > dateTo) {
            toast.error("'Available From' date cannot be after 'Available To' date.");
            return;
        }

        // --- Prepare Data for API ---
        const dataToSave = {
            id: product.id,
            mrp: formData.mrp,
            price: formData.price,
            stock: formData.stock,
            stockStatus: formData.stockStatus,
            // Pass the ISO strings for the backend
            availableFrom: dateFrom.toISOString(), 
            availableTo: dateTo.toISOString(),     
        };

        // Call the parent's save handler
        onSave(dataToSave); 
    };

    // ... (rest of the UI JSX remains the same)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in" onClick={() => onClose(false)}>
            
            <div 
                className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all duration-300 scale-95 animate-zoom-in" 
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Edit Product: <span className="text-blue-600">{product.name}</span></h2>
                    <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={e => handleSubmit(e)} className="space-y-6">
                    
                    {/* Price and MRP */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label htmlFor="mrp" className="block text-sm font-medium text-gray-700 mb-1">MRP ({currency})</label>
                            <input
                                type="number"
                                id="mrp"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none transition duration-150 ease-in-out"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Offer Price ({currency})</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none transition duration-150 ease-in-out"
                                required
                            />
                        </div>
                    </div>

                    {/* Stock and Stock Status */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock (Units)</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none transition duration-150 ease-in-out"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="stockStatus" className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                            <select
                                id="stockStatus"
                                name="stockStatus"
                                value={formData.stockStatus}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none appearance-none bg-white pr-8 transition duration-150 ease-in-out"
                                required
                            >
                                {stockStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Availability Dates */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                            <input
                                type="date"
                                id="availableFrom"
                                name="availableFrom"
                                value={formData.availableFrom}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none transition duration-150 ease-in-out"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="availableTo" className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
                            <input
                                type="date"
                                id="availableTo"
                                name="availableTo"
                                value={formData.availableTo}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base outline-none transition duration-150 ease-in-out"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6">
                        <button 
                            type="button" 
                            onClick={() => onClose(false)} 
                            className="px-6 py-2 text-base font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}