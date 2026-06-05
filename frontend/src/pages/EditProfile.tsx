import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, MapPin, Plus, Trash2, Edit2, Camera, ArrowLeft, Check, Home, Briefcase, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { handleError } from "@/lib/errorHandler";

interface UserAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });
  
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
      });
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const data = await api.auth.getAddresses();
      if (Array.isArray(data)) {
        setAddresses(data);
      } else if (data && Array.isArray((data as any).data)) {
        setAddresses((data as any).data);
      } else if (data && Array.isArray((data as any).addresses)) {
        setAddresses((data as any).addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      handleError(error, 'api');
      setAddresses([]);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to edit your profile.</p>
            <Link to="/login">
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const avatarUrl = await api.auth.uploadAvatar(file);
      await api.auth.updateProfile({ avatar: avatarUrl });
      await refreshUser();
      toast({ title: "Profile photo updated" });
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await api.auth.updateProfile({
        name: form.name,
        phone: form.phone || undefined,
      });
      await refreshUser();
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast({ title: "Please fill all address fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (editingAddress) {
        await api.auth.updateAddress(editingAddress.id, addressForm);
        toast({ title: "Address updated" });
      } else {
        await api.auth.addAddress(addressForm);
        toast({ title: "Address added" });
      }
      await loadAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({ label: "Home", address: "", city: "", state: "", pincode: "" });
    } catch (error) {
      toast({ title: "Failed to save address", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.auth.deleteAddress(id);
      await loadAddresses();
      toast({ title: "Address removed" });
    } catch (error) {
      toast({ title: "Failed to delete address", variant: "destructive" });
    }
  };

  const getLabelIcon = (label: string) => {
    if (label === "Home") return <Home className="w-4 h-4" />;
    if (label === "Office") return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-gold/30">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">Click to change photo</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">Personal Information</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <Input
                  value={user.email}
                  disabled
                  className="bg-muted/50"
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </div>

          {/* Saved Addresses */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Saved Addresses
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddressForm(true);
                  setEditingAddress(null);
                  setAddressForm({ label: "Home", address: "", city: "", state: "", pincode: "" });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {(!Array.isArray(addresses) || addresses.length === 0) && !showAddressForm ? (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No addresses saved yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(addresses) && addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getLabelIcon(addr.label)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{addr.label}</p>
                        <p className="text-sm text-muted-foreground">{addr.address}</p>
                        <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditAddress(addr)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAddress(addr.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Address Form */}
            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="mt-4 p-4 rounded-xl border border-border space-y-4">
                <h3 className="font-medium text-foreground">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Address Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Full Address</label>
                  <textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    placeholder="Street address, area, landmark"
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">City</label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">State</label>
                    <Input
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Pincode</label>
                  <Input
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Address"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;
