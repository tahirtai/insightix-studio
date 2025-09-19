"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js"; // import User type

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null); // use proper type
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // not logged in → redirect to login
        router.push("/login");
      } else {
        setUser(user);
      }
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // send user back to login page
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      {user ? (
        <>
          <p className="mb-4">Welcome, {user.email} 🎉</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </>
      ) : (
        <p>Loading user info...</p>
      )}
    </div>
  );
}
