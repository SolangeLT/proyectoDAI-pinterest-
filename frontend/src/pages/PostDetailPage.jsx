import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { postsApi, removePostFromCache } from "../api/client.js";
import { ErrorState, LoadingState } from "../components/StatusMessage.jsx";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser] = useCurrentUser();

  const postQuery = useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getPost(id),
  });

  const deleteMutation = useMutation({
    mutationFn: postsApi.deletePost,
    onSuccess: (_, postId) => {
      removePostFromCache(postId);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    },
  });

  if (postQuery.isLoading) {
    return <LoadingState />;
  }

  const post = postQuery.data;
  const canEdit = post && currentUser?.id === post.user_id;

  return (
    <section>
      <ErrorState error={postQuery.error || deleteMutation.error} />

      {post && (
        <div className="detail-layout">
          <div className="detail-image-wrap">
            <img src={post.image_url} alt={`Post de ${post.user_name}`} />
          </div>
          <aside className="detail-panel">
            <p className="eyebrow">Detalle</p>
            <h1>Post de {post.user_name}</h1>
            <p className="text-muted">
              Alta: {new Date(post.created_at).toLocaleString()}
            </p>
            <div className="tag-row mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>

            {canEdit && (
              <div className="d-flex gap-2 flex-wrap">
                <Link className="btn btn-dark" to={`/posts/${post.id}/edit`}>
                  <Edit3 size={17} />
                  Editar
                </Link>
                <button
                  className="btn btn-outline-danger"
                  type="button"
                  onClick={() => deleteMutation.mutate(post.id)}
                >
                  <Trash2 size={17} />
                  Eliminar
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
