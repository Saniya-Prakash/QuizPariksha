import { Navbar } from '../../organisms';
import { Outlet } from 'react-router';


const Layout = ({ withIcons }) => {
  return (
    <div className="app-container">
      <Navbar withIcons={withIcons} />
      <main className="main-content">
        <Outlet /> 
      </main>
    </div>
  );
};

export { Layout };