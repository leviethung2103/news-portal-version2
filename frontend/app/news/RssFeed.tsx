"use client";
import { useEffect, useState } from "react";
import { fetchRssFromBackend, RssItem } from "@/lib/fetchRss";

const DEFAULT_RSS_URL = "https://vnexpress.net/rss/tin-moi-nhat.rss";

export default function RssFeed() {
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchRssFromBackend(DEFAULT_RSS_URL)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading RSS feed...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">RSS Feed</h3>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li key={idx} className="border p-4 rounded bg-white">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
              {item.title}
            </a>
            <div className="mt-2 text-gray-700 text-sm max-h-40 overflow-y-auto whitespace-pre-line">
              {item.content.slice(0, 500)}{item.content.length > 500 ? "..." : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
