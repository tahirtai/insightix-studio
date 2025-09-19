"use client"; // ← Must be at the very top

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  name: string;
  created_at: string;
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) console.error(error);
      else setProject(data);
    };

    fetchProject();
  }, [projectId]);

  if (!project) return <p className="p-8">Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
      <p className="text-gray-600">
        Created: {new Date(project.created_at).toLocaleDateString()}
      </p>
      <p className="mt-4 text-gray-700">Here we will add documents soon!</p>
    </div>
  );
}
