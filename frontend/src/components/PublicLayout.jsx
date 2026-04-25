import React from 'react';
import { Outlet } from 'react-router-dom';

import PublicNavbar from './PublicNavbar.jsx';
import Footer from './Footer.jsx';

export default function PublicLayout() {
	return (
		<div className="public-shell">
			<PublicNavbar />
			<Outlet />
			<Footer />
		</div>
	);
}
