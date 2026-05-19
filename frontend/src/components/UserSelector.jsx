import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, UserPlus } from "lucide-react";
import { useState } from "react";

import { usersApi } from "../api/client.js";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function UserSelector() {
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.listUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: (user) => {
      saveCurrentUser(user);
      setUsername("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    createUserMutation.mutate({ username, email });
  }

  return (
    <div className="user-panel">
      <form className="user-form" onSubmit={handleSubmit}>
        <input
          required
          aria-label="Nombre de usuario"
          className="form-control form-control-sm"
          placeholder="usuario"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          required
          aria-label="Correo"
          className="form-control form-control-sm"
          placeholder="correo"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          className="btn btn-dark btn-sm icon-btn"
          type="submit"
          title="Crear usuario"
          disabled={createUserMutation.isPending}
        >
          <UserPlus size={15} />
        </button>
      </form>

      <div className="user-current-row">
        <select
          aria-label="Seleccionar usuario"
          className="form-select form-select-sm"
          value={currentUser?.id || ""}
          onChange={(event) => {
            const user = usersQuery.data?.find((item) => item.id === event.target.value);
            saveCurrentUser(user || null);
          }}
        >
          <option value="">Sin usuario</option>
          {usersQuery.data?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <span className="current-user-badge" title={currentUser?.email || "Sin usuario activo"}>
          <Save size={13} />
          {currentUser?.username || "Ninguno"}
        </span>
      </div>

      {createUserMutation.error && (
        <span className="user-error">{createUserMutation.error.message}</span>
      )}
    </div>
  );
}
