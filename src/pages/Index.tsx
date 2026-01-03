import { Layout } from '@/components/layout/Layout';
import { CreateShareForm } from '@/components/share/CreateShareForm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Code, FileText, QrCode, Globe } from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              Free & Open Source
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground">
              Share Text <span className="text-gradient">Instantly</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Paste your text or code below to generate a shareable link. 
              The fastest way to share snippets online.
            </p>
          </div>

          {/* Create Form */}
          <Card className="max-w-4xl mx-auto p-6 lg:p-8 bg-card border-border animate-fade-in">
            <CreateShareForm />
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Use <span className="text-primary">TextShare</span>?
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
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Markdown Rendering"
              description="Your markdown content looks exactly right, every time."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-primary" />}
              title="Flexible Expiration"
              description="Choose how long your content stays available."
            />
            <FeatureCard
              icon={<QrCode className="h-6 w-6 text-primary" />}
              title="QR Codes"
              description="Automatic QR code generation for easy mobile sharing."
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
              title="Paste Content"
              description="Drop your text, markdown, or code into the editor above."
            />
            <StepCard
              number={2}
              title="Get Your Link"
              description="Instantly receive a unique URL ready to share."
            />
            <StepCard
              number={3}
              title="Share Anywhere"
              description="Send the link directly or use the generated QR code."
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