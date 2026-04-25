import { permanentRedirect } from 'next/navigation';

export default function UserAgreementRedirectPage() {
  permanentRedirect('/terms');
}
