import { FC, ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='bg-slate-200 min-w-[450px] max-w-[550px] p-10 rounded-md'>
        {children}
      </div>
    </div>
  );
  
  
};

export default AuthLayout;