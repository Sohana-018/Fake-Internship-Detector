import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { USE_DUMMY_DATA } from '../api';
import '../styles/navbar.css';

const Navbar = ({ theme, toggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar-shared animate-fade-in">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <h1>Fake Internship Detector</h1>
          </Link>
          {USE_DUMMY_DATA && <span className="demo-badge">DEMO MODE</span>}
        </div>

        {/* Hamburger Menu Toggle (Mobile Only) */}
        <button 
          className="hamburger" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Analytics
          </NavLink>
        </div>

        <div className="navbar-actions">
          <button className="btn btn-outline theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
