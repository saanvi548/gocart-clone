'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import Loading from "@/components/Loading"
import Image from "next/image"
import toast from "react-hot-toast"
import InventoryForm from "@/components/InventoryForm"

export default function Inventory() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setOrders(data.orders)
        setLoading(false)
      } catch (err) {
        toast.error(err?.response?.data?.error || err.message)
      }
    }
    if (isLoaded && user) fetchOrders()
  }, [isLoaded, user, getToken])

  if (!isLoaded || loading) return <Loading />

  const grouped = {}
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const key = `${item.productId}_${order.status}`
      if (!grouped[key]) grouped[key] = { product: item.product, quantity: 0, totalPrice: 0, status: order.status }
      grouped[key].quantity += item.quantity
      grouped[key].totalPrice += item.quantity * item.price
    })
  })

  const inventory = Object.values(grouped).filter(item =>
    item.product.name.toLowerCase().includes(search.toLowerCase())
  )

  const availability = (status) =>
    status === "DELIVERED" ? "Available" : "Available by Proxy"

  const handleAddItem = (newItem) => {
    const key = `${newItem.product.productId}_${newItem.status}`
    if (!grouped[key]) grouped[key] = { product: newItem.product, quantity: 0, totalPrice: 0, status: newItem.status }
    grouped[key].quantity += newItem.stock
    grouped[key].totalPrice += newItem.totalPaid
    setOrders(prev => [...prev])
    setShowForm(false)
  }

  const handleDelete = (key) => {
    delete grouped[key]
    setOrders(prev => [...prev])
    toast.success("Deleted successfully!")
  }

  const handleUpdate = (key, updated) => {
    if (grouped[key]) {
      grouped[key].quantity = updated.quantity
      grouped[key].status = updated.status
      grouped[key].totalPrice = updated.totalPrice
    }
    setOrders(prev => [...prev])
  }

  return (
    <div className="min-h-[70vh] mx-6 relative">
      <div className="my-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <PageTitle heading="Inventory" text={`Showing ${inventory.length} items`} linkText="Go to home" />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-slate-400"
            />
            <button
              onClick={() => setShowForm({ type: 'add' })}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition"
            >
              + Add Item
            </button>
          </div>
        </div>

        {inventory.length > 0 ? (
          <table className="w-full text-slate-500 table-auto border-separate border-spacing-y-4">
            <thead>
              <tr className="text-slate-600 text-left">
                <th>Product</th>
                <th>Image</th>
                <th>Status</th>
                <th>Available Stock</th>
                <th>Price Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={i} className="bg-white rounded shadow-sm hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.product.name}</td>
                  <td className="px-4 py-3">
                    <Image
                      src={item.product.images?.[0]?.startsWith("http") ? item.product.images[0] : `/images/products/${item.product.images?.[0]}` || "/placeholder.png"}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      className="rounded-md border object-contain"
                    />
                  </td>
                  <td className="px-4 py-3">{availability(item.status)}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">${item.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <a href="/store/add-product">
                      <button className="bg-green-200 text-green-800 px-3 py-1 rounded hover:bg-green-300 transition">
                        Add Product
                      </button>
                    </a>
                    <button
                      onClick={() => setShowForm({ type: 'update', key: `${item.product.productId}_${item.status}`, item })}
                      className="bg-blue-200 text-blue-800 px-3 py-1 rounded hover:bg-blue-300 transition"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(`${item.product.productId}_${item.status}`)}
                      className="bg-red-200 text-red-800 px-3 py-1 rounded hover:bg-red-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
            <h1 className="text-3xl font-semibold">No Inventory Items</h1>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowForm(false)} />
          <div className="relative z-50 w-full max-w-md p-6 bg-white rounded-md shadow-md">
            {showForm.type === 'add' ? (
              <InventoryForm onAdd={handleAddItem} />
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Update Inventory</h2>
                <div className="flex flex-col gap-3">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={showForm.item.quantity}
                    onChange={e => setShowForm(prev => ({ ...prev, item: { ...prev.item, quantity: parseInt(e.target.value) || 0 } }))}
                    className="border px-2 py-1 rounded w-full"
                  />
                  <label>Status</label>
                  <select
                    value={showForm.item.status}
                    onChange={e => setShowForm(prev => ({ ...prev, item: { ...prev.item, status: e.target.value } }))}
                    className="border px-2 py-1 rounded w-full"
                  >
                    <option value="DELIVERED">Available</option>
                    <option value="PENDING">Available by Proxy</option>
                  </select>
                  <label>Total Price Paid</label>
                  <input
                    type="number"
                    min="0"
                    value={showForm.item.totalPrice}
                    onChange={e => setShowForm(prev => ({ ...prev, item: { ...prev.item, totalPrice: parseFloat(e.target.value) || 0 } }))}
                    className="border px-2 py-1 rounded w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowForm(false)} className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                  <button
                    onClick={() => {
                      handleUpdate(showForm.key, showForm.item)
                      toast.success("Updated successfully!")
                      setShowForm(false)
                    }}
                    className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
