import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [resetComplete, setResetComplete] = useState(false);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a valid recovery session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Check URL hash for recovery token (Supabase handles this automatically)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            if (type === 'recovery' && accessToken) {
                setIsValidSession(true);
            } else if (session) {
                setIsValidSession(true);
            } else {
                setIsValidSession(false);
            }
        };

        checkSession();

        // Listen for auth state changes (recovery token processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const validateForm = () => {
        try {
            passwordSchema.parse({ password, confirmPassword });
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: { password?: string; confirmPassword?: string } = {};
                error.errors.forEach((err) => {
                    if (err.path[0] === 'password') newErrors.password = err.message;
                    if (err.path[0] === 'confirmPassword') newErrors.confirmPassword = err.message;
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                toast.error(error.message || 'Failed to reset password');
            } else {
                setResetComplete(true);
                toast.success('Password reset successfully!');
            }
        } catch (err) {
            toast.error('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Loading state while checking session
    if (isValidSession === null) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Verifying reset link...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Invalid or expired link
    if (isValidSession === false) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20">
                    <Card className="max-w-md mx-auto bg-card border-border">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
                                <KeyRound className="h-12 w-12 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                            <CardDescription>
                                This password reset link is invalid or has expired.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Password reset links expire after 1 hour for security reasons.
                                Please request a new one.
                            </p>
                            <Button
                                className="w-full"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Request New Reset Link
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/auth')}
                            >
                                Back to Sign In
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Success view
    if (resetComplete) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20">
                    <Card className="max-w-md mx-auto bg-card border-border">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10">
                                <ShieldCheck className="h-12 w-12 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl">Password Reset Complete</CardTitle>
                            <CardDescription className="text-base">
                                Your password has been successfully updated.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p>Your password has been changed</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p>You can now sign in with your new password</p>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => navigate('/auth')}
                            >
                                Sign In Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-20">
                <Card className="max-w-md mx-auto bg-card border-border">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                            <Lock className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                        <CardDescription>
                            Enter your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 bg-secondary"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 pr-10 bg-secondary"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    Password must be at least 6 characters long.
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reset Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
