import { Link } from "react-router-dom";
import type { FC } from "react";

export const Home: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
            Welcome to Tribeca
          </h1>
          <p className="text-xl text-[#8E8E93] leading-relaxed max-w-2xl mx-auto">
            Lock your tokens and participate in governance with a modern, secure
            platform
          </p>
          <div className="mt-12 flex justify-center space-x-6">
            <Link
              to="/lock"
              className="px-8 py-4 bg-[#007AFF] text-white rounded-xl hover:bg-[#0066CC] transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-lg"
            >
              Start Locking
            </Link>
            <Link
              to="/vote"
              className="px-8 py-4 border-2 border-[#007AFF] text-[#007AFF] rounded-xl hover:bg-[#007AFF] hover:text-white transition-all duration-300 transform hover:scale-105 font-medium text-lg"
            >
              View Proposals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
