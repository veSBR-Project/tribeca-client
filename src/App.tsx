import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Lock } from "./pages/Lock";
import { Unlock } from "./pages/Unlock";
import "./App.css";

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", backgroundColor: "#242424" }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lock" element={<Lock />} />
          <Route path="/unlock" element={<Unlock />} />
        </Routes>
        <ToastContainer
          theme="dark"
          toastStyle={{ backgroundColor: "#333", color: "#fff" }}
        />
      </div>
    </Router>
  );
}

export default App;
