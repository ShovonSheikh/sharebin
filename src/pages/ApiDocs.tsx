import { useState, useMemo } from 'react';
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
import { Play, Copy, Check, Loader2, Key, FileText, Trash2, List, Lock, Flame } from 'lucide-react';
import { generateCurl, generateFetch } from '@/lib/curlGenerator';

const API_BASE_URL = getApiBaseUrl();

export default function ApiDocs() {
  return (
    <Layout showFooter={false}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="secondary">API v1</Badge>
            <h1 className="text-4xl font-bold">Pastely API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Programmatically create, read, and manage text pastes.
            </p>
          </div>

          {/* Authentication */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Authentication
              </CardTitle>
              <CardDescription>
                API requests require authentication via Bearer token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Generate an API key from your <a href="/dashboard" className="text-primary hover:underline">dashboard</a>.
                Include it in the <code className="bg-secondary px-2 py-1 rounded text-sm">Authorization</code> header:
              </p>
              <CodeBlock language="bash">
                {`Authorization: Bearer ts_your_api_key_here`}
              </CodeBlock>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="bg-secondary flex-wrap h-auto gap-2 p-2">
              <TabsTrigger value="create" className="gap-2">
                <FileText className="h-4 w-4" />
                Create Paste
              </TabsTrigger>
              <TabsTrigger value="get" className="gap-2">
                <FileText className="h-4 w-4" />
                Get Paste
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List Pastes
              </TabsTrigger>
              <TabsTrigger value="delete" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Paste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <CreatePasteEndpoint />
            </TabsContent>

            <TabsContent value="get">
              <GetPasteEndpoint />
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
      setResponse(JSON.stringify({ error: 'Request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // Generate cURL command reactively based on form state
  const curlCommand = useMemo(() => generateCurl({
    method: 'POST',
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

  // Generate JavaScript fetch code reactively
  const jsCommand = useMemo(() => generateFetch({
    method: 'POST',
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
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key (optional)</label>
          <Input
            placeholder="ts_your_api_key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content *</label>
          <Textarea
            placeholder="Your text content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-secondary font-mono min-h-[100px]"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Optional title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Live Examples</label>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
              Updates as you type
            </Badge>
          </div>
          <CodeExamples curl={curlCommand} javascript={jsCommand} />
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
      setResponse(JSON.stringify({ error: 'Request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EndpointCard
      method="GET"
      path="/get?id={paste_id}"
      description="Retrieve a paste by its ID."
    >
      <div className="grid gap-4">
        <div className="space-y-2">
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

        <CodeExamples
          curl={`curl "${API_BASE_URL}/get?id=abc12345"`}
          javascript={`const response = await fetch("${API_BASE_URL}/get?id=abc12345");
const data = await response.json();
console.log(data.paste_content);`}
        />
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
      setResponse(JSON.stringify({ error: 'Request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EndpointCard
      method="GET"
      path="/list"
      description="List all pastes for the authenticated user."
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key *</label>
          <Input
            placeholder="ts_your_api_key"
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

        <CodeExamples
          curl={`curl "${API_BASE_URL}/list" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          javascript={`const response = await fetch("${API_BASE_URL}/list", {
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
});

const data = await response.json();
console.log(data.pastes);`}
        />
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
      setResponse(JSON.stringify({ error: 'Request failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EndpointCard
      method="DELETE"
      path="/delete?id={paste_id}"
      description="Delete a paste. You must be the owner."
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key *</label>
          <Input
            placeholder="ts_your_api_key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <div className="space-y-2">
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

        <CodeExamples
          curl={`curl -X DELETE "${API_BASE_URL}/delete?id=abc12345" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          javascript={`const response = await fetch("${API_BASE_URL}/delete?id=abc12345", {
  method: "DELETE",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
});

const data = await response.json();
console.log(data.message);`}
        />
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
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="text-lg font-mono">{path}</code>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CodeBlock({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-code border border-code-border rounded-lg p-4 overflow-x-auto">
        <code className={`text-sm font-mono ${language ? `language-${language}` : ''}`}>
          {children}
        </code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function ResponseBlock({ response }: { response: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Response</label>
      <CodeBlock language="json">{response}</CodeBlock>
    </div>
  );
}

function CodeExamples({ curl, javascript }: { curl: string; javascript: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Examples</label>
      <Tabs defaultValue="curl">
        <TabsList className="bg-secondary">
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent value="curl" className="mt-2">
          <CodeBlock language="bash">{curl}</CodeBlock>
        </TabsContent>
        <TabsContent value="javascript" className="mt-2">
          <CodeBlock language="javascript">{javascript}</CodeBlock>
        </TabsContent>
      </Tabs>
    </div>
  );
}