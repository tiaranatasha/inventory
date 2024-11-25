import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Info,
  Database,
  Monitor,
  Server,
  Network,
  Briefcase,
  FolderTree,
  BookOpen,
  BarChartHorizontal,
  Folder,
  Pencil,
  Download,
  Trash2,
  ChevronLeft, // Import ChevronLeft
  ChevronRight, // Import ChevronRight
} from "lucide-react";
import Sidebar, { SidebarItem } from "../../components/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import Table from "../../components/Table";
import TableRow from "../../components/TableRow";
import TableHeader from "../../components/TableHeader";
import TableCell from "../../components/TableCell";
import ProfileCard from "../../components/ProfileCard";
import Swal from "sweetalert2"; // Import SweetAlert
import * as XLSX from "xlsx"; // Import XLSX library
import Navbar from "../../components/Navbar";
import NavbarItem from "../../components/NavbarItem";

const PcComponent = () => {
  const [pcs, setPCs] = useState([]);
  const [isFormVisible, setFormVisible] = useState(false);
  const [isImportFormVisible, setImportFormVisible] = useState(false); // Initialize state for import form visibility
  const [isReportVisible, setReportVisible] = useState(false); // State for report visibility
  const [form, setForm] = useState({
    id: "",
    it_code: "",
    brand: "",
    serial_number: "",
    ip_address: "",
    mac_address: "",
    host_name: "",
    location: "",
    business_unit: "",
    department: "",
    username: "",
    status: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const [isEditSuccess, setIsEditSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [macError, setMacError] = useState("");
  const [isIpDuplicate, setIsIpDuplicate] = useState(false); // State to track if IP is duplicate
  const [isMacAddressDuplicate, setIsMacAddressDuplicate] = useState(false); // State to track if mac addres is duplicate
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set jumlah item per halaman
  const [totalPages, setTotalPages] = useState(0);
  

  const tableContainerRef = useRef(null);

  const scrollLeft = () => {
    if (tableContainerRef.current) {
      console.log("Scrolling left");
      tableContainerRef.current.scrollBy({ left: -350, behavior: "smooth" });
    } else {
      console.log("tableContainerRef is not set");
    }
  };

  const scrollRight = () => {
    if (tableContainerRef.current) {
      console.log("Scrolling right");
      tableContainerRef.current.scrollBy({ left: 350, behavior: "smooth" });
    } else {
      console.log("tableContainerRef is not set");
    }
  };

  useEffect(() => {
    fetchPCs();
    fetchProfile();
  }, []);

  const fetchPCs = async () => {
    try {
      const response = await axios.get("http://localhost:3001/pc");
      setPCs(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage)); // Calculate total pages
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:3001/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(response.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Filter PCs berdasarkan IT Code, IP Address, dan MAC Address
  const filteredPCs = pcs.filter(pc =>
    pc.it_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.mac_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate the current PCs to display
  const indexOfLastPC = currentPage * itemsPerPage;
  const indexOfFirstPC = indexOfLastPC - itemsPerPage;
  const currentPCs = filteredPCs.slice(indexOfFirstPC, indexOfLastPC);
  const totalFilteredPages = Math.ceil(filteredPCs.length / itemsPerPage); // Update total pages based on filtered PCs

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

 const handleInputChange  = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Reset errors when user starts typing
    if (name === "ip_address") {
      setError("");
    }
    if (name === "mac_address") {
      setMacError("");
    }

    // Check for duplicate IP address
    if (name === "ip_address") {
      const isDuplicateIP = pcs.some((pc) => pc.ip_address === value && pc.id !== form.id);
      if (isDuplicateIP) {
        setError("IP address already exists. Please enter a unique IP address.");
        setIsIpDuplicate(true); // Set IP duplicate state to true
      } else {
        setError("");
        setIsIpDuplicate(false); // Set IP duplicate state to false
      }
    }

    // Check for duplicate MAC address
    if (name === "mac_address") {
      const isDuplicateMAC = pcs.some((pc) => pc.mac_address === value && pc.id !== form.id);
      if (isDuplicateMAC) {
        setMacError("Mac address already exists. Please enter a unique Mac address.");
        setIsMacAddressDuplicate(true); // Set MAC duplicate state to true
      } else {
        setMacError("");
        setIsMacAddressDuplicate(false); // Set MAC duplicate state to false
      }
    }

    // Check if IP address and MAC address are the same
    if (form.ip_address === form.mac_address) {
      setError("IP address and MAC address cannot be the same.");
      setMacError("IP address and MAC address cannot be the same.");
    } else {
      // Clear errors if they are not the same
      if (name === "ip_address") {
        setMacError("");
      }
      if (name === "mac_address") {
        setError("");
      }
    }
  };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const newFormErrors = {}; // Object to hold error messages

      // Check for empty fields
      const requiredFields = [
        "it_code",
        "brand",
        "serial_number",
        "ip_address",
        "mac_address",
        "host_name",
        "location",
        "business_unit",
        "department",
        "username",
        "status",
      ];

      requiredFields.forEach((field) => {
        if (!form[field]) {
          newFormErrors[field] = "This field is required."; // Set error message for empty fields
        }
      });

      // Check if IP address and MAC address are the same
      if (form.ip_address === form.mac_address) {
        newFormErrors.ip_address = "IP address and MAC address cannot be the same.";
        newFormErrors.mac_address = "IP address and MAC address cannot be the same.";
      }

      // Check for duplicate IP address
      const isDuplicateIP = pcs.some((pc) => pc.ip_address === form.ip_address && pc.id !== form.id);
      if (isDuplicateIP) {
        newFormErrors.ip_address = "IP address already exists. Please enter a unique IP address.";
      }

      // Check for duplicate MAC address
      const isDuplicateMAC = pcs.some((pc) => pc.mac_address === form.mac_address && pc.id !== form.id);
      if (isDuplicateMAC) {
        newFormErrors.mac_address = "Mac address already exists. Please enter a unique Mac address.";
      }

      // If there are errors, set the error state and return
      if (Object.keys(newFormErrors).length > 0) {
        setError(newFormErrors.ip_address || ""); // Set IP error if exists
        setMacError(newFormErrors.mac_address || ""); // Set MAC error if exists
        showAlert("Please fill in all fields before submitting.");
        return;
      }

      // Check if editing and the IP or MAC address is the same as the existing entry
      if (form.id) {
        const existingPC = pcs.find((pc) => pc.id === form.id);
        if (existingPC) {
          if (existingPC.ip_address === form.ip_address) {
            setError("You cannot save the same IP address.");
            showAlert("You cannot save the same IP address.");
            return;
          }
          if (existingPC.mac_address === form.mac_address) {
            setMacError("You cannot save the same MAC address.");
            showAlert("You cannot save the same MAC address.");
            return;
          }
        }
      }

      try {
        if (form.id) {
          await axios.put(`http://localhost:3001/pc/${form.id}`, form);
          showAlert("PC updated successfully!", "success");
          setIsEditSuccess(true);
          setTimeout(() => setIsEditSuccess(false), 3000);
        } else {
          await axios.post("http://localhost:3001/pc", form);
          showAlert("PC added successfully!", "success");
        }
        setForm({
          id: "",
          it_code: "",
          brand: "",
          serial_number: "",
          ip_address: "",
          mac_address: "",
          host_name: "",
          location: "",
          business_unit: "",
          department: "",
          username: "",
          status: "",
        });
        fetchPCs();
        setFormVisible(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      } catch (err) {
        console.error(err.message);
      }
    };

  const handleEdit = (pc) => {
    setForm(pc);
    setFormVisible(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Confirmation",
      text: "Are you sure you want to delete this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3001/pc/${id}`);
        Swal.fire({
          title: "Delete!",
          text: "PC removed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchPCs();
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const showAlert = (message, iconType = "warning") => {
    Swal.fire({
      title: iconType === "success" ? "Success" : "Warning",
      text: message,
      icon: iconType,
      confirmButtonText: "OK",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Check for duplicate IP addresses and MAC addresses in the imported data
      const importedIPs = jsonData.map((item) => item.ip_address);
      const existingIPs = pcs.map((item) => item.ip_address);
      const duplicateIPs = importedIPs.filter((ip) => existingIPs.includes(ip));

      const importedMACs = jsonData.map((item) => item.mac_address);
      const existingMACs = pcs.map((item) => item.mac_address);
      const duplicateMACs = importedMACs.filter((mac) => existingMACs.includes(mac));

      if (duplicateIPs.length > 0 || duplicateMACs.length > 0) {
        let errorMessage = "Duplicate values found:";
        if (duplicateIPs.length > 0) {
          errorMessage += `\nIP Addresses: ${duplicateIPs.join(", ")}`;
        }
        if (duplicateMACs.length > 0) {
          errorMessage += `\nMAC Addresses: ${duplicateMACs.join(", ")}`;
        }
        showAlert(errorMessage, "error");
        return;
      }

      try {
        await axios.post("http://localhost:3001/pc/import", jsonData);
        showAlert("Data imported successfully!", "success");
        fetchPCs();
        setImportFormVisible(false); // Close the import form after successful import
      } catch (error) {
        showAlert("Failed to import data. Please try again.", "error");
        console.error("Error importing data:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const pcsFiltered = pcs.filter(
    (pc) =>
      pc.it_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //select delete rows
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  // Function to handle row selection
  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
    if (showCheckboxes) {
      setSelectedRows([]); // Clear selected rows when hiding checkboxes
      setSelectAll(false); // Reset Select All when hiding checkboxes
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(id)
        ? prevSelectedRows.filter((rowId) => rowId !== id)
        : [...prevSelectedRows, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]); // Deselect all rows
    } else {
      setSelectedRows(pcsFiltered.map((pc) => pc.id)); // Select all rows
    }
    setSelectAll(!selectAll); // Toggle Select All state
  };
  // Function to handle deletion of selected rows
  const handleDeleteSelectedRows = async () => {
    const result = await Swal.fire({
      title: "Confirmation",
      text: `Are you sure you want to delete the selected ${selectedRows.length} items?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      try {
        await Promise.all(
          selectedRows.map((id) =>
            axios.delete(`http://localhost:3001/pc/${id}`)
          )
        );
        Swal.fire({
          title: "Deleted!",
          text: `${selectedRows.length} licenses removed successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchPCs();
        setSelectedRows([]); // Clear selected rows after deletion
      } catch (err) {
        console.error(err.message);
      }
    } else {
      // Clear selected rows if user cancels
      setSelectedRows([]);
    }
  };

  const toggleForm = () => {
    setFormVisible(!isFormVisible);
    setError(""); // Clear IP error
    setMacError(""); // Clear MAC error
    setIsIpDuplicate(false); // Reset IP duplicate state
    setIsMacAddressDuplicate(false); // Reset MAC duplicate state
    if (isFormVisible) {
      setForm({
        id: "",
        it_code: "",
        brand: "",
        serial_number: "",
        ip_address: "",
        mac_address: "",
        host_name: "",
        location: "",
        business_unit: "",
        department: "",
        username: "",
        status: "",
      });
    }
  };

  const toggleImportForm = () => {
    setImportFormVisible(!isImportFormVisible);
  };

  const toggleReportView = () => {
    setReportVisible(!isReportVisible); // Toggle report visibility
  };

  return (
    <>
      <div className="flex">
        <Sidebar>
          <Link to="/budget">
            <SidebarItem icon={<Database size={20} />} text="ISA" />
          </Link>

          <Link to="/pc">
            <SidebarItem icon={<Monitor size={20} />} text="PC" active>
            
              <Link to="/pc/thinclient">
                <SidebarItem text="Thin Client" />
              </Link>
              <Link to="/pc/printer">
                <SidebarItem text="Printer" />
              </Link>
              <Link to="/pc/monitor">
                <SidebarItem text="Monitor" />
              </Link>
            </SidebarItem>
          </Link>

          <Link to="/summary">
            <SidebarItem icon={<Server size={20} />} text="DC" />
          </Link>

          <Link to="/telnet">
            <SidebarItem icon={<Network size={20} />} text="Telnet" />
          </Link>

          <Link to="/project">
            <SidebarItem icon={<Briefcase size={20} />} text="Project" />
          </Link>

          <Link to="/cab">
            <SidebarItem icon={<FolderTree size={20} />} text="CAB" />
          </Link>

          <Link to="/sop_cp">
            <SidebarItem icon={<BookOpen size={20} />} text="SOP/CP" />
          </Link>

          <Link to="/SurveyFeedbackAveris">
            <SidebarItem
              icon={<BarChartHorizontal size={20} />}
              text="Survey Feedback Averis"
            />
          </Link>

          <Link to="/OtherDocuments">
            <SidebarItem icon={<Folder size={20} />} text="Other Documents" />
          </Link>

          <Link to="/help">
            <SidebarItem icon={<Info size={20} />} text="Help" />
          </Link>

          <hr className="my-3" />
        </Sidebar>

        <div className="flex-1 p-6 overflow-x-auto">
          <Navbar>
            <Link to="/pc">
              <NavbarItem active={true}>PC</NavbarItem>
            </Link>
            <Link to="/printer">
              <NavbarItem>Printer</NavbarItem>
            </Link>
            <Link to="/thinclient">
              <NavbarItem>ThinClient</NavbarItem>
            </Link>
            <Link to="/monitor">
              <NavbarItem>Monitor</NavbarItem>
            </Link>
          </Navbar>
          <div>
            <div className="flex-1 p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center mt-4 space-x-2">
                  <input
                    type="search"
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute text-gray-500 transform -translate-y-1/2 right-2 top-1/2 hover:text-gray-700"
                    ></button>
                  )}
                  <button
                    onClick={toggleCheckboxes}
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
                  >
                    {showCheckboxes ? "Cancel Selection " : "Select"}
                  </button>
                  {showCheckboxes && (
                    <button
                      onClick={handleDeleteSelectedRows}
                      className="flex items-center px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-700"
                      disabled={selectedRows.length === 0}
                    >
                      <Trash2 size={21} strokeWidth={1} />
                    </button>
                  )}
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={toggleForm}
                    className="px-4 py-2 text-white transition duration-200 ease-in-out bg-blue-500 rounded-md hover:bg-blue-700"
                  >
                    Add PC
                  </button>
                  <button
                    onClick={() => setImportFormVisible(true)} // Show import form when clicked
                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Import Excel
                  </button>
                  <button
                    onClick={toggleReportView} // Show report view when clicked
                    className="p-2 rounded-md hover:bg-gray-200"
                  >
                    View Report
                  </button>
                </div>
              </div>

              {isFormVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="max-w-5xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                    <h2 className="mb-2 text-lg font-semibold text-center">
                      {form.id ? "Edit PC" : "Add New PC"}
                    </h2>
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <label
                          htmlFor="it_code"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          IT Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="it_code"
                          name="it_code"
                          placeholder="IT Code"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.it_code}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="brand"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Brand <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="brand"
                          name="brand"
                          placeholder="Brand"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.brand}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="serial_number"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Serial Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="serial_number"
                          name="serial_number"
                          placeholder="Serial Number"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.serial_number}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="ip_address"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          IP Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="ip_address"
                          name="ip_address"
                          placeholder="IP Address"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.ip_address}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="mac_address"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Mac Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="mac_address"
                          name="mac_address"
                          placeholder="Mac Address"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.mac_address}
                          onChange={handleInputChange}
                        />
                        {macError && <p className="text-red-500">{macError}</p>} {/* Display MAC error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="host_name"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Host Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="host_name"
                          name="host_name"
                          placeholder="Host Name"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.host_name}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="location"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          placeholder="Location"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.location}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="business_unit"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Business Unit <span className="text-red-500">*</span>
                        </label>
                        <select
                        id="business_unit"
                        name="business_unit"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={form.business_unit}
                        onChange={handleInputChange}
                      >
                        <option>Select Business Unit</option>
                        <option value="PT. Asia Pasific Rayon">
                          PT. Asia Pasific Rayon
                        </option>
                        <option value="PT. Asia Pasific Yarn">
                          PT. Asia Pasific Yarn
                        </option>
                        <option value="PT. Riau Andalan Pulp and Paper">
                          PT. Riau Andalan Pulp and Paper
                        </option>
                        
                        <option value="PT. Riau Andalan Kertas">
                          PT. Riau Andalan Kertas
                        </option>
                        <option value="PT. Riau Prima Energy">
                          PT. Riau Prima Energy
                        </option>
                        <option value="PT. Common Services">
                          PT. Common Services
                        </option>
                      </select>
                      {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="department"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          placeholder="Department"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.department}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="username"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          placeholder="Username"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.username}
                          onChange={handleInputChange}
                        />
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>
                      <div>
                        <label
                          htmlFor="status"
                          className="block mb-1 font-medium text-gray-700"
                        >
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={form.status}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Status</option>
                          <option value="OK">OK</option>
                          <option value="SCRAP">SCRAP</option>
                        </select>
                        {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
                      </div>

                      <div className="flex justify-end col-span-3 mt-4 space-x-4">
                        <button
                          type="submit"
                          className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button onClick={toggleForm} className="text-red-500">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {isImportFormVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="max-w-5xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                    <h2 className="mb-2 text-lg font-semibold text-center">
                      Import Excel File
                    </h2>
                    <label
                      htmlFor="file"
                      className="block mb-1 font-medium text-gray-700"
                    >
                      Select Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="block w-full p-3 mb-4 transition duration-150 ease-in-out border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-end space-x-4">
                      <a
                        href="../../../public/excel/pc.xlsx"
                        download
                        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      >
                        Download Template
                      </a>
                      <button
                        onClick={toggleImportForm}
                        className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              
              <div
                className="overflow-x-auto max-h-96"
                style={{ overflowY: "scroll", overflowX: "auto" }} // Ensure horizontal overflow is enabled
                ref={tableContainerRef}
              >
                <div style={{ width: "2000px" }}>
                  <Table style={{ minWidth: "2000px" }}>
                    <TableHeader>
                      {showCheckboxes && (
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                      )}
                      <TableCell>No</TableCell>
                      <TableCell>IT Code</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Mac Address</TableCell>
                      <TableCell>Host Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Business Unit</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableHeader>

                    {currentPCs.map((pc, index) => (
                      <TableRow key={pc.id}>
                        {showCheckboxes && (
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(pc.id)}
                              onChange={() => handleSelectRow(pc.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                        <TableCell>{pc.it_code}</TableCell>
                        <TableCell>{pc.brand}</TableCell>
                        <TableCell>{pc.serial_number}</TableCell>
                        <TableCell>{pc.ip_address}</TableCell>
                        <TableCell>{pc.mac_address}</TableCell>
                        <TableCell>{pc.host_name}</TableCell>
                        <TableCell>{pc.location}</TableCell>
                        <TableCell>{pc.business_unit}</TableCell>
                        <TableCell>{pc.department}</TableCell>
                        <TableCell>{pc.username}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-md ${
                              pc.status === "OK"
                                ? "bg-green-500 text-white"
                                : pc.status === "Scrap"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {pc.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleEdit(pc)}
                            className="px-2 py-1 mr-2 text-white bg-green-500 rounded-md hover:bg-green-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(pc.id)}
                            className="px-2 py-1 text-white bg-red-500 rounded-md hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-center mt-2">
                <button
                  onClick={scrollLeft} // Attach scrollLeft function
                  className="px-4 py-2 mr-2 text-white bg-gray-300 rounded-md hover:bg-gray-600" // Added margin-right
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollRight} // Attach scrollRight function
                  className="px-4 py-2 text-white bg-gray-300 rounded-md hover:bg-gray-600"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Previous
                </button>
                <span className="mx-4">Page {currentPage} of {totalFilteredPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalFilteredPages}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Next
                </button>
              </div>

              {/* Report View */}
              {isReportVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-[1000px] h-[700px] p-8 mx-4 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto">
                    <h2 className="mb-4 text-xl font-semibold text-center">PC Report View</h2>
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border px-4 py-2">No</th>
                          <th className="border px-4 py-2">IT Code</th>
                          <th className="border px-4 py-2">Brand</th>
                          <th className="border px-4 py-2">Serial Number</th>
                          <th className="border px-4 py-2">IP Address</th>
                          <th className="border px-4 py-2">MAC Address</th>
                          <th className="border px-4 py-2">Host Name</th>
                          <th className="border px-4 py-2">Location</th>
                          <th className="border px-4 py-2">Business Unit</th>
                          <th className="border px-4 py-2">Department</th>
                          <th className="border px-4 py-2">Username</th>
                          <th className="border px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcs.map((pc, index) => (
                          <tr key={pc.id}>
                            <td className="border px-4 py-2">{index + 1}</td>
                            <td className="border px-4 py-2">{pc.it_code}</td>
                            <td className="border px-4 py-2">{pc.brand}</td>
                            <td className="border px-4 py-2">{pc.serial_number}</td>
                            <td className="border px-4 py-2">{pc.ip_address}</td>
                            <td className="border px-4 py-2">{pc.mac_address}</td>
                            <td className="border px-4 py-2">{pc.host_name}</td>
                            <td className="border px-4 py-2">{pc.location}</td>
                            <td className="border px-4 py-2">{pc.business_unit}</td>
                            <td className="border px-4 py-2">{pc.department}</td>
                            <td className="border px-4 py-2">{pc.username}</td>
                            <td className="border px-4 py-2">{pc.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={toggleReportView}
                        className="px-4 py-2 text-red-500 hover:text-red-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PcComponent;
