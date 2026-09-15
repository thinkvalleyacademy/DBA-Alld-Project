---
name: form-autofill-optional-upload
description: 'Implement forms with auto-fill from database and optional file uploads with skip checkboxes. Use when: creating update/edit member forms, handling conditional uploads (voter affidavit, BC documents), allowing users to skip file uploads without losing existing data.'
argument-hint: 'Form component name and database table (e.g., "UpdateMemberForm" + "members table")'
user-invocable: true
---

# Form Auto-Fill with Optional Upload & Skip Functionality

This skill guides developers through implementing a complete form pattern that:
- ✅ Auto-fills existing data from the database
- ✅ Handles optional file uploads with skip checkboxes
- ✅ Prevents data override when users don't upload files
- ✅ Manages conditional required fields based on enum selections
- ✅ Maintains form state integrity across conditional logic

## When to Use

**Perfect for:**
- Update/Edit member details pages
- Multi-step registration forms with conditional uploads
- Forms with optional document uploads (voter affidavit, BC documents)
- Cases where existing data should persist if user skips upload

**Real-world example from codebase:**
- Update Member Details (`editdetails.jsx`) - auto-fills and allows selective updates
- Life Member Registration (`LifeMemberRegister.jsx`) - conditionally requires affidavit if voter="yes"
- Welfare Member Registration (`WelfareMemRegister.jsx`) - similar conditional upload logic

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Form Component                          │
├─────────────────────────────────────────────────┤
│  • formData state                               │
│  • handleChange (input + file handling)         │
│  • fetchMemberDetails (auto-fill from DB)       │
│  • handleSubmit (submit with optional files)    │
└─────────────────────────────────────────────────┘
         ↓
    handleChange()
         ↓
  ┌─────────────────────────────────────────────────┐
  │  Input Field                                    │
  ├─────────────────────────────────────────────────┤
  │  • Regular inputs (name, email, etc.)           │
  │  • File inputs with skip checkbox               │
  │  • Conditional fields (voter → affidavit)      │
  └─────────────────────────────────────────────────┘
         ↓
    handleSubmit()
         ↓
  ┌─────────────────────────────────────────────────┐
  │  API Request                                    │
  ├─────────────────────────────────────────────────┤
  │  • Include only changed/uploaded files          │
  │  • Preserve existing docs if skipped            │
  │  • Send form data as FormData for multipart     │
  └─────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Define Form State with All Fields

Include all database fields + file handling fields:

```jsx
const [formData, setFormData] = useState({
  // Personal Details
  name: "",
  gender: "",
  guardianName: "",
  dob: "",
  bloodGroup: "",
  
  // Address
  address: "",
  city: "",
  zip: "",
  ksAddress: "",
  
  // Contact
  mobile: "",
  email: "",
  
  // Nominee
  nomineeName: "",
  nomineeMobile: "",
  
  // DBA/Membership
  membershipDate: "",
  lastSubscription: "",
  
  // Document Uploads (combined field + file + skip checkbox)
  documentType: "",      // e.g., "ID", "C.O.P", "Certificate"
  documentFile: null,    // actual file object
  skipDocUpload: false,  // skip checkbox
  
  // Voter & Affidavit
  voter: "",             // "yes" or "no"
  affidavit: null,       // file object
  skipAffidavit: false,  // skip checkbox
});
```

### Step 2: Implement Input Change Handler

Handle both regular inputs and files, including skip checkbox logic:

```jsx
const handleChange = (e) => {
  const { name, value, type, files, checked } = e.target;
  
  setFormData((prev) => ({
    ...prev,
    // Regular inputs and selects
    [name]: type === "checkbox" 
      ? checked                    // for skip checkboxes
      : type === "file" 
        ? files[0]                 // for file inputs
        : value,                   // for text/email/number/date
  }));
};
```

### Step 3: Implement Auto-Fill from Database

Fetch existing member data and populate all fields:

