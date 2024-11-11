import { Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Layout from "./pages/app/components/Layout";

const Home = lazy(() => import("./pages/home/Home"));
const AppPage = lazy(() => import("./pages/app/AppPage"));
const Runes = lazy(() => import("./pages/app/runes/Runes"));
const Ord = lazy(() => import("./pages/app/ordinals/Ord"));
const BRC20 = lazy(() => import("./pages/app/brc20/BRC20"));


const App = () => {


  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route index element={<Home />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<AppPage />} />
          <Route path="/runes" element={<Runes />} />
          <Route path="/ordinals" element={<Ord />} />
          <Route path="/brc20" element={<BRC20 />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
