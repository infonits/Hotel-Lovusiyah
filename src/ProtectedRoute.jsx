import { Navigate } from 'react-router-dom'
import { useAuth } from './context/authContext'

export default function ProtectedRoute({ children }) {
    // const { user } = useAuth()
    const user = { email: 'sdfl@lsdf.com' }
    if (!user) return <Navigate to="/login" replace />
    return children
}
