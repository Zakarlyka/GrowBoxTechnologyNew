import { useParams, Navigate } from 'react-router-dom';

// Redirect old /device/:id routes to new /dashboard?device=:id
export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  
  if (id) {
    return <Navigate to={`/dashboard?device=${id}`} replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}
