import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            TextShare is not responsible for the contents of shared links.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/docs" className="text-muted-foreground hover:text-primary transition-colors">
              API Documentation
            </Link>
            <span className="text-muted-foreground">
              Built with ❤️
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}