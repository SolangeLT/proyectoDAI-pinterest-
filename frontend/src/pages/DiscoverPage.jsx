import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Save } from "lucide-react";

import { mergePostCache, postsApi } from "../api/client.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusMessage.jsx";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [currentUser] = useCurrentUser();

  const discoverQuery = useQuery({
    queryKey: ["discover", 12],
    queryFn: () => postsApi.discover(12),
  });

  const saveMutation = useMutation({
    mutationFn: (photo) =>
      postsApi.createPost({
        image_url: photo.image_url,
        tags: ["descubrimiento", "unsplash"],
      }),
    onSuccess: (post) => {
      mergePostCache([post]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Unsplash desde backend</p>
          <h1>Descubrimiento</h1>
        </div>
        <button className="btn btn-outline-dark" type="button" onClick={() => discoverQuery.refetch()}>
          <RefreshCcw size={17} />
          Actualizar
        </button>
      </div>

      <ErrorState error={discoverQuery.error || saveMutation.error} />

      {!currentUser?.id && (
        <div className="alert alert-warning">
          Crea o selecciona un usuario para poder convertir fotos descubiertas en posts propios.
        </div>
      )}

      {discoverQuery.isLoading && <LoadingState />}

      {discoverQuery.data?.length === 0 && <EmptyState text="No llegaron imagenes de Unsplash." />}

      {discoverQuery.data && (
        <div className="pin-grid">
          {discoverQuery.data.map((photo) => (
            <article className="pin-card" key={photo.id}>
              <a href={photo.source_url} target="_blank" rel="noreferrer" className="pin-image-link">
                <img className="pin-image" src={photo.image_url} alt={photo.description} />
              </a>
              <div className="pin-body">
                <div>
                  <p className="pin-owner mb-1">{photo.author_name}</p>
                  <p className="small text-muted mb-0">{photo.description}</p>
                </div>
                <button
                  className="btn btn-outline-dark btn-sm icon-btn"
                  type="button"
                  title="Guardar como post"
                  disabled={!currentUser?.id || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(photo)}
                >
                  <Save size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
