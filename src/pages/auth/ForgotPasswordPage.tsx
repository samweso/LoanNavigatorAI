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
import { MailIcon } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const { error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      error(err.message || 'Failed to send reset password email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Check Your Email</h1>
          <div className="mt-6 text-base text-gray-600">
            <p>We've sent you an email with a link to reset your password.</p>
            <p className="mt-2">
              If you don't see it, please check your spam folder.
            </p>
          </div>
        </div>
        <div className="pt-4">
          <Link to="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Password Reset</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we'll send you a reset link
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
        </div>

        <Button
          type="submit"
          className="w-full py-2.5"
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" /> : 'Send Reset Link'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Remember your password?</span>{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}