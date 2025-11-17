import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Terminal as TerminalIcon, Send, Trash2, Download } from 'lucide-react';

interface TerminalMessage {
  id: string;
  timestamp: Date;
  type: 'command' | 'response' | 'error' | 'info';
  message: string;
  deviceId?: string;
}

interface TerminalProps {
  deviceId: string;
  deviceName: string;
  isConnected: boolean;
}

export function Terminal({ deviceId, deviceName, isConnected }: TerminalProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial connection message
    if (isConnected) {
      addMessage('info', `Connected to ${deviceName} (${deviceId})`);
      addMessage('info', 'Type "help" for available commands');
    }
  }, [isConnected, deviceName, deviceId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Simulate real-time sensor updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const sensorData = {
        temp: (20 + Math.random() * 10).toFixed(1),
        humidity: (50 + Math.random() * 30).toFixed(0),
        soil: (30 + Math.random() * 40).toFixed(0),
      };
      
      addMessage('info', `Sensor Update: T:${sensorData.temp}°C H:${sensorData.humidity}% S:${sensorData.soil}%`);
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const addMessage = (type: TerminalMessage['type'], message: string) => {
    const newMessage: TerminalMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      deviceId,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    addMessage('command', `> ${cmd}`);
    setIsLoading(true);

    // Simulate command execution delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerCmd = cmd.toLowerCase().trim();

    switch (lowerCmd) {
      case 'help':
        addMessage('response', 'Available commands:');
        addMessage('response', '  status - Show device status');
        addMessage('response', '  sensors - Read all sensor values');
        addMessage('response', '  light on/off - Control lighting');
        addMessage('response', '  fan on/off - Control ventilation');
        addMessage('response', '  water pump [duration] - Run water pump');
        addMessage('response', '  reset - Reset device');
        addMessage('response', '  clear - Clear terminal');
        addMessage('response', '  help - Show this help');
        break;

      case 'status':
        addMessage('response', 'Device Status:');
        addMessage('response', `  Power: ${Math.random() > 0.5 ? 'ON' : 'OFF'}`);
        addMessage('response', `  Light: ${Math.random() > 0.5 ? 'ON' : 'OFF'}`);
        addMessage('response', `  Fan: ${Math.random() > 0.5 ? 'ON' : 'OFF'}`);
        addMessage('response', `  Connection: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
        addMessage('response', `  Uptime: ${Math.floor(Math.random() * 100)}h ${Math.floor(Math.random() * 60)}m`);
        break;

      case 'sensors':
        addMessage('response', 'Sensor Readings:');
        addMessage('response', `  Temperature: ${(20 + Math.random() * 10).toFixed(1)}°C`);
        addMessage('response', `  Humidity: ${(50 + Math.random() * 30).toFixed(0)}%`);
        addMessage('response', `  Soil Moisture: ${(30 + Math.random() * 40).toFixed(0)}%`);
        addMessage('response', `  Light Level: ${(60 + Math.random() * 40).toFixed(0)}%`);
        addMessage('response', `  Water Level: ${(70 + Math.random() * 30).toFixed(0)}%`);
        break;

      case 'light on':
        addMessage('response', 'Light turned ON');
        break;

      case 'light off':
        addMessage('response', 'Light turned OFF');
        break;

      case 'fan on':
        addMessage('response', 'Ventilation fan turned ON');
        break;

      case 'fan off':
        addMessage('response', 'Ventilation fan turned OFF');
        break;

      case 'reset':
        addMessage('response', 'Device reset initiated...');
        setTimeout(() => {
          addMessage('info', 'Device reset complete');
        }, 2000);
        break;

      case 'clear':
        setMessages([]);
        addMessage('info', 'Terminal cleared');
        break;

      default:
        if (lowerCmd.startsWith('water pump')) {
          const duration = lowerCmd.split(' ')[2] || '10';
          addMessage('response', `Water pump activated for ${duration} seconds`);
        } else {
          addMessage('error', `Unknown command: ${cmd}`);
          addMessage('info', 'Type "help" for available commands');
        }
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand(command);
      setCommand('');
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    addMessage('info', 'Terminal cleared');
  };

  const downloadLog = () => {
    const logContent = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.message}`)
      .join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceName}-terminal-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMessageColor = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'response': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-yellow-400';
      default: return 'text-foreground';
    }
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5" />
            {t('devices.terminal')} - {deviceName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? t('devices.connected') : t('devices.disconnected')}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearTerminal}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadLog}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4">
          <div className="font-mono text-sm space-y-1">
            {messages.map((message) => (
              <div key={message.id} className={`${getMessageColor(message.type)} break-words`}>
                <span className="text-muted-foreground text-xs">
                  [{message.timestamp.toLocaleTimeString()}]
                </span>{' '}
                {message.message}
              </div>
            ))}
            {isLoading && (
              <div className="text-muted-foreground">
                <span className="animate-pulse">Processing...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={isConnected ? t('devices.enterCommand') : t('devices.notConnected')}
              disabled={!isConnected || isLoading}
              className="font-mono"
            />
            <Button 
              type="submit" 
              disabled={!isConnected || isLoading || !command.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}