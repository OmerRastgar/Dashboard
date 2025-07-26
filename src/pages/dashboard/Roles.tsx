import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield,
  ShieldCheck,
  Filter,
  Loader2
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useRoles, 
  usePermissions,
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  useAssignPermissionsToRole,
  type CreateRoleData,
  type UpdateRoleData,
  type Role,
  type Permission
} from "@/hooks/useApi";
import { usePermissions as useUserPermissions } from "@/hooks/usePermissions";

// Form validation schemas
const roleFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export default function Roles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  const { toast } = useToast();
  const userPermissions = useUserPermissions();
  
  // API hooks
  const { data: roles = [], isLoading, error } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissionsToRole();

  // Form for creating roles
  const createForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      is_active: true,
    },
  });

  // Form for editing roles
  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
  });

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle role creation
  const handleCreateRole = async (data: RoleFormData) => {
    try {
      await createRoleMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  // Handle role editing
  const handleEditRole = async (data: RoleFormData) => {
    if (!editingRole) return;
    
    try {
      await updateRoleMutation.mutateAsync({
        id: editingRole.id,
        data: data,
      });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      setEditDialogOpen(false);
      setEditingRole(null);
      editForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  // Handle role status toggle
  const toggleRoleStatus = async (role: Role) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        data: { is_active: !role.is_active },
      });
      toast({
        title: "Success",
        description: `Role ${role.is_active ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role status",
        variant: "destructive",
      });
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.display_name}"?`)) return;
    
    try {
      await deleteRoleMutation.mutateAsync(role.id);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog with role data
  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    editForm.reset({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      is_active: role.is_active,
    });
    setEditDialogOpen(true);
  };

  // Open permissions dialog
  const openPermissionsDialog = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions.map(p => p.id));
    setPermissionsDialogOpen(true);
  };

  // Handle permission assignment
  const handleAssignPermissions = async () => {
    if (!editingRole) return;
    
    try {
      await assignPermissionsMutation.mutateAsync({
        roleId: editingRole.id,
        permissionIds: selectedPermissions,
      });
      toast({
        title: "Success",
        description: "Permissions assigned successfully",
      });
      setPermissionsDialogOpen(false);
      setEditingRole(null);
      setSelectedPermissions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign permissions",
        variant: "destructive",
      });
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              Error loading roles: {error.message}
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
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        {userPermissions.canCreateRoles() && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-gradient-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role that can be assigned to users.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateRole)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., admin, editor, viewer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Administrator, Content Editor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what this role can do..." {...field} />
                      </FormControl>
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
                          Role can be assigned to users
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
                  <Button type="submit" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Role
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
                placeholder="Search roles..."
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

      {/* Roles Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">All Roles</CardTitle>
          <CardDescription>Manage roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Permissions</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-muted-foreground">Loading roles...</div>
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Shield className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{role.display_name}</div>
                            <div className="text-sm text-muted-foreground">{role.name}</div>
                            {role.description && (
                              <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission.id} variant="secondary" className="text-xs">
                              {permission.display_name}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={role.is_active}
                            onCheckedChange={() => toggleRoleStatus(role)}
                            disabled={updateRoleMutation.isPending}
                          />
                          <Badge 
                            variant={role.is_active ? "default" : "secondary"}
                            className={role.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}
                          >
                            {role.is_active ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                            {role.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(role.created_at).toLocaleDateString()}
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
                            {userPermissions.canEditRoles() && (
                              <DropdownMenuItem 
                                className="hover:bg-muted cursor-pointer"
                                onClick={() => openEditDialog(role)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                            )}
                            {userPermissions.canManageRolePermissions() && (
                              <DropdownMenuItem 
                                className="hover:bg-muted cursor-pointer"
                                onClick={() => openPermissionsDialog(role)}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                            )}
                            {(userPermissions.canEditRoles() || userPermissions.canManageRolePermissions() || userPermissions.canDeleteRoles()) && <DropdownMenuSeparator />}
                            {userPermissions.canDeleteRoles() && (
                              <DropdownMenuItem 
                                className="hover:bg-muted cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => handleDeleteRole(role)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Role
                              </DropdownMenuItem>
                            )}
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and settings.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditRole)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., admin, editor, viewer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Administrator, Content Editor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this role can do..." {...field} />
                    </FormControl>
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
                        Role can be assigned to users
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
                <Button type="submit" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Assignment Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Assign permissions to the role "{editingRole?.display_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <div key={resource} className="space-y-3">
                <h4 className="font-medium text-foreground capitalize">{resource} Permissions</h4>
                <div className="grid grid-cols-1 gap-3">
                  {resourcePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.display_name}
                      </label>
                      {permission.description && (
                        <span className="text-xs text-muted-foreground">
                          - {permission.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions} disabled={assignPermissionsMutation.isPending}>
              {assignPermissionsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{roles.length}</div>
            <p className="text-xs text-accent">All defined roles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {roles.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-accent">Currently assignable</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{permissions.length}</div>
            <p className="text-xs text-accent">Available permissions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}