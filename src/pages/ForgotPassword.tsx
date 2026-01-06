import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle2, MailCheck, KeyRound } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const validateEmail = () => {
        try {
            emailSchema.parse({ email });
            setError(null);
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail()) return;

        setLoading(true);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                toast.error(resetError.message || 'Failed to send reset email');
                setError(resetError.message);
            } else {
                setEmailSent(true);
                toast.success('Password reset email sent!');
            }
        } catch (err) {
            toast.error('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Email Sent Success View
    if (emailSent) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20">
                    <Card className="max-w-md mx-auto bg-card border-border">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 p-4 rounded-full bg-green-500/10">
                                <MailCheck className="h-12 w-12 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl">Check Your Email</CardTitle>
                            <CardDescription className="text-base">
                                We've sent a password reset link to:
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-3 bg-secondary rounded-lg text-center">
                                <p className="font-medium text-foreground">{email}</p>
                            </div>

                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p>Click the link in the email to reset your password</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p>The link will expire in 1 hour for security</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <p>Check your spam folder if you don't see the email</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail('');
                                    }}
                                >
                                    Send to a different email
                                </Button>
                                <Link to="/auth" className="block">
                                    <Button variant="ghost" className="w-full gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </div>
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
                            <KeyRound className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                        <CardDescription>
                            No worries! Enter your email address and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        className="pl-10 bg-secondary"
                                        autoFocus
                                    />
                                </div>
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <Link to="/auth" className="block">
                                <Button type="button" variant="outline" className="w-full gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign In
                                </Button>
                            </Link>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
