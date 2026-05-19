import { useEffect, useState } from "react";

import { getCurrentUser, setCurrentUser } from "../api/client.js";

export default function useCurrentUser() {
  const [currentUser, setLocalCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    function syncUser() {
      setLocalCurrentUser(getCurrentUser());
    }

    window.addEventListener("current-user-updated", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("current-user-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  function saveCurrentUser(user) {
    setCurrentUser(user);
    setLocalCurrentUser(user);
  }

  return [currentUser, saveCurrentUser];
}
