import React from "react"
import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import ResetPassword from "./pages/ResetPassword"
import {Toaster} from "react-hot-toast"
import ScrollToTop from "./components/ScrollToTop"
import DashboardBanner from "./pages/DashboardBanner"
import DashboardRigid from "./pages/DashboardRigid"
import DashboardAdhesive from "./pages/DashboardAdhesive"
import DashboardHandheld from "./pages/DashboardHandheld"
import DashboardMagnet from "./pages/DashboardMagnet"
import DashboardApparel from "./pages/DashboardApparel"
import DashboardMisc from "./pages/DashboardMisc"

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
        <Route path="/dashboard-handheld" element={<DashboardHandheld />} />
        <Route path="/dashboard-magnet" element={<DashboardMagnet />} />
        <Route path="/dashboard-apparel" element={<DashboardApparel />} />
        <Route path="/dashboard-misc" element={<DashboardMisc />} />
      </Routes>
    </div>
  )
}

export default App
