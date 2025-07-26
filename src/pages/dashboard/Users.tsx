import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Shield,
  Filter,
  Loader2,
  Key
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useUsers, 
  useRoles,
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useAssignRolesToUser,
  type CreateUserData,
  type UpdateUserData,
  type Role,
  type User
} from "@/hooks/useApi";
import PasswordResetDialog from "@/components/PasswordResetDialog";
import { usePermissions } from "@/hooks/usePermissions";

// Form validation schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_ids: z.array(z.number()).optional(),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  
  const { toast } = useToast();
  const permissions = usePermissions();
  
  // API hooks
  const { data: users = [], isLoading, error } = useUsers();
  const { data: roles = [] } = useRoles(true); // Only active roles
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const assignRolesMutation = useAssignRolesToUser();

  // Form for creating users
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      full_name: "",
      role_ids: [],
      is_active: true,
    },
  });

  // Form for editing users
  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const roleNames = user.roles?.map(r => r.name.toLowerCase()).join(' ') || '';
    const roleDisplayNames = user.roles?.map(r => r.display_name.toLowerCase()).join(' ') || '';
    
    return user.username.toLowerCase().includes(searchLower) ||
           user.email.toLowerCase().includes(searchLower) ||
           user.full_name.toLowerCase().includes(searchLower) ||
           roleNames.includes(searchLower) ||
           roleDisplayNames.includes(searchLower);
  });

  // Handle user creation
  const handleCreateUser = async (data: UserFormData) => {
    try {
      const createData: CreateUserData = {
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        password: data.password,
        is_active: data.is_active,
        role_ids: data.role_ids,
      };
      await createUserMutation.mutateAsync(createData);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  // Handle user editing
  const handleEditUser = async (data: UserFormData) => {
    if (!editingUser) return;
    
    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: data,
      });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  // Handle user status toggle
  const toggleUserStatus = async (user: User) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: { is_active: !user.is_active },
      });
      toast({
        title: "Success",
        description: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.username}?`)) return;
    
    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog with user data
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role_ids: user.roles?.map(r => r.id) || [],
      is_active: user.is_active,
    });
    setEditDialogOpen(true);
  };

  // Open roles dialog
  const openRolesDialog = (user: User) => {
    setEditingUser(user);
    setSelectedRoles(user.roles?.map(r => r.id) || []);
    setRolesDialogOpen(true);
  };

  // Handle role assignment
  const handleAssignRoles = async () => {
    if (!editingUser) return;
    
    try {
      await assignRolesMutation.mutateAsync({
        userId: editingUser.id,
        roleIds: selectedRoles,
      });
      toast({
        title: "Success",
        description: "Roles assigned successfully",
      });
      setRolesDialogOpen(false);
      setEditingUser(null);
      setSelectedRoles([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign roles",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              Error loading users: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and role assignments</p>
        </div>
        {permissions.canCreateUsers() && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-gradient-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. You can assign roles after creation.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles (Optional)</FormLabel>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {roles.map((role) => (
                          <div key={role.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`create-role-${role.id}`}
                              checked={field.value?.includes(role.id) || false}
                              onCheckedChange={(checked) => {
                                const currentRoles = field.value || [];
                                if (checked) {
                                  field.onChange([...currentRoles, role.id]);
                                } else {
                                  field.onChange(currentRoles.filter(id => id !== role.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`create-role-${role.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {role.display_name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          User can log in and access the system
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, username, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="hover:bg-muted">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">All Users</CardTitle>
          <CardDescription>A list of all users and their assigned roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roles</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-muted-foreground">Loading users...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            <>
                              {user.roles.slice(0, 2).map((role) => (
                                <Badge 
                                  key={role.id}
                                  variant={role.name === "admin" ? "default" : role.name === "user_manager" ? "secondary" : "outline"}
                                  className="font-medium"
                                >
                                  {role.display_name}
                                </Badge>
                              ))}
                              {user.roles.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.roles.length - 2} more
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No roles assigned
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => toggleUserStatus(user)}
                            disabled={updateUserMutation.isPending}
                          />
                          <Badge 
                            variant={user.is_active ? "default" : "secondary"}
                            className={user.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}
                          >
                            {user.is_active ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="hover:bg-muted cursor-pointer"
                              onClick={() => openEditDialog(user)}
                              disabled={!permissions.canEditUsers()}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="hover:bg-muted cursor-pointer"
                              onClick={() => openRolesDialog(user)}
                              disabled={!permissions.canManageRoles()}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setEditingUser(user);
                                setPasswordResetDialogOpen(true);
                              }}
                              disabled={!permissions.canResetPasswords()}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="hover:bg-muted cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => handleDeleteUser(user)}
                              disabled={!permissions.canDeleteUsers()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-role-${role.id}`}
                            checked={field.value?.includes(role.id) || false}
                            onCheckedChange={(checked) => {
                              const currentRoles = field.value || [];
                              if (checked) {
                                field.onChange([...currentRoles, role.id]);
                              } else {
                                field.onChange(currentRoles.filter(id => id !== role.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`edit-role-${role.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {role.display_name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        User can log in and access the system
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Roles Assignment Dialog */}
      <Dialog open={rolesDialogOpen} onOpenChange={setRolesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for "{editingUser?.full_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2 p-2 rounded border">
                  <Checkbox
                    id={`assign-role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles([...selectedRoles, role.id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`assign-role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.display_name}
                    </label>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRoles} disabled={assignRolesMutation.isPending}>
              {assignRolesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-accent">All registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.filter(u => u.is_active).length}</div>
            <p className="text-xs text-accent">Currently active users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.filter(u => !u.is_active).length}</div>
            <p className="text-xs text-accent">Deactivated users</p>
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        open={passwordResetDialogOpen}
        onOpenChange={setPasswordResetDialogOpen}
        user={editingUser}
      />
    </div>
  );
}