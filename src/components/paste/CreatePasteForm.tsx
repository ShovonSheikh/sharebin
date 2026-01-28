import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SYNTAX_OPTIONS, getExpirationOptionsForTier, getExpirationDate, hashPassword } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasFeature, getFeatureUpgradeTier } from '@/lib/featureGating';
import { toast } from 'sonner';
import { Share2, Loader2, Lock, Flame, Eye, EyeOff, Copy, Check, Crown } from 'lucide-react';
import { LiveCodeEditor } from '@/components/editor/LiveCodeEditor';
import { Link } from 'react-router-dom';

export function CreatePasteForm() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [syntax, setSyntax] = useState('plaintext');
  const [expiration, setExpiration] = useState('never');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdPasteUrl, setCreatedPasteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const userTier = profile?.subscription_tier || 'free';
  const canUsePassword = hasFeature(userTier, 'PASSWORD_PROTECTION');
  const expirationOptions = getExpirationOptionsForTier(userTier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter some content to paste');
      return;
    }

    setLoading(true);

    try {
      const expiresAt = getExpirationDate(expiration);
      const passwordHash = canUsePassword && password ? await hashPassword(password) : null;

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
      if (canUsePassword && password) features.push('password protected');
      if (burnAfterRead) features.push('burn after reading');

      const message = features.length > 0
        ? `Paste created (${features.join(', ')})!`
        : 'Paste created successfully!';

      toast.success(message);

      // For burn-after-read shares, show the link instead of navigating
      // This prevents the creator from consuming the one-time view
      if (burnAfterRead) {
        setCreatedPasteUrl(`${window.location.origin}/p/${data.id}`);
      } else {
        navigate(`/p/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating paste:', error);
      toast.error('Failed to create paste. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPasteUrl = async () => {
    if (createdPasteUrl) {
      await navigator.clipboard.writeText(createdPasteUrl);
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
    setCreatedPasteUrl(null);
    setCopied(false);
  };

  // Show success screen for burn-after-read pastes
  if (createdPasteUrl) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="mx-auto p-4 rounded-full bg-orange-500/10 w-fit">
          <Flame className="h-12 w-12 text-orange-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Burn Paste Created!</h2>
          <p className="text-muted-foreground">
            This link will self-destruct after being viewed once.
          </p>
        </div>

        <div className="p-4 bg-secondary rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Share this paste:</p>
          <div className="flex items-center gap-2">
            <Input
              value={createdPasteUrl}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button onClick={copyPasteUrl} variant="outline" className="shrink-0 gap-2">
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
          Create Another Paste
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

        <LiveCodeEditor
          value={content}
          onChange={setContent}
          language={syntax}
          placeholder="Paste your text or code here..."
          minHeight="180px"
          maxLength={100000}
        />
      </div>

      {/* Security Options */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
        <div className="flex-1 space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4 text-primary" />
            Password Protection
            {!canUsePassword && (
              <Badge variant="outline" className="text-xs gap-1">
                <Crown className="h-3 w-3" />
                {getFeatureUpgradeTier('PASSWORD_PROTECTION')}
              </Badge>
            )}
          </Label>
          {canUsePassword ? (
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
          ) : (
            <Link to="/subscription">
              <Input
                disabled
                placeholder="Upgrade to Pro for password protection"
                className="bg-background/50 border-border cursor-pointer opacity-60"
              />
            </Link>
          )}
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
              {expirationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {userTier === 'free' && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-t border-border mt-1">
                  <Link to="/subscription" className="text-primary hover:underline">
                    Upgrade for more options
                  </Link>
                </div>
              )}
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
          Create Paste
        </Button>
      </div>

      {burnAfterRead && (
        <p className="text-sm text-orange-500 flex items-center gap-2">
          <Flame className="h-4 w-4" />
          This paste will be permanently deleted after it's viewed once.
        </p>
      )}
    </form>
  );
}
