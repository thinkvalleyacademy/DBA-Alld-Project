import PageWrapper from "../../../utility/PageWrapper";
import MemberSearch from "../../../components/MemberSearch";

const GeneralMemberSearch = () => {
  return (
    <PageWrapper>
      <MemberSearch type={1} title="Search General Members" />
    </PageWrapper>
  );
};

export default GeneralMemberSearch;
