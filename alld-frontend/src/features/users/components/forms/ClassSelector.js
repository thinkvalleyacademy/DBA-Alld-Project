// Ensure consistent usage of ClassSelector across the codebase.
function ClassSelector({ classes, selectedClass, onChange }) {
    return (
      <select value={selectedClass} onChange={onChange} className="border rounded px-3 py-1">
        <option value="">Select Class</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.className}
          </option>
        ))}
      </select>
    );
  }
  export default ClassSelector;
