'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"
import LocationInput from "@/components/LocationsInput"

export default function StoreAddProduct() {

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [locationDetails, setLocationDetails] = useState(null)
    const [loading, setLoading] = useState(false)

    const { getToken } = useAuth()

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const handleLocationSelect = async (place) => {
        setSelectedLocation(place)
        
        // Fetch detailed location info (coordinates, etc.)
        try {
            const res = await fetch(`/api/location/details?place_id=${place.place_id}`)
            const data = await res.json()
            
            if (data.status === 'OK') {
                const { geometry, formatted_address, address_components } = data.result
                
                // Extract city and country
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

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        // --- VALIDATION CHECKS ---
        
        // 1. Check for Category Selection
        if (!productInfo.category) {
            return toast.error("Please select a category.")
        }

        // 2. Check if prices are valid positive numbers
        const mrp = parseFloat(productInfo.mrp)
        const price = parseFloat(productInfo.price)

        if (isNaN(mrp) || isNaN(price) || mrp <= 0 || price <= 0) {
            return toast.error("Actual Price and Offer Price must be positive numbers.")
        }
        
        // 3. Check for at least one image
        if (!images[1] && !images[2] && !images[3] && !images[4]) {
            return toast.error('Please upload at least one image')
        }

        // 4. Check for location
        if (!locationDetails) {
            return toast.error('Please select a product location')
        }
        
        // --- END VALIDATION ---
        
        setLoading(true)

        try {
            const formData = new FormData()
            
            // Append product info
            for (const key in productInfo) {
                formData.append(key, productInfo[key])
            }

            // Append location data
            formData.append('latitude', locationDetails.latitude)
            formData.append('longitude', locationDetails.longitude)
            formData.append('address', locationDetails.address)
            formData.append('placeId', locationDetails.placeId)
            formData.append('city', locationDetails.city)
            formData.append('country', locationDetails.country)

            // Append images
            Object.keys(images).forEach((key) => {
                images[key] && formData.append('images', images[key])
            })

            const token = await getToken()
            
            // API Call
            const { data } = await axios.post('/api/store/product', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            toast.success(data.message)

            // Reset state on success
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })

            setImages({ 1: null, 2: null, 3: null, 4: null })
            setSelectedLocation(null)
            setLocationDetails(null)

        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)

        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Actual Price ($)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Offer Price ($)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            {/* NEW: Location Input */}
            <div className="my-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Location <span className="text-red-500">*</span>
                </label>
                <div className="max-w-sm">
                    <LocationInput onSelect={handleLocationSelect} />
                </div>
                {selectedLocation && (
                    <p className="text-sm text-green-600 mt-2">
                        ✓ Selected: {selectedLocation.description}
                    </p>
                )}
            </div>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition disabled:opacity-50 disabled:cursor-not-allowed">
                Add Product
            </button>
        </form>
    )
}