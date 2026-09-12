import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'

import FarmerDashboard from './pages/FarmerDashboard'
import MyListings from './pages/MyListings'
import CreateListing from './pages/CreateListing'
import Offers from './pages/Offers'
import Transactions from './pages/Transactions'
import MarketPrices from './pages/MarketPrices'
import Logistics from './pages/Logistics'

import BuyerDashboard from './pages/BuyerDashboard'
import MyOffers from './pages/MyOffers'
import BrowseProduce from './pages/BrowseProduce'
import MakeOffer from './pages/MakeOffer'
import BuyerTransactions from './pages/BuyerTransactions'

import AdminDashboard from './pages/AdminDashboard'
import Navbar from './components/Navbar'

import Register from './pages/Register'


function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user')

  if (!token || !userData) {
    return <Navigate to="/login" replace />
  }

  let user

  try {
    user = JSON.parse(userData)
  } catch {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    if (user.role === 'farmer') {
      return <Navigate to="/farmer" replace />
    }

    if (user.role === 'buyer') {
      return <Navigate to="/buyer" replace />
    }

    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}


function App() {
  return (
    <>
      <Navbar />

      <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route 
      path="/register" 
      element={<Register />} 
      />


      {/* Farmer routes */}

      <Route
        path="/farmer"
        element={
          <ProtectedRoute role="farmer">
            <FarmerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/listings"
        element={
          <ProtectedRoute role="farmer">
            <MyListings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/listings/create"
        element={
          <ProtectedRoute role="farmer">
            <CreateListing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/offers"
        element={
          <ProtectedRoute role="farmer">
            <Offers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/transactions"
        element={
          <ProtectedRoute role="farmer">
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/market-prices"
        element={
          <ProtectedRoute role="farmer">
            <MarketPrices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer/logistics"
        element={
          <ProtectedRoute role="farmer">
            <Logistics />
          </ProtectedRoute>
        }
      />


      {/* Buyer routes */}

      <Route
        path="/buyer"
        element={
          <ProtectedRoute role="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/offers"
        element={
          <ProtectedRoute role="buyer">
            <MyOffers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/produce"
        element={
          <ProtectedRoute role="buyer">
            <BrowseProduce />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/produce/:listingId/offer"
        element={
          <ProtectedRoute role="buyer">
            <MakeOffer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/transactions"
        element={
          <ProtectedRoute role="buyer">
            <BuyerTransactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/logistics"
        element={
          <ProtectedRoute role="buyer">
             <Logistics />
          </ProtectedRoute>
       }
/>


      {/* Admin routes */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
      </Routes>
    </>
  )
}

export default App