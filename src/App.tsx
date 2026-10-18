import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Owl } from './icons';
import Home from './pages/Home';
import MyFolders from './pages/MyFolders';
import FolderDetail from './pages/FolderDetail';
import EditQuestion from './pages/EditQuestion';
import Study from './pages/Study';
import NotFound from './pages/NotFound';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import SiteBanner from './components/SiteBanner';
import { ThemeSync, useActiveMascot, useActiveSkin } from './lib/theme';
import { SkinContext } from './lib/skinContext';
import RouteTracker from './components/RouteTracker';

export default function App() {
  const skin = useActiveSkin();
  const mascot = useActiveMascot();
  return (
    <SkinContext.Provider value={mascot}>
    <div className="flex min-h-screen flex-col">
      <ThemeSync />
      <RouteTracker />
      <Navbar />
      <SiteBanner />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/me" element={<MyFolders />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/f/:folderId" element={<FolderDetail />} />
          <Route path="/f/:folderId/new" element={<EditQuestion />} />
          <Route path="/f/:folderId/edit/:questionId" element={<EditQuestion />} />
          <Route path="/f/:folderId/study" element={<Study />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="flex items-center justify-center gap-2 pb-6 text-sm font-semibold text-ink/40">
        <Owl size={22} /> {skin.name} · học vui mỗi ngày
      </footer>
    </div>
    </SkinContext.Provider>
  );
}
