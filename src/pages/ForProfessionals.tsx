import { AudienceLandingPage } from '../components/AudienceLandingPage'
import { AUDIENCE_LANDINGS } from '../lib/audienceLanding'

export function ForProfessionals() {
  return <AudienceLandingPage config={AUDIENCE_LANDINGS.professionals} />
}
