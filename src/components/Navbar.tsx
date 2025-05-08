import { Link } from "react-router-dom";
import { WalletConnectButton } from "./WalletConnectButton";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/lock", label: "Lock Tokens" },
    { to: "/redeem", label: "Redeem veSBR" },
    { to: "/admin", label: "Admin" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-4 md:px-8 py-4 glass-effect z-50">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white p-2"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span
            className={`w-full h-0.5 bg-white transform transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`w-full h-0.5 bg-white transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`w-full h-0.5 bg-white transform transition-all duration-300 ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </div>
      </button>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 relative group"
          >
            {link.label}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#007AFF] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden fixed top-[72px] left-0 right-0 bg-black glass-effect transition-all duration-300 z-50 ${
          isMenuOpen
            ? "translate-y-0 opacity-100 visible"
            : "-translate-y-full opacity-0 invisible"
        }`}
      >
        <div className="flex flex-col p-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hover:scale-105 transition-transform duration-300">
        <WalletConnectButton />
      </div>
    </nav>
  );
};
