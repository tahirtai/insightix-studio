"use client"; // Must be at the very top

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  name: string;
  created_at: string;
};

type Document = {
  id: string;
  title: string;
  created_at: string;
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project info
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

  // Fetch documents inside project
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setDocuments(data || []);
      setLoading(false);
    };

    fetchDocs();
  }, [projectId]);

  // Create new document
  const createDocument = async () => {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("No logged-in user", userError);
      return;
    }

    // Insert document with project_id + user_id
    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          project_id: projectId,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // Redirect to the new document editor
    router.push(`/dashboard/${projectId}/${data.id}`);
  };

  if (!project) return <p className="p-8">Loading project...</p>;

  return (
    <div className="p-8 space-y-6">
      {/* Project Info */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-600">
          Created: {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Documents Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Documents</h2>
          <button
            onClick={createDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ➕ New Document
          </button>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-500">
            No documents yet. Create one to get started!
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                onClick={() =>
                  router.push(`/dashboard/${projectId}/${doc.id}`)
                }
                className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 flex justify-between"
              >
                <span>{doc.title}</span>
                <span className="text-gray-500 text-sm">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
