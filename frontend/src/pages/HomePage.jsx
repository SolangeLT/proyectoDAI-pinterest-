import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  mergePostCache,
  postsApi,
  readCachedPosts,
  readSyncTimestamp,
  removePostFromCache,
  writePostCache,
} from "../api/client.js";
import Pagination from "../components/Pagination.jsx";
import PostCard from "../components/PostCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusMessage.jsx";

const PAGE_SIZE = 12;

function pageFromCache(page) {
  const cached = readCachedPosts();
  const totalPages = Math.max(1, Math.ceil(cached.length / PAGE_SIZE));

  return {
    items: cached.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    limit: PAGE_SIZE,
    total: cached.length,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_previous: page > 1,
  };
}

export default function HomePage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["posts", page],
    queryFn: async () => {
      const cached = readCachedPosts();
      const syncTimestamp = readSyncTimestamp();
      const shouldSyncFromTimestamp = page === 1 && cached.length > 0 && syncTimestamp;

      const data = await postsApi.listPosts({
        page,
        limit: PAGE_SIZE,
        minDate: shouldSyncFromTimestamp ? syncTimestamp : undefined,
      });

      if (shouldSyncFromTimestamp) {
        mergePostCache(data.items);
        return pageFromCache(1);
      }

      if (page === 1) {
        writePostCache(data.items);
      } else {
        mergePostCache(data.items);
      }

      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: postsApi.deletePost,
    onSuccess: (_, postId) => {
      removePostFromCache(postId);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const data = postsQuery.data;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Feed principal</p>
          <h1>Para ti</h1>
        </div>
      </div>

      <ErrorState error={postsQuery.error || deleteMutation.error} />

      {postsQuery.isLoading && <LoadingState />}

      {data && data.items.length === 0 && (
        <EmptyState text="Todavia no hay posts. Crea el primero desde Nuevo." />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="pin-grid">
            {data.items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={(postId) => deleteMutation.mutate(postId)}
              />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            hasNext={data.has_next}
            hasPrevious={data.has_previous}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
