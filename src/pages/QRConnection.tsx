import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, ArrowRight } from 'lucide-react';

const QRConnection = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Невірне посилання</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Токен підключення не знайдено
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const setupUrl = `http://192.168.4.1/?token=${token}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Підключення пристрою</CardTitle>
          <CardDescription className="text-base">
            Слідуйте інструкціям нижче для підключення вашого GrowBox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <QRCodeSVG value={setupUrl} size={200} level="H" />
            </div>
          </div>

          {/* Token Display */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Токен підключення:</p>
            <code className="block w-full p-3 bg-background rounded text-sm break-all font-mono">
              {token}
            </code>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Інструкція з підключення
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">📲 Підключіться до Wi-Fi GrowBox-Setup</p>
                  <p className="text-sm text-muted-foreground">
                    Знайдіть мережу з назвою <code className="px-2 py-1 bg-background rounded">GrowBox-Setup</code> та підключіться до неї
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">🔗 Відскануйте QR-код</p>
                  <p className="text-sm text-muted-foreground">
                    Відскануйте QR-код вище або вручну відкрийте <code className="px-2 py-1 bg-background rounded">{setupUrl}</code> в браузері
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">🧩 Налаштуйте Wi-Fi</p>
                  <p className="text-sm text-muted-foreground">
                    Токен буде автоматично заповнений. Введіть дані вашої домашньої Wi-Fi мережі та натисніть "Підключити"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">✅ Пристрій підключиться автоматично</p>
                  <p className="text-sm text-muted-foreground">
                    Після успішного підключення пристрій автоматично з'явиться у вашому списку пристроїв
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Примітка:</strong> Токен підключення дійсний протягом 24 годин. 
              Після успішного підключення пристрій автоматично з'явиться у вашому списку пристроїв.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRConnection;
