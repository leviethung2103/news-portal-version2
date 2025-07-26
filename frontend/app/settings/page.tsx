"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import AuthWrapper from "@/components/auth-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Trash2, Edit, Plus, Settings, Rss, Clock, Play, RefreshCw, AlertCircle, Timer } from "lucide-react"
import { NewsProvider } from "@/components/news-provider"
import { 
  fetchRssFeeds, 
  createRssFeed, 
  updateRssFeed, 
  deleteRssFeed, 
  fetchRssFeedImmediately,
  fetchCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  triggerImmediateFetch,
  getSchedulerStatus,
  RssFeed,
  CronJob 
} from "@/lib/fetchRss"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRssFeedDialogOpen, setIsRssFeedDialogOpen] = useState(false)
  const [isCronJobDialogOpen, setIsCronJobDialogOpen] = useState(false)
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null)
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)
  const [feedFormData, setFeedFormData] = useState({
    name: "",
    url: "",
    category: "General",
    active: true,
    fetch_interval: 3600
  })
  const [jobFormData, setJobFormData] = useState({
    name: "",
    schedule: "0 * * * *",
    active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadFeeds(),
        loadCronJobs(),
        loadSchedulerStatus()
      ])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data. Make sure the backend server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFeeds = async () => {
    try {
      const fetchedFeeds = await fetchRssFeeds()
      setFeeds(fetchedFeeds)
    } catch (error) {
      console.error("Failed to load RSS feeds:", error)
    }
  }

  const loadCronJobs = async () => {
    try {
      const fetchedJobs = await fetchCronJobs()
      setCronJobs(fetchedJobs)
    } catch (error) {
      console.error("Failed to load cron jobs:", error)
    }
  }

  const loadSchedulerStatus = async () => {
    try {
      const status = await getSchedulerStatus()
      setSchedulerStatus(status)
    } catch (error) {
      console.error("Failed to load scheduler status:", error)
    }
  }

  // RSS Feed Handlers
  const handleRssFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingFeed) {
        const updatedFeed = await updateRssFeed(editingFeed.id!, { ...feedFormData, id: editingFeed.id })
        setFeeds(feeds.map(feed => feed.id === editingFeed.id ? updatedFeed : feed))
        toast({
          title: "Success",
          description: "RSS feed updated successfully",
        })
      } else {
        const newFeed = await createRssFeed(feedFormData)
        setFeeds([...feeds, newFeed])
        toast({
          title: "Success",
          description: "RSS feed created and fetch initiated",
        })
      }
      
      setIsRssFeedDialogOpen(false)
      setEditingFeed(null)
      setFeedFormData({ name: "", url: "", category: "General", active: true, fetch_interval: 3600 })
    } catch (error) {
      toast({
        title: "Error",
        description: editingFeed ? "Failed to update RSS feed" : "Failed to create RSS feed",
        variant: "destructive",
      })
    }
  }

  const handleRssFeedEdit = (feed: RssFeed) => {
    setEditingFeed(feed)
    setFeedFormData({
      name: feed.name,
      url: feed.url,
      category: feed.category || "General",
      active: feed.active,
      fetch_interval: feed.fetch_interval || 3600
    })
    setIsRssFeedDialogOpen(true)
  }

  const handleRssFeedDelete = async (feedId: number) => {
    try {
      await deleteRssFeed(feedId)
      setFeeds(feeds.filter(feed => feed.id !== feedId))
      toast({
        title: "Success",
        description: "RSS feed deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete RSS feed",
        variant: "destructive",
      })
    }
  }

  const handleRssFeedFetch = async (feedId: number) => {
    try {
      await fetchRssFeedImmediately(feedId)
      toast({
        title: "Success",
        description: "RSS feed fetch initiated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger RSS feed fetch",
        variant: "destructive",
      })
    }
  }

  // Cron Job Handlers
  const handleCronJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingJob) {
        const updatedJob = await updateCronJob(editingJob.id!, jobFormData)
        setCronJobs(cronJobs.map(job => job.id === editingJob.id ? updatedJob : job))
        toast({
          title: "Success",
          description: "Cron job updated successfully",
        })
      } else {
        const newJob = await createCronJob(jobFormData)
        setCronJobs([...cronJobs, newJob])
        toast({
          title: "Success",
          description: "Cron job created successfully",
        })
      }
      
      setIsCronJobDialogOpen(false)
      setEditingJob(null)
      setJobFormData({ name: "", schedule: "0 * * * *", active: true })
      await loadSchedulerStatus()
    } catch (error) {
      toast({
        title: "Error",
        description: editingJob ? "Failed to update cron job" : "Failed to create cron job",
        variant: "destructive",
      })
    }
  }

  const handleCronJobEdit = (job: CronJob) => {
    setEditingJob(job)
    setJobFormData({
      name: job.name,
      schedule: job.schedule,
      active: job.active
    })
    setIsCronJobDialogOpen(true)
  }

  const handleCronJobDelete = async (jobId: number) => {
    try {
      await deleteCronJob(jobId)
      setCronJobs(cronJobs.filter(job => job.id !== jobId))
      toast({
        title: "Success",
        description: "Cron job deleted successfully",
      })
      await loadSchedulerStatus()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cron job",
        variant: "destructive",
      })
    }
  }

  const handleTriggerFetch = async () => {
    try {
      const result = await triggerImmediateFetch()
      toast({
        title: "Success",
        description: `Fetched ${result.total_articles} articles from ${result.successful_feeds} feeds`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger immediate fetch",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = (type: 'feed' | 'job') => {
    if (type === 'feed') {
      setIsRssFeedDialogOpen(false)
      setEditingFeed(null)
      setFeedFormData({ name: "", url: "", category: "General", active: true, fetch_interval: 3600 })
    } else {
      setIsCronJobDialogOpen(false)
      setEditingJob(null)
      setJobFormData({ name: "", schedule: "0 * * * *", active: true })
    }
  }

  const categories = ["General", "Politics"]
  const cronPresets = [
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every 30 minutes", value: "*/30 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 2 hours", value: "0 */2 * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
  ]

  const fetchIntervals = [
    { label: "15 minutes", value: 900 },
    { label: "30 minutes", value: 1800 },
    { label: "1 hour", value: 3600 },
    { label: "2 hours", value: 7200 },
    { label: "6 hours", value: 21600 },
    { label: "12 hours", value: 43200 },
    { label: "24 hours", value: 86400 }
  ]

  if (loading) {
    return (
      <AuthWrapper requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen bg-background">
        <NewsProvider>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-6 w-6" />
                <h1 className="text-3xl font-bold">Settings</h1>
              </div>

      <Tabs defaultValue="feeds" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="feeds" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">RSS </span>Feeds
          </TabsTrigger>
          <TabsTrigger value="cron" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Cron </span>Jobs
          </TabsTrigger>
          <TabsTrigger value="status" className="text-xs sm:text-sm">Status</TabsTrigger>
        </TabsList>

        {/* RSS Feeds Tab */}
        <TabsContent value="feeds">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  <CardTitle>RSS Feed Management</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleTriggerFetch} variant="outline" className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Fetch </span>All
                  </Button>
                  <Dialog open={isRssFeedDialogOpen} onOpenChange={setIsRssFeedDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsRssFeedDialogOpen(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add </span>RSS Feed
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingFeed ? "Edit RSS Feed" : "Add New RSS Feed"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRssFeedSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Feed Name</Label>
                          <Input
                            id="name"
                            value={feedFormData.name}
                            onChange={(e) => setFeedFormData({ ...feedFormData, name: e.target.value })}
                            placeholder="e.g., BBC News"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="url">RSS URL</Label>
                          <Input
                            id="url"
                            type="url"
                            value={feedFormData.url}
                            onChange={(e) => setFeedFormData({ ...feedFormData, url: e.target.value })}
                            placeholder="https://example.com/rss"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={feedFormData.category} onValueChange={(value) => setFeedFormData({ ...feedFormData, category: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="fetch_interval">Fetch Interval</Label>
                          <Select 
                            value={feedFormData.fetch_interval.toString()} 
                            onValueChange={(value) => setFeedFormData({ ...feedFormData, fetch_interval: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fetch interval" />
                            </SelectTrigger>
                            <SelectContent>
                              {fetchIntervals.map((interval) => (
                                <SelectItem key={interval.value} value={interval.value.toString()}>
                                  {interval.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="active"
                            checked={feedFormData.active}
                            onCheckedChange={(checked) => setFeedFormData({ ...feedFormData, active: checked })}
                          />
                          <Label htmlFor="active">Active</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => handleDialogClose('feed')}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingFeed ? "Update" : "Create"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {feeds.length === 0 ? (
                <div className="text-center py-8">
                  <Rss className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No RSS feeds configured</h3>
                  <p className="text-gray-600 mb-4">Add your first RSS feed to start fetching news content.</p>
                  <Button onClick={() => setIsRssFeedDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add RSS Feed
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {feeds.map((feed) => (
                    <div key={feed.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{feed.name}</h3>
                          <Badge variant={feed.active ? "default" : "secondary"}>
                            {feed.active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{feed.category}</Badge>
                          {feed.error_count && feed.error_count > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {feed.error_count} errors
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">{feed.url}</p>
                        <p className="text-xs text-gray-500">
                          Interval: {fetchIntervals.find(i => i.value === feed.fetch_interval)?.label || `${feed.fetch_interval}s`}
                          {feed.last_fetched && (
                            <span className="block sm:inline sm:ml-2">
                              Last fetched: {new Date(feed.last_fetched).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRssFeedFetch(feed.id!)}
                          className="flex-1 sm:flex-none"
                        >
                          <Play className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Fetch</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRssFeedEdit(feed)}
                          className="flex-1 sm:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRssFeedDelete(feed.id!)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="cron">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle>Cron Job Management</CardTitle>
                </div>
                <Dialog open={isCronJobDialogOpen} onOpenChange={setIsCronJobDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsCronJobDialogOpen(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add </span>Cron Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingJob ? "Edit Cron Job" : "Add New Cron Job"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCronJobSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="job_name">Job Name</Label>
                        <Input
                          id="job_name"
                          value={jobFormData.name}
                          onChange={(e) => setJobFormData({ ...jobFormData, name: e.target.value })}
                          placeholder="e.g., hourly_fetch"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="schedule">Cron Schedule</Label>
                        <Select value={jobFormData.schedule} onValueChange={(value) => setJobFormData({ ...jobFormData, schedule: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule preset" />
                          </SelectTrigger>
                          <SelectContent>
                            {cronPresets.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="mt-2"
                          value={jobFormData.schedule}
                          onChange={(e) => setJobFormData({ ...jobFormData, schedule: e.target.value })}
                          placeholder="0 * * * * (cron expression)"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: minute hour day month day-of-week
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="job_active"
                          checked={jobFormData.active}
                          onCheckedChange={(checked) => setJobFormData({ ...jobFormData, active: checked })}
                        />
                        <Label htmlFor="job_active">Active</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose('job')}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingJob ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {cronJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No cron jobs configured</h3>
                  <p className="text-gray-600 mb-4">Add cron jobs to schedule automatic RSS fetching.</p>
                  <Button onClick={() => setIsCronJobDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cron Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cronJobs.map((job) => (
                    <div key={job.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{job.name}</h3>
                          <Badge variant={job.active ? "default" : "secondary"}>
                            {job.active ? "Active" : "Inactive"}
                          </Badge>
                          {job.error_count && job.error_count > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {job.error_count} errors
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1 font-mono">{job.schedule}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Run count: {job.run_count || 0}</p>
                          {job.last_run && (
                            <p>Last run: {new Date(job.last_run).toLocaleString()}</p>
                          )}
                          {job.next_run && (
                            <p>Next run: {new Date(job.next_run).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCronJobEdit(job)}
                          className="flex-1 sm:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCronJobDelete(job.id!)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    <CardTitle>Scheduler Status</CardTitle>
                  </div>
                  <Button onClick={loadSchedulerStatus} variant="outline" size="sm" className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {schedulerStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <Badge variant={schedulerStatus.running ? "default" : "secondary"}>
                        {schedulerStatus.running ? "Running" : "Stopped"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Total Jobs: </span>
                      {schedulerStatus.total_jobs || 0}
                    </div>
                    {schedulerStatus.jobs && schedulerStatus.jobs.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Active Jobs:</h4>
                        <div className="space-y-2">
                          {schedulerStatus.jobs.map((job: any, index: number) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{job.name}</div>
                              <div className="text-gray-600">
                                Next run: {job.next_run ? new Date(job.next_run).toLocaleString() : 'Not scheduled'}
                              </div>
                              <div className="text-gray-600">Trigger: {job.trigger}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Loading scheduler status...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{feeds.length}</div>
                    <div className="text-sm text-gray-600">Total Feeds</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{feeds.filter(f => f.active).length}</div>
                    <div className="text-sm text-gray-600">Active Feeds</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{cronJobs.length}</div>
                    <div className="text-sm text-gray-600">Cron Jobs</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{cronJobs.filter(j => j.active).length}</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
            </div>
          </main>
        </div>
      </NewsProvider>
    </div>
    </AuthWrapper>
  )
}