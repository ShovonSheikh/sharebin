import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CreatePasteForm } from '@/components/paste/CreatePasteForm';
import { FileUploadForm } from '@/components/upload/FileUploadForm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Clock, Code, FileText, QrCode, Globe, Type, Upload, Image, FileArchive } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('text');

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-6 lg:py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 space-y-3 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              Free & Open Source
            </Badge>
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground">
              Share Content <span className="text-gradient">Instantly</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Paste text, code, or upload files to generate a shareable link.
              The fastest way to share snippets and files online.
            </p>
          </div>

          {/* Create Form with Tabs */}
          <Card className="max-w-4xl mx-auto p-4 lg:p-6 bg-card border-border animate-fade-in">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="text" className="gap-2">
                  <Type className="h-4 w-4" />
                  Text / Code
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="h-4 w-4" />
                  File Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-0">
                <CreatePasteForm />
              </TabsContent>

              <TabsContent value="file" className="mt-0">
                <FileUploadForm />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Use <span className="text-primary">OpenPaste</span>?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Zero Friction"
              description="No accounts required. Just paste, create, and share."
            />
            <FeatureCard
              icon={<Code className="h-6 w-6 text-primary" />}
              title="Syntax Highlighting"
              description="Support for 20+ programming languages with beautiful highlighting."
            />
            <FeatureCard
              icon={<Image className="h-6 w-6 text-primary" />}
              title="Image Hosting"
              description="Upload images with direct links for embedding anywhere."
            />
            <FeatureCard
              icon={<FileArchive className="h-6 w-6 text-primary" />}
              title="File Sharing"
              description="Share documents and zipped folders (ZIP, RAR, 7Z, TAR.GZ)."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-primary" />}
              title="Flexible Expiration"
              description="Choose how long your content stays available."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6 text-primary" />}
              title="API Access"
              description="Full REST API for programmatic access and automation."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Three Simple Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Paste or Upload"
              description="Drop your text, code, or files into the editor above."
            />
            <StepCard
              number={2}
              title="Get Your Link"
              description="Instantly receive a unique URL ready to share."
            />
            <StepCard
              number={3}
              title="Share Anywhere"
              description="Send the link or use embed codes for images."
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export default Index;
