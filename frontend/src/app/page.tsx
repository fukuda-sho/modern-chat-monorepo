"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth/login");
    } else {
      // Avoid synchronous setState warning
      setTimeout(() => setIsAuthenticated(true), 0);
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <h1 className="text-2xl font-semibold mb-2">Welcome to Chat App</h1>
          <p>Select a room from the sidebar to start chatting.</p>
        </div>
      </main>
    </div>
  );
}
