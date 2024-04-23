'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { login } from '@/lib/actions';

import { LoginSchema } from '@/lib/Schema';
import { FormError } from '../Form_error';
import { FormSuccess } from '../Form_success';



const SignInForm = () => {
  const [error,setError]=useState<string|undefined>("");
  const [success,setSuccess]=useState<string|undefined>("");
  const [isPending,startTransition]=useTransition();
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    startTransition(()=>{
    login(values).then((data)=>{
      setError(data?.error);
      setSuccess(data?.success);
    })
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
        <div className='space-y-2'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                  disabled={isPending}
                  placeholder='mail@example.com'
                   {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    type='password'
                    placeholder='Enter your password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormError message={error}/>
        <FormSuccess message={success}/>
        <Button className='w-full mt-6' disabled={isPending} type='submit'>
          Sign in
        </Button>
      </form>
      
      
      <p className='text-center text-sm text-gray-600 mt-2'>
        If you don&apos;t have an account, please&nbsp;
        <Link className='text-blue-500 hover:underline' href='/auth/signup'>
          Sign up
        </Link>
      </p>
    </Form>
  );
};

export default SignInForm;