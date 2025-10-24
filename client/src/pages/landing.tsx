import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Zap, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PlusCircle className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">TeleGroup</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/login">Login</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Automate Telegram Group Creation at Scale
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Create hundreds of Telegram groups instantly with our professional automation platform. 
              Secure, fast, and reliable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="h-12" data-testid="button-get-started">
              <a href="/register">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" className="h-12" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription>
                  Create up to 100 groups in minutes. Our automated system handles everything seamlessly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription>
                  Your Telegram credentials are encrypted and never shared. Bank-level security guaranteed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Pay As You Go</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription>
                  Only $2 per 100 groups. No subscriptions, no hidden fees. Pay with cryptocurrency.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Join 500+ users automating Telegram groups
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 TeleGroup. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
