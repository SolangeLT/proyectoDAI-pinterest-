import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { getSignedOutUserIds, signOutUser, usersApi } from "../api/client.js";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function UsersPage() {
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signedOutIds, setSignedOutIds] = useState(() => getSignedOutUserIds());
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

  useEffect(() => {
    function syncSignedOutUsers() {
      setSignedOutIds(getSignedOutUserIds());
    }

    window.addEventListener("signed-out-users-updated", syncSignedOutUsers);
    window.addEventListener("storage", syncSignedOutUsers);

    return () => {
      window.removeEventListener("signed-out-users-updated", syncSignedOutUsers);
      window.removeEventListener("storage", syncSignedOutUsers);
    };
  }, []);

  const availableUsers =
    usersQuery.data?.filter((user) => !signedOutIds.includes(user.id)) || [];

  function handleSubmit(event) {
    event.preventDefault();
    createUserMutation.mutate({ username, email });
  }

  function handleSignOut() {
    if (currentUser?.id) {
      signOutUser(currentUser.id);
    } else {
      saveCurrentUser(null);
    }
  }

  return (
    <section className="editor-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Agregar usuario</h1>
        </div>
      </div>

      <div className="editor-panel">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-5">
              <label className="form-label" htmlFor="username">
                Usuario
              </label>
              <input
                required
                id="username"
                className="form-control"
                placeholder="palazrak"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label" htmlFor="email">
                Correo
              </label>
              <input
                required
                id="email"
                className="form-control"
                placeholder="correo@ejemplo.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-2 d-flex align-items-end">
              <button
                className="btn btn-dark w-100"
                type="submit"
                disabled={createUserMutation.isPending}
              >
                <UserPlus size={17} />
                Crear
              </button>
            </div>
          </div>
        </form>

        {createUserMutation.error && (
          <div className="alert alert-danger mt-3">{createUserMutation.error.message}</div>
        )}

        <div className="account-switcher mt-4">
          <div>
            <label className="form-label" htmlFor="activeUser">
              Usuario activo
            </label>
            <select
              id="activeUser"
              className="form-select"
              value={currentUser?.id || ""}
              onChange={(event) => {
                const user = availableUsers.find((item) => item.id === event.target.value);
                saveCurrentUser(user || null);
              }}
            >
              <option value="">Sin usuario</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <span className="current-user-badge account-badge" title={currentUser?.email || "Sin usuario activo"}>
            <Save size={13} />
            {currentUser?.username || "Ninguno"}
          </span>

          <button
            className="btn btn-outline-dark"
            type="button"
            disabled={!currentUser?.id}
            onClick={handleSignOut}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </div>
    </section>
  );
}
