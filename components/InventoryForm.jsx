'use client';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'DELIVERED', label: 'Delivered (Available)' },
  { value: 'SHIPPED', label: 'Shipped (Proxy Available)' },
  { value: 'ORDER_PLACED', label: 'Order Placed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function InventoryForm({ onAdd }) {
  const [productName, setProductName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState('DELIVERED');
  const [pricePaid, setPricePaid] = useState('');
  const [stock, setStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imagePreviewUrl = useMemo(() => {
    return imageFile ? URL.createObjectURL(imageFile) : '/placeholder.png';
  }, [imageFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName || pricePaid === '' || stock === '') {
      toast.error('Please fill all fields.');
      return;
    }
    const parsedStock = parseInt(stock);
    const parsedPrice = parseFloat(pricePaid);
    if (parsedStock <= 0 || parsedPrice < 0) {
      toast.error('Stock must be positive and Price cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Adding item...', { id: 'add-item' });

    try {
      await new Promise((res) => setTimeout(res, 500));
      const newItem = {
        product: { name: productName, image: imagePreviewUrl, productId: crypto.randomUUID() },
        status,
        stock: parsedStock,
        totalPaid: parsedPrice * parsedStock,
      };
      onAdd(newItem);

      toast.success(`${productName} added!`, { id: 'add-item' });

      // Reset form
      setProductName('');
      setImageFile(null);
      setStatus('DELIVERED');
      setPricePaid('');
      setStock('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add item.', { id: 'add-item' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center mb-6 border-b border-gray-200 pb-2">
        <PlusCircle className="w-6 h-6 text-green-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Add Inventory Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Deluxe Widget"
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            required
          />
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden shadow-sm flex items-center justify-center">
            <img src={imagePreviewUrl} alt="Preview" className="object-cover w-full h-full" />
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:py-2 file:px-4 file:border-0 file:bg-green-50 file:text-green-700 file:rounded-full file:hover:bg-green-100"
            />
            <p className="text-xs text-gray-400 mt-1">{imageFile ? imageFile.name : 'Session only preview'}</p>
          </div>
        </div>

        {/* Price and Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Paid ($)</label>
            <input
              type="number"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="1"
              placeholder="1"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              required
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition appearance-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center items-center p-3 rounded-xl font-semibold text-white transition shadow-lg ${
            isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
          }`}
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {isSubmitting ? 'Adding...' : 'Add to Inventory'}
        </button>
      </form>
    </div>
  );
}
