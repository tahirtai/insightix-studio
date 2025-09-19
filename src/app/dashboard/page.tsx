"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type Project = {
  id: string;
  name: string;
  created_at: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login"); // redirect if not logged in
      } else {
        setUser(user);
        fetchProjects(user.id);
      }
    };

    getUser();
  }, [router]);

  // Fetch projects from Supabase
  const fetchProjects = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching projects:", error);
    if (data) setProjects(data);
    setLoading(false);
  };

  // Create new project
  const createProject = async () => {
    if (!newProject.trim() || !user) return;

    const { error } = await supabase.from("projects").insert({
      name: newProject,
      user_id: user.id,
    });

    if (!error) {
      setNewProject("");
      fetchProjects(user.id);
    } else {
      console.error(error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 transition font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Welcome */}
        {user && (
          <p className="mb-6 text-gray-700 text-lg">
            Welcome, <span className="font-medium">{user.email}</span> 🎉
          </p>
        )}

        {/* New Project Form */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <input
          type="text"
          placeholder="New Project Name"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          className="flex-1 border border-gray-300 p-3 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            onClick={createProject}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Create Project
          </button>
        </div>

        {/* Projects List */}
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Your Projects
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">
            You don’t have any projects yet. Create one above!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-2xl shadow hover:shadow-xl transition cursor-pointer border border-gray-200"
                onClick={() => router.push(`/dashboard/${project.id}`)}
              >
                <h3 className="font-bold text-xl mb-2 text-gray-800">
                  {project.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
