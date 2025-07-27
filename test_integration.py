#!/usr/bin/env python3
"""
Test script to verify backend-frontend integration with database and cron job functionality
"""
import requests
import json
import time

API_BASE_URL = "http://localhost:8000"


def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure FastAPI server is running on port 8000")
        return False


def test_database_setup():
    """Test if database is set up correctly"""
    print("\n🗄️  Testing database setup...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/feeds")
        if response.status_code == 200:
            print("✅ Database connection successful")
            return True
        else:
            print(f"❌ Database connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False


def create_sample_feeds():
    """Create sample RSS feeds for testing"""
    sample_feeds = [
        {
            "name": "BBC News",
            "url": "http://feeds.bbci.co.uk/news/rss.xml",
            "category": "World",
            "active": True,
            "fetch_interval": 3600,
        },
        {
            "name": "TechCrunch",
            "url": "https://techcrunch.com/feed/",
            "category": "Technology",
            "active": True,
            "fetch_interval": 7200,
        },
        {
            "name": "Reuters Business",
            "url": "https://feeds.reuters.com/reuters/businessNews",
            "category": "Business",
            "active": True,
            "fetch_interval": 1800,
        },
    ]

    print("\n🔧 Creating sample RSS feeds...")
    created_feeds = []

    for feed in sample_feeds:
        try:
            response = requests.post(f"{API_BASE_URL}/api/v1/rss/feeds", json=feed)
            if response.status_code == 200:
                created_feed = response.json()
                created_feeds.append(created_feed)
                print(f"✅ Created feed: {feed['name']} (ID: {created_feed['id']})")
            else:
                error_detail = response.json().get("detail", "Unknown error")
                if "already exists" in error_detail:
                    print(f"⚠️  Feed {feed['name']} already exists")
                else:
                    print(f"❌ Feed creation failed for {feed['name']}: {error_detail}")
        except Exception as e:
            print(f"❌ Error creating feed {feed['name']}: {e}")

    return created_feeds


def test_rss_endpoints():
    """Test RSS API endpoints"""
    print("\n🧪 Testing RSS API endpoints...")

    # Test getting all feeds
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/feeds")
        if response.status_code == 200:
            feeds = response.json()
            print(f"✅ Retrieved {len(feeds)} RSS feeds from database")

            # Show feed details
            for feed in feeds:
                status = "Active" if feed["active"] else "Inactive"
                interval = feed.get("fetch_interval", 3600)
                print(f"  - {feed['name']}: {status}, {interval}s interval")

            return feeds
        else:
            print(f"❌ Failed to get feeds: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting feeds: {e}")
        return []


def test_cron_jobs():
    """Test cron job functionality"""
    print("\n⏰ Testing cron job functionality...")

    # Get existing cron jobs
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/cron-jobs")
        if response.status_code == 200:
            jobs = response.json()
            print(f"✅ Retrieved {len(jobs)} cron jobs")

            for job in jobs:
                status = "Active" if job["active"] else "Inactive"
                run_count = job.get("run_count", 0)
                print(f"  - {job['name']}: {status}, Schedule: {job['schedule']}, Runs: {run_count}")

            return jobs
        else:
            print(f"❌ Failed to get cron jobs: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting cron jobs: {e}")
        return []


def test_scheduler_status():
    """Test scheduler status"""
    print("\n🔧 Testing scheduler status...")

    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/scheduler/status")
        if response.status_code == 200:
            status = response.json()
            scheduler_running = status.get("running", False)
            total_jobs = status.get("total_jobs", 0)

            print(f"✅ Scheduler Status: {'Running' if scheduler_running else 'Stopped'}")
            print(f"✅ Total Scheduled Jobs: {total_jobs}")

            if status.get("jobs"):
                print("📋 Active Jobs:")
                for job in status["jobs"]:
                    next_run = job.get("next_run", "Not scheduled")
                    if next_run != "Not scheduled":
                        next_run = f"Next: {next_run}"
                    print(f"  - {job.get('name', 'Unknown')}: {next_run}")

            return status
        else:
            print(f"❌ Failed to get scheduler status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting scheduler status: {e}")
        return None


def test_immediate_fetch(feeds):
    """Test immediate RSS fetch functionality"""
    if not feeds:
        print("⚠️  No feeds to test immediate fetch")
        return

    print("\n🚀 Testing immediate RSS fetch...")

    # Test fetch for first feed
    first_feed = feeds[0]
    try:
        response = requests.post(f"{API_BASE_URL}/api/v1/rss/feeds/{first_feed['id']}/fetch")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Immediate fetch triggered for {first_feed['name']}")
            print(f"  Message: {result.get('message', 'No message')}")
        else:
            print(f"❌ Failed to trigger immediate fetch: {response.status_code}")
    except Exception as e:
        print(f"❌ Error triggering immediate fetch: {e}")


def test_rss_items():
    """Test fetching RSS items from database"""
    print("\n📰 Testing RSS articles retrieval...")

    # Test getting all articles
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/articles?limit=10")
        if response.status_code == 200:
            articles = response.json()
            print(f"✅ Retrieved {len(articles)} articles from database")

            if articles:
                print("📋 Recent Articles:")
                for article in articles[:3]:  # Show first 3
                    title = (
                        article.get("title", "No title")[:50] + "..."
                        if len(article.get("title", "")) > 50
                        else article.get("title", "No title")
                    )
                    published = article.get("published", "No date")
                    print(f"  - {title} ({published})")
        else:
            print(f"❌ Failed to get articles: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting articles: {e}")

    # Test legacy endpoint for compatibility
    try:
        response = requests.get(f"{API_BASE_URL}/api/v1/rss/items")
        if response.status_code == 200:
            items = response.json()
            print(f"✅ Legacy endpoint works: {len(items)} items")
        else:
            print(f"⚠️  Legacy endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Legacy endpoint error: {e}")


def trigger_global_fetch():
    """Test global RSS fetch trigger"""
    print("\n🌐 Testing global RSS fetch...")

    try:
        response = requests.post(f"{API_BASE_URL}/api/v1/rss/cron-jobs/trigger-fetch")
        if response.status_code == 200:
            result = response.json()
            total_feeds = result.get("total_feeds", 0)
            successful_feeds = result.get("successful_feeds", 0)
            total_articles = result.get("total_articles", 0)

            print(f"✅ Global fetch completed:")
            print(f"  - Processed {successful_feeds}/{total_feeds} feeds")
            print(f"  - Fetched {total_articles} articles")

            if result.get("errors"):
                print(f"  - {len(result['errors'])} errors occurred")
                for error in result["errors"][:3]:  # Show first 3 errors
                    print(f"    • {error}")
        else:
            print(f"❌ Failed to trigger global fetch: {response.status_code}")
    except Exception as e:
        print(f"❌ Error triggering global fetch: {e}")


def main():
    """Main test function"""
    print("🚀 Testing Enhanced RSS News Portal with Database & Cron Jobs")
    print("=" * 70)

    # Test backend health
    if not test_backend_health():
        print("\n💡 To start the backend, run:")
        print("cd fastapi-optimized-project")
        print("conda create -n news-portal python=3.12")
        print("conda activate news-portal")
        print("pip install -r requirements.txt")
        print("python run.py")
        return

    # Test database setup
    if not test_database_setup():
        print("\n❌ Database setup failed - check backend logs")
        return

    # Test RSS endpoints
    feeds = test_rss_endpoints()

    # Create sample feeds if none exist
    if not feeds:
        created_feeds = create_sample_feeds()
        time.sleep(2)  # Wait for background tasks
        feeds = test_rss_endpoints()

    # Test cron job functionality
    cron_jobs = test_cron_jobs()

    # Test scheduler status
    scheduler_status = test_scheduler_status()

    # Test immediate fetch
    if feeds:
        test_immediate_fetch(feeds)
        time.sleep(3)  # Wait for fetch to complete

    # Test RSS items retrieval
    test_rss_items()

    # Test global fetch trigger
    trigger_global_fetch()

    print("\n🎉 Enhanced Integration Test Completed!")
    print("\n📊 Summary:")
    print(f"  - RSS Feeds: {len(feeds)} configured")
    print(f"  - Cron Jobs: {len(cron_jobs)} configured")
    print(f"  - Scheduler: {'Running' if scheduler_status and scheduler_status.get('running') else 'Stopped'}")

    print("\n💡 Next steps:")
    print("1. Start the frontend: cd frontend && npm run dev")
    print("2. Visit http://localhost:3000")
    print("3. Navigate to Settings to manage RSS feeds and cron jobs")
    print("4. Check the news page to see fetched RSS content")
    print("5. Monitor the Status tab for scheduler information")


if __name__ == "__main__":
    main()
