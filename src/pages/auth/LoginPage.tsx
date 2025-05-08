import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Loader } from '../../components/ui/loader';
import { LockIcon, MailIcon } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { error, success } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      success('Logged in successfully');
    } catch (err: any) {
      error(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to continue to LoanNavigator AI
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <MailIcon className="w-5 h-5 mr-2 text-gray-400" />
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
            </div>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isLoading}
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <LockIcon className="w-5 h-5 mr-2 text-gray-400" />
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-2.5"
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" /> : 'Sign in'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account?</span>{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}