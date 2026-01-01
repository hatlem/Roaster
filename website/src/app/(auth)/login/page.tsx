import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone/50 animate-pulse">
        <div className="h-8 bg-stone/30 rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-stone/20 rounded w-64 mx-auto mb-8" />
        <div className="space-y-6">
          <div className="h-12 bg-stone/20 rounded-xl" />
          <div className="h-12 bg-stone/20 rounded-xl" />
          <div className="h-12 bg-stone/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
