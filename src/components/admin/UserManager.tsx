// src/components/admin/UserManager.tsx
// (або /pages/AdminPage.tsx, залежно від вашої структури)

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";
import type { RpcFunctionDefinitions, AdminUser } from '@/types/supabase-v2.8';

export function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast(); // 2. ⭐️ ФУНКЦІЯ ЗАВАНТАЖЕННЯ (ВИПРАВЛЕНА)

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase.rpc as any)(
        'admin_get_all_users'
      );

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("No data returned from admin_get_all_users");
        setUsers([]);
        return;
      }
      
      setUsers(data as AdminUser[]);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити список користувачів: ${error.message}`,
        variant: "destructive",
      });
      setUsers([]); // Set empty array on error to stop loading state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Цей компонент завантажиться ТІЛЬКИ ПІСЛЯ того, як
    // AdminRoute (з App.tsx) успішно перевірить роль через get_my_role(),
    // тому "вічного спінера" більше не буде.
    loadUsers();
  }, []); // 4. ⭐️ ФУНКЦІЯ ЗМІНИ РОЛІ

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ app_role: newRole } as any)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: `Роль користувача успішно змінено на ${newRole}`,
      }); // Оновлюємо стан локально

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
  }; // 5. РЕНДЕР (з 'full_name' та 'app_role')

  if (loading) {
    return (
      <Card>
               {" "}
        <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />       {" "}
        </CardContent>
             {" "}
      </Card>
    );
  }

  return (
    <Card>
           {" "}
      <CardHeader>
               {" "}
        <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />          Керування Користувачами        {" "}
        </CardTitle>
                <CardDescription>          Перегляд та зміна ролей користувачів системи         </CardDescription>   
         {" "}
      </CardHeader>
           {" "}
      <CardContent>
               {" "}
        <Table>
                   {" "}
          <TableHeader>
                       {" "}
            <TableRow>
                            <TableHead>Ім'я (full_name)</TableHead>              <TableHead>Email</TableHead>           
                <TableHead>Поточна Роль (app_role)</TableHead>              <TableHead>Змінити Роль</TableHead>         
               {" "}
            </TableRow>
                     {" "}
          </TableHeader>
                   {" "}
          <TableBody>
                       {" "}
            {users.map((user) => (
              <TableRow key={user.user_id}>
                {/* ⭐️ ВИПРАВЛЕНО: 'full_name' */}               {" "}
                <TableCell>{user.full_name || "Не вказано"}</TableCell>               {" "}
                <TableCell>{user.email}</TableCell>               {" "}
                <TableCell>
                  {/* ⭐️ ВИПРАВЛЕНО: 'app_role' */}                 {" "}
                  <span className="capitalize">{user.app_role}</span>               {" "}
                </TableCell>
                               {" "}
                <TableCell>
                                   {" "}
                  <Select
                    value={user.app_role}
                    onValueChange={(value) => handleRoleChange(user.user_id, value)}
                    disabled={updatingId === user.user_id}
                  >
                                       {" "}
                    <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Оберіть роль" />                   {" "}
                    </SelectTrigger>
                                       {" "}
                    <SelectContent>
                      {/* Переконайтеся, що ці 'value' відповідають вашому ENUM 'app_role' */}                     {" "}
                      <SelectItem value="user">User</SelectItem>                     {" "}
                      <SelectItem value="developer">Developer</SelectItem>                     {" "}
                      <SelectItem value="admin">Admin</SelectItem>                     {" "}
                      <SelectItem value="superadmin">Superadmin</SelectItem>                   {" "}
                    </SelectContent>
                                     {" "}
                  </Select>
                                 {" "}
                </TableCell>
                             {" "}
              </TableRow>
            ))}
                     {" "}
          </TableBody>
                 {" "}
        </Table>
             {" "}
      </CardContent>
         {" "}
    </Card>
  );
}

// Якщо ваш компонент експортується за замовчуванням
export default UserManager;
