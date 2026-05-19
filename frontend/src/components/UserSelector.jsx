import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { getSignedOutUserIds, signOutUser, usersApi } from "../api/client.js";
import useCurrentUser from "../hooks/useCurrentUser.js";

export default function UserSelector() {
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const [signedOutIds, setSignedOutIds] = useState(() => getSignedOutUserIds());

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.listUsers,
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

  function handleSignOut() {
    if (currentUser?.id) {
      signOutUser(currentUser.id);
      setSignedOutIds(getSignedOutUserIds());
    } else {
      saveCurrentUser(null);
    }
  }

  return (
    <div className="user-panel">
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
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <button
          className="btn btn-outline-dark btn-sm icon-btn"
          type="button"
          title="Sign out"
          disabled={!currentUser?.id}
          onClick={handleSignOut}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
