const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RssItem {
  title: string;
  link: string;
  content: string;
  description?: string;
  published?: string;
  category?: string;
}

export interface RssFeed {
  id?: number;
  name: string;
  url: string;
  category?: string;
  active: boolean;
  fetch_interval?: number;
  last_fetched?: string;
  last_error?: string;
  error_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CronJob {
  id?: number;
  name: string;
  schedule: string;
  active: boolean;
  last_run?: string;
  next_run?: string;
  run_count?: number;
  error_count?: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

// RSS Items API
export async function fetchRssFromBackend(rssUrl: string): Promise<RssItem[]> {
  const apiUrl = `${API_BASE_URL}/api/v1/rss/rss?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error("Failed to fetch RSS feed");
  }
  return res.json();
}

export async function fetchAllRssItems(): Promise<RssItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/items`);
  if (!res.ok) {
    throw new Error("Failed to fetch RSS items");
  }
  return res.json();
}

export async function fetchRssFeedItems(feedId: number): Promise<RssItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feed/${feedId}/items`);
  if (!res.ok) {
    throw new Error("Failed to fetch RSS feed items");
  }
  return res.json();
}

// RSS Feeds Management API
export async function fetchRssFeeds(): Promise<RssFeed[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feeds`);
  if (!res.ok) {
    throw new Error("Failed to fetch RSS feeds");
  }
  return res.json();
}

export async function createRssFeed(feed: Omit<RssFeed, 'id'>): Promise<RssFeed> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feeds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feed),
  });
  if (!res.ok) {
    throw new Error("Failed to create RSS feed");
  }
  return res.json();
}

export async function updateRssFeed(feedId: number, feed: RssFeed): Promise<RssFeed> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feeds/${feedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feed),
  });
  if (!res.ok) {
    throw new Error("Failed to update RSS feed");
  }
  return res.json();
}

export async function deleteRssFeed(feedId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feeds/${feedId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error("Failed to delete RSS feed");
  }
}

export async function fetchRssFeedImmediately(feedId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/feeds/${feedId}/fetch`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error("Failed to trigger RSS feed fetch");
  }
}

// Cron Jobs API
export async function fetchCronJobs(): Promise<CronJob[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/cron-jobs`);
  if (!res.ok) {
    throw new Error("Failed to fetch cron jobs");
  }
  return res.json();
}

export async function createCronJob(job: Omit<CronJob, 'id'>): Promise<CronJob> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/cron-jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    throw new Error("Failed to create cron job");
  }
  return res.json();
}

export async function updateCronJob(jobId: number, job: Partial<CronJob>): Promise<CronJob> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/cron-jobs/${jobId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    throw new Error("Failed to update cron job");
  }
  return res.json();
}

export async function deleteCronJob(jobId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/cron-jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error("Failed to delete cron job");
  }
}

export async function triggerImmediateFetch(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/cron-jobs/trigger-fetch`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error("Failed to trigger immediate fetch");
  }
  return res.json();
}

export async function getSchedulerStatus(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/rss/scheduler/status`);
  if (!res.ok) {
    throw new Error("Failed to get scheduler status");
  }
  return res.json();
}
