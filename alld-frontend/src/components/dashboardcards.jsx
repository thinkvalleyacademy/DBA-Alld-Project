import {
  Users,
  UserCheck,
  Heart,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "./apiService";
import { useAuth } from "../context/AuthContext";

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value.replace(/,/g, '')) || 0;
    
    if (start === end) return;

    const incrementTime = Math.max(duration / end, 10); 
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return count.toLocaleString();
};

function DashboardStats() {
  const [allMembersCount, setAllMembersCount] = useState("0");
  const [generalMembersCount, setGeneralMembersCount] = useState("0");
  const [lifeMembersCount, setLifeMembersCount] = useState("0");
  const [welfareMembersCount, setWelfareMembersCount] = useState("0");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const fetchMembersCount = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowAnimation(true);
        
        console.log("🔄 Fetching members count from API...");
        
        const response = await apiService.memberList({
          page: 0,
          size: 10,
        });
        const genRes =  await apiService.memberList({
          page: 0,
          size: 10,
          memberType: 1,
        });
        const lifeRes =  await apiService.memberList({  
          page: 0,
          size: 1,
          memberType: 2,
        });
        const wellRes =  await apiService.memberList({
          page: 0,
          size: 1,
          memberType: 3,
        });
        const genData = genRes.data.data;
        const lifeData = lifeRes.data.data;
        const wellData = wellRes.data.data;
        
        const data = response.data.data;
        
        if (data && data.totalMembers !== undefined) {
          const totalCount = data.totalMembers;
          const generalCount = genData.totalMembers;
          const lifeCount = lifeData.totalMembers;
          const welfareCount = wellData.totalMembers;
          
          setGeneralMembersCount(generalCount.toString());
        
          setLifeMembersCount(lifeCount.toString());
          
          setWelfareMembersCount(welfareCount.toString());
          setAllMembersCount(totalCount.toString());
        } else {
          console.warn("No totalMembers found in response:", data);
          throw new Error('No member count found in response');
        }
        
      } catch (err) {
        console.error('Error fetching members count:', err);
        setError(err.message || 'Failed to fetch member count');
      } finally {
        setLoading(false);
        // Animation complete hone ke baad reset karenge
        setTimeout(() => setShowAnimation(false), 1500);
      }
    };

    fetchMembersCount();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const stats = [
    {
      title: "All Members",
      value: loading ? "Loading..." : error ? "Error" : allMembersCount,
      subtitle: loading ? "Fetching data..." : error ? "Failed to load" : "Total Members",
      color: "from-blue-500 to-cyan-500",
      icon: Users,
      animate: true,
      route: "/member/list",
    },
    {
      title: "General Members",
      value: loading ? "Loading..." : error ? "Error" : generalMembersCount,
      subtitle: "General Members",
      color: "from-green-500 to-emerald-500",
      icon: UserCheck,
      animate: true,
      route: "/member/list",
    },
    {
      title: "Life Members",
      value: loading ? "Loading..." : error ? "Error" : lifeMembersCount,
      subtitle: "Life Members",
      color: "from-purple-500 to-indigo-600",
      icon: Heart,
      animate: true,
      route: "/lifemember/list",
    },
    {
      title: "Welfare Members",
      value: loading ? "Loading..." : error ? "Error" : welfareMembersCount,
      subtitle: "Welfare Members",
      color: "from-pink-500 to-rose-500",
      icon: TrendingUp,
      animate: true,
      route: "/welfmember/list",
    },
    // {
    //   title: "Today's Registrations",
    //   value: "1",
    //   subtitle: "1 General / 0 Life",
    //   color: "from-orange-500 to-amber-500",
    //   icon: UserPlus,
    //   animate: false,
    // },
    // {
    //   title: "DBA Account",
    //   value: "11556350",
    //   subtitle: "Account Transactions",
    //   color: "from-emerald-500 to-teal-600",
    //   icon: Wallet,
    //   animate: false,
    //   isCurrency: true,
    // },
    // {
    //   title: "Oath Commissioner",
    //   value: "12.00",
    //   subtitle: "Commissioner Account",
    //   color: "from-green-600 to-lime-500",
    //   icon: FileText,
    //   animate: false,
    //   isCurrency: true,
    // },
    // {
    //   title: "Wellfare Account",
    //   value: "817075",
    //   subtitle: "Account Transactions",
    //   color: "from-teal-500 to-cyan-600",
    //   icon: Target,
    //   animate: false,
    //   isCurrency: true,
    // },
    // {
    //   title: "Total Balance",
    //   value: "12373437",
    //   subtitle: "All Account Balance",
    //   color: "from-green-700 to-emerald-600",
    //   icon: BarChart3,
    //   animate: false,
    //   isCurrency: true,
    // },
    // {
    //   title: "Expiring in 90 Days",
    //   value: "10220",
    //   subtitle: "93.12% of Members",
    //   color: "from-sky-400 to-blue-500",
    //   icon: Calendar,
    //   animate: false,
    // },
    // {
    //   title: "Expiring in 30 Days",
    //   value: "10146",
    //   subtitle: "92.45% of Members",
    //   color: "from-amber-500 to-amber-500",
    //   icon: Clock,
    //   animate: false,
    // },
    // {
    //   title: "Expired Subscriptions",
    //   value: "10143",
    //   subtitle: "92.42% Expired",
    //   color: "from-red-500 to-pink-600",
    //   icon: CloudOff,
    //   animate: false,
    // },
  ];

  const formatCurrency = (value) => {
    return `₹${parseInt(value).toLocaleString()}`;
  };

  const formatNumber = (value) => {
    return parseInt(value).toLocaleString();
  };

 const displayValue = (item) => {
  if (loading) {
    return "Calculating...";
  }

  if (error) {
    return "Error";
  }

  const isNumber = !isNaN(item.value);

  // Animate ALL numeric values when showAnimation = true
  if (showAnimation && isNumber) {
    return <AnimatedNumber value={item.value} duration={1500} />;
  }

  // Currency formatting
  if (item.isCurrency && isNumber) {
    return formatCurrency(item.value);
  }

  // Normal number formatting
  if (isNumber) {
    return formatNumber(item.value);
  }

  return item.value;
};


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Hello {user.name}, Welcome to dashboard
        </h1>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Real-time membership statistics and account overview
          </div>
          
          {/* Refresh Button and API Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              loading 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                : error 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {loading ? '🔄 Calculating...' : error ? '❌ API Error' : '✅ Live Data'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {stats.map((item, index) => {
          const IconComponent = item.icon;

          const handleCardClick = () => {
            if (item.route) {
              navigate(item.route);
            }
          };

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-48 flex flex-col justify-between relative overflow-hidden group`}
              onClick={handleCardClick}
            >
              <div className="flex flex-col h-full">
                {/* Top Section */}
                <div className="flex justify-between items-start mb-3 flex-shrink-0 min-h-[60px]">
                  <div className="flex-1 min-w-0 pr-3">
                    <h2 className="text-2xl font-bold mb-1 leading-tight break-all">
                      {displayValue(item)}
                    </h2>
                    <p className="text-lg font-semibold opacity-90 break-words leading-tight">
                      {item.title}
                    </p>
                  </div>
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm w-12 h-12 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex-1 mb-3 min-h-[40px] flex items-center">
                  <p className="text-sm opacity-80 leading-relaxed break-words w-full">
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom Section - Progress bars */}
                <div className="flex-shrink-0">
                  {(item.title.includes('Expiring') || item.title.includes('Expired')) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-70">
                        {item.title.includes('90 Days') ? '93%' :
                         item.title.includes('30 Days') ? '92%' : '92%'}
                      </span>
                      <div className="flex-1 ml-2 max-w-20">
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.title.includes('90 Days') ? 'bg-yellow-300' :
                              item.title.includes('30 Days') ? 'bg-orange-300' : 'bg-red-300'
                            }`}
                            style={{
                              width: item.title.includes('90 Days') ? '93%' :
                                    item.title.includes('30 Days') ? '92%' : '92%'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Loading Indicator */}
              {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}

              {/* Click to view indicator */}
              {item.route && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <div className="flex-1">
              <span className="text-red-700 dark:text-red-300 font-medium">API Error: {error}</span>
            </div>
            <button 
              onClick={handleRefresh}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardStats;
