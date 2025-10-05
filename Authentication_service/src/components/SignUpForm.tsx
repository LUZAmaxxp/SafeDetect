import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { signUpSchema, SignUpFormData } from "../utils/validation";

const SignUpForm: React.FC = () => {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      isAgreed: false,
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );
      // Optionally reset form or redirect user here
    } catch (error: any) {
      toast.error(error.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div className="form-group">
        <label className="form-label">First Name</label>
        <input
          type="text"
          className="form-input"
          {...register("firstName")}
          placeholder="Enter your first name"
        />
        {errors.firstName && (
          <p className="form-error">{errors.firstName.message}</p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Last Name</label>
        <input
          type="text"
          className="form-input"
          {...register("lastName")}
          placeholder="Enter your last name"
        />
        {errors.lastName && (
          <p className="form-error">{errors.lastName.message}</p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">E-mail Address</label>
        <input
          type="email"
          className="form-input"
          {...register("email")}
          placeholder="Enter your email"
        />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-input"
          {...register("password")}
          placeholder="Create a strong password"
        />
        {errors.password && (
          <p className="form-error">{errors.password.message}</p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          className="form-input"
          {...register("confirmPassword")}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="form-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          className="checkbox-input"
          {...register("isAgreed")}
        />
        <label className="checkbox-label">I agree to Terms & Conditions</label>
        {errors.isAgreed && (
          <p className="form-error">{errors.isAgreed.message}</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
      <div className="text-center mt-4">
         <Link to="/auth/signin" className="Join-Us">
                Already Have an Account ? Sign-In .
                </Link>
      </div>
    </form>
  );
};

export default SignUpForm;
