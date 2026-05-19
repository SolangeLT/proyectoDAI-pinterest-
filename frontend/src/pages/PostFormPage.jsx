import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { mergePostCache, postsApi, uploadsApi } from "../api/client.js";
import PostForm from "../components/PostForm.jsx";
import { ErrorState, LoadingState } from "../components/StatusMessage.jsx";

export default function PostFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getPost(id),
    enabled: isEditing,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ intent, payload, imageFile }) => {
      const nextPayload = { ...payload };
      if (imageFile) {
        const upload = await uploadsApi.uploadImage(imageFile);
        nextPayload.image_url = upload.image_url;
      }

      if (intent === "create") {
        return postsApi.createPost(nextPayload);
      }
      if (intent === "replace") {
        return postsApi.replacePost(id, nextPayload);
      }
      return postsApi.patchPost(id, nextPayload);
    },
    onSuccess: (post) => {
      mergePostCache([post]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      navigate(`/posts/${post.id}`);
    },
  });

  if (isEditing && postQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <section className="editor-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{isEditing ? "Edicion" : "Alta"}</p>
          <h1>{isEditing ? "Editar post" : "Crear post"}</h1>
        </div>
      </div>

      <ErrorState error={postQuery.error || saveMutation.error} />

      <PostForm
        initialValues={postQuery.data}
        isEditing={isEditing}
        isSubmitting={saveMutation.isPending}
        onSubmit={(data) => saveMutation.mutate(data)}
      />
    </section>
  );
}
