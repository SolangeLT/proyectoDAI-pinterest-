import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postsApi, removePostFromCache } from "../api/client.js";
import PostCard from "../components/PostCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusMessage.jsx";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function MyPostsPage() {
  const [currentUser] = useCurrentUser();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["posts", "mine", currentUser?.id],
    queryFn: () => postsApi.listPosts({ page: 1, limit: 50 }),
    enabled: Boolean(currentUser?.id),
  });

  const deleteMutation = useMutation({
    mutationFn: postsApi.deletePost,
    onSuccess: (_, postId) => {
      removePostFromCache(postId);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const myPosts = postsQuery.data?.items.filter((post) => post.user_id === currentUser?.id) || [];

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Usuario actual</p>
          <h1>Mis posts</h1>
        </div>
      </div>

      <ErrorState error={postsQuery.error || deleteMutation.error} />

      {!currentUser?.id && (
        <EmptyState text="Crea o selecciona un usuario en la barra superior para ver tus posts." />
      )}

      {postsQuery.isLoading && <LoadingState />}

      {currentUser?.id && !postsQuery.isLoading && myPosts.length === 0 && (
        <EmptyState text="Este usuario todavia no ha creado posts." />
      )}

      {myPosts.length > 0 && (
        <div className="pin-grid">
          {myPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(postId) => deleteMutation.mutate(postId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
