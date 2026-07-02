import { Construction } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'

interface PlaceholderPageProps {
  title?: string
  description?: string
}

function formatSection(section?: string) {
  if (!section) return 'Module'
  return section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { section } = useParams()
  const pageTitle = title ?? formatSection(section)

  return (
    <DashboardLayout title={pageTitle}>
      <Card
        padding="lg"
        className="flex min-h-[50vh] flex-col items-center justify-center border-dashed text-center sm:min-h-[60vh]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Construction className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{pageTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {description ??
            'This module is coming soon. We are building it step by step as part of the ERP rollout.'}
        </p>
      </Card>
    </DashboardLayout>
  )
}
