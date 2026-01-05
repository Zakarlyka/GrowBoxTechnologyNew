import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, Bot } from "lucide-react";
import type { AdminUser } from '@/types/supabase-v2.8';

interface AdminUserWithAI extends AdminUser {
  is_ai_allowed?: boolean;
}

export function UserManager() {
  const [users, setUsers] = useState<AdminUserWithAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingAiId, setUpdatingAiId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('admin_get_all_users');

      if (rpcError) {
        console.error("RPC error:", rpcError);
        throw rpcError;
      }
      
      if (!rpcData) {
        console.warn("No data returned from admin_get_all_users");
        setUsers([]);
        return;
      }

      const userIds = (rpcData as AdminUser[]).map(u => u.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, is_ai_allowed')
        .in('user_id', userIds);

      if (profilesError) {
        console.error("Profiles error:", profilesError);
      }

      const usersWithAI = (rpcData as AdminUser[]).map(user => {
        const profileMatch = profilesData?.find(p => p.user_id === user.user_id);
        return {
          ...user,
          is_ai_allowed: profileMatch?.is_ai_allowed ?? false,
        };
      });
      
      setUsers(usersWithAI);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити список користувачів: ${error.message}`,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await (supabase.from("user_roles") as any)
        .update({ app_role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: `Роль користувача успішно змінено на ${newRole}`,
      });

      setUsers((prevUsers) => prevUsers.map((u) => (u.user_id === userId ? { ...u, app_role: newRole as AdminUser['app_role'] } : u)));
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити роль користувача",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAiAccessChange = async (userId: string, newValue: boolean) => {
    setUpdatingAiId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_ai_allowed: newValue })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: newValue ? "AI доступ активовано" : "AI доступ вимкнено",
      });

      setUsers((prevUsers) => prevUsers.map((u) => (u.user_id === userId ? { ...u, is_ai_allowed: newValue } : u)));
    } catch (error: any) {
      console.error("Error updating AI access:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити AI доступ",
        variant: "destructive",
      });
    } finally {
      setUpdatingAiId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Керування Користувачами
        </CardTitle>
        <CardDescription>
          Перегляд та зміна ролей користувачів системи
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ім'я</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Змінити Роль</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Bot className="h-4 w-4" />
                  AI Доступ
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.full_name || "Не вказано"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="capitalize">{user.app_role}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.app_role}
                    onValueChange={(value) => handleRoleChange(user.user_id, value)}
                    disabled={updatingId === user.user_id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Оберіть роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={user.is_ai_allowed ?? false}
                      onCheckedChange={(checked) => handleAiAccessChange(user.user_id, checked)}
                      disabled={updatingAiId === user.user_id}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default UserManager;
