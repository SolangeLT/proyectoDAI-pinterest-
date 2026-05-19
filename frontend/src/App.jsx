import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyPostsPage from "./pages/MyPostsPage.jsx";
import PostDetailPage from "./pages/PostDetailPage.jsx";
import PostFormPage from "./pages/PostFormPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/new" element={<PostFormPage />} />
        <Route path="/posts/:id/edit" element={<PostFormPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/mine" element={<MyPostsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
