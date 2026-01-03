import { useState } from 'react';
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
import { SYNTAX_OPTIONS, EXPIRATION_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import { Play, Copy, Check, Loader2, Key, FileText, Trash2, List } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function ApiDocs() {
  return (
    <Layout showFooter={false}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="secondary">API v1</Badge>
            <h1 className="text-4xl font-bold">TextShare API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Programmatically create, read, and manage text shares.
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
                Create Share
              </TabsTrigger>
              <TabsTrigger value="get" className="gap-2">
                <FileText className="h-4 w-4" />
                Get Share
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List Shares
              </TabsTrigger>
              <TabsTrigger value="delete" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Share
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <CreateShareEndpoint />
            </TabsContent>

            <TabsContent value="get">
              <GetShareEndpoint />
            </TabsContent>

            <TabsContent value="list">
              <ListSharesEndpoint />
            </TabsContent>

            <TabsContent value="delete">
              <DeleteShareEndpoint />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

function CreateShareEndpoint() {
  const [apiKey, setApiKey] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [syntax, setSyntax] = useState('plaintext');
  const [expiration, setExpiration] = useState('never');
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
      const res = await fetch(`${API_BASE_URL}/api-shares`, {
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

  return (
    <EndpointCard
      method="POST"
      path="/api-shares"
      description="Create a new text share."
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

        <div className="grid sm:grid-cols-3 gap-4">
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
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <CodeExamples
          curl={`curl -X POST "${API_BASE_URL}/api-shares" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"content": "Hello World", "syntax": "plaintext"}'`}
          javascript={`const response = await fetch("${API_BASE_URL}/api-shares", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify({
    content: "Hello World",
    syntax: "plaintext"
  })
});

const data = await response.json();
console.log(data.url);`}
        />
      </div>
    </EndpointCard>
  );
}

function GetShareEndpoint() {
  const [shareId, setShareId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!shareId.trim()) {
      toast.error('Share ID is required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api-shares?id=${shareId}`, {
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
      path="/api-shares?id={share_id}"
      description="Retrieve a share by its ID."
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Share ID *</label>
          <Input
            placeholder="abc12345"
            value={shareId}
            onChange={(e) => setShareId(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <CodeExamples
          curl={`curl "${API_BASE_URL}/api-shares?id=abc12345"`}
          javascript={`const response = await fetch("${API_BASE_URL}/api-shares?id=abc12345");
const data = await response.json();
console.log(data.content);`}
        />
      </div>
    </EndpointCard>
  );
}

function ListSharesEndpoint() {
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
      const res = await fetch(`${API_BASE_URL}/api-shares`, {
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
      path="/api-shares"
      description="List all shares for the authenticated user."
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
          curl={`curl "${API_BASE_URL}/api-shares" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          javascript={`const response = await fetch("${API_BASE_URL}/api-shares", {
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
});

const data = await response.json();
console.log(data.shares);`}
        />
      </div>
    </EndpointCard>
  );
}

function DeleteShareEndpoint() {
  const [apiKey, setApiKey] = useState('');
  const [shareId, setShareId] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleTry = async () => {
    if (!apiKey.trim() || !shareId.trim()) {
      toast.error('API Key and Share ID are required');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api-shares?id=${shareId}`, {
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
      path="/api-shares?id={share_id}"
      description="Delete a share. You must be the owner."
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
          <label className="text-sm font-medium">Share ID *</label>
          <Input
            placeholder="abc12345"
            value={shareId}
            onChange={(e) => setShareId(e.target.value)}
            className="bg-secondary font-mono"
          />
        </div>

        <Button onClick={handleTry} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Try It
        </Button>

        {response && <ResponseBlock response={response} />}

        <CodeExamples
          curl={`curl -X DELETE "${API_BASE_URL}/api-shares?id=abc12345" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          javascript={`const response = await fetch("${API_BASE_URL}/api-shares?id=abc12345", {
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