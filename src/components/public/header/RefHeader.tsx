import { listPublicResearchGroups } from '@/server/public/queries/researchPublic';
import { RefHeaderTop } from '@/components/public/header/RefHeaderTop';
import { RefNavbar } from '@/components/public/header/RefNavbar';
import { RefMobileMenu } from '@/components/public/header/RefMobileMenu';

export async function RefHeader() {
  const researchGroups = await listPublicResearchGroups();

  return (
    <header className="sticky top-0 z-50 flex flex-col bg-white">
      <RefHeaderTop />
      <RefNavbar researchGroups={researchGroups} />
      <RefMobileMenu researchGroups={researchGroups} />
    </header>
  );
}
