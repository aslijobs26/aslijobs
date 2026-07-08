import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./home-page";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
