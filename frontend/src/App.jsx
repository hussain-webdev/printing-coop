import React from "react"
import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import ResetPassword from "./pages/ResetPassword"
import {Toaster} from "react-hot-toast"
import ScrollToTop from "./components/ScrollToTop"
import DashboardBanner from "./pages/DashboardBanner"
import DashboardRigid from "./pages/DashboardRigid"
import DashboardAdhesive from "./pages/DashboardAdhesive"
import DashboardMisc from "./pages/DashboardMisc"
import DashboardMagnet from "./pages/DashboardMagnet"
import DashboardApparel from "./pages/DashboardApparel"
import ManageAccount from "./pages/ManageAccount"
import OrderHistory from "./pages/OrderHistory"
import Cart from "./pages/Cart"
import OrderBanner from "./pages/OrderBanner"
import OrderRigid from "./pages/OrderRigid"
import OrderAdhesive from "./pages/OrderAdhesive"
import OrderMisc from "./pages/OrderMisc"
import PlaceOrder from "./pages/PlaceOrder"
import ManagePayments from "./pages/ManagePayments"
import OrderMagnet from "./pages/OrderMagnet"
import OrderApparel from "./pages/OrderApparel"
import OrderDTF from "./pages/OrderDTF"
import DashboardFlag from "./pages/DashboardFlag"
import OrderFlag from "./pages/OrderFlag"
import ProductListing from "./pages/ProductListing"

function App() {

  return (
    <div>
      <ScrollToTop />
      <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#fff",
                  color: "#022052",
                },
                success: {
                  iconTheme: {
                    primary: "#022052",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 6000,
                },
              }}
            />
      
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/reset-password" element={<ResetPassword />}/>

        <Route path="/dashboard-banner" element={<DashboardBanner />} />
        <Route path="/dashboard-rigid" element={<DashboardRigid />} />
        <Route path="/dashboard-adhesive" element={<DashboardAdhesive />} />
        <Route path="/dashboard-misc" element={<DashboardMisc />} />
        <Route path="/dashboard-magnet" element={<DashboardMagnet />} />
        <Route path="/dashboard-apparel" element={<DashboardApparel />} />
        <Route path="/dashboard-flag" element={<DashboardFlag />} />
        <Route path="/product-listing" element={<ProductListing />} />

        <Route path="/manage-account" element={<ManageAccount />} />
        <Route path="/manage-payments" element={<ManagePayments />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        
        <Route path="/order/banner/:productId" element={<OrderBanner />} />
        <Route path="/order/rigid/:productId" element={<OrderRigid />} />
        <Route path="/order/adhesive/:productId" element={<OrderAdhesive />} />
        <Route path="/order/misc/:productId" element={<OrderMisc />} />
        <Route path="/order/magnet/:productId" element={<OrderMagnet />} />
        <Route path="/order/apparel/:productId" element={<OrderApparel />} />
        <Route path="/order/dtf/:productId" element={<OrderDTF />} />
        <Route path="/order/flag/:productId" element={<OrderFlag />} />

      </Routes>
    </div>
  )
}

export default App
