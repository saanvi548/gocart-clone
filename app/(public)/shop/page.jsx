'use client'

import { Suspense, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import LocationInput from "@/components/LocationsInput";
import { MoveLeftIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

function ShopContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const router = useRouter();

  const products = useSelector((state) => state.product.list);

  // FILTER STATES
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [maxDistance, setMaxDistance] = useState(50);
  const [stockStatus, setStockStatus] = useState("");

  // Haversine distance calculator
  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(lat1 * Math.PI/180) *
      Math.cos(lat2 * Math.PI/180) *
      Math.sin(dLon/2)**2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  // FILTERING
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));

    // STOCK STATUS FILTER
    if (stockStatus) {
      filtered = filtered.filter((p) => p.stockStatus === stockStatus);
    }

    // DISTANCE FILTER
    if (selectedLocation?.location) {
      const userLat = selectedLocation.location.lat;
      const userLng = selectedLocation.location.lng;

      filtered = filtered.filter((p) => {
        if (!p.latitude || !p.longitude) return false;

        const dist = getDistanceKm(userLat, userLng, p.latitude, p.longitude);
        return dist <= maxDistance;
      });
    }

    // SORTING
    if (sortOrder === "low-high") filtered.sort((a, b) => a.price - b.price);
    if (sortOrder === "high-low") filtered.sort((a, b) => b.price - a.price);

    return filtered;
  }, [
    products,
    search,
    selectedCategory,
    minPrice,
    maxPrice,
    sortOrder,
    selectedLocation,
    maxDistance,
    stockStatus,
  ]);

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto flex items-start">

        {/* LEFT PRODUCT GRID */}
        <div className="flex-1 min-w-[60%] pr-10">
          <h1
            onClick={() => router.push("/shop")}
            className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
          >
            {search && <MoveLeftIcon size={20} />}
            {selectedCategory ? (
              <span className="text-slate-700 font-medium">{selectedCategory}</span>
            ) : (
              <>
                All <span className="text-slate-700 font-medium">Products</span>
              </>
            )}
          </h1>

          {selectedLocation && (
            <p className="text-sm mb-4 text-gray-600">
              Showing results near: <strong>{selectedLocation.description}</strong>
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-30 gap-y-10 mb-32">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}

            {filteredProducts.length === 0 && (
              <p className="text-gray-500">No products match your filters.</p>
            )}
          </div>
        </div>

        {/* RIGHT FILTER BOX */}
        <aside className="w-64 shrink-0 p-5 border border-gray-200 rounded-xl bg-white shadow-sm h-fit sticky top-6 ml-20 mt-6">
          <h2 className="text-lg font-medium mb-4 text-slate-700">
            Filters
          </h2>

          {/* LOCATION */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Location</p>
            <LocationInput onSelect={(place) => setSelectedLocation(place)} />
          </div>

          {/* DISTANCE */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">
              Max Distance: {maxDistance} km
            </p>
            <input
              type="range"
              min="1"
              max="100"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* CATEGORY */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Category</p>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* STOCK AVAILABILITY */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Stock Status</p>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">All</option>
              <option value="STOCK_AVAILABLE">Available</option>
              <option value="STOCK_AVAILABLE_BY_PROXY">Available by Proxy</option>
              <option value="STOCK_UNAVAILABLE">Unavailable</option>
            </select>
          </div>

          {/* MIN PRICE */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Min Price</p>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* MAX PRICE */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Max Price</p>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          {/* SORT */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-1">Sort By</p>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">None</option>
              <option value="low-high">Price: Low → High</option>
              <option value="high-low">Price: High → Low</option>
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}