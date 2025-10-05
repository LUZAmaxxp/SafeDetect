import React from "react";
import SignUpForm from "../components/SignUpForm";

const SignUp: React.FC = () => {
  return (
    <div className="card-content">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create your account
        </h2>
        <p className="text-gray-600">Join SafeDetect today</p>
      </div>
      <SignUpForm />
    </div>
  );
};

export default SignUp;
