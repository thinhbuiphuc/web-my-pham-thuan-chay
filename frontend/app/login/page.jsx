"use client";

import { useRouter } from "next/navigation";
import AuthPage from "@/components/auth/AuthPage";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthPage
      onAuthSuccess={() => {
        router.push("/");
      }}
    />
  );
}
