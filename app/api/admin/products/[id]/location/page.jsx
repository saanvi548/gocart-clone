"use client";

import { useState, useEffect } from 'react';
// 💡 The error is likely due to how the environment resolves 'next/navigation'. 
// Since this is a Client Component, the original import is correct 
// for a standard Next.js app. We will proceed with the original import 
// as it is standard practice, assuming the environment issue is temporary 
// or related to the specific runtime configuration.
import { useParams, useRouter } from 'next/navigation'; 
import { MapPin, Loader2, Save, XCircle } from 'lucide-react';

// Mock data structure for the product state
const initialProductState = {
  name: 'Loading Product...',
  latitude: null,
  longitude: null,
  address: '',
  city: '',
  country: '',
  placeId: '',
};

export default function EditProductLocationPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(initialProductState);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // --- 1. Fetch Current Product Data ---
  useEffect(() => {
    if (!productId) return;

    const fetchProductData = async () => {
      setIsLoading(true);
      setError(null);
      
      // NOTE: This assumes you have a GET handler in your route.jsx
      // to fetch the current product details including its location.
      try {
        const response = await fetch(`/api/admin/products/${productId}`); 
        if (!response.ok) {
          throw new Error('Failed to fetch product data.');
        }
        const data = await response.json();
        
        // Use destructuring to ensure all fields are initialized, handling nulls
        const fetchedData = data.product || initialProductState; 
        
        setProduct(fetchedData);
        setFormData({
          latitude: fetchedData.latitude || '',
          longitude: fetchedData.longitude || '',
          address: fetchedData.address || '',
          city: fetchedData.city || '',
          country: fetchedData.country || '',
          placeId: fetchedData.placeId || '',
        });
      } catch (err) {
        setError(err.message || 'An error occurred while fetching product data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  // --- 2. Handle Form Changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert coordinate inputs to strings, but allow empty string
    const newValue = (name === 'latitude' || name === 'longitude') ? (value === '' ? '' : String(value)) : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear messages on user interaction
    setMessage(null);
    setError(null);
  };

  // --- 3. Handle Form Submission (PATCH to API Route) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUpdating) return;

    // Enhanced validation for coordinates
    const lat = formData.latitude;
    const lng = formData.longitude;

    if (!lat || !lng) {
      setError("Latitude and Longitude are required.");
      return;
    }
    
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
        setError("Latitude and Longitude must be valid numbers.");
        return;
    }


    setIsUpdating(true);
    setMessage(null);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/products/${productId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parsedLat, // Send parsed numbers
          longitude: parsedLng, // Send parsed numbers
          address: formData.address,
          placeId: formData.placeId,
          city: formData.city,
          country: formData.country,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Log the full error detail if available
        console.error("API Update Error Details:", result);
        throw new Error(result.error || result.message || 'Failed to update location.');
      }

      setProduct(prev => ({ ...prev, ...result.product }));
      setMessage('Product location updated successfully!');
      
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during update.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 4. Render Loading/Error States ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="ml-3 text-lg font-medium text-gray-700">Loading product details...</p>
      </div>
    );
  }

  if (error && !message) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
            <XCircle className="h-10 w-10 text-red-600 mb-4" />
            <h1 className="text-xl font-bold text-red-800">Error Loading Data</h1>
            <p className="text-sm text-red-600 mt-2">{error}</p>
            <button
                onClick={() => router.back()}
                className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
            >
                Go Back
            </button>
        </div>
    );
  }


  // --- 5. Main UI Render ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-4 border-b pb-4 mb-6">
          <MapPin className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-extrabold text-gray-800">
            Edit Location: {product.name}
          </h1>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latitude */}
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                Latitude (Required)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="latitude"
                  id="latitude"
                  value={formData.latitude || ''}
                  onChange={handleChange}
                  placeholder="e.g., 34.0522"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                  required
                />
              </div>
            </div>

            {/* Longitude */}
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                Longitude (Required)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="longitude"
                  id="longitude"
                  value={formData.longitude || ''}
                  onChange={handleChange}
                  placeholder="e.g., -118.2437"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Line */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address Line
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={formData.country || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
              />
            </div>

            {/* Place ID (Hidden/Optional) */}
            <div>
              <label htmlFor="placeId" className="block text-sm font-medium text-gray-700">
                Place ID (Optional, for Google Maps integration)
              </label>
              <input
                type="text"
                name="placeId"
                id="placeId"
                value={formData.placeId || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdating}
              className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg transition-colors duration-200 ${
                isUpdating
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save New Location
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}