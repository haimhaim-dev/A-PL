"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface LoginButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LoginButton({ 
  variant = "default", 
  size = "default", 
  className = "",
  showIcon = true,
  children 
}: LoginButtonProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <Button
      onClick={handleLoginClick}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
    >
      {showIcon && <LogIn className="w-4 h-4" />}
      {children || "로그인"}
    </Button>
  );
}