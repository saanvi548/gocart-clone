import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

export const uploadCart = createAsyncThunk('cart/uploadCart',
    async ({ getToken }, thunkAPI) => {
        // FIX 1: The thunk must return a promise that resolves when the debounce is complete.
        return new Promise((resolve, reject) => {
            
            // Clear any existing timer
            clearTimeout(debounceTimer)
            
            // Set the new timer
            debounceTimer = setTimeout(async () => {
                try {
                    const { cartItems } = thunkAPI.getState().cart;
                    const token = await getToken();
                    
                    // The actual API call
                    const response = await axios.post('/api/cart', { cart: cartItems }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    
                    // Resolve the promise, signaling the thunk is fulfilled
                    resolve(response.data) 
                } catch (error) {
                    // Reject the promise, signaling the thunk is rejected
                    // The outer thunkAPI handles the rejection, so we just reject the promise here
                    reject(thunkAPI.rejectWithValue(error.response.data || error.message))
                }
            }, 1000)
        })
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/cart', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            // Return data as received, e.g., { cart: {...}, message: '...' }
            return data 
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data)
        }
    }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
                // The state.total logic was incorrect if the count was already 0. 
                // We should only decrement if the item existed and was decremented.
                state.total = Math.max(0, state.total - 1) 
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            // Check if item exists before decrementing total
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder) => {
        // builder.addCase(fetchCart.fulfilled, (state, action) => {
        //     state.cartItems = action.payload.cart || {} // Ensure cart is an object
        //     // Calculate total from the fetched items
        //     state.total = Object.values(state.cartItems).reduce((acc, item) => acc + item, 0)
        // })

        builder.addCase(fetchCart.fulfilled, (state, action) => {
    state.cartItems = action.payload.cart || {}

    // Ensure cartItems values are numeric (quantity)
    state.total = Object.values(state.cartItems).reduce((acc, item) => {
        const qty = typeof item === "number"
            ? item
            : (typeof item?.quantity === "number" ? item.quantity : 0)
        return acc + qty
    }, 0)
})
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer