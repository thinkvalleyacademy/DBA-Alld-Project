import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Loader2, Shield, RefreshCw, User, Hash, Phone, MapPin, Calendar, Droplet, CreditCard, Users, Mail, Home, Award, FileText, CheckCircle } from 'lucide-react';
import publicApiService from '../components/publicApiService';
import { BASE_URLS } from '../constants/apiConfig';
import defaultAdvocate from '../assets/default_advocate.png';
import { getMemberStatusMeta } from '../utility/memberStatus';

// Format date as DD MM YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const toAbsoluteApiUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const apiBase = (BASE_URLS.USER || "").trim();
  if (!apiBase) return path;
  const normalizedBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

// Member photo flow kept separate from public notices.
const buildMemberPhotoUrl = (photoPath) => {
  if (!photoPath) return null;

  try {
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      const parsed = new URL(photoPath);
      if (parsed.pathname.startsWith("/files/")) {
        parsed.pathname = `/dba-alld${parsed.pathname}`;
      }
      return parsed.toString();
    }
  } catch (e) {
    return null;
  }

  let path = photoPath;
  if (!photoPath.includes("/")) {
    path = `upload/photos/${photoPath}`;
  } else if (photoPath.startsWith("/")) {
    path = photoPath.substring(1);
  }

  if (path.startsWith("files/")) {
    return toAbsoluteApiUrl(`/dba-alld/${path}`);
  }
  return toAbsoluteApiUrl(`/dba-alld/files/${path}`);
};

const fetchPhoto = async (photoPath) => {
  if (!photoPath) return null;

  try {
    const finalUrl = buildMemberPhotoUrl(photoPath);
    if (!finalUrl) return null;

    const response = await fetch(finalUrl, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      headers: {}
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error fetching photo:", err);
    return null;
  }
};

const getMemberDisplayType = (memberDetails) => {
  const typeValue = memberDetails?.gmlMemberType ?? memberDetails?.gmLmMemberType;

  return typeValue === 1 ? 'General'
    : typeValue === 2 ? 'Life'
    : typeValue === 3 ? 'Welfare'
    : memberDetails?.memberType || 'Old';
};

// Simple alphanumeric CAPTCHA generator
const generateCaptcha = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return captcha;
};

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const loadRecaptchaScript = (siteKey) => {
  if (!siteKey) {
    return Promise.reject(new Error("Missing REACT_APP_RECAPTCHA_SITE_KEY"));
  }

  if (window.grecaptcha?.execute) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-recaptcha-key="${siteKey}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', () => reject(new Error("Failed to load reCAPTCHA")), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaKey = siteKey;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
};

