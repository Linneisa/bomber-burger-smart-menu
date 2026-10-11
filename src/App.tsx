import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { PicksFab } from "./components/PicksFab";
import { PicksProvider } from "./contexts/PicksContext";
import { PreferenceProvider } from "./contexts/PreferenceContext";
import { Home } from "./pages/Home";
import { MenuDetail } from "./pages/MenuDetail";
import { MenuExplore } from "./pages/MenuExplore";
import { Picks } from "./pages/Picks";
import { Preferences } from "./pages/Preferences";
import { Recommendations } from "./pages/Recommendations";

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/preferensi" element={<Preferences />} />
        <Route path="/hasil" element={<Recommendations />} />
        <Route path="/menu" element={<MenuExplore />} />
        <Route path="/menu/:id" element={<MenuDetail />} />
        <Route path="/pilihanku" element={<Picks />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>);

}

export function App() {
  return (
    <BrowserRouter>
      <PicksProvider>
        <PreferenceProvider>
          <div className="min-h-screen w-full bg-cream-dark">
            <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-cream sm:shadow-[0_0_40px_-12px_rgba(31,77,46,0.18)]">
              <AnimatedRoutes />
            </div>
            <PicksFab />
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: "'Plus Jakarta Sans', sans-serif", borderRadius: 16, fontWeight: 600 }
            }} />
          
        </PreferenceProvider>
      </PicksProvider>
    </BrowserRouter>);

}