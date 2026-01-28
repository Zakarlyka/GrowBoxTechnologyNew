import { Check, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  isActive?: boolean;
  isPopular?: boolean;
  onSubscribe?: () => void;
  disabled?: boolean;
}

export function PricingCard({
  name,
  price,
  period = '/міс',
  description,
  features,
  isActive = false,
  isPopular = false,
  onSubscribe,
  disabled = false,
}: PricingCardProps) {
  return (
    <Card className={cn(
      "relative flex flex-col h-full transition-all duration-300",
      isPopular && "border-primary shadow-lg shadow-primary/20 scale-[1.02]",
      isActive && "ring-2 ring-success/50 border-success"
    )}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            Рекомендовано
          </Badge>
        </div>
      )}

      {/* Active Badge */}
      {isActive && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-success/10 text-success border-success">
            <Check className="w-3 h-3 mr-1" />
            Активний план
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          {isPopular && <Zap className="w-5 h-5 text-primary" />}
          {name}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{price}</span>
            {price !== 'Безкоштовно' && (
              <span className="text-muted-foreground">{period}</span>
            )}
          </div>
        </div>

        {/* Features List */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className={cn(
                "mt-0.5 rounded-full p-0.5",
                feature.included ? "text-success" : "text-muted-foreground"
              )}>
                <Check className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-sm",
                !feature.included && "text-muted-foreground line-through"
              )}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className={cn(
            "w-full",
            isPopular && "bg-primary hover:bg-primary/90"
          )}
          variant={isActive ? "outline" : isPopular ? "default" : "secondary"}
          onClick={onSubscribe}
          disabled={disabled || isActive}
        >
          {isActive ? 'Поточний план' : 'Підписатися'}
        </Button>
      </CardFooter>
    </Card>
  );
}
