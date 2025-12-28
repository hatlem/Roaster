import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  return auth;
};

export default useAuth;
