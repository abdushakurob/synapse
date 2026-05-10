import { createFileRoute } from '@tanstack/react-router'
import { AgentDashboard } from '@/components/synapse/AgentDashboard'

export const Route = createFileRoute('/agent-b')({
  component: AgentB,
})

function AgentB() {
  return <AgentDashboard firmName="Meridian Trading" wsPort={3002} accentColor="#10b981" />
}
