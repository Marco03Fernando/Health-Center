import { useState } from 'react';
import { useUserApp } from '@/contexts/UserAppContext';
import { mockProducts } from '@/data/mock';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
const categories = [
    { label: 'All', value: 'all' },
    { label: 'OTC', value: 'otc' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Vitamins', value: 'vitamins' },
    { label: 'Devices', value: 'devices' },
    { label: 'Personal Care', value: 'personal_care' },
];
const MarketplacePage = () => {
    const { addToCart } = useUserApp();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const filtered = mockProducts.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'all' || p.category === category;
        return matchSearch && matchCat;
    });
    return (<div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pharmacy</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse medicines and health products</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <Input placeholder="Search medicines..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(c => (<Button key={c.value} variant={category === c.value ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c.value)} className="shrink-0">
            {c.label}
          </Button>))}
      </div>

      {filtered.length === 0 ? (<div className="text-center py-12 text-muted-foreground">No products found.</div>) : (<div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(p => (<ProductCard key={p.id} product={p} onAddToCart={(product) => { addToCart(product); toast.success(`${product.name} added to cart`); }}/>))}
        </div>)}
    </div>);
};
export default MarketplacePage;