```jsx
const fetchMemberDetails = async (memberId) => {
  try {
    const res = await apiService.memberDetails(memberId);
    const member = res.data.data.member;

    if (!member) {
      showErrorToast("Member not found");
      return;
    }

    // ✅ Map database fields to form state
    setFormData((prev) => ({
      ...prev,
      // Personal Details
      name: member.name || "",
      gender: member.gender || "",
      guardianName: member.guardianName || "",
      dob: member.dob || "",
      bloodGroup: member.bloodGroup || "",
      
      // Address
      address: member.address || "",
      city: member.city || "",
      zip: member.zip || "",
      ksAddress: member.ksAddress || "",
      
      // Contact
      mobile: member.mobile || "",
      email: member.email || "",
      
      // Nominee
      nomineeName: member.nomineeName || "",
      nomineeMobile: member.nomineeMobile || "",
      
      // Membership
      membershipDate: member.membershipDate || "",
      lastSubscription: member.lastSubscription || "",
      
      // Documents (IMPORTANT: Don't reset file inputs - user controls upload)
      documentType: member.bcOfUpType || "",
      // documentFile stays null - let user choose to update
      skipDocUpload: false,
      
      // Voter
      voter: member.voter || "",
      // affidavit stays null - let user choose to update
      skipAffidavit: false,
    }));
    
    showSuccessToast("Member details loaded");
  } catch (error) {
    console.error("Error fetching member:", error);
    showErrorToast("Failed to fetch member details");
  }
};
```

### Step 4: Create File Input with Skip Checkbox

Render file inputs with optional skip functionality:

```jsx
{/* BC Document Upload Section */}
<div>
  <label className="block text-sm font-extrabold mb-1">
    Upload BC Of UP Documents
  </label>
  
  {/* Skip Checkbox */}
  <label className="flex items-center mb-3 space-x-2">
    <input
      type="checkbox"
      name="skipDocUpload"
      checked={formData.skipDocUpload}
      onChange={handleChange}
      className="w-4 h-4"
    />
    <span className="text-sm text-gray-700">
      Skip upload (keep existing document)
    </span>
  </label>
  
  {/* File Input - Only required if NOT skipped */}
  {!formData.skipDocUpload && (
    <input
      type="file"
      name="documentFile"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={handleChange}
      required={!formData.skipDocUpload}
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  )}
</div>

{/* Voter & Affidavit Section - Conditional */}
<div>
  <label className="block text-sm font-extrabold mb-1">
    Do You Want To Become Voter Member
  </label>
  
  <select
    name="voter"
    value={formData.voter}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
  >
    <option value="">Select</option>
    <option value="yes">Yes</option>
    <option value="no">No</option>
  </select>

  {/* Affidavit - Only show if voter="yes" */}
  {formData.voter === "yes" && (
    <>
      <label className="flex items-center mb-3 space-x-2">
        <input
          type="checkbox"
          name="skipAffidavit"
          checked={formData.skipAffidavit}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700">
          Skip upload (keep existing affidavit)
        </span>
      </label>

      {!formData.skipAffidavit && (
        <input
          type="file"
          name="affidavit"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          required={!formData.skipAffidavit}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      )}
    </>
  )}
</div>
```

### Step 5: Implement Form Submission with Smart File Handling

