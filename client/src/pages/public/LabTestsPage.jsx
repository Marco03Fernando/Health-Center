import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchLabTests } from "@/services/public.service";
import {
  FlaskConical,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";

const LabTestCard = ({ test }) => (
  <div className="card-healthcare flex flex-col gap-4">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <FlaskConical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground leading-tight">{test.name}</h3>
        {test.testCode && (
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
            {test.testCode}
          </span>
        )}
      </div>
      {test.price != null && (
        <span className="shrink-0 text-lg font-bold text-foreground">
          LKR {test.price}
        </span>
      )}
    </div>

    {test.description && (
      <p className="text-sm text-muted-foreground">{test.description}</p>
    )}

    <div className="flex flex-wrap gap-2 text-xs">
      {test.category && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
          <Tag className="h-3 w-3" /> {test.category}
        </span>
      )}
      {test.sampleTypes && (
        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
          Sample: {test.sampleTypes}
        </span>
      )}
    </div>

    {test.instructions && (
      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        <span className="font-medium text-foreground">Instructions: </span>
        {test.instructions}
      </p>
    )}

    <Button size="sm" className="mt-auto self-start" asChild>
      <Link to="/user">
        Book Test <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </Button>
  </div>
);

const LabTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLabTests();
      const items = data.data ?? [];
      setTests(items);

      // Derive unique categories from results
      const cats = ["All", ...new Set(items.map((t) => t.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tests.filter((t) => {
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.testCode?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="section-padding">
      <div className="section-container">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Lab <span className="text-gradient">Tests</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Accurate diagnostics with fast, digitally-delivered results.
          </p>
        </div>

        {/* Search */}
        <div className="mt-10 relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test name, code, or description..."
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* CTA banner */}
        <div className="mt-8 rounded-2xl bg-accent/50 border border-border px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground font-medium">
            Results delivered digitally · Same-day processing available
          </p>
          <Button size="sm" asChild>
            <Link to="/user">Book via Patient Portal</Link>
          </Button>
        </div>

        {/* Results */}
        <div className="mt-10">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium text-foreground">Failed to load lab tests</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={load} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-24 text-center text-muted-foreground">
              No tests match your search.
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing {filtered.length} test{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t) => (
                  <LabTestCard key={t._id} test={t} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabTestsPage;
