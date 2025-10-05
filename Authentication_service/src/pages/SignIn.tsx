import React, { useState } from "react";
import { Link } from "react-router-dom";
import SignInForm from "../components/SignInForm";
import MagicLinkForm from "../components/MagicLinkForm";

const SignIn: React.FC = () => {
  const [useMagicLink, setUseMagicLink] = useState(false);

  return (
    <div className="card-content">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Sign in to your SafeDetect account</p>
      </div>

      <div className="space-y-6">
        {useMagicLink ? <MagicLinkForm /> : <SignInForm />}

        <div className="divider">
          <span>Or</span>
        </div>

        <div className="text-center">
          <button
            onClick={() => setUseMagicLink(!useMagicLink)}
            className="btn btn-link"
          >
            {useMagicLink
              ? "Sign in with password instead"
              : "Sign in with magic link instead"}
          </button>
        </div>

        <div className="text-center">
          
          <Link to="/auth/signup" className="Join-Us">
            Don't Have an Account ? Join Us .
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
