import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BookOpen } from 'lucide-react';
import { OpenPasteLogo } from '@/components/icons/OpenPasteLogo';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <OpenPasteLogo className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold text-foreground">
            Open<span className="text-primary">Paste</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/pricing">
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
          </Link>
          <Link to="/docs">
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              API Docs
            </Button>
          </Link>

          <SignedIn>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-card border border-border",
                  userButtonPopoverActionButton: "text-foreground hover:bg-secondary",
                  userButtonPopoverActionButtonText: "text-foreground",
                  userButtonPopoverFooter: "hidden",
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <Link to="/sign-in">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
