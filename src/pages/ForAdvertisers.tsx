import { AudienceLandingPage } from '../components/AudienceLandingPage'
import { AUDIENCE_LANDINGS } from '../lib/audienceLanding'

export function ForAdvertisers() {
  return <AudienceLandingPage config={AUDIENCE_LANDINGS.advertisers} />
}
