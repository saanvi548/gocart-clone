'use client'

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import LocationInput from "@/components/LocationsInput"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function UpdateProductLocations() {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationDetails, setLocationDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(true)
  
  const { getToken } = useAuth()

  // Fetch products without location data
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setFetchingProducts(true)
      const token = await getToken()
      const { data } = await axios.get('/api/admin/products/without-location', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(data.products)
    } catch (error) {
      toast.error('Failed to fetch products')
      console.error(error)
    } finally {
      setFetchingProducts(false)
    }
  }

  const handleLocationSelect = async (place) => {
    setSelectedLocation(place)
    
    try {
      const res = await fetch(`/api/location/details?place_id=${place.place_id}`)
      const data = await res.json()
      
      if (data.status === 'OK') {
        const { geometry, formatted_address, address_components } = data.result
        
        const city = address_components?.find(c => c.types.includes("locality"))?.long_name
        const country = address_components?.find(c => c.types.includes("country"))?.long_name
        
        setLocationDetails({
          latitude: geometry.location.lat,
          longitude: geometry.location.lng,
          address: formatted_address,
          placeId: place.place_id,
          city: city || '',
          country: country || '',
        })
      }
    } catch (error) {
      console.error('Error fetching location details:', error)
      toast.error('Failed to fetch location details')
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !locationDetails) {
      return toast.error('Please select a product and location')
    }

    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.patch(
        `/api/admin/products/${selectedProduct.id}/location`,
        locationDetails,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast.success('Product location updated!')
      
      // Remove updated product from list
      setProducts(products.filter(p => p.id !== selectedProduct.id))
      setSelectedProduct(null)
      setSelectedLocation(null)
      setLocationDetails(null)
      
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update location')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpdateWithStoreLocation = async () => {
    if (!confirm('Update all products with their store locations?')) return

    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        '/api/admin/products/bulk-update-locations',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast.success(data.message)
      fetchProducts() // Refresh the list
      
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Bulk update failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingProducts) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Update Product Locations</h1>
      <p className="text-gray-600 mb-8">
        {products.length} products need location data
      </p>

      {/* Bulk Update Option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="font-semibold text-blue-900 mb-2">Quick Bulk Update</h2>
        <p className="text-sm text-blue-700 mb-4">
          Automatically update all products with their store's location
        </p>
        <button
          onClick={handleBulkUpdateWithStoreLocation}
          disabled={loading || products.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Bulk Update All Products
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-semibold">✓ All products have location data!</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm">
          {/* Product Selector */}
          <div className="p-6 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product to Update
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value)
                setSelectedProduct(product)
                setSelectedLocation(null)
                setLocationDetails(null)
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} ({product.category})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Product Details */}
          {selectedProduct && (
            <div className="p-6 bg-gray-50 border-b">
              <h3 className="font-semibold text-lg mb-2">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Store:</strong> {selectedProduct.store?.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Category:</strong> {selectedProduct.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Price:</strong> ${selectedProduct.price}
              </p>
            </div>
          )}

          {/* Location Input */}
          {selectedProduct && (
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location
              </label>
              <LocationInput onSelect={handleLocationSelect} />
              
              {selectedLocation && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-semibold mb-2">
                    ✓ Location Selected
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Address:</strong> {locationDetails?.address}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Coordinates:</strong> {locationDetails?.latitude?.toFixed(4)}, {locationDetails?.longitude?.toFixed(4)}
                  </p>
                  {locationDetails?.city && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>City:</strong> {locationDetails.city}
                    </p>
                  )}
                  {locationDetails?.country && (
                    <p className="text-sm text-gray-700">
                      <strong>Country:</strong> {locationDetails.country}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleUpdateProduct}
                disabled={loading || !locationDetails}
                className="mt-4 w-full bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Updating...' : 'Update Product Location'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}