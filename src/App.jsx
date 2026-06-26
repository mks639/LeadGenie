import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to pushState / popState events
    window.addEventListener('popstate', handleLocationChange);
    
    // Custom event to handle programatic navigation
    window.addEventListener('navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange);
    };
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    // Dispatch custom event to trigger state updates in other listeners
    window.dispatchEvent(new Event('navigate'));
    setCurrentPath(path);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 antialiased selection:bg-purple-500 selection:text-white">
      {currentPath === '/admin' ? (
        <Dashboard navigate={navigate} />
      ) : (
        <LandingPage navigate={navigate} />
      )}
    </div>
  );
}

export default App;
