const React = require('react');

const MemoryRouter = ({ children }) => children;
const BrowserRouter = ({ children }) => children;
const Link = ({ children }) => children || null;
const NavLink = ({ children }) => children || null;
const Outlet = () => null;
const Route = ({ children }) => children || null;
const Routes = ({ children }) => children || null;
const Navigate = () => null;

function useLocation() {
  return { pathname: '/', search: '', hash: '', state: null, key: 'default' };
}

function useNavigate() {
  return () => {};
}

function useParams() {
  return {};
}

// useSearchParams returns [searchParams, setSearchParams]
function useSearchParams() {
  const params = new URLSearchParams();
  return [params, () => {}];
}

module.exports = {
  MemoryRouter,
  BrowserRouter,
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
};
