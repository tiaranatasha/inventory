import { Link, useNavigate } from "react-router-dom";
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
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import Sidebar, { SidebarItem } from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import NavbarItem from "../../../components/NavbarItem";
import Table from "../../../components/Table";
import TableRow from "../../../components/TableRow";
import TableHeader from "../../../components/TableHeader";
import TableCell from "../../../components/TableCell";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

const MicrosoftComponent = () => {
  const [microsoft, setMicrosoft] = useState([]);
  const [isFormVisible, setFormVisible] = useState(false);
  const [isReportVisible, setReportVisible] = useState(false);
  const [form, setForm] = useState({
    id: "",
    company_name: "",
    department: "",
    user_name: "",
    account: "",
    products_name: "",
    sku_number: "",
    version: "",
    type_license: "",
    contact_number_vendor: "",
    qty: "",
    effective_date: "",
    expired_date: "",
    po: "",
    vendor_name: "",
    email_vendor: "",
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const [isEditSuccess, setIsEditSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const tableContainerRef = useRef(null);

  const scrollLeft = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -350, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 350, behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchMicrosoft();
    fetchProfile();
  }, []);

  const fetchMicrosoft = async () => {
    try {
      const response = await axios.get("http://localhost:3001/microsoft");
      setMicrosoft(response.data);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const newForm = {
        ...prevForm,
        [name]: value,
      };

      // Update account based on company selection
      if (name === "company_name") {
        newForm.account =
          value === "PT. Asia Pasific Rayon"
            ? "0005438932"
            : value === "PT. Asia Pasific Yarn"
            ? "0005601968"
            : value === "PT. Riau Andalan Pulp and Paper"
            ? "3333"
            : value === "PT. Riau Andalan Kertas"
            ? " 2222"
            : value === "PT. Riau Power Energy"
            ? "1111"
            : value === "PT. Common Services"
            ? "0000"
            : prevForm.account; // Tetap menggunakan nilai sebelumnya jika tidak ada yang dipilih
      }

      // Update SKU based on product selection
      if (name === "products_name") {
        newForm.sku_number =
          value === "Exchange Server Std User CAL 2019"
            ? "AAA-03435"
            : value === "Office MAC 2019"
            ? "AAA-03519"
            : value === "Office Pro Plus 2019"
            ? "AAA-03509"
            : value === "Office Std 2016"
            ? "AAA-03499"
            : value === "Office Std 2019"
            ? "AAA-03499"
            : value === "Project Std 2019"
            ? "AAA-03474"
            : value === "Visio Pro 2019"
            ? "AAA-03915"
            : value === "Windows Remote Dekstop Server 2016"
            ? "AAA-03871"
            : value === "Windows Remote Dekstop Server 2019"
            ? "AAA-03871"
            : value === "Windows Server User CAL 2016"
            ? "AAA-03786"
            : value === "Windows Server User CAL 2019"
            ? "AAA-03786"
            : prevForm.sku_number; // Tetap menggunakan nilai sebelumnya jika tidak ada yang dipilih
      }

      return newForm;
    });
  };
  
  const [inputErrors, setInputErrors] = useState({});
  const handleSubmit = async (e) => {
    e.preventDefault();
    let haserror = false;
    
    const requiredFields = [
      "company_name",
      "products_name",
      "account",
      "sku_number",
      "department",
      "user_name",
      "version",
      "type_license",
      "qty",
      "effective_date",
      "expired_date",
      "po",
      "vendor_name",
      "email_vendor",
    ];

    const emptyFields = requiredFields.filter(field => !form[field]);
    if (emptyFields.length > 0) {
      const errors = {};
      const errorMessages = []; // Array untuk menyimpan pesan kesalahan

      emptyFields.forEach(field => {
        errors[field] = true; // Set error for each empty field
        errorMessages.push(`${field.replace(/_/g, ' ')} is required.`); // Tambahkan pesan kesalahan ke array
      });

      setInputErrors(errors); // Update input errors state
      showAlert(errorMessages.join('\n'), "warning"); // Tampilkan semua pesan kesalahan dalam satu alert
      return;
    }

    
    if (
      !form.company_name ||
      !form.products_name ||
      !form.account ||
      !form.sku_number ||
      !form.department ||
      !form.user_name ||
      !form.version ||
      !form.type_license ||
      !form.qty ||
      !form.effective_date ||
      !form.expired_date ||
      !form.po ||
      !form.vendor_name ||
      !form.email_vendor
    ) {
      showAlert("Please fill in all fields before submitting.", true);
      return;
    }
  
    try {
      let response;
      if (form.id) {
        // Update existing entry
        response = await axios.put(`http://localhost:3001/microsoft/${form.id}`, form);
        showAlert("License entry updated successfully!");
      } else {
        // Create new entry
        response = await axios.post("http://localhost:3001/microsoft", form);
        showAlert("License entry added successfully!");
      }

      // Update state with the new data
      setMicrosoft((prevMicrosoft) => {
        // If updating, replace the old entry; if adding, append the new entry
        if (form.id) {
          return prevMicrosoft.map((item) => (item.id === form.id ? response.data : item));
        } else {
          return [...prevMicrosoft, response.data];
        }
      });

      // Reset form
      setForm({
        id: "",
        company_name: "",
        department: "",
        user_name: "",
        account: "",
        products_name: "",
        sku_number: "",
        version: "",
        type_license: "",
        contact_number_vendor: "",
        qty: "",
        effective_date: "",
        expired_date: "",
        po: "",
        vendor_name: "",
        email_vendor: "",
      });

      // Close the form
      setFormVisible(false);
    } catch (err) {
      console.error(err.message);
    }

  
    
};
  
  const handleEdit = (microsoft) => {
    // Convert date strings to the format expected by input type="date"
    const formattedEffectiveDate = microsoft.effective_date.split("T")[0];
    const formattedExpiredDate = microsoft.expired_date.split("T")[0];

    setForm({
      ...microsoft,
      effective_date: formattedEffectiveDate,
      expired_date: formattedExpiredDate,
    });
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
        await axios.delete(`http://localhost:3001/microsoft/${id}`);
        Swal.fire({
          title: "Deleted!",
          text: "License removed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchMicrosoft();
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const toggleForm = () => {
    setFormVisible(!isFormVisible);
  };

  const showAlert = (message, isError = false) => {
    Swal.fire({
      title: isError ? "Warning" : "Success",
      text: message,
      icon: isError ? "warning" : "success",
      confirmButtonText: "OK",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/"); // Redirect user to the LoginForm page
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set jumlah item per halaman

  const microsoftFiltered = microsoft.filter(
    (microsoft) =>
      microsoft.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      microsoft.sku_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      microsoft.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      microsoft.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total pages
  const totalPages = Math.ceil(microsoftFiltered.length / itemsPerPage);

  // Get current items for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = microsoftFiltered.slice(indexOfFirstItem, indexOfLastItem);

  const calculateRemainingDays = (expiredDate) => {
    const today = dayjs();
    const expiryDate = dayjs(expiredDate);
    return expiryDate.diff(today, "day");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showAlert("No file selected", true);
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Upload",
      text: `Are you sure you want to upload the file: ${file.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, upload it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const bstr = event.target.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          console.log("Parsed Excel data:", data);

          const response = await axios.post(
            "http://localhost:3001/microsoft/import",
            data
          );
          console.log("Server response:", response.data);
          showAlert("Data imported successfully!");
          fetchMicrosoft();
          setUploadVisible(false); // Menutup form upload setelah berhasil
        } catch (error) {
          console.error("Error importing data:", error);
          showAlert(
            `Error importing data: ${error.message}. Please check the console for details.`,
            true
          );
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        showAlert("Error reading file. Please try again.", true);
      };

      reader.readAsBinaryString(file);
    }
  };
  const [isUploadVisible, setUploadVisible] = useState(false); // State untuk menampilkan form upload

  const toggleUploadForm = () => {
    setUploadVisible(!isUploadVisible);
  };

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
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]); // Deselect all rows
    } else {
      setSelectedRows(microsoftFiltered.map((microsoft) => microsoft.id)); // Select all rows
    }
    setSelectAll(!selectAll); // Toggle Select All state
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(id)
        ? prevSelectedRows.filter((rowId) => rowId !== id)
        : [...prevSelectedRows, id]
    );
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
            axios.delete(`http://localhost:3001/microsoft/${id}`)
          )
        );
        Swal.fire({
          title: "Deleted!",
          text: `${selectedRows.length} licenses removed successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchMicrosoft();
        setSelectedRows([]); // Clear selected rows after deletion
      } catch (err) {
        console.error(err.message);
      }
    } else {
      // Clear selected rows if user cancels
      setSelectedRows([]);
    }
  };

  const toggleReportForm = () => {
    setReportVisible(!isReportVisible);
  };

  const handleReportView = () => {
    toggleReportForm();
  };

  return (
    <>
      <div className="flex">
        <Sidebar>
          <Link to="/budget">
            <SidebarItem icon={<Database size={20} />} text="ISA" active />
          </Link>

          <Link to="/pc">
            <SidebarItem icon={<Monitor size={20} />} text="PC" />
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
            <Link to="/budget">
              <NavbarItem>Budget</NavbarItem>
            </Link>
            <Link to="/kpi_pis">
              <NavbarItem>KPI/PIS</NavbarItem>
            </Link>
            <Link to="/audit">
              <NavbarItem>Audit</NavbarItem>
            </Link>
            <Link to="/rfc_vendor">
              <NavbarItem>RFC Vendor</NavbarItem>
            </Link>
            <Link to="/vendor_repair">
              <NavbarItem>Vendor Repair</NavbarItem>
            </Link>
            <Link to="/microsoft">
              <NavbarItem active={true}>License</NavbarItem>
            </Link>
            <Link to="/audit1">
              <NavbarItem>Audit 1</NavbarItem>
            </Link>
            <Link to="/audit2">
              <NavbarItem>Audit 2</NavbarItem>
            </Link>
          </Navbar>
          <div>
            <br />
            <select
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onChange={(e) => (window.location.href = e.target.value)}
            >
              <option value="/microsoft" selected>
                Microsoft
              </option>
              <option value="/vmware">VMWare</option>
              <option value="/veritas">Veritas</option>
              <option value="/hexnode">Hexnode</option>
              <option value="/crowdstrike">Crowdstrike</option>
              <option value="/ipguard">IP Guard</option>
              <option value="/fde">FDE</option>
              <option value="/veemep">Veem EP</option>
              <option value="/autocad">Autocad</option>
              <option value="/adobe">Adobe</option>
              <option value="/minitab">Minitab</option>
              <option value="/mindmngr">Mind Mngr</option>
              <option value="/sketchup">Sketchup</option>
              <option value="/staadpro">StaadPro</option>
              <option value="/lidar">LIDAR</option>
              <option value="/arcgis">ARCGIS</option>
              <option value="/zoom">Zoom</option>
              <option value="/other">Others</option>
            </select>
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleForm}
                    className="px-4 py-2 text-white transition duration-200 ease-in-out bg-blue-500 rounded-md hover:bg-blue-700"
                  >
                    Add License
                  </button>
                  <button
                    onClick={toggleUploadForm} // Mengubah fungsi untuk menampilkan form upload
                    className="px-4 py-2 text-white transition duration-200 ease-in-out bg-green-500 rounded-md hover:bg-green-700"
                  >
                    Import Excel
                  </button>
                  <button
                    onClick={handleReportView}
                    className="p-2 rounded-md hover:bg-gray-200"
                  >
                    View Report
                  </button>
                </div>
              </div>

              {isUploadVisible && ( // Menampilkan form upload jika isUploadVisible true
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-full p-8 mx-4 bg-white border border-gray-300 rounded-md shadow-md h-90 max-w-96">
                    <h2 className="mb-4 text-xl font-semibold text-center">
                      Upload Excel File
                    </h2>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="block w-full p-3 mb-4 transition duration-150 ease-in-out border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-between mt-4">
                      <a
                        href="../../../public/excel/microsoft.xlsx"
                        download
                        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      >
                        Download Template
                      </a>

                      <button
                        onClick={toggleUploadForm}
                        className="px-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isFormVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="h-full max-w-3xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-center">
                  {form.id ? "Edit License" : "Add New License"}
                </h2>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-3 gap-6"
                >
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="company_name"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="company_name"
                        name="company_name"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.company_name ? 'border-red-500' : ''}`}
                        value={form.company_name}
                        onChange={handleInputChange}
                      >
                        <option>Select Company Name</option>
                        <option value="PT. Asia Pasific Rayon">
                          PT. Asia Pasific Rayon
                        </option>
                        <option value="PT. Asia Pasific Yarn">
                          PT. Asia Pasific Yarn
                        </option>
                        <option value="PT. Riau Andalan Pulp and Paper">
                          PT. Riau Andalan Pulp and Paper
                        </option>
                        v
                        <option value="PT. Riau Andalan Kertas">
                          PT. Riau Andalan Kertas
                        </option>
                        <option value="PT. Riau Power Energy">
                          PT. Riau Power Energy
                        </option>
                        <option value="PT. Common Services">
                          PT. Common Services
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="products_name"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Products Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="products_name"
                        name="products_name"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.products_name ? 'border-red-500' : ''}`}
                        value={form.products_name}
                        onChange={handleInputChange}
                      >
                        <option>Select Product Name</option>
                        <option value="Exchange Server Std User CAL 2019">
                          Exchange Server Std User CAL 2019
                        </option>
                        <option value="Office MAC 2019">Office MAC 2019</option>
                        <option value="Office Pro Plus 2019">
                          Office Pro Plus 2019
                        </option>
                        <option value="Office Std 2016">Office Std 2016</option>
                        <option value="Office Std 2019">Office Std 2019</option>
                        <option value="Project Std 2019">
                          Project Std 2019
                        </option>
                        <option value="Visio Pro 2019">Visio Pro 2019</option>
                        <option value="Windows Remote Dekstop Server 2016">
                          Windows Remote Dekstop Server 2016
                        </option>
                        <option value="Windows Remote Dekstop Server 2019">
                          Windows Remote Dekstop Server 2019
                        </option>
                        <option value="Windows Server User CAL 2016">
                          Windows Server User CAL 2016
                        </option>
                        <option value="Windows Server User CAL 2019">
                          Windows Server User CAL 2019
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="account"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Account
                      </label>
                      <input
                        type="text"
                        id="account"
                        name="account"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.account ? 'border-red-500' : ''}`}
                        value={form.account}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="sku_number"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        SKU Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="sku_number"
                        name="sku_number"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.sku_number ? 'border-red-500' : ''}`}
                        value={form.sku_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="department"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.department ? 'border-red-500' : ''}`}
                        value={form.department}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="user_name"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        User Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="user_name"
                        name="user_name"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.user_name ? 'border-red-500' : ''}`}
                        value={form.user_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="version"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Version
                      </label>
                      <input
                        type="text"
                        id="version"
                        name="version"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.version ? 'border-red-500' : ''}`}
                        value={form.version}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="type_license"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Type License <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type_license"
                        name="type_license"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.type_license ? 'border-red-500' : ''}`}
                        value={form.type_license}
                        onChange={handleInputChange}
                      >
                        <option>Select Type License</option>
                        <option value="Per User">Per User</option>
                        <option value="Per Device">Per Device</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="contact_number"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Contact Number vendor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact_number_vendor"
                        name="contact_number_vendor"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={form.contact_number_vendor}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="qty"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Quantity
                      </label>
                      <input
                        type="text"
                        id="qty"
                        name="qty"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.qty ? 'border-red-500' : ''}`}
                        value={form.qty}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="effective_date"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="effective_date"
                        name="effective_date"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.effective_date ? 'border-red-500' : ''}`}
                        value={form.effective_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="expired_date"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Expired Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="expired_date"
                        name="expired_date"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.expired_date ? 'border-red-500' : ''}`}
                        value={form.expired_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="po"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        PO
                      </label>
                      <input
                        type="text"
                        id="po"
                        name="po"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.po ? 'border-red-500' : ''}`}
                        value={form.po}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vendor_name"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Vendor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vendor_name"
                        name="vendor_name"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.vendor_name ? 'border-red-500' : ''}`}
                        value={form.vendor_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email_vendor"
                        className="block mb-1 font-medium text-gray-700"
                      >
                        Vendor Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email_vendor"
                        name="email_vendor"
                        className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.email_vendor ? 'border-red-500' : ''}`}
                        value={form.email_vendor}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end col-span-3 mt-4 space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={toggleForm}
                      className="px-4 py-2 text-red-500 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div
            className="overflow-x-auto max-h-96"
            style={{ overflowY: "scroll", overflowX: "auto" }}
            ref={tableContainerRef}
          >
            <div style={{ width: "3000px" }}>
              <Table style={{ minWidth: "3000px" }}>
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
                  <TableCell className="text-center">No</TableCell>
                  <TableCell className="text-center">Company Name</TableCell>
                  <TableCell className="text-center">Department</TableCell>
                  <TableCell className="text-center">User Name</TableCell>
                  <TableCell className="text-center">Account</TableCell>
                  <TableCell className="text-center">Products Name</TableCell>
                  <TableCell className="text-center">SKU Number</TableCell>
                  <TableCell className="text-center">Version</TableCell>
                  <TableCell className="text-center">Type License</TableCell>
                  <TableCell className="text-center">Contact Number</TableCell>
                  <TableCell className="text-center">Qty/User</TableCell>
                  <TableCell className="text-center">Effective Date</TableCell>
                  <TableCell className="text-center">Expired Date</TableCell>
                  <TableCell className="text-center">Remaining Days</TableCell>
                  <TableCell className="text-center">PO</TableCell>
                  <TableCell className="text-center">Vendor Name</TableCell>
                  <TableCell className="text-center">Email Vendor</TableCell>
                  <TableCell className="text-center">Action</TableCell>
                </TableHeader>
                {currentItems.map((microsoft, index) => {
                  const remainingDays = calculateRemainingDays(
                    microsoft.expired_date
                  );
                  return (
                    <TableRow key={microsoft.id}>
                      {showCheckboxes && (
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(microsoft.id)}
                            onChange={() => handleSelectRow(microsoft.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-center">{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                      <TableCell className="text-center">
                        {microsoft.company_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.department}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.user_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.account}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.products_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.sku_number}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.version}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.type_license}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.contact_number}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.qty}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(microsoft.effective_date)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(microsoft.expired_date)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          style={{
                            color:
                              remainingDays <= 0
                                ? "red"
                                : remainingDays <= 90
                                ? "orange"
                                : "inherit",
                          }}
                        >
                          {remainingDays > 0
                            ? `${remainingDays} days`
                            : "Expired"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.po}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.vendor_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {microsoft.email_vendor}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleEdit(microsoft)}
                            className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-blue-500 rounded-md hover:bg-blue-700 hover:shadow-lg hover:scale-105"
                          >
                            <Pencil size={16} strokeWidth={1} />
                          </button>
                          <button
                            onClick={() => handleDelete(microsoft.id)}
                            className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-red-500 rounded-md hover:bg-red-700 hover:shadow-lg hover:scale-105"
                          >
                            <Trash2 size={16} strokeWidth={1} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
            >
              Previous
            </button>
            <span className="mx-4">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          </div>
          
            {isReportVisible && ( // Render the report view when visible
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-[800px] h-[600px] p-4 mx-4 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto">
      <h2 className="mb-4 text-xl font-semibold text-center">Report View</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">No</th>
            <th className="border px-4 py-2">Company Name</th>
            <th className="border px-4 py-2">Department</th>
            <th className="border px-4 py-2">User Name</th>
            <th className="border px-4 py-2">Account</th>
            <th className="border px-4 py-2">Products Name</th>
            <th className="border px-4 py-2">SKU Number</th>
            <th className="border px-4 py-2">Version</th>
            <th className="border px-4 py-2">Type License</th>
            <th className="border px-4 py-2">Contact Number</th>
            <th className="border px-4 py-2">Quantity</th>
            <th className="border px-4 py-2">Effective Date</th>
            <th className="border px-4 py-2">Expired Date</th>
            <th className="border px-4 py-2">PO</th>
            <th className="border px-4 py-2">Vendor Name</th>
            <th className="border px-4 py-2">Email Vendor</th>
          </tr>
        </thead>
        <tbody>
          {microsoft.map((item, index) => (
            <tr key={item.id}>
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{item.company_name}</td>
              <td className="border px-4 py-2">{item.department}</td>
              <td className="border px-4 py-2">{item.user_name}</td>
              <td className="border px-4 py-2">{item.account}</td>
              <td className="border px-4 py-2">{item.products_name}</td>
              <td className="border px-4 py-2">{item.sku_number}</td>
              <td className="border px-4 py-2">{item.version}</td>
              <td className="border px-4 py-2">{item.type_license}</td>
              <td className="border px-4 py-2">{item.contact_number_vendor}</td>
              <td className="border px-4 py-2">{item.qty}</td>
              <td className="border px-4 py-2">{item.effective_date.split("T")[0]}</td>
              <td className="border px-4 py-2">{item.expired_date.split("T")[0]}</td>
              <td className="border px-4 py-2">{item.po}</td>
              <td className="border px-4 py-2">{item.vendor_name}</td>
              <td className="border px-4 py-2">{item.email_vendor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-4">
        <button
          onClick={toggleReportForm}
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
    </>
  );
};

export default MicrosoftComponent;
