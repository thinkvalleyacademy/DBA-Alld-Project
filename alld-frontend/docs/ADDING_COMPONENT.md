graph TD
  NewComponent["🆕 New Component"]
  AddRoute["➕ Add Route"]
  AddMock["🧪 Create Mock"]
  RegisterAPI["⚙️ Register in ApiUtil.js"]

  NewComponent --> AddRoute
  AddRoute --> RegisterAPI
  RegisterAPI --> AddMock

### Updated Steps

1. **Create New Component**: Add the new component in the appropriate folder under `src/pages` or `src/components`.
2. **Add Route**: Register the route in `App.js` using `react-router-dom`.
3. **Create Mock**: If using mock APIs, add the mock implementation in `src/mockData`.
4. **Register in ApiUtil.js**: Update `ApiUtil.js` to include the new API endpoint if applicable.
