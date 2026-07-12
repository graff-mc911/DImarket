import { AudienceLandingPage } from '../components/AudienceLandingPage'
import { AUDIENCE_LANDINGS } from '../lib/audienceLanding'

export function ForCompanies() {
  return <AudienceLandingPage config={AUDIENCE_LANDINGS.companies} />
}
