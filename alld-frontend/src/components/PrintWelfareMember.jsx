import { useEffect, useState } from "react";
import apiService from "./apiService";
import defaultAdvocate from "../assets/default_advocate.png";
import { useSearchParams } from "react-router-dom";
import { getFileServerBaseUrl } from "../constants/fileServer";

import "./printStyles.css";

const FILE_SERVER_URL = getFileServerBaseUrl();
const BATCH_SIZE = 10; // Fetch 10 photos at a time

const PrintWelfareMember = () => {
  const [members, setMembers] = useState([]);
  const [memberPhotos, setMemberPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchParams] = useSearchParams();
  const memberType = Number(searchParams.get("memberType")) || 3; // fallback

  // Function to fetch photo with auth header and return blob URL
  const fetchPhotoWithAuth = async (photoPath) => {
    if (!photoPath) return null;
    const token = localStorage.getItem("accessToken");
    const path = photoPath.startsWith("upload/") ? photoPath : `upload/photos/${photoPath}`;
    const url = `${FILE_SERVER_URL}/${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      // Silently fail - will use default image
    }
    return null;
  };

  useEffect(() => {
    return () => {
      window.onafterprint = null;
    };
  }, []);

  const getMemberTypeTitle = (type) => {
    switch (type) {
      case 1:
        return "General Member List";
      case 2:
        return "Life Member List";
      case 3:
        return "Welfare Member List";
      default:
        return "Member List";
    }
  };

  useEffect(() => {
    const fetchPhotosInBatchesLocal = async (membersList) => {
      const photosMap = {};
      const totalMembers = membersList.length;

      for (let i = 0; i < totalMembers; i += BATCH_SIZE) {
        const batch = membersList.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (member) => {
            if (member.photo) {
              const photoUrl = await fetchPhotoWithAuth(member.photo);
              if (photoUrl) {
                photosMap[member.memberId] = photoUrl;
              }
            }
          })
        );

        // Update progress
        const progress = Math.min(Math.round(((i + BATCH_SIZE) / totalMembers) * 100), 100);
        setLoadingProgress(progress);
        setMemberPhotos({ ...photosMap });
      }

      return photosMap;
    };

    const fetchData = async () => {
      const res = await apiService.memberList({
        page: 0,
        size: 100000,
        memberType: memberType,
      });

      if (res?.data?.status === 200) {
        const membersList = res.data.data.members;
        setMembers(membersList);
        setLoading(false);

        // Fetch photos in batches with progress
        await fetchPhotosInBatchesLocal(membersList);
        setPhotosLoading(false);
      }
    };

    fetchData();
    document.title = `${getMemberTypeTitle(memberType)} - DBA Allahabad`;

    return () => {
      document.title = "DBA Software";
    };
  }, [memberType]);

  useEffect(() => {
    if (!loading && !photosLoading && members.length > 0) {
      // Small delay to ensure all images are rendered
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, photosLoading, members]);

  // Get photo from memberPhotos map or return default
  const getPhoto = (memberId) => {
    return memberPhotos[memberId] || defaultAdvocate;
  };

  // Loading screen
  if (loading || photosLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {loading ? "Loading Members..." : "Loading Photos..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {loading
              ? "Fetching member data..."
              : `Downloading photos: ${loadingProgress}%`}
          </p>
          {!loading && (
            <>
              <div className="w-64 bg-gray-200 rounded-full h-3 mx-auto mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {members.length} members total
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="print-container">
      <div className="print-page-header">
        <span>{getMemberTypeTitle(memberType)}</span>
        <span>DBA Allahabad</span>
      </div>

      <div className="card-grid">
        {members.map((m, index) => (
          <div className="card" key={m.memberId}>
            <div className="index-box">{index + 1}</div>
            <div className="card-left">
              <p className="mb-1">
                <b>Name</b> {m.name}
              </p>
              <p className="mb-1">
                <b>S/O</b> {m.guardianName}
              </p>
              <p className="mb-1">
                <b>EN No.</b> {m.enNo}
              </p>
              <p className="mb-1">
                <b>COP No.</b> {m.registrationNo}
              </p>
              <p className="mb-1">
                <b>Mobile</b> {m.mobile}
              </p>
              <p className="mb-1">
                <b>Address</b> {m.address}
              </p>
              {memberType === 1 && m.expiryDate && (
                <p className="mb-1">
                  <b>Last Subscription</b> {m.expiryDate}
                </p>
              )}
            </div>

            <div className="card-right">
              <img
                src={getPhoto(m.memberId)}
                onError={(e) => (e.target.src = defaultAdvocate)}
                alt={m.name}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PrintWelfareMember;
