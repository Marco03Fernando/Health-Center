import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Star, Building2, Phone, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
export default function CentersPage() {
    const [centersList, setCentersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [search, setSearch] = useState("");
    const [newCenter, setNewCenter] = useState({
        name: "",
        address: "",
        district: "",
        phone: "",
    });
    const loadCenters = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/centers/admin/all", { method: "GET" });
            setCentersList(Array.isArray(res?.data) ? res.data : []);
        }
        catch (error) {
            alert(error?.message || "Failed to load centers");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadCenters();
    }, []);
    const handleAdd = async () => {
        if (!newCenter.name.trim()) {
            alert("Center name is required");
            return;
        }
        try {
            setSubmitting(true);
            const res = await apiFetch("/centers/admin", {
                method: "POST",
                body: JSON.stringify({
                    name: newCenter.name,
                    address: newCenter.address,
                    district: newCenter.district,
                    phone: newCenter.phone,
                }),
            });
            const created = res?.data;
            if (created) {
                setCentersList((prev) => [created, ...prev]);
            }
            setShowAddDialog(false);
            setNewCenter({ name: "", address: "", district: "", phone: "" });
        }
        catch (error) {
            alert(error?.message || "Failed to add center");
        }
        finally {
            setSubmitting(false);
        }
    };
    const toggleActive = async (id) => {
        const previous = [...centersList];
        setCentersList((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c)));
        try {
            const res = await apiFetch(`/centers/admin/${id}/active`, {
                method: "PATCH",
            });
            const updated = res?.data;
            if (updated) {
                setCentersList((prev) => prev.map((c) => (c._id === id ? updated : c)));
            }
        }
        catch (error) {
            setCentersList(previous);
            alert(error?.message || "Failed to update center status");
        }
    };
    const toggleFeatured = async (id) => {
        const previous = [...centersList];
        setCentersList((prev) => prev.map((c) => (c._id === id ? { ...c, isFeatured: !c.isFeatured } : c)));
        try {
            const res = await apiFetch(`/centers/admin/${id}/featured`, {
                method: "PATCH",
            });
            const updated = res?.data;
            if (updated) {
                setCentersList((prev) => prev.map((c) => (c._id === id ? updated : c)));
            }
        }
        catch (error) {
            setCentersList(previous);
            alert(error?.message || "Failed to update center featured status");
        }
    };
    const filteredCenters = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q)
            return centersList;
        return centersList.filter((center) => {
            const locationText = `${center.address || ""} ${center.district || ""}`.toLowerCase();
            return (center.name?.toLowerCase().includes(q) ||
                locationText.includes(q) ||
                center.phone?.toLowerCase().includes(q));
        });
    }, [centersList, search]);
    const featuredCenters = filteredCenters.filter((c) => c.isFeatured);
    const activeCount = centersList.filter((c) => c.isActive).length;
    const featuredCount = centersList.filter((c) => c.isFeatured).length;
    const getLocationText = (center) => {
        if (center.address && center.district)
            return `${center.address}, ${center.district}`;
        if (center.address)
            return center.address;
        if (center.district)
            return center.district;
        return "Location not available";
    };
    const CenterCard = ({ center }) => (<Card className="group h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground"/>
              </div>

              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base font-semibold leading-tight">
                  <span className="truncate">{center.name}</span>
                  {center.isFeatured && (<Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-500"/>)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Healthcare Center
                </p>
              </div>
            </div>
          </div>

          <Badge variant={center.isActive ? "default" : "secondary"} className="rounded-full px-3 py-1 text-[11px]">
            {center.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0"/>
            <span className="leading-5">{getLocationText(center)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0"/>
            <span>{center.phone?.trim() ? center.phone : "Phone not available"}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-3">
            <div className="pr-3">
              <p className="text-xs font-medium text-foreground">Active</p>
              <p className="text-[11px] text-muted-foreground">Visibility status</p>
            </div>
            <Switch checked={center.isActive} onCheckedChange={() => toggleActive(center._id)}/>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-3">
            <div className="pr-3">
              <p className="text-xs font-medium text-foreground">Featured</p>
              <p className="text-[11px] text-muted-foreground">Homepage priority</p>
            </div>
            <Switch checked={center.isFeatured} onCheckedChange={() => toggleFeatured(center._id)}/>
          </div>
        </div>
      </CardContent>
    </Card>);
    return (<div className="space-y-8 p-1 md:p-2">
      <div className="rounded-3xl border bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5"/>
              Center Management
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Centers</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Manage healthcare centers, control visibility, and highlight featured locations
                with a cleaner and more professional admin view.
              </p>
            </div>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-11 rounded-xl px-5 shadow-sm">
                <Plus className="mr-2 h-4 w-4"/>
                Add Center
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px] rounded-2xl">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl">Add New Center</DialogTitle>
                <DialogDescription>
                  Enter the center details below to create a new healthcare center.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Center Name</Label>
                  <Input id="name" value={newCenter.name} onChange={(e) => setNewCenter((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter center name" className="h-11 rounded-xl"/>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={newCenter.address} onChange={(e) => setNewCenter((prev) => ({ ...prev, address: e.target.value }))} placeholder="Enter address" className="h-11 rounded-xl"/>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="district">District</Label>
                    <Input id="district" value={newCenter.district} onChange={(e) => setNewCenter((prev) => ({ ...prev, district: e.target.value }))} placeholder="Enter district" className="h-11 rounded-xl"/>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={newCenter.phone} onChange={(e) => setNewCenter((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" className="h-11 rounded-xl"/>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleAdd} disabled={submitting} className="h-11 rounded-xl px-6">
                    {submitting ? "Adding..." : "Add Center"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Centers</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : centersList.length}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Active Centers</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Featured Centers</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "--" : featuredCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border shadow-sm">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Center Directory</h2>
              <p className="text-sm text-muted-foreground">
                Browse, search, and manage all available centers.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder="Search by center name, district, address, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl pl-10"/>
            </div>
          </div>

          <Tabs defaultValue="all" className="mt-6">
            <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">
                All Centers
              </TabsTrigger>
              <TabsTrigger value="featured" className="rounded-lg">
                Featured
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {loading ? (<div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Loading centers...
                </div>) : filteredCenters.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
                  <p className="text-sm font-medium">No centers found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try changing the search term or add a new center.
                  </p>
                </div>) : (<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCenters.map((c) => (<CenterCard key={c._id} center={c}/>))}
                </div>)}
            </TabsContent>

            <TabsContent value="featured" className="mt-6">
              {loading ? (<div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Loading centers...
                </div>) : featuredCenters.length === 0 ? (<div className="rounded-2xl border border-dashed p-10 text-center">
                  <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/>
                  <p className="text-sm font-medium">No featured centers found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mark a center as featured to show it here.
                  </p>
                </div>) : (<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {featuredCenters.map((c) => (<CenterCard key={c._id} center={c}/>))}
                </div>)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);
}
