import { Link } from "react-router-dom";
import { WalletConnectButton } from "./WalletConnectButton";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-8 py-4 glass-effect z-50">
      <div className="flex items-center space-x-8">
        <Link
          to="/dashboard"
          className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 relative group"
        >
          Dashboard
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#007AFF] transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link
          to="/lock"
          className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 relative group"
        >
          Lock Tokens
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#007AFF] transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link
          to="/redeem"
          className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 relative group"
        >
          Redeem veSBR
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#007AFF] transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link
          to="/admin"
          className="text-lg font-medium text-white hover:text-[#007AFF] transition-all duration-300 relative group"
        >
          Admin
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#007AFF] transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </div>
      <div className="hover:scale-105 transition-transform duration-300">
        <WalletConnectButton />
      </div>
    </nav>
  );
};
