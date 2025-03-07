import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ClubVPS</Link>
        <div className="space-x-4">
          <Link to="/vms" className="hover:text-blue-200 transition">My VMs</Link>
          <Link to="/vms/create" className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded transition">
            Create VM
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;