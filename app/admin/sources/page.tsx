import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'News Sources — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

const MOCK_SOURCES = [
  { id: 1, name: 'Reuters Africa', api_url: 'https://api.reuters.com/feed/africa', category: 'General', status: 'active', last_fetched: '2024-04-20 14:32', articles_today: 18 },
  { id: 2, name: 'BBC News API', api_url: 'https://feeds.bbci.co.uk/news', category: 'General', status: 'active', last_fetched: '2024-04-20 14:00', articles_today: 24 },
  { id: 3, name: 'TechCrunch RSS', api_url: 'https://techcrunch.com/feed/', category: 'Tech', status: 'active', last_fetched: '2024-04-20 13:45', articles_today: 9 },
  { id: 4, name: 'Kenya Business Daily', api_url: 'https://businessdailyafrica.com/rss', category: 'Business', status: 'active', last_fetched: '2024-04-20 12:00', articles_today: 7 },
  { id: 5, name: 'Al Jazeera English', api_url: 'https://aljazeera.com/feed', category: 'Politics', status: 'inactive', last_fetched: '2024-04-18 09:00', articles_today: 0 },
  { id: 6, name: 'NASA News', api_url: 'https://api.nasa.gov/news', category: 'Science', status: 'active', last_fetched: '2024-04-20 11:00', articles_today: 3 },
]

export default function AdminSourcesPage() {
  const active = MOCK_SOURCES.filter(s => s.status === 'active').length
  const totalToday = MOCK_SOURCES.reduce((s, src) => s + src.articles_today, 0)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="News Sources" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sources', value: MOCK_SOURCES.length },
            { label: 'Active', value: active },
            { label: 'Inactive', value: MOCK_SOURCES.length - active },
            { label: 'Articles Today', value: totalToday },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">Feed Sources</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              + Add Source
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Source</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">API / Feed URL</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Articles Today</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Last Fetched</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SOURCES.map(src => (
                  <tr key={src.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{src.name}</td>
                    <td className="px-4 py-3">
                      <a href={src.api_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs truncate max-w-[200px] block">
                        {src.api_url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{src.category}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{src.articles_today}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{src.last_fetched}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        src.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {src.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-600 hover:underline font-medium">Fetch Now</button>
                        <button className="text-xs text-gray-500 hover:underline font-medium">Edit</button>
                        <button className="text-xs text-red-500 hover:underline font-medium">
                          {src.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