Only send files that were actually uploaded/changed:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isSubmitting) return;

  try {
    setIsSubmitting(true);

    // Prepare member data (text fields only)
    const memberData = {
      memberId: memberId,
      name: formData.name,
      gender: formData.gender,
      guardianName: formData.guardianName,
      dob: formData.dob,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      city: formData.city,
      zip: formData.zip,
      ksAddress: formData.ksAddress,
      mobile: formData.mobile,
      email: formData.email,
      nomineeName: formData.nomineeName,
      nomineeMobile: formData.nomineeMobile,
      membershipDate: formData.membershipDate,
      lastSubscription: formData.lastSubscription,
      bcOfUpType: formData.documentType,
      voter: formData.voter,
      // NOTE: Don't include file paths here - sent separately via FormData
    };

    const formDataToSend = new FormData();
    formDataToSend.append(
      "member",
      new Blob([JSON.stringify(memberData)], { type: "application/json" })
    );

    // ✅ Only append files that were actually selected AND NOT skipped
    if (formData.documentFile && !formData.skipDocUpload) {
      formDataToSend.append("documentFile", formData.documentFile);
    }

    if (formData.affidavit && !formData.skipAffidavit) {
      formDataToSend.append("affidavit", formData.affidavit);
    }

    // Make API call
    const response = await apiService.updateMember(
      memberId,
      formDataToSend
    );

    if (response.data.success) {
      showSuccessToast("Member details updated successfully");
      onUpdateSuccess?.();
    }
  } catch (error) {
    console.error("Error updating member:", error);
    showErrorToast(
      error.response?.data?.message || "Failed to update member"
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Key Patterns & Rules

### ✅ DO

| Pattern | Reason |
|---------|--------|
| Use `type="checkbox"` for skip toggles | Clear UX for optional uploads |
| Initialize files as `null` in state | Allows `if (file)` checks before append |
| Set `required={!formData.skipCheckbox}` | Validation depends on skip toggle status |
| Show file input conditionally | Simplifies form when not needed |
| Send files in FormData, JSON in Blob | Multipart/form-data requirement |
| Only append files if selected | Prevents empty file errors in backend |
| Map database response → form state 1:1 | Ensures auto-fill accuracy |

### ❌ DON'T

| Anti-Pattern | Issue |
|---------------|-------|
| Always make file fields required | Breaks optional skip logic |
| Send `null` or empty files to backend | Causes validation errors |
| Reset file inputs after auto-fill | Users can't decide whether to keep old files |
| Mix text fields and files in JSON | FormData + Blob pattern is required |
| Hardcode required validation | Doesn't account for skip checkbox state |
| Auto-require affidavit if voter="no" | Only required when voter="yes" |

---

## Quick Reference: Field Mapping

### Personal Details
```
Database         → React State        → Form Input
name             → formData.name      → text input
gender           → formData.gender    → select
dob              → formData.dob       → date input
bloodGroup       → formData.bloodGroup → select
guardianName     → formData.guardianName → text input
```

### Document Uploads
```
Database         → React State             → Skip Logic
bcOfUpType       → formData.documentType   → skipDocUpload checkbox
bcOfUpPhoto      → formData.documentFile   → File not reset after fetch
voter            → formData.voter         → Controls affidavit visibility
affidavite       → formData.affidavit     → skipAffidavit checkbox
```

---

## Testing Checklist

Before submitting changes, verify:

- [ ] Auto-fill populates all existing fields correctly
- [ ] File inputs remain empty after auto-fill (user controlled)
- [ ] Skip checkboxes appear for optional uploads
- [ ] Unchecking skip checkbox reveals file input
- [ ] File inputs show `required` only when skip=false
- [ ] Voter selection shows/hides affidavit section
- [ ] Form submits without errors
- [ ] Skipped uploads don't send empty files to backend
- [ ] Backend receives JSON member data + only selected files
- [ ] Existing files preserved if upload skipped
- [ ] Error messages display on failure

---

## Backend Integration Notes

### API Expects

```
Content-Type: multipart/form-data

Parts:
1. member (application/json) - Text fields as JSON object
2. documentFile (optional) - PDF/Image file
3. affidavit (optional) - PDF/Image file
```

### Example Request

```
POST /api/members/{memberId}
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="member"
Content-Type: application/json

{"memberId":"M123","name":"John Doe","voter":"yes",...}

--boundary
Content-Disposition: form-data; name="affidavit"; filename="affidavit.pdf"
Content-Type: application/pdf

[binary file content]
--boundary--
```

### Backend Service Implementation

```jsx
// API Service
const updateMember = async (memberId, formData) => {
  return axios.post(
    `/api/members/${memberId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        // Authorization header added by interceptor
      },
    }
  );
};
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Files not uploading | Check FormData.append() - only append if file exists after filtered |
| "Data override" on skip | Initialize files as `null`, not empty string |
| Field shows undefined after fetch | Use `member.field || ""` with fallback |
| Skip checkbox won't toggle visibility | Use `{formData.skipDocUpload && <FileInput />}` |
| Voter affidavit always required | Use `required={formData.voter === "yes" && !formData.skipAffidavit}` |
| API returns 400 bad request | Verify FormData has correct Blob JSON, check Content-Type header |

---

## Code References

Real-world implementations in codebase:

- [editdetails.jsx](../../src/components/editdetails.jsx) - Complete update member form pattern
- [LifeMemberRegister.jsx](../../src/features/users/components/LifeMemberRegister.jsx) - Conditional voter/affidavit logic
- [RegisterMember.jsx](../../src/features/users/components/RegisterMember.jsx) - Skip doc upload pattern
- [MemberRequest.java](../../src/main/java/com/dba/alld/dto/MemberRequest.java) - Backend DTO for multipart
