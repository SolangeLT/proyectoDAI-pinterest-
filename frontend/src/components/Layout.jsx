import { Compass, Grid3X3, ImagePlus, Images, UserPlus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import UserSelector from "./UserSelector.jsx";

const THEME_KEY = "mosaico.theme";

export default function Layout({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="container-fluid px-3 px-lg-4">
          <div className="nav-frame">
            <div className="brand-link">
              <button
                className="brand-mark"
                type="button"
                title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                onClick={toggleTheme}
              >
                M
              </button>
              <NavLink to="/" className="brand-name">
                Mosaico
              </NavLink>
            </div>

            <div className="nav-links" aria-label="Navegacion principal">
              <NavLink to="/" className="nav-pill">
                <Grid3X3 size={17} />
                Feed
              </NavLink>
              <NavLink to="/new" className="nav-pill">
                <ImagePlus size={17} />
                Nuevo
              </NavLink>
              <NavLink to="/discover" className="nav-pill">
                <Compass size={17} />
                Descubrir
              </NavLink>
              <NavLink to="/mine" className="nav-pill">
                <Images size={17} />
                Mis posts
              </NavLink>
              <NavLink to="/users" className="nav-pill">
                <UserPlus size={17} />
                Agregar usuario
              </NavLink>
            </div>

            <div className="user-box">
              <UserRound size={17} />
              <UserSelector />
            </div>
          </div>
        </nav>
      </header>

      <main className="container-fluid px-3 px-lg-4 py-4">{children}</main>
    </div>
  );
}
