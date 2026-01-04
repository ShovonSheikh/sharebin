import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SYNTAX_OPTIONS, EXPIRATION_OPTIONS, getExpirationDate, hashPassword } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Share2, Loader2, Lock, Flame, Eye, EyeOff, Copy, Check, ExternalLink } from 'lucide-react';

export function CreateShareForm() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [syntax, setSyntax] = useState('plaintext');
  const [expiration, setExpiration] = useState('never');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter some content to share');
      return;
    }

    setLoading(true);

    try {
      const expiresAt = getExpirationDate(expiration);
      const passwordHash = password ? await hashPassword(password) : null;

      const { data, error } = await supabase
        .from('shares')
        .insert({
          content: content.trim(),
          title: title.trim() || null,
          syntax,
          expires_at: expiresAt?.toISOString() || null,
          user_id: user?.id || null,
          password_hash: passwordHash,
          burn_after_read: burnAfterRead,
        })
        .select('id')
        .single();

      if (error) throw error;

      const features = [];
      if (password) features.push('password protected');
      if (burnAfterRead) features.push('burn after reading');

      const message = features.length > 0
        ? `Share created (${features.join(', ')})!`
        : 'Share created successfully!';

      toast.success(message);

      // For burn-after-read shares, show the link instead of navigating
      // This prevents the creator from consuming the one-time view
      if (burnAfterRead) {
        setCreatedShareUrl(`${window.location.origin}/s/${data.id}`);
      } else {
        navigate(`/s/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error('Failed to create share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = async () => {
    if (createdShareUrl) {
      await navigator.clipboard.writeText(createdShareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setContent('');
    setTitle('');
    setSyntax('plaintext');
    setExpiration('never');
    setPassword('');
    setBurnAfterRead(false);
    setCreatedShareUrl(null);
    setCopied(false);
  };

  // Show success screen for burn-after-read shares
  if (createdShareUrl) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto p-4 rounded-full bg-orange-500/10 w-fit">
          <Flame className="h-12 w-12 text-orange-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Burn Link Created!</h2>
          <p className="text-muted-foreground">
            This link will self-destruct after being viewed once.
          </p>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Share this link:</p>
          <div className="flex items-center gap-2">
            <Input
              value={createdShareUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button onClick={copyShareUrl} variant="outline" className="shrink-0 gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-orange-500 bg-orange-500/10 p-3 rounded-lg">
          <Flame className="h-4 w-4" />
          <span>Do NOT open this link yourself - it will be deleted after the first view!</span>
        </div>

        <Button onClick={resetForm} variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Create Another Share
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-secondary border-border"
          maxLength={100}
        />

        <Textarea
          placeholder="Paste your text or code here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[180px] bg-secondary border-border font-mono text-sm resize-y"
          maxLength={100000}
        />
      </div>

      {/* Security Options */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
        <div className="flex-1 space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4 text-primary" />
            Password Protection
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Optional password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border pr-10"
              maxLength={100}
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
        </div>

        <div className="flex items-center gap-3 sm:pt-6">
          <Switch
            id="burn"
            checked={burnAfterRead}
            onCheckedChange={setBurnAfterRead}
          />
          <Label htmlFor="burn" className="flex items-center gap-2 cursor-pointer">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Burn after reading</span>
          </Label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={syntax} onValueChange={setSyntax}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Syntax Highlighting" />
            </SelectTrigger>
            <SelectContent>
              {SYNTAX_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={expiration} onValueChange={setExpiration}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Expiration" />
            </SelectTrigger>
            <SelectContent>
              {EXPIRATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || !content.trim()}
          className="gap-2 glow-primary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Create Share
        </Button>
      </div>

      {burnAfterRead && (
        <p className="text-sm text-orange-500 flex items-center gap-2">
          <Flame className="h-4 w-4" />
          This share will be permanently deleted after it's viewed once.
        </p>
      )}
    </form>
  );
}
