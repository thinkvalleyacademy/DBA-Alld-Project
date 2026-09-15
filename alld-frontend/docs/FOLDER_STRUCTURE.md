graph TD
  A["📁 /pages"] --> B1["Register.js"]
  A --> B2["Login.js"]
  A --> B3["UserReport.js"]

  C["📁 /mockData/user"] --> D1["mockLoginApi"]
  C --> D2["mockRegisterApi"]
  C --> D3["mockUsersListApi"]

  E["📁 /utility"] --> F1["APIUtils.js"]
  E --> F2["PageWrapper.js"]

  G["📁 /context"] --> H1["UserReportContext"]
