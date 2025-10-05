import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { PiRocketLaunch } from "react-icons/pi";

const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="auth-container">
      {/* Cloud background elements */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      <div className="cloud cloud-4"></div>
      <div className="cloud cloud-5"></div>
      
      <div className="auth-split-layout">
        {/* Left Side - Auth Forms */}
        <div className="auth-forms-section">
          <div className="auth-cards-container">
            {/* Left Card - Sign In */}
            
            {/* Right Card - Sign Up */}
            <div className="auth-card">
           <div className="card-content">
                <Outlet />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Hero Section */}
        <div className="auth-hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="text-4xl font-bold text-white mb-4">
                The simplest way to manage your workspace.
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                Aenean mollit non deserunt ullamco est sit aliqua dolor do amet sint velit officia consequat duis.
              </p>
              <div className="flex items-center text-white">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Sign Up Thumbmail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
