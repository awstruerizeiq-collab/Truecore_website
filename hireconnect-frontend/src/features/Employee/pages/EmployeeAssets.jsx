import React, { useState, useEffect } from "react";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const ASSET_TYPES = {
    laptop: "Laptop",
    mobile: "Mobile Phone",
    tablet: "Tablet",
    sim: "SIM Card",
    other: "Other"
};

export default function EmployeeAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState({
        employeeId: "",
        employeeName: "",
        department: "",
        email: "",
        role: ""
    });
    const [error, setError] = useState(null);

    // Get authentication token
    const getAuthToken = () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        return token ? token.replace('Bearer ', '') : null;
    };

    // Fetch current user details from API
    const fetchCurrentUser = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error("Authentication required");
            }

            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user details");
            }

            const data = await response.json();

            if (data.success && data.data) {
                const userData = data.data;
                return {
                    employeeId: userData.id?.toString() || "",
                    employeeName: userData.fullName || userData.name || "",
                    department: userData.department || "N/A",
                    email: userData.email || "",
                    role: userData.role || "EMPLOYEE"
                };
            }

            throw new Error("Invalid user data received");
        } catch (error) {
            console.error('Error fetching user details:', error);
            // Fallback to localStorage if API fails
            return getUserFromLocalStorage();
        }
    };

    // Fallback: Get user details from localStorage
    const getUserFromLocalStorage = () => {
        try {
            const userId = localStorage.getItem('userId');
            const employeeName = localStorage.getItem('employeeName');
            const userRole = localStorage.getItem('userRole');
            const userDepartment = localStorage.getItem('userDepartment');

            // Try to get additional info from stored user object if available
            const userInfo = localStorage.getItem('userInfo');
            let department = userDepartment || "";
            let email = "";

            if (userInfo) {
                try {
                    const parsed = JSON.parse(userInfo);
                    department = parsed.department || department || "N/A";
                    email = parsed.email || "";
                } catch (_e) {
                    console.log('Could not parse userInfo');
                }
            }

            if (userId && employeeName) {
                return {
                    employeeId: userId,
                    employeeName: employeeName,
                    department: department || "N/A",
                    email: email,
                    role: userRole || "EMPLOYEE"
                };
            }

            return null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    };

    // Fetch employee assets based on employeeId
    const fetchEmployeeAssets = async (employeeId) => {
        try {
            const token = getAuthToken();
            if (!token) {
                setError("Authentication required. Please login again.");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/assets/employee/${employeeId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Only set assets that actually exist in the database
                setAssets(data.data || []);
            } else {
                console.error('Failed to fetch assets:', data.message);
                setAssets([]);
            }
        } catch (error) {
            console.error('Error fetching employee assets:', error);
            setError("Error loading assets. Please refresh the page.");
        }
    };

    useEffect(() => {
        const loadEmployeeData = async () => {
            setLoading(true);
            setError(null);

            try {
                // First, fetch the current user details from API
                const userDetails = await fetchCurrentUser();

                if (userDetails && userDetails.employeeId) {
                    setEmployee(userDetails);

                    // Then fetch their assets
                    await fetchEmployeeAssets(userDetails.employeeId);
                } else {
                    setError("Please login to view your assets");
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setError("Failed to load employee data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadEmployeeData();
    }, []);

    if (error) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto mt-10">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-800 text-lg font-semibold mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Page Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#011A8B]">My Assets</h1>
                <p className="text-gray-600 mt-1">View and manage your assigned company assets</p>
            </div>

            {/* Employee Info Card */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                        <p className="font-semibold text-gray-900">
                            {loading ? (
                                <span className="inline-block w-32 h-5 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                                employee.employeeName || "N/A"
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                        <p className="font-semibold text-gray-900">
                            {loading ? (
                                <span className="inline-block w-20 h-5 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                                employee.employeeId || "N/A"
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                        <p className="font-semibold text-gray-900">
                            {loading ? (
                                <span className="inline-block w-24 h-5 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                                employee.department || "N/A"
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
                        <p className="font-semibold text-gray-900">
                            {loading ? (
                                <span className="inline-block w-24 h-5 bg-gray-200 animate-pulse rounded"></span>
                            ) : (
                                employee.role || "N/A"
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Assets Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Assets</p>
                            <p className="text-3xl font-bold text-[#011A8B] mt-1">
                                {loading ? "..." : assets.length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#011A8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Laptops</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                                {loading ? "..." : assets.filter(a => a.assetType === 'laptop').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Mobile Devices</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">
                                {loading ? "..." : assets.filter(a => a.assetType === 'mobile').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Assigned Assets</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#011A8B] text-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Image</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Asset Type</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Make / Model</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Serial Number</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Accessories</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Issued Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-[#011A8B] border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500">Loading your assets...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-gray-500 font-medium">No assets assigned to you yet</p>
                                            <p className="text-gray-400 text-sm mt-1">Assets will appear here once they are issued to you</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset, index) => (
                                    <tr key={asset.id || index} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            {asset.imagePath ? (
                                                <img
                                                    src={`${API_BASE_URL}/uploads/assets/${asset.imagePath}`}
                                                    alt="Asset"
                                                    className="w-16 h-16 object-cover rounded border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-200"
                                                style={{ display: asset.imagePath ? 'none' : 'flex' }}
                                            >
                                                No Image
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {ASSET_TYPES[asset.assetType] || asset.assetType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{asset.makeModel}</td>
                                        <td className="px-4 py-3 font-mono text-sm text-gray-700">{asset.serialNumber}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{asset.accessories || 'None'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${asset.condition === 'New' ? 'bg-green-100 text-green-800' :
                                                    asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {asset.condition}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{asset.dateIssued}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Important Note */}
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm text-blue-800 font-semibold">Important Note</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Please take good care of the assigned assets. Report any issues, damages, or loss to your manager immediately. You are responsible for the proper use and security of these assets.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
