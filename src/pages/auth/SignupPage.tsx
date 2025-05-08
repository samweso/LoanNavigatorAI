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
import { LockIcon, MailIcon, UserIcon } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  fullName: z.string().min(2, { message: 'Full name is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { error, success } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password);
      success('Check your email to confirm your account');
    } catch (err: any) {
      error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Create Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign up to start using LoanNavigator AI
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-gray-400" />
              <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
            </div>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              disabled={isLoading}
              {...register('fullName')}
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

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
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <LockIcon className="w-5 h-5 mr-2 text-gray-400" />
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
            </div>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-2.5"
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" /> : 'Create account'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account?</span>{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}