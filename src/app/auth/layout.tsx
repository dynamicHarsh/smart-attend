import { FC, ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return <div className='bg-slate-200 m-auto  max-w-[500px] p-10 rounded-md'>{children}</div>;
};

export default AuthLayout;