export const getGuardianLabel = (memberDetails = {}) => {
  const gender = String(memberDetails?.gender || "").trim().toLowerCase();
  const relation = String(memberDetails?.relation || "").trim().toLowerCase();

  if (relation.includes('husband')) return 'Husband Name';
  if (relation.includes('wife')) return 'Wife Name';
  if (relation.includes('father')) return 'Father Name';

  if (gender === 'female' || gender === 'f') return 'Husband Name';
  if (gender === 'male' || gender === 'm') return 'Father Name';

  return 'Father/Husband Name';
};
