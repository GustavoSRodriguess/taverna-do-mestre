import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../ui/Loading';

interface ProtectedRouteProps {
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    redirectPath = '/login'
}) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading fullScreen text="Verificando autenticação..." />;
    }

    console.log(isAuthenticated);
    console.log(localStorage.getItem('authToken'));
    console.log(!!localStorage.getItem('authToken'));
    if (!isAuthenticated) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;