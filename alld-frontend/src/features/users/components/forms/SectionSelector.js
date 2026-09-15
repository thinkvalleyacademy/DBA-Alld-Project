// Ensure consistent usage of SectionSelector across the codebase.
function SectionSelector({ sections, selectedSection, onChange }) {
    return (
      <select value={selectedSection} onChange={onChange} className="border rounded px-3 py-1">
        <option value="">Select Section</option>
        {sections.map((sec) => (
          <option key={sec.id} value={sec.sectionName}>
            {sec.sectionName}
          </option>
        ))}
      </select>
    );
  }
  export default SectionSelector;