const getRecaptchaToken = async (action = 'member_search') => {
  if (!RECAPTCHA_SITE_KEY) {
    throw new Error("Missing REACT_APP_RECAPTCHA_SITE_KEY");
  }

  await loadRecaptchaScript(RECAPTCHA_SITE_KEY);

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
        if (!token) {
          reject(new Error("Empty reCAPTCHA token"));
          return;
        }
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const resolveNoticeImageUrl = (url) => toAbsoluteApiUrl(url);

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Search Popup States
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Alphanumeric CAPTCHA verification state
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaText, setCaptchaText] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [verifyingCaptcha, setVerifyingCaptcha] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState(null);
  const [pendingMemberId, setPendingMemberId] = useState(null);
  const [pendingMemberData, setPendingMemberData] = useState(null);
  const [noticeSlideIndex, setNoticeSlideIndex] = useState(0);
  const [uploadedNoticeSlides, setUploadedNoticeSlides] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadPublicNoticeSlides = async () => {
      try {
        const res = await publicApiService.getPublicNoticeImages();
        const notices = Array.isArray(res?.data?.data) ? res.data.data : [];

        const slides = notices
          .map((notice) => {
            const rawSrc = notice.imageUrl || (notice.imagePath ? `/dba-alld/files/${notice.imagePath}` : null);
            const baseSrc = resolveNoticeImageUrl(rawSrc);
            if (!baseSrc) return null;
            const src = `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}v=${encodeURIComponent(notice.cacheVersion || "")}`;
            return {
              src,
              alt: notice.name || "Official association notice",
              title: notice.name || "",
            };
          })
          .filter(Boolean);

        setUploadedNoticeSlides(slides);
      } catch (error) {
        console.warn("Failed to load public notice slides:", error);
        setUploadedNoticeSlides([]);
      }
    };

    loadPublicNoticeSlides();
  }, []);

  // Focus input when popup opens
  useEffect(() => {
    if (showSearchPopup && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showSearchPopup]);

  const refreshCaptcha = (clearError = true) => {
    setCaptchaText(generateCaptcha());
    setUserCaptchaInput("");
    if (clearError) {
      setCaptchaError("");
    }
  };

  // Execute member search after CAPTCHA verification
  const executeSearchWithCaptcha = async (query, recaptchaToken) => {
    setVerifyingCaptcha(true);
    setIsSearching(true);
    setSearchError("");

    try {
      const res = await publicApiService.generalMemberSearch({
        query: query,
        type: '',
        captchaToken: recaptchaToken
      });

      console.log("Search results after CAPTCHA verification:", res.data);

      if (res.data && res.data.status === 200) {
        const results = res.data.data || [];
        setMemberSuggestions(results);
        if (results.length > 0) {
          setShowSearchDropdown(true);
          setShowCaptcha(false);
          setPendingSearchQuery(null);
        } else {
          setSearchError("No members found matching your search");
          setShowCaptcha(false);
        }
      } else if (res.data && (res.data.status === 400 || res.data.status === 401)) {
        setSearchError(res.data.message || "CAPTCHA verification failed. Please try again.");
      } else {
        setSearchError(res.data?.message || "Search failed. Please try again.");
        setShowCaptcha(false);
      }
    } catch (err) {
      console.error("Error searching members:", err);
      setSearchError("Failed to fetch results. Please try again.");
      setShowCaptcha(false);
    } finally {
      setIsSearching(false);
      setVerifyingCaptcha(false);
    }
  };

  // Execute member details fetch after CAPTCHA verification
  const executeMemberDetailsFetch = async (memberId) => {
    setLoadingDetails(true);
    try {
      const res = await publicApiService.memberDetails(memberId);

      if (res.data.status === 200) {
        const member = res.data.data.member;
        setMemberDetails(member);

        if (member.photo) {
          const photo = await fetchPhoto(member.photo);
          setPhotoUrl(photo);
        }

        setSelectedMember({ memberId: member.memberId, name: member.name });
        setShowCaptcha(false);
        setPendingMemberId(null);
      } else {
        setSearchError(res.data.message || "Failed to fetch member details");
      }
    } catch (err) {
      console.error("Error fetching member details:", err);

      try {
        const res = await publicApiService.memberDetailsPost(memberId);

        if (res.data.status === 200) {
          const member = res.data.data.member;
          setMemberDetails(member);

          if (member.photo) {
            const photo = await fetchPhoto(member.photo);
            setPhotoUrl(photo);
          }

          setSelectedMember({ memberId: member.memberId, name: member.name });
          setShowCaptcha(false);
          setPendingMemberId(null);
        } else {
          setSearchError(res.data.message || "Failed to fetch member details");
        }
      } catch (postErr) {
        console.error("Error fetching member details with POST:", postErr);
        setSearchError("Failed to fetch member details. Please try again.");
      }
    } finally {
      setLoadingDetails(false);
      setVerifyingCaptcha(false);
    }
  };

  // Execute member select after CAPTCHA verification
  const executeMemberSelect = async (member) => {
    setLoadingDetails(true);
    try {
      const res = await publicApiService.memberDetails(member.memberId);

      if (res.data.status === 200) {
        const memberData = res.data.data.member;
        setMemberDetails(memberData);

        if (memberData.photo) {
          const photo = await fetchPhoto(memberData.photo);
          setPhotoUrl(photo);
        }

        setSelectedMember({ memberId: memberData.memberId, name: memberData.name });
        setShowCaptcha(false);
        setPendingMemberData(null);
      } else {
        setSearchError(res.data.message || "Failed to fetch member details");
      }
    } catch (err) {
      console.error("Error fetching member details:", err);
      setSearchError("Failed to fetch member details. Please try again.");
    } finally {
      setLoadingDetails(false);
      setVerifyingCaptcha(false);
    }
  };

  // Verify alphanumeric CAPTCHA and execute pending action
  const verifyCaptchaAndExecute = async () => {
    if (!userCaptchaInput) {
      setCaptchaError("Please enter the CAPTCHA text");
      return;
    }

    if (userCaptchaInput.trim() !== captchaText) {
      setCaptchaError("Incorrect CAPTCHA. Please try again.");
      refreshCaptcha(false);
      return;
    }

    setCaptchaError("");
    setVerifyingCaptcha(true);

    try {
      const recaptchaToken = await getRecaptchaToken('member_search');

      if (pendingSearchQuery) {
        await executeSearchWithCaptcha(pendingSearchQuery, recaptchaToken);
      } else if (pendingMemberId) {
        await executeMemberDetailsFetch(pendingMemberId);
      } else if (pendingMemberData) {
        await executeMemberSelect(pendingMemberData);
      }
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      setSearchError("Google reCAPTCHA verification failed. Please try again.");
      setVerifyingCaptcha(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { value } = e.target;
    setSearchQuery(value);
    setMemberSuggestions([]);
    setShowSearchDropdown(false);
    setSearchError("");
    setSelectedMember(null);
    setMemberDetails(null);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      e.preventDefault();
      setPendingSearchQuery(searchQuery.trim());
      setShowCaptcha(true);
      refreshCaptcha();
      setShowSearchDropdown(false);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchQuery.trim().length >= 2) {
      setPendingSearchQuery(searchQuery.trim());
      setShowCaptcha(true);
      refreshCaptcha();
      setShowSearchDropdown(false);
    }
  };

  // Handle member selection from dropdown
  const handleMemberSelect = (member) => {
    setSearchQuery(`${member.name} (${member.memberId})`);
    setShowSearchDropdown(false);
    executeMemberSelect(member);
  };

  // UPDATED: Handle clear search (cross button inside input) - Works for ALL states
  const handleClearSearch = () => {
    // Clear search query
    setSearchQuery("");
    setMemberSuggestions([]);
    setShowSearchDropdown(false);
    
    // If member details are showing, clear them
    if (selectedMember || memberDetails) {
      setSelectedMember(null);
      setMemberDetails(null);
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
      setPhotoUrl(null);
    }
    
    // If CAPTCHA is showing, clear it
    if (showCaptcha) {
      setShowCaptcha(false);
      setCaptchaText("");
      setUserCaptchaInput("");
      setCaptchaError("");
    }
    
    // Clear all pending states
    setPendingSearchQuery(null);
    setPendingMemberId(null);
    setPendingMemberData(null);
    setSearchError("");
    
    // Focus back on input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const closePopup = () => {
    setShowSearchPopup(false);
    setSearchQuery("");
    setMemberSuggestions([]);
    setSelectedMember(null);
    setMemberDetails(null);
    setPhotoUrl(null);
    setShowSearchDropdown(false);
    setSearchError("");
    setShowCaptcha(false);
    setCaptchaText("");
    setUserCaptchaInput("");
    setCaptchaError("");
    setVerifyingCaptcha(false);
    setPendingSearchQuery(null);
    setPendingMemberId(null);
    setPendingMemberData(null);
    setIsSearching(false);

    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    if (photoUrl && photoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  const features = [
    {
      image: '/person.png',
      title: 'Member Community',
      description: 'Join a distinguished community of legal professionals committed to excellence, integrity, and mutual support in the pursuit of justice.'
    },
    {
      image: '/voting_verified.png',
      title: 'Voting Rights',
      description: 'Exercise your democratic right to participate in association elections and shape important decisions that affect our legal community.'
    },
    {
      image: '/secure_system.png',
      title: 'Welfare Support',
      description: 'Access comprehensive welfare benefits and financial assistance programs designed to support members and their families in times of need.'
    },
    {
      image: '/membership.png',
      title: 'Professional Growth',
      description: 'Enhance your legal career through seminars, workshops, and networking opportunities with fellow advocates and judicial officers.'
    }
  ];

  const membershipPlans = [
    {
      type: 'General Membership',
      description: 'Annual membership with full benefits',
      features: [
        'Full voting rights in elections',
        'Access to all association events',
        'Official Member ID card',
        'Library and resource access',
        'Welfare scheme eligibility'
      ],
      highlight: true
    },
    {
      type: 'Life Membership',
      description: 'One-time enrollment, lifetime benefits',
      features: [
        'Permanent membership status',
        'No annual renewal required',
        'Full voting rights',
        'Priority in all programs',
        'Special recognition certificate'
      ],
      highlight: false
    }
  ];

  // Fallback slides from public/slides/ (used only when DB-backed uploads are not available).
  const noticeSlideFileNames = [
    "WhatsApp Image 2026-02-27 at 18.49.48.jpeg",
    "WhatsApp Image 2026-02-27 at 18.49.49 (1).jpeg",
    "WhatsApp Image 2026-02-27 at 18.49.49.jpeg",
    "WhatsApp Image 2026-02-27 at 18.49.50 (1).jpeg",
    "WhatsApp Image 2026-02-27 at 18.49.50.jpeg",
    "WhatsApp Image 2026-02-28 at 11.50.16 (1).jpeg",
    "WhatsApp Image 2026-02-28 at 11.50.16.jpeg",
    "WhatsApp Image 2026-02-28 at 11.50.17.jpeg",
    "WhatsApp Image 2026-02-28 at 11.50.18.jpeg",
  ];

  const fallbackNoticeSlides = noticeSlideFileNames.map((fileName, index) => ({
    src: encodeURI(`/slides/${fileName}`),
    alt: `Official association notice slide ${index + 1}`,
    title: "",
  }));

  const noticeSlides = uploadedNoticeSlides.length > 0
    ? uploadedNoticeSlides
    : fallbackNoticeSlides;

  useEffect(() => {
    if (noticeSlides.length === 0) {
      setNoticeSlideIndex(0);
      return;
    }
    if (noticeSlideIndex >= noticeSlides.length) {
      setNoticeSlideIndex(0);
    }
  }, [noticeSlides.length, noticeSlideIndex]);

  const showPrevNoticeSlide = () => {
    if (noticeSlides.length === 0) return;
    setNoticeSlideIndex((current) => (current - 1 + noticeSlides.length) % noticeSlides.length);
  };

  const showNextNoticeSlide = () => {
    if (noticeSlides.length === 0) return;
    setNoticeSlideIndex((current) => (current + 1) % noticeSlides.length);
  };

  const memberStatusMeta = getMemberStatusMeta(memberDetails?.status);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white shadow-md'
          : 'bg-transparent backdrop-blur-md'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-amber-600 bg-white">
                <img
                  src="/image.png"
                  alt="DBA Emblem"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultAdvocate;
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-lg lg:text-xl font-bold transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'
                  }`}>
                  District Bar Association
                </h1>
                <p className={`text-xs transition-colors ${isScrolled ? 'text-gray-500' : 'text-white/80'
                  }`}>
                  Established in Service of Justice
                </p>
              </div>
              <span className={`sm:hidden text-lg font-bold transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'
                }`}>
                DBA
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {['About', 'Benefits', 'Membership'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${isScrolled
                      ? 'text-gray-700 hover:text-amber-700 hover:bg-amber-50'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {item}
                </a>
              ))}
              {/* Search Member Button - Opens Popup */}
              <button
                onClick={() => setShowSearchPopup(true)}
                className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${isScrolled
                    ? 'text-gray-700 hover:text-amber-700 hover:bg-amber-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
              >
                Search Member
              </button>
              <Link
                to="/login"
                className="ml-2 lg:ml-4 px-4 lg:px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-md transition-all shadow-md hover:shadow-lg"
              >
                Member Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-md transition-colors ${isScrolled ? 'text-gray-700' : 'text-white'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white rounded-b-lg shadow-lg py-4 px-2">
              {['About', 'Benefits', 'Membership'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-md"
                >
                  {item}
                </a>
              ))}
              {/* Search Member Button - Mobile */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSearchPopup(true);
                }}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-md"
              >
                Search Member
              </button>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block mx-4 mt-3 px-4 py-3 bg-amber-600 text-white text-center font-semibold rounded-md"
              >
                Member Login
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Search Member Popup */}
      {showSearchPopup && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
            onClick={closePopup}
          />

          {/* Popup Content */}
          <div className="relative min-h-screen flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 pb-8">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
              
              {/* Header with Close Button (Top Cross) */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-600" />
                  Member Search
                </h3>
                <button
                  onClick={closePopup}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Close popup"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Input Section */}
              <div className="relative">
                <div className="flex items-center border-b border-gray-200 gap-2 pr-3">
                  <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      if (searchQuery.length >= 2 && memberSuggestions.length > 0) {
                        setShowSearchDropdown(true);
                      }
                    }}
                    placeholder="Search by name, father's name, enrollment no, COP no, or mobile..."
                    className="w-full pl-12 pr-12 py-4 text-gray-700 placeholder-gray-400 focus:outline-none text-base"
                    autoComplete="off"
                    disabled={showCaptcha}
                  />
                  <button
                    onClick={handleSearchClick}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    type="button"
                    disabled={showCaptcha || searchQuery.trim().length < 2}
                  >
                    Search
                  </button>
                  {/* Bottom Cross - Search Input Clear Button - NOW WORKS EVERYWHERE */}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-28 text-gray-400 hover:text-gray-600"
                      type="button"
                      title="Clear search and start fresh"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Helper text */}
                {!showCaptcha && !selectedMember && !searchError && (
                  <p className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100">
                    Type at least 2 characters to search members...
                  </p>
                )}

                {/* Error Message */}
                {searchError && (
                  <p className="text-red-500 text-xs px-4 py-2 bg-red-50 border-b border-red-100">{searchError}</p>
                )}
              </div>

              {/* Dropdown Suggestions */}
              {showSearchDropdown && memberSuggestions.length > 0 && !showCaptcha && (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {memberSuggestions.map((s, index) => (
                    <div
                      key={s.id || index}
                      className="px-4 py-3 hover:bg-amber-50 cursor-pointer transition-colors"
                      onClick={() => handleMemberSelect(s)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{s.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            MEMBER
                          </span>
                        </div>
                        <span className="text-xs text-amber-600 font-medium">
                          ID: {s.memberId}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">Father: {s.fatherName || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Hash className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">EN: {s.enNo || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Hash className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">COP: {s.registrationNo || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{s.mobile || "-"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading State for Suggestions */}
              {isSearching && !showCaptcha && (
                <div className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Searching members...</p>
                </div>
              )}

              {/* No Results Message */}
              {searchQuery.length >= 2 && memberSuggestions.length === 0 && !isSearching && !showCaptcha && !selectedMember && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No members found matching "{searchQuery}"</p>
                  <p className="text-xs text-amber-600 mt-2">Click Search and complete CAPTCHA to view details</p>
                </div>
              )}

              {/* CAPTCHA Section */}
              {showCaptcha && (
                <div className="p-6 bg-amber-50 border-t border-amber-200">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        🔒 Verification Required
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Enter the CAPTCHA text shown below. Search will run only after this and Google reCAPTCHA verification both pass.
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-mono text-xl font-bold px-4 py-2 rounded-lg tracking-wider">
                          {captchaText}
                        </div>
                        <button
                          onClick={refreshCaptcha}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          disabled={verifyingCaptcha}
                          type="button"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={userCaptchaInput}
                        onChange={(e) => setUserCaptchaInput(e.target.value)}
                        placeholder="Enter CAPTCHA"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
                        disabled={verifyingCaptcha}
                      />

                      {captchaError && (
                        <p className="text-red-500 text-xs mb-2">{captchaError}</p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={verifyCaptchaAndExecute}
                          disabled={verifyingCaptcha || !userCaptchaInput.trim()}
                          className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          type="button"
                        >
                          {verifyingCaptcha ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify & Continue'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowCaptcha(false);
                            setCaptchaText("");
                            setUserCaptchaInput("");
                            setCaptchaError("");
                            setPendingSearchQuery(null);
                            setPendingMemberId(null);
                            setPendingMemberData(null);
                          }}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
                          disabled={verifyingCaptcha}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Member Details - COMPLETE WITH ALL FIELDS */}
              {selectedMember && memberDetails && !showCaptcha && (
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {/* Header with Name and ID */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">{memberDetails.name}</h2>
                      <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                        ID: {memberDetails.memberId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        memberStatusMeta.pillClassName
                      }`}>
                        {memberStatusMeta.label}
                      </span>
                      {memberDetails.voter === "Yes" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Voter
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Photo and Basic Info Grid */}
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      <img
                        src={photoUrl || defaultAdvocate}
                        onError={(e) => (e.target.src = defaultAdvocate)}
                        alt={memberDetails.name}
                        className="w-32 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                      />
                    </div>

                    {/* Basic Information Grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> Father's Name
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.guardianName || memberDetails.fatherName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Member Type
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {getMemberDisplayType(memberDetails)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Gender
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.gender || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Date of Birth
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(memberDetails.dob)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Droplet className="w-3 h-3" /> Blood Group
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.bloodGroup || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Registration Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.registrationType || "C.O.P No."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Information */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      Registration Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Registration No</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.registrationNo || "091546"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">EN No</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.enNo || "961/87"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mobile</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.mobile || "9450108755"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.email || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.city || "Prayagraj"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4 text-amber-600" />
                      Address Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Residence Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.address || "82/220 Rajapur Imambara"}, {memberDetails.city || "Prayagraj"}, {memberDetails.state || "Uttar Pradesh"} - {memberDetails.zip || "211001"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">KS Address (Court Address)</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.ksAddress || "Seat No. 1 Mukhtarkhana"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Membership Information */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      Membership Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Membership Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(memberDetails.membershipDate) || "01-03-2018"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expiry Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(memberDetails.expiryDate) || "28-11-2024"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">E-Wallet Balance</p>
                        <p className="text-sm font-semibold text-green-600">
                          ₹{memberDetails.ewalletBalance || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Voter</p>
                        <p className="text-sm font-medium text-gray-900">
                          {memberDetails.voter || "Yes"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nominee Information */}
                  {(memberDetails.nomineeName || memberDetails.nomineName || memberDetails.nomineeMobile || memberDetails.nomineMobile) && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        Nominee Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nominee Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {memberDetails.nomineeName || memberDetails.nomineName || "Shahana Begum"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Nominee Mobile</p>
                          <p className="text-sm font-medium text-gray-900">
                            {memberDetails.nomineeMobile || memberDetails.nomineMobile || "7510018681"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberDetails(null);
                        setPhotoUrl(null);
                        setSearchQuery("");
                        setMemberSuggestions([]);
                      }}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      type="button"
                    >
                      ← New Search
                    </button>
                   
                  </div>
                </div>
              )}

              {/* Initial State Message */}
              {!searchQuery && !selectedMember && !showCaptcha && !isSearching && (
                <div className="px-4 py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-base text-gray-500">Search for members by name, enrollment no, or mobile...</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full">Name</span>
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full">Father's Name</span>
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full">Enrollment No</span>
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full">COP No</span>
                    <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full">Mobile</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:h-screen flex items-end sm:items-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          <img
            src="/courts.png"
            alt=""
            className="w-full h-full object-cover object-bottom sm:object-center"
            loading="eager"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultAdvocate;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-gray-900/70 sm:from-gray-900/85 sm:via-gray-900/75 sm:to-gray-800/70"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent sm:from-gray-900/60 sm:via-transparent sm:to-gray-900/40"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-600/20 border border-amber-500/30 rounded-full mb-4 sm:mb-6">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-amber-200 text-xs sm:text-sm font-medium">Official Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              District Bar
              <span className="block text-amber-400">Association</span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-300 leading-relaxed max-w-2xl">
              Uniting legal professionals in the pursuit of justice, integrity, and excellence.
            </p>

            <div className="mt-3 sm:mt-4 flex items-center text-gray-400 text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span>Established for the Welfare of Advocates</span>
            </div>

            <div className="mt-6 sm:mt-10">
              <a
                href="#membership"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Become a Member
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                  <h3 className="text-white text-lg font-semibold text-center">
                    Official Association Notice
                  </h3>
                </div>
                <div className="p-6 flex justify-center bg-gray-50">
                  {noticeSlides.length === 0 ? (
                    <div className="w-full max-w-2xl rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                      No notice images found yet.
                    </div>
                  ) : (
                    <div className="w-full max-w-2xl">
                      <div className="relative rounded-lg overflow-hidden shadow-md bg-white">
                        <img
                          src={noticeSlides[noticeSlideIndex]?.src}
                          alt={noticeSlides[noticeSlideIndex]?.alt}
                          className="w-full h-auto"
                          loading={noticeSlideIndex === 0 ? "eager" : "lazy"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultAdvocate;
                          }}
                        />

                        {/* Left Arrow */}
                        <button
                          type="button"
                          onClick={showPrevNoticeSlide}
                          aria-label="Previous slide"
                          className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/50 hover:bg-black/60 text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Right Arrow */}
                        <button
                          type="button"
                          onClick={showNextNoticeSlide}
                          aria-label="Next slide"
                          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/50 hover:bg-black/60 text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Counter */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/55 text-white text-xs">
                          {noticeSlideIndex + 1} / {noticeSlides.length}
                        </div>

                        {/* Slide Title */}
                        {noticeSlides[noticeSlideIndex]?.title && (
                          <div className="absolute left-3 right-3 bottom-12 px-3 py-2 rounded-md bg-black/60 text-white text-sm text-center">
                            {noticeSlides[noticeSlideIndex].title}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-gray-100 border-t border-gray-200">
                  <p className="text-gray-600 text-sm text-center">
                    This notice is published for informational purposes by the District Bar Association.
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full mb-4">
                About Us
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Committed to Justice,
                <span className="text-amber-600"> United in Purpose</span>
              </h2>
              <p className="mt-6 text-gray-600 leading-relaxed">
                The District Bar Association stands as a pillar of the legal community,
                dedicated to upholding the principles of justice, ethics, and professional
                excellence. We provide a platform for advocates to connect, grow, and
                serve society together.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Our association offers comprehensive support through welfare programs,
                professional development opportunities, and a strong network of legal
                professionals committed to the rule of law.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-28 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full mb-4">
              Member Benefits
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why Join the Association?
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              Discover the advantages of being part of our esteemed legal community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-56 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center p-6">
                  {feature.image ? (
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultAdvocate;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  )}
                </div>

                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="membership" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full mb-4">
              Membership
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Join Our Association
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              Choose a membership plan that aligns with your professional journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {membershipPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 transition-all ${plan.highlight
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 shadow-xl'
                    : 'bg-stone-50 border border-stone-200'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-amber-600 text-white text-sm font-semibold rounded-full shadow-lg">
                      Popular Choice
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.type}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.highlight ? 'bg-amber-600' : 'bg-gray-400'
                        }`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={`w-full block text-center py-3.5 rounded-xl font-semibold transition-all ${plan.highlight
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                >
                  Apply for Membership
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-gray-500 text-sm">
            Welfare membership available for eligible members. Please contact the office for details and documentation requirements.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-600 bg-white">
                  <img
                    src="/image.png"
                    alt="DBA"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAdvocate;
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold">District Bar Association</h3>
                  <p className="text-xs text-gray-500">Serving Justice Since Establishment</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Dedicated to the welfare of legal professionals and the pursuit of justice.
                Join our community of advocates committed to excellence and integrity.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-amber-500 transition-colors">About Us</a></li>
                <li><a href="#benefits" className="hover:text-amber-500 transition-colors">Benefits</a></li>
                <li><a href="#membership" className="hover:text-amber-500 transition-colors">Membership</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Member Access</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowSearchPopup(true)}
                    className="hover:text-amber-500 transition-colors"
                  >
                    Search Member
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-500 transition-colors">
                    Member Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p>&copy; {new Date().getFullYear()} District Bar Association. All rights reserved.</p>
              <p className="mt-2 md:mt-0 text-gray-500">
                Designed for the Legal Fraternity
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
