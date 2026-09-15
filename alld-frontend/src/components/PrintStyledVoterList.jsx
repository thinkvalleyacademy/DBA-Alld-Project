import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiService from "./apiService";
import defaultAdvocate from "../assets/default_advocate.png";
import { getFileServerBaseUrl } from "../constants/fileServer";
import "./printStyles.css";

const FILE_SERVER_URL = getFileServerBaseUrl();
const PHOTO_BATCH_SIZE = 50;
const PRINT_PHOTO_WIDTH = 140;
const PRINT_PHOTO_HEIGHT = 170;
const photoUrlCache = new Map();

const createPrintThumbnailUrl = (blob) =>
  new Promise((resolve) => {
    const sourceUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PRINT_PHOTO_WIDTH;
      canvas.height = PRINT_PHOTO_HEIGHT;

      const context = canvas.getContext("2d");
      const scale = Math.max(
        PRINT_PHOTO_WIDTH / image.naturalWidth,
        PRINT_PHOTO_HEIGHT / image.naturalHeight
      );
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const offsetX = (PRINT_PHOTO_WIDTH - drawWidth) / 2;
      const offsetY = (PRINT_PHOTO_HEIGHT - drawHeight) / 2;

      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      URL.revokeObjectURL(sourceUrl);

      canvas.toBlob(
        (thumbnailBlob) => {
          resolve(thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : null);
        },
        "image/jpeg",
        0.72
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      resolve(null);
    };

    image.src = sourceUrl;
  });

const PrintStyledVoterList = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [memberPhotos, setMemberPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Function to fetch photo with auth header and return blob URL
  const fetchPhotoWithAuth = async (photoPath) => {
    if (!photoPath) return null;
    if (photoUrlCache.has(photoPath)) return photoUrlCache.get(photoPath);

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
        const objectUrl = (await createPrintThumbnailUrl(blob)) || URL.createObjectURL(blob);
        photoUrlCache.set(photoPath, objectUrl);
        return objectUrl;
      }
    } catch (err) {
      // Silently fail - will use default image
    }
    return null;
  };

  const getTitle = (voterType) => {
    if (voterType === "gm") {
      return "General Member Voter List";
    } else {
      return "Life Member Voter List";
    }
  };

  useEffect(() => {
    window.onafterprint = () => {
      window.close();
    };

    return () => {
      window.onafterprint = null;
    };
  }, []);

  useEffect(() => {
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const period = year && month ? ` - ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}` : "";
    document.title = `Print ${getTitle(type)}${period}`;

    return () => {
      document.title = "DBA Software";
    };
  }, [type, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchCompleteVoterList = async (fetcher, params) => {
      const firstPage = await fetcher({ ...params, page: 0, size: 1 });
      const totalMembers = firstPage?.data?.data?.totalMembers || 0;

      if (totalMembers <= 1) {
        return firstPage;
      }

      return fetcher({ ...params, page: 0, size: totalMembers });
    };

    const fetchPhotosInBatches = async (membersList) => {
      const photosMap = {};
      const photoToMemberIds = membersList.reduce((map, member) => {
        if (!member.photo) return map;
        const memberIds = map.get(member.photo) || [];
        memberIds.push(member.memberId);
        map.set(member.photo, memberIds);
        return map;
      }, new Map());
      const uniquePhotoPaths = Array.from(photoToMemberIds.keys());

      if (uniquePhotoPaths.length === 0) {
        if (isMounted) {
          setLoadingProgress(100);
          setMemberPhotos({});
        }
        return photosMap;
      }

      for (let i = 0; i < uniquePhotoPaths.length; i += PHOTO_BATCH_SIZE) {
        const batch = uniquePhotoPaths.slice(i, i + PHOTO_BATCH_SIZE);

        await Promise.all(
          batch.map(async (photoPath) => {
            const photoUrl = await fetchPhotoWithAuth(photoPath);
            if (photoUrl) {
              photoToMemberIds.get(photoPath).forEach((memberId) => {
                photosMap[memberId] = photoUrl;
              });
            }
          })
        );

        if (!isMounted) return photosMap;

        const progress = Math.min(
          Math.round(((i + PHOTO_BATCH_SIZE) / uniquePhotoPaths.length) * 100),
          100
        );
        setLoadingProgress(progress);
      }

      if (isMounted) setMemberPhotos(photosMap);
      return photosMap;
    };

    const loadData = async () => {
      let res;

      const year = parseInt(searchParams.get("year")) || new Date().getFullYear();
      const month = parseInt(searchParams.get("month")) || new Date().getMonth() + 1;
      const query = searchParams.get("query")?.trim();

      if (type === "gm") {
        res = query
          ? await fetchCompleteVoterList(apiService.gmSearch, { year, month, query })
          : await fetchCompleteVoterList(apiService.gmList, { year, month });
      } else if (type === "lm") {
        res = query
          ? await fetchCompleteVoterList(apiService.lmSearchByMonthYear, { year, month, query })
          : await fetchCompleteVoterList(apiService.lmList, { year, month });
      } else {
        console.error("Unknown voter type:", type);
        return;
      }

      if (res?.data?.status === 200) {
        const membersList = res.data.data.members;
        if (!isMounted) return;
        setMembers(membersList);
        setLoading(false);

        // Fetch photos in batches with progress
        await fetchPhotosInBatches(membersList);
        if (isMounted) setPhotosLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [type, searchParams]);

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
            {loading ? "Loading Voters..." : "Loading Photos..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {loading
              ? "Fetching voter data..."
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
                {members.length} voters total
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
        <span>{getTitle(type)}</span>
        <span>DBA Allahabad</span>
      </div>

      <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
        District Bar Association Allahabad
      </h2>

      {/* ===== GRID ===== */}
      <div className="card-grid">
        {members.map((m, index) => (
          <div className="card" key={m.memberId}>
            <div className="index-box">{index + 1}</div>
            <div className="card-left">
              <p className="mb-1">
                <b>Member ID</b> {m.memberId}
              </p>
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

export default PrintStyledVoterList;
