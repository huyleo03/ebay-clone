import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProductDetail from "./pages/product/[id]/page";
import Cart from "./pages/cart/page";
import Checkout from "./pages/checkout/page";
import Orders from "./pages/orders/page";
import ListCategory from "./pages/listCategory/page";
import Wishlist from "./pages/wishlist/page";
import Sell from "./pages/sell/page";

import TotalSell from "./pages/totalSell/page";
import Success from "./pages/success/page";
import AuthPage from "./pages/auth/page";
import AdminDashboard from "./pages/admin/page";
import AuctionProductDetail from "./pages/auction/page";
import OrderHistory from "./pages/OrderHistory/page";
import SearchResults from "./pages/SearchResults/SearchResults";
import SellerProducts from "./pages/sellerProduct/page";
import DailyDeals from "./pages/dailyDeal/page";
import HelpContact from "./pages/help/page";
import Profile from "./pages/profile/profile";
import BidHistory from "./pages/bidHistory/[productId]/page";
import { CartProvider } from "./context/cartContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart/" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/list-category/:categoryId" element={<ListCategory />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/sellerProduct" element={<SellerProducts />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/totalSell" element={<TotalSell />} />
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/auction-product" element={<AuctionProductDetail />} />
          <Route path="/daily-deals" element={<DailyDeals />} />
          <Route path="/help" element={<HelpContact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bidHistory/:productId" element={<BidHistory />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
