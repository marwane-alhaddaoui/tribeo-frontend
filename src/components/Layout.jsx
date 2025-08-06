import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-container">
        <Outlet />
      </main>
    </div>
  );
}

