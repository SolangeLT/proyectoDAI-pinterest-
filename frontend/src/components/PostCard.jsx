import { Edit3, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import useCurrentUser from "../hooks/useCurrentUser.js";

export default function PostCard({ post, onDelete }) {
  const [currentUser] = useCurrentUser();
  const canEdit = currentUser?.id && currentUser.id === post.user_id;

  return (
    <article className="pin-card">
      <Link to={`/posts/${post.id}`} className="pin-image-link">
        <img className="pin-image" src={post.image_url} alt={`Post de ${post.user_name}`} />
      </Link>
      <div className="pin-body">
        <div>
          <p className="pin-owner mb-1">{post.user_name}</p>
          <div className="tag-row">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="pin-actions">
            <Link
              className="btn btn-outline-dark btn-sm icon-btn"
              to={`/posts/${post.id}/edit`}
              title="Editar"
            >
              <Edit3 size={15} />
            </Link>
            <button
              className="btn btn-outline-danger btn-sm icon-btn"
              type="button"
              title="Eliminar"
              onClick={() => onDelete?.(post.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
