import { createFileRoute } from '@tanstack/react-router'
import { AgentDashboard } from '@/components/synapse/AgentDashboard'

export const Route = createFileRoute('/agent-a')({
  component: AgentA,
})

function AgentA() {
  return <AgentDashboard firmName="Apex Capital" wsPort={3001} accentColor="#3b82f6" />
}
