import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DirectImage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                if (!id) return;

                const { data, error: fetchError } = await supabase
                    .from("shares")
                    .select("file_path, password_hash")
                    .eq("id", id)
                    .single();

                if (fetchError) throw fetchError;

                if (!data) {
                    setError("Image not found");
                    return;
                }

                // If password protected, redirect to standard view
                if (data.password_hash) {
                    navigate(`/p/${id}`);
                    return;
                }

                if (data.file_path) {
                    const { data: publicUrlData } = supabase.storage
                        .from("uploads")
                        .getPublicUrl(data.file_path);

                    setImageUrl(publicUrlData.publicUrl);
                } else {
                    setError("No image file associated with this ID");
                }
            } catch (err) {
                console.error("Error fetching image:", err);
                setError("Failed to load image");
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-xl font-semibold">{error}</h1>
                <Button variant="secondary" onClick={() => navigate("/")}>
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="Shared content"
                    className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
                />
            )}
        </div>
    );
}
