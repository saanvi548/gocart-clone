import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchCart } from '@/lib/features/cart/cartSlice';

const MOCK_STORE_ADDRESS = {
  id: 'store_pickup_address_id',
  userId: 'system_user',
  name: 'Main Store Location',
  email: 'store@example.com',
  street: '456 Commerce Way',
  city: 'Tech City',
  state: 'CA',
  zip: '94043',
  country: 'USA',
  phone: '555-1234',
  createdAt: new Date().toISOString(),
};

const OrderSummary = ({ totalPrice, items }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const addressList = useSelector((state) => state.address.list);

  // --- Online Order States ---
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [coupon, setCoupon] = useState('');

  // --- Offline Order States ---
  const [offlineDate, setOfflineDate] = useState(null);
  const [offlineCouponCode, setOfflineCouponCode] = useState('');
  const [offlineCoupon, setOfflineCoupon] = useState(null);

  // Online coupon handler
  const handleCouponCode = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast('Please login to continue');
      const token = await getToken();
      const { data } = await axios.post(
        '/api/coupon',
        { code: couponCodeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoupon(data.coupon);
      toast.success('Coupon Applied');
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  // Online place order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast('Please login to place an order');
      if (!selectedAddress) return toast('Please select an address');

      const token = await getToken();
      const orderData = { addressId: selectedAddress.id, items, paymentMethod };
      if (coupon) orderData.couponCode = coupon.code;

      const { data } = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (paymentMethod === 'STRIPE') {
        window.location.href = data.session.url;
      } else {
        toast.success(data.message);
        router.push('/orders');
        dispatch(fetchCart({ getToken }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  // Online total
  const { finalTotal, shippingCost } = useMemo(() => {
    let finalTotal = totalPrice;
    let shippingCost = paymentMethod === 'IN_PERSON_PICKUP' ? 0 : 5;
    if (user?.primaryPublicMetadata?.plan === 'plus' && paymentMethod !== 'IN_PERSON_PICKUP') shippingCost = 0;
    if (coupon) finalTotal -= (coupon.discount / 100) * totalPrice;
    return { finalTotal: finalTotal + shippingCost, shippingCost };
  }, [totalPrice, coupon, paymentMethod, user]);

  // Offline coupon handler
  const handleOfflineCoupon = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/coupon', { code: offlineCouponCode });
      setOfflineCoupon(data.coupon);
      toast.success('Coupon Applied to Offline Order');
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  // Offline total
  const offlineFinalPrice = useMemo(() => {
    if (!offlineCoupon) return totalPrice;
    return totalPrice - (offlineCoupon.discount / 100) * totalPrice;
  }, [totalPrice, offlineCoupon]);

  // Offline place order
  const handleOfflineOrder = () => {
    if (!offlineDate) return toast.error('Please select a pickup date');

    const storeIds = items.map((item) => item.storeId);
    const uniqueStoreIds = [...new Set(storeIds)];
    if (uniqueStoreIds.length > 1) return toast.error('Offline order must contain products from the same store.');

    toast.success(`Offline order placed! Total: ${currency}${offlineFinalPrice.toFixed(2)}`);
    toast.success(`Added reminder to Google Calendar for ${offlineDate.toLocaleDateString()}`);

    // Clear cart
    dispatch(fetchCart({ getToken }));

    // Clear offline inputs
    setOfflineDate(null);
    setOfflineCouponCode('');
    setOfflineCoupon(null);
  };

  // Date limits
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 10);
  const maxDate = new Date(today.getFullYear(), today.getMonth(), 17);

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      {/* Online Order */}
      <h2 className="text-xl font-medium text-slate-600 mb-4">Payment Summary</h2>

      <div className="flex gap-2 items-center">
        <input type="radio" id="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-gray-500" />
        <label htmlFor="COD" className="cursor-pointer">COD</label>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <input type="radio" id="STRIPE" checked={paymentMethod === 'STRIPE'} onChange={() => setPaymentMethod('STRIPE')} className="accent-gray-500" />
        <label htmlFor="STRIPE" className="cursor-pointer">Stripe Payment</label>
      </div>

      {/* Address */}
      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p>Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center">
            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
            <SquarePenIcon onClick={() => setSelectedAddress(null)} className="cursor-pointer" size={18} />
          </div>
        ) : (
          <div>
            {addressList.length > 0 && (
              <select className="border border-slate-400 p-2 w-full my-3 outline-none rounded" onChange={(e) => setSelectedAddress(addressList[e.target.value])}>
                <option value="">Select Address</option>
                {addressList.map((address, index) => (
                  <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                ))}
              </select>
            )}
            <button className="flex items-center gap-1 text-slate-600 mt-1" onClick={() => setShowAddressModal(true)}>Add Address <PlusIcon size={18} /></button>
          </div>
        )}
      </div>

      {/* Online Coupon */}
      {!coupon ? (
        <form onSubmit={(e) => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className="flex justify-center gap-3 mt-3">
          <input type="text" placeholder="Coupon Code" className="border border-slate-400 p-1.5 rounded w-full outline-none" value={couponCodeInput} onChange={(e) => setCouponCodeInput(e.target.value)} />
          <button className="bg-slate-700 text-white px-3 rounded hover:bg-slate-900 active:scale-95 transition-all">Apply</button>
        </form>
      ) : (
        <div className="w-full flex items-center justify-center gap-2 text-xs mt-2">
          <p>Code: <span className="font-semibold ml-1">{coupon.code.toUpperCase()}</span></p>
          <p>{coupon.description}</p>
          <XIcon size={18} onClick={() => setCoupon('')} className="hover:text-red-700 transition cursor-pointer" />
        </div>
      )}

      {/* Online Total */}
      <div className="flex justify-between py-4">
        <p>Total:</p>
        <p className="font-medium text-right">{currency}{finalTotal.toFixed(2)}</p>
      </div>

      <button onClick={(e) => toast.promise(handlePlaceOrder(e), { loading: 'Placing Order...' })} className="w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all">
        Place Order
      </button>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

      {/* Offline Order */}
      <div className="my-6 py-4 border-t border-slate-200 text-slate-500">
        <h2 className="text-xl font-medium text-slate-600 mb-4">Offline Order</h2>
        <p className="text-slate-400 text-xs mb-2">Select Pickup Date (10-17)</p>
        <DatePicker
          selected={offlineDate}
          onChange={setOfflineDate}
          minDate={minDate}
          maxDate={maxDate}
          placeholderText="Choose a pickup date"
          className="border border-slate-400 p-2 w-full rounded outline-none mb-3"
        />

        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Coupon Code" className="border border-slate-400 p-2 rounded w-full outline-none" value={offlineCouponCode} onChange={(e) => setOfflineCouponCode(e.target.value)} />
          <button onClick={(e) => toast.promise(handleOfflineCoupon(e), { loading: 'Checking Coupon...' })} className="bg-slate-700 text-white px-3 rounded hover:bg-slate-900 active:scale-95 transition-all">
            Apply
          </button>
        </div>

        {offlineCoupon && (
          <div className="flex justify-between mb-3 text-xs text-slate-600">
            <span>Coupon ({offlineCoupon.code.toUpperCase()}):</span>
            <span>-{currency}{(offlineCoupon.discount / 100 * totalPrice).toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between py-2 mb-4 font-medium">
          <p>Total Price:</p>
          <p>{currency}{offlineFinalPrice.toFixed(2)}</p>
        </div>

        <button onClick={handleOfflineOrder} className="w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all">
          Place Offline Order
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
