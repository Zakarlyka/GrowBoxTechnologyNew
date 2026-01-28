import { useState } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { PricingCard } from './PricingCard';
import { PaymentHistory } from './PaymentHistory';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const FREE_FEATURES = [
  { text: 'Базовий моніторинг датчиків', included: true },
  { text: 'Ручне керування пристроями', included: true },
  { text: 'До 3 пристроїв', included: true },
  { text: 'Історія за останні 7 днів', included: true },
  { text: 'AI Auto-pilot', included: false },
  { text: 'Telegram сповіщення', included: false },
  { text: 'Необмежені пристрої', included: false },
  { text: 'Пріоритетна підтримка', included: false },
];

const PRO_FEATURES = [
  { text: 'Базовий моніторинг датчиків', included: true },
  { text: 'Ручне керування пристроями', included: true },
  { text: 'Необмежена кількість пристроїв', included: true },
  { text: 'Повна історія без обмежень', included: true },
  { text: '🤖 AI Auto-pilot режим', included: true },
  { text: '📱 Telegram сповіщення', included: true },
  { text: '📧 Email алерти', included: true },
  { text: '⭐ Пріоритетна підтримка', included: true },
];

export function BillingTab() {
  const { isPremium, isLoading } = usePremiumStatus();
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (plan: 'free' | 'pro') => {
    if (plan === 'free') return;
    
    setSubscribing(true);
    
    // Simulate subscription flow - will be replaced with real Stripe integration
    setTimeout(() => {
      toast({
        title: "Скоро буде доступно!",
        description: "Інтеграція з платіжною системою в розробці. Слідкуйте за оновленнями!",
      });
      setSubscribing(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Завантаження тарифів...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Тарифні плани</h2>
        <p className="text-muted-foreground">
          Оберіть план, який найкраще підходить для ваших потреб
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        <PricingCard
          name="Novice"
          price="Безкоштовно"
          description="Для початківців та тестування"
          features={FREE_FEATURES}
          isActive={!isPremium}
          onSubscribe={() => handleSubscribe('free')}
        />
        
        <PricingCard
          name="Agro Wizard"
          price="199 ₴"
          description="Повний контроль з AI асистентом"
          features={PRO_FEATURES}
          isActive={isPremium}
          isPopular={true}
          onSubscribe={() => handleSubscribe('pro')}
          disabled={subscribing}
        />
      </div>

      <Separator className="my-8" />

      {/* Payment History */}
      <PaymentHistory />
    </div>
  );
}
