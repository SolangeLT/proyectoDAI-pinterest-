import { Compass, Grid3X3, ImagePlus, Images, UserPlus, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

import UserSelector from "./UserSelector.jsx";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="container-fluid px-3 px-lg-4">
          <div className="nav-frame">
            <NavLink to="/" className="brand-link">
              <span className="brand-mark">M</span>
              <span>Mosaico</span>
            </NavLink>

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
