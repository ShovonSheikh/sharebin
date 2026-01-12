import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SYNTAX_OPTIONS, EXPIRATION_OPTIONS, getApiBaseUrl } from '@/lib/constants';
import { toast } from 'sonner';
import { Play, Copy, Check, Loader2, Key, FileText, Trash2, List, Lock, Flame, Terminal, ArrowLeft, Upload } from 'lucide-react';
import { generateCurl, generateFetch, generatePython, generateGo, generatePHP, generateRuby } from '@/lib/curlGenerator';
import { HighlightedCodeBlock } from '@/components/api-docs/HighlightedCodeBlock';

const API_BASE_URL = getApiBaseUrl();

export default function ApiDocs() {
  return (
    <Layout showFooter={false}>
      <div className="container mx-auto px-4 py-8 lg:py-12 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-8 min-w-0">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          {/* Header */}
          <div className="space-y-4">
            <Badge variant="secondary">API v1</Badge>
            <h1 className="text-4xl font-bold">OpenPaste API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Programmatically create, read, and manage text pastes and file uploads.
            </p>
          </div>

          {/* Authentication */}
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Authentication
              </CardTitle>
              <CardDescription>
                API requests require authentication via Bearer token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 min-w-0 overflow-hidden">
              <p className="text-muted-foreground">
                Generate an API key from your <a href="/dashboard" className="text-primary hover:underline">dashboard</a>.
                Include it in the <code className="bg-secondary px-2 py-1 rounded text-sm">Authorization</code> header:
              </p>
              <HighlightedCodeBlock language="bash">
                {`Authorization: Bearer op_your_api_key_here`}
              </HighlightedCodeBlock>
            </CardContent>
          </Card>

          {/* Rate Limiting Info */}
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Rate Limiting
              </CardTitle>
              <CardDescription>
                API requests are rate limited to prevent abuse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 min-w-0 overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">60</p>
                  <p className="text-sm text-muted-foreground">requests per minute</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">1,000</p>
                  <p className="text-sm text-muted-foreground">requests per hour</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Rate limit headers are included in all responses:
              </p>
              <HighlightedCodeBlock language="bash">
                {`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 30`}
              </HighlightedCodeBlock>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="bg-secondary grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 p-1">
              <TabsTrigger value="create" className="gap-2 text-xs sm:text-sm py-2">
                <FileText className="h-4 w-4 hidden sm:block" />
                Create
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2 text-xs sm:text-sm py-2">
                <Upload className="h-4 w-4 hidden sm:block" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="get" className="gap-2 text-xs sm:text-sm py-2">
                <FileText className="h-4 w-4 hidden sm:block" />
                Get
              </TabsTrigger>
              <TabsTrigger value="raw" className="gap-2 text-xs sm:text-sm py-2">
                <Terminal className="h-4 w-4 hidden sm:block" />
                Raw
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 text-xs sm:text-sm py-2">
                <List className="h-4 w-4 hidden sm:block" />
                List
              </TabsTrigger>
              <TabsTrigger value="delete" className="gap-2 text-xs sm:text-sm py-2">
                <Trash2 className="h-4 w-4 hidden sm:block" />
                Delete
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <CreatePasteEndpoint />
            </TabsContent>

            <TabsContent value="upload">
              <UploadFileEndpoint />
            </TabsContent>

            <TabsContent value="get">
              <GetPasteEndpoint />
            </TabsContent>

            <TabsContent value="raw">
              <RawPasteEndpoint />
            </TabsContent>

            <TabsContent value="list">
              <ListPastesEndpoint />
            </TabsContent>

            <TabsContent value="delete">
              <DeletePasteEndpoint />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

function CreatePasteEndpoint() {
  const [apiKey, setApiKey] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [syntax, setSyntax] = useState('plaintext');
  const [expiration, setExpiration] = useState('never');
  const [password, setPassword] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify({
          content,
          title: title || undefined,
          syntax,
          expiration,
          password: password || undefined,
          burn_after_read: burnAfterRead || undefined,
        }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(JSON.stringify({ error: errorMessage, hint: 'Check API URL and network connection' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const requestOptions = useMemo(() => ({
    method: 'POST' as const,
    url: `${window.location.origin}${API_BASE_URL}/create`,
    apiKey: apiKey || 'YOUR_API_KEY',
    body: {
      content: content || 'Hello World',
      title: title || undefined,
      syntax,
      expiration,
      password: password || undefined,
      burn_after_read: burnAfterRead || undefined,
    }
  }), [apiKey, content, title, syntax, expiration, password, burnAfterRead]);

  return (
    <EndpointCard
      method="POST"
      path="/create"
      description="Create a new text paste."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">API Key (optional)</label>
          <Input
            placeholder="op_your_api_key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">Content *</label>
          <Textarea
            placeholder="Your text content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-secondary font-mono min-h-[100px]"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Optional title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium">Syntax</label>
            <Select value={syntax} onValueChange={setSyntax}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNTAX_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium">Expiration</label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </label>
            <Input
              type="password"
              placeholder="Optional password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
          <input
            type="checkbox"
            id="burnAfterRead"
            checked={burnAfterRead}
            onChange={(e) => setBurnAfterRead(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="burnAfterRead" className="flex items-center gap-2 text-sm cursor-pointer">
            <Flame className="h-4 w-4 text-orange-500" />
            Burn after reading (delete after first view)
          </label>
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <div className="space-y-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples options={requestOptions} />
        </div>
      </div>
    </EndpointCard>
  );
}

function UploadFileEndpoint() {
  return (
    <EndpointCard
      method="POST"
      path="/upload"
      description="Upload a file (images, documents, archives)."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload files via multipart/form-data. Supports:
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground">Images</p>
              <p className="text-muted-foreground">.png, .jpg, .gif, .webp, .svg</p>
              <p className="text-xs text-muted-foreground/70">Max: 10MB</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Documents</p>
              <p className="text-muted-foreground">.pdf, .doc, .docx, .xls, .xlsx</p>
              <p className="text-xs text-muted-foreground/70">Max: 25MB</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Archives</p>
              <p className="text-muted-foreground">.zip, .rar, .7z, .tar.gz</p>
              <p className="text-xs text-muted-foreground/70">Max: 50MB</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">cURL Example</label>
          <HighlightedCodeBlock language="bash">
            {`curl -X POST "${window.location.origin}${API_BASE_URL}/upload" \\
  -H "Authorization: Bearer op_your_api_key" \\
  -F "file=@/path/to/your/file.png" \\
  -F "title=My Upload" \\
  -F "expiration=1w"`}
          </HighlightedCodeBlock>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Response</label>
          <HighlightedCodeBlock language="json">
            {JSON.stringify({
              paste_id: "abc12345",
              url: `${window.location.origin}/p/abc12345`,
              direct_url: `${window.location.origin}/i/abc12345`,
              file_name: "file.png",
              file_size: 102400,
              content_type: "image"
            }, null, 2)}
          </HighlightedCodeBlock>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm">
            <strong>Direct Image URL:</strong> Use <code className="bg-secondary px-1 rounded">/i/{'{id}'}</code> for embedding images in other projects.
          </p>
        </div>
      </div>
    </EndpointCard>
  );
}

function GetPasteEndpoint() {
  const [pasteId, setPasteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!pasteId.trim()) {
      toast.error('Paste ID is required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/get?id=${pasteId}`, {
        method: 'GET',
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(JSON.stringify({ error: errorMessage, hint: 'Check API URL and network connection' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const requestOptions = useMemo(() => ({
    method: 'GET' as const,
    url: `${window.location.origin}${API_BASE_URL}/get?id=${pasteId || 'YOUR_PASTE_ID'}`,
  }), [pasteId]);

  return (
    <EndpointCard
      method="GET"
      path="/get?id={paste_id}"
      description="Retrieve a paste by its ID. Returns file metadata for uploads."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">Paste ID *</label>
          <Input
            placeholder="abc12345"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <div className="space-y-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples options={requestOptions} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Response (File Upload)</label>
          <HighlightedCodeBlock language="json">
            {JSON.stringify({
              paste_id: "abc12345",
              content_type: "image",
              file_name: "photo.jpg",
              file_size: 2048576,
              file_type: "image/jpeg",
              created_at: "2026-01-12T..."
            }, null, 2)}
          </HighlightedCodeBlock>
        </div>
      </div>
    </EndpointCard>
  );
}

function RawPasteEndpoint() {
  const [pasteId, setPasteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!pasteId.trim()) {
      toast.error('Paste ID is required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/raw?id=${pasteId}`, {
        method: 'GET',
      });

      const text = await res.text();
      setResponse(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const requestOptions = useMemo(() => ({
    method: 'GET' as const,
    url: `${window.location.origin}${API_BASE_URL}/raw?id=${pasteId || 'YOUR_PASTE_ID'}`,
  }), [pasteId]);

  return (
    <EndpointCard
      method="GET"
      path="/raw?id={paste_id}"
      description="Get raw paste content as plain text. Perfect for piping to other commands."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="p-4 bg-secondary/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Returns plain text without JSON wrapping. Ideal for:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside space-y-1">
            <li>Piping to other commands: <code className="bg-secondary px-1 rounded">curl ... | python</code></li>
            <li>Downloading with wget</li>
            <li>Direct script execution</li>
          </ul>
          <p className="text-sm text-yellow-500 mt-3">
            ⚠️ Password-protected pastes cannot be accessed via this endpoint.
          </p>
        </div>

        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">Paste ID *</label>
          <Input
            placeholder="abc12345"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && (
          <div className="space-y-2 min-w-0 overflow-hidden">
            <label className="text-sm font-medium">Response (Plain Text)</label>
            <HighlightedCodeBlock language="plaintext">{response}</HighlightedCodeBlock>
          </div>
        )}

        <div className="space-y-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples options={requestOptions} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Direct Image Access</label>
          <HighlightedCodeBlock language="bash">
            {`# For image uploads, use /img endpoint:
curl "${window.location.origin}${API_BASE_URL}/img?id=YOUR_IMAGE_ID" > image.png

# Or use the short URL:
curl "${window.location.origin}/i/YOUR_IMAGE_ID" > image.png`}
          </HighlightedCodeBlock>
        </div>
      </div>
    </EndpointCard>
  );
}

function ListPastesEndpoint() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!apiKey.trim()) {
      toast.error('API Key is required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(JSON.stringify({ error: errorMessage, hint: 'Check API URL and network connection' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const requestOptions = useMemo(() => ({
    method: 'GET' as const,
    url: `${window.location.origin}${API_BASE_URL}/list`,
    apiKey: apiKey || 'YOUR_API_KEY',
  }), [apiKey]);

  return (
    <EndpointCard
      method="GET"
      path="/list"
      description="List all pastes and uploads for the authenticated user."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">API Key *</label>
          <Input
            placeholder="op_your_api_key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <div className="space-y-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples options={requestOptions} />
        </div>
      </div>
    </EndpointCard>
  );
}

function DeletePasteEndpoint() {
  const [apiKey, setApiKey] = useState('');
  const [pasteId, setPasteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!apiKey.trim() || !pasteId.trim()) {
      toast.error('API Key and Paste ID are required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/delete?id=${pasteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(JSON.stringify({ error: errorMessage, hint: 'Check API URL and network connection' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const requestOptions = useMemo(() => ({
    method: 'DELETE' as const,
    url: `${window.location.origin}${API_BASE_URL}/delete?id=${pasteId || 'YOUR_PASTE_ID'}`,
    apiKey: apiKey || 'YOUR_API_KEY',
  }), [apiKey, pasteId]);

  return (
    <EndpointCard
      method="DELETE"
      path="/delete?id={paste_id}"
      description="Delete a paste or file. You must be the owner."
    >
      <div className="grid gap-4 min-w-0 overflow-hidden">
        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">API Key *</label>
          <Input
            placeholder="op_your_api_key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <div className="space-y-2 min-w-0">
          <label className="text-sm font-medium">Paste ID *</label>
          <Input
            placeholder="abc12345"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <div className="space-y-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples options={requestOptions} />
        </div>
      </div>
    </EndpointCard>
  );
}

function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description: string;
  children: React.ReactNode;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-success text-success-foreground',
    POST: 'bg-primary text-primary-foreground',
    DELETE: 'bg-destructive text-destructive-foreground',
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="text-lg font-mono break-all">{path}</code>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">{children}</CardContent>
    </Card>
  );
}

function ResponseBlock({ response }: { response: string }) {
  return (
    <div className="space-y-2 min-w-0 overflow-hidden">
      <label className="text-sm font-medium">Response</label>
      <HighlightedCodeBlock language="json">{response}</HighlightedCodeBlock>
    </div>
  );
}

interface CodeExamplesOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  apiKey?: string;
  body?: Record<string, any>;
}

function CodeExamples({ options }: { options: CodeExamplesOptions }) {
  const curlCode = useMemo(() => generateCurl(options), [options]);
  const jsCode = useMemo(() => generateFetch(options), [options]);
  const pythonCode = useMemo(() => generatePython(options), [options]);
  const goCode = useMemo(() => generateGo(options), [options]);
  const phpCode = useMemo(() => generatePHP(options), [options]);
  const rubyCode = useMemo(() => generateRuby(options), [options]);

  return (
    <div className="space-y-2 min-w-0 overflow-hidden">
      <Tabs defaultValue="curl">
        <TabsList className="bg-secondary flex-wrap h-auto">
          <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
          <TabsTrigger value="javascript" className="text-xs">JavaScript</TabsTrigger>
          <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
          <TabsTrigger value="go" className="text-xs">Go</TabsTrigger>
          <TabsTrigger value="php" className="text-xs">PHP</TabsTrigger>
          <TabsTrigger value="ruby" className="text-xs">Ruby</TabsTrigger>
        </TabsList>
        <TabsContent value="curl" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="bash">{curlCode}</HighlightedCodeBlock>
        </TabsContent>
        <TabsContent value="javascript" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="javascript">{jsCode}</HighlightedCodeBlock>
        </TabsContent>
        <TabsContent value="python" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="python">{pythonCode}</HighlightedCodeBlock>
        </TabsContent>
        <TabsContent value="go" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="go">{goCode}</HighlightedCodeBlock>
        </TabsContent>
        <TabsContent value="php" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="php">{phpCode}</HighlightedCodeBlock>
        </TabsContent>
        <TabsContent value="ruby" className="mt-2 min-w-0 overflow-hidden">
          <HighlightedCodeBlock language="ruby">{rubyCode}</HighlightedCodeBlock>
        </TabsContent>
      </Tabs>
    </div>
  );
}
