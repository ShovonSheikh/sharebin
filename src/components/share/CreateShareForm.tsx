import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SYNTAX_OPTIONS, EXPIRATION_OPTIONS, getExpirationDate } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Share2, Loader2 } from 'lucide-react';

export function CreateShareForm() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [syntax, setSyntax] = useState('plaintext');
  const [expiration, setExpiration] = useState('never');
  const [loading, setLoading] = useState(false);
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
      
      const { data, error } = await supabase
        .from('shares')
        .insert({
          content: content.trim(),
          title: title.trim() || null,
          syntax,
          expires_at: expiresAt?.toISOString() || null,
          user_id: user?.id || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Share created successfully!');
      navigate(`/s/${data.id}`);
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error('Failed to create share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
          className="min-h-[300px] bg-secondary border-border font-mono text-sm resize-y"
          maxLength={100000}
        />
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
    </form>
  );
}