import { Save, Send, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import useCurrentUser from "../hooks/useCurrentUser.js";

function toDatetimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function nowForInput() {
  return toDatetimeLocal(new Date().toISOString());
}

function tagsToText(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function textToTags(text) {
  return text
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function PostForm({ initialValues, isEditing, isSubmitting, onSubmit }) {
  const [currentUser] = useCurrentUser();
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [createdAt, setCreatedAt] = useState(nowForInput());
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setImageUrl(initialValues.image_url || "");
      setImageFile(null);
      setCreatedAt(toDatetimeLocal(initialValues.created_at));
      setTags(tagsToText(initialValues.tags));
    }
  }, [initialValues]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function submit(event, intent) {
    event.preventDefault();
    if (!imageFile && !imageUrl.trim()) {
      setFormError("Sube una imagen o pega un link directo antes de guardar.");
      return;
    }

    setFormError("");
    onSubmit({
      intent,
      imageFile,
      payload: {
        image_url: imageUrl.trim(),
        created_at: createdAt ? new Date(createdAt).toISOString() : null,
        tags: textToTags(tags),
      },
    });
  }

  const disabled = isSubmitting || !currentUser?.id;

  return (
    <form className="editor-panel" onSubmit={(event) => submit(event, "patch")}>
      {!currentUser?.id && (
        <div className="alert alert-warning">
          Crea o selecciona un usuario en Agregar usuario para crear o modificar posts.
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="imageFile">
          Subir imagen
        </label>
        <input
          id="imageFile"
          className="form-control"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            setImageFile(event.target.files?.[0] || null);
            setFormError("");
          }}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="imageUrl">
          Link directo a imagen
        </label>
        <input
          id="imageUrl"
          className="form-control"
          type="url"
          value={imageUrl}
          onChange={(event) => {
            setImageUrl(event.target.value);
            setFormError("");
          }}
          placeholder="https://..."
        />
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="createdAt">
            Fecha de alta
          </label>
          <input
            id="createdAt"
            className="form-control"
            type="datetime-local"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.target.value)}
          />
        </div>

        <div className="col-12 col-md-7">
          <label className="form-label" htmlFor="tags">
            Etiquetas
          </label>
          <input
            id="tags"
            className="form-control"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="arte, viajes, comida"
          />
        </div>
      </div>

      {formError && <div className="alert alert-danger mt-3">{formError}</div>}

      {(previewUrl || imageUrl) && (
        <div className="preview-strip mt-4">
          <img src={previewUrl || imageUrl} alt="Vista previa" />
        </div>
      )}

      <div className="form-actions">
        {isEditing ? (
          <>
            <button className="btn btn-dark" type="submit" disabled={disabled}>
              <Save size={17} />
              Editar
            </button>
            <button
              className="btn btn-outline-dark"
              type="button"
              disabled={disabled}
              onClick={(event) => submit(event, "replace")}
            >
              <Upload size={17} />
              Reemplazar
            </button>
          </>
        ) : (
          <button className="btn btn-dark" type="button" disabled={disabled} onClick={(event) => submit(event, "create")}>
            <Send size={17} />
            Crear post
          </button>
        )}
      </div>
    </form>
  );
}
