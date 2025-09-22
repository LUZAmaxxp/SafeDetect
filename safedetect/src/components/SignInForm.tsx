import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { signInSchema, SignInFormData } from "../utils/validation";

const SignInForm: React.FC = () => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password, data.rememberMe);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
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
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="form-error">{errors.password.message}</p>
        )}
        <div>
        <Link to="/auth/forgot-password" className="forgot-password">
                    Forgot password?
          </Link>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          className="checkbox-input"
          {...register("rememberMe")}
        />
        <label className="checkbox-label">Remember me</label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

export default SignInForm;
