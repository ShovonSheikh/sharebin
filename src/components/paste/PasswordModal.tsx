import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordModalProps {
  title?: string | null;
  burnAfterRead?: boolean;
  onSubmit: (password: string) => Promise<boolean>;
  error?: string | null;
}

export function PasswordModal({ title, burnAfterRead, onSubmit, error }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setLocalError('Please enter a password');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const success = await onSubmit(password);
      if (!success) {
        setLocalError('Invalid password');
        toast.error('Invalid password. Please try again.');
      }
    } catch {
      setLocalError('Failed to verify password');
      toast.error('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Password Protected</h1>
            {title && (
              <p className="text-muted-foreground">"{title}"</p>
            )}
            <p className="text-muted-foreground">
              This share requires a password to view.
            </p>
          </div>

          {burnAfterRead && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-500 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>This share will be deleted after viewing.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border pr-10"
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

            {(localError || error) && (
              <p className="text-sm text-destructive">{localError || error}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Unlock Share
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
