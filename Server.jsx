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
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
} from "lucide-react"; // Added Chevron imports
import Sidebar, { SidebarItem } from "../../components/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react"; // Added useRef
import Navbar from "../../components/Navbar";
import NavbarItem from "../../components/NavbarItem";
import Table from "../../components/Table";
import TableRow from "../../components/TableRow";
import TableHeader from "../../components/TableHeader";
import TableCell from "../../components/TableCell";
import ProfileCard from "../../components/ProfileCard";
import axios from "axios";
import * as XLSX from "xlsx"; // Import XLSX library
import Swal from "sweetalert2"; // Import SweetAlert

function ServerComponent() {
  const [servers, setServers] = useState([]); // State for servers
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const itemsPerPage = 10; // Set the number of items per page
  const [totalPages, setTotalPages] = useState(0); // State for total pages
  const tableContainerRef = useRef(null); // Reference for the table container
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
  const [isEditSuccess, setIsEditSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [duplicateFields, setDuplicateFields] = useState({ // State untuk menandai field duplikat
    mac_address: false,
    ip_address: false,
    asset_tag_number: false,
});
const [errorMessages, setErrorMessages] = useState({ // State untuk menyimpan pesan kesalahan
  mac_address: "",
  ip_address: "",
  asset_tag_number: "",
});
const [isDisabled, setIsDisabled] = useState(false);
  

  const [isFormVisible, setIsFormVisible] = useState(false); // State untuk form visibility
  const [searchField, setSearchField] = useState(""); // State for search field
  const [isSearchVisible, setIsSearchVisible] = useState(false); // State untuk mengontrol visibilitas input pencarian
  const [form, setForm] = useState({
    // State for form data
    rack: "",
    seq: "",
    type: "",
    active: "",
    asset_category: "",
    asset_number: "",
    asset_tag_number: "",
    site: "",
    location: "",
    user: "",
    job_title: "",
    bu: "",
    domain: "",
    deposit_cyberark: "",
    server_ownership: "",
    application_owner: "",
    system_owner: "",
    business_unit: "",
    add_in_solarwinds: "",
    server_role: "",
    brand: "",
    mac_address: "",
    hostName: "",
    ip_address: "",
    ilo: "",
    model: "",
    serial_no: "",
    physical_virtual: "",
    power_supply_model: "",
    eosl_date: "",
    planned_refresh_date: "",
    eosl_status: "",
    cip: "",
    date_purchased: "",
    power_supply_model_description: "",
    power_consumption: "",
    btu_hour: "",
    po_renewal_maintenance_contract: "",
    po_purchase_material: "",
    cost_local_currency: "",
    indicate_which_currency: "",
    cost_usd: "",
    utilization_storage: "",
    criticalityRating: "",
    dr_enable: "",
    warranty_start_date: "",
    end_date: "",
    date_disposed: "",
    core_each_processor: "",
    number_of_physical_processor: "",
    total_core: "",
    cpu: "",
    ram: "",
    hard_disk: "",
    part_number_harddisk: "",
    usb_disabled: "",
    cd_dvd: "",
    os_version: "",
    remarks: "",
    ms_office_version: "",
    druva: "",
    ip_guard: "",
    fde: "",
  });
  const [devices, setDevices] = useState([]); // Define devices state

  const handleAddDevice = () => {
    setForm({}); // Reset form to initial values
    setIsFormVisible(true); // Show the form
  };

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Cek apakah ada duplikat pada mac_address, ip_address, atau asset_tag_number
    const newDuplicateFields = { mac_address: false, ip_address: false, asset_tag_number: false };
    const newErrorMessages = { mac_address: "", ip_address: "", asset_tag_number: "" };

    // Cek duplikat
    if (name === "mac_address") {
        newDuplicateFields.mac_address = servers.some(server => server.mac_address === value);
        if (newDuplicateFields.mac_address) {
            newErrorMessages.mac_address = "already";
        }
    } else if (name === "ip_address") {
        newDuplicateFields.ip_address = servers.some(server => server.ip_address === value);
        if (newDuplicateFields.ip_address) {
            newErrorMessages.ip_address = "already";
        }
    } else if (name === "asset_tag_number") {
        newDuplicateFields.asset_tag_number = servers.some(server => server.asset_tag_number === value);
        if (newDuplicateFields.asset_tag_number) {
            newErrorMessages.asset_tag_number = "already";
        }
    }

    // Set duplicate fields state
    setDuplicateFields(newDuplicateFields);
    setErrorMessages(newErrorMessages);

    // Jika ada duplikat, tampilkan alert dan disable input lainnya
    if (newDuplicateFields[name]) {
        
        setIsDisabled(true); // Disable semua input
        // Kosongkan input lainnya
        const newForm = { ...form };
        Object.keys(newForm).forEach(key => {
            if (key !== name) {
                newForm[key] = ""; // Clear other fields
            }
        });
        setForm(newForm);
    } else {
        // Jika tidak ada duplikat, aktifkan kembali input
        setIsDisabled(false);
    }
};



  const handleEdit = (server) => {
    setForm(server); // Mengisi form dengan data server yang dipilih
    setIsFormVisible(true); // Menampilkan form
  };

  function handleSubmit(e) {
    e.preventDefault();

    // Cek apakah ada field yang kosong
    for (const [key, value] of Object.entries(form)) {
      if (value === "") {
        Swal.fire("Error!", `Field ${key} cannot be empty.`, "error");
        return; // Hentikan pengiriman jika ada field yang kosong
      }
    }

    // Cek apakah mac_address, ip_address, dan asset_tag_number sudah ada
    const isDuplicate = servers.some(
      (server) =>
        (server.mac_address === form.mac_address &&
          form.mac_address !== form.mac_address) ||
        (server.ip_address === form.ip_address &&
          form.ip_address !== form.ip_address) ||
        (server.asset_tag_number === form.asset_tag_number &&
          form.asset_tag_number !== form.asset_tag_number)
    );

    if (isDuplicate) {
      Swal.fire(
        "Error!",
        "MAC Address, IP Address, or Asset Tag Number must be unique.",
        "error"
      );
      return; // Hentikan pengiriman jika ada duplikat
    }

    // Jika semua field terisi, lanjutkan dengan pengiriman data
    const isActive = form.active === "true" || form.active === true; // Pastikan ini boolean

    const dataToInsert = {
      ...form,
      active: isActive, // Pastikan active adalah boolean
    };

    console.log("Data to insert:", dataToInsert); // Log data yang akan dikirim

    // Cek apakah form memiliki ID untuk menentukan apakah ini edit atau create
    if (form.id) {
      // Jika ada ID, lakukan update
      axios
        .put(`http://localhost:3001/server/${form.id}`, dataToInsert)
        .then(() => {
          Swal.fire("Updated!", "The server has been updated.", "success");
          fetchServers(); // Refresh daftar server
          setForm({}); // Reset form setelah pengiriman
          setIsFormVisible(false); // Sembunyikan form
        })
        .catch((err) => {
          console.error("Error updating server:", err); // Log error
          Swal.fire(
            "Error!",
            "There was an error updating the server.",
            "error"
          );
        });
    } else {
      // Jika tidak ada ID, lakukan create
      axios
        .post("http://localhost:3001/server", dataToInsert)
        .then(() => {
          Swal.fire("Created!", "The server has been created.", "success");
          fetchServers(); // Refresh daftar server
          setForm({}); // Reset form setelah pengiriman
          setIsFormVisible(false); // Sembunyikan form
        })
        .catch((err) => {
          console.error("Error creating server:", err); // Log error
          Swal.fire(
            "Error!",
            "There was an error creating the server.",
            "error"
          );
        });
    }
  }

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible); // Mengubah visibilitas form
  };

  // Fetch servers data
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/server");
        setServers(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage)); // Calculate total pages
      } catch (err) {
        console.error("Error fetching servers:", err);
      }
    };
    fetchServers();
  }, []);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return; // Prevent invalid page numbers
    setCurrentPage(pageNumber);
  };

  // Calculate the current servers to display
  const indexOfLastServer = currentPage * itemsPerPage;
  const indexOfFirstServer = indexOfLastServer - itemsPerPage;
  const currentServers = servers.slice(indexOfFirstServer, indexOfLastServer);

  // Scroll functions (assuming you have these defined)
  const scrollLeft = () => {
    // Implement scroll left logic
  };

  const scrollRight = () => {
    // Implement scroll right logic
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
      setSelectedRows(servers.map((server) => server.id)); // Select all rows
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
            axios.delete(`http://localhost:3001/server/${id}`)
          )
        );
        Swal.fire({
          title: "Deleted!",
          text: `${selectedRows.length} licenses removed successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchServers();
        setSelectedRows([]); // Clear selected rows after deletion
      } catch (err) {
        console.error(err.message);
      }
    } else {
      // Clear selected rows if user cancels
      setSelectedRows([]);
    }
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
  
          const response = await axios.post("http://localhost:3001/server/import", data);
          showAlert("Data imported successfully!");
          fetchServers();
          setUploadVisible(false);
        } catch (error) {
          console.error("Error importing data:", error);
          // Check if the error response contains a message
          if (error.response && error.response.data && error.response.data.message) {
            showAlert(error.response.data.message, true); // Show the specific error message
          } else {
            showAlert("Error importing data: Please check the console for details.", true);
          }
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

  const showAlert = (message, isError = false) => {
    Swal.fire({
      title: isError ? "Error" : "Success",
      text: message,
      icon: isError ? "error" : "success",
      confirmButtonText: "OK",
    });
  };

  // State untuk menampilkan form upload

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Confirmation",
      text: "Are you sure you want to delete this server?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3001/server/${id}`);
        Swal.fire("Deleted!", "The server has been deleted.", "success");
        fetchServers(); // Refresh the server list
      } catch (err) {
        console.error("Error deleting server:", err);
        Swal.fire("Error!", "There was an error deleting the server.", "error");
      }
    }
  };

  //format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [searchFieldTerm, setSearchFieldTerm] = useState(""); // State for search field term

  const handleFieldSearch = (e) => {
    setSearchFieldTerm(e.target.value.toLowerCase());
    const fields = document.querySelectorAll("input, select");
    fields.forEach((field) => {
      const label = field.previousElementSibling;
      if (label && label.textContent.toLowerCase().includes(searchFieldTerm)) {
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.classList.add("bg-yellow-100");
      } else {
        field.classList.remove("bg-yellow-100");
      }
    });
  };

  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false); // State to manage search input visibility

  const toggleSearchInput = () => {
    setIsSearchInputVisible(!isSearchInputVisible); // Toggle search input visibility
  };

  const [dropdownVisible, setDropdownVisible] = useState({
    management: false,
    tape: false,
    server: false,
    storage: false,
    router: false,
    device: false,
    infrastructure: false,
    managementStorage: false, // Unique key for storage and switch
    managementRouter: false, // Unique key for router and pmis
  });

 
  const [activeDropdown, setActiveDropdown] = useState("Management"); // State to track active dropdown

  // Function to handle dropdown toggle and set active dropdown
  const toggleDropdown = (name) => {
    setActiveDropdown(name); // Update active dropdown
    setDropdownVisible((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const [isReportFormVisible, setIsReportFormVisible] = useState(false); // State for report visibility

  const toggleReportForm = () => {
    setIsReportFormVisible(!isReportFormVisible); // Toggle report visibility
  };

  return (
    <>
      <div className="flex">
        <Sidebar>
          <Link to="/budget">
            <SidebarItem icon={<Database size={20} />} text="ISA" />
          </Link>

          <Link to="/pc">
            <SidebarItem icon={<Monitor size={20} />} text="PC" />
          </Link>

          <Link to="/summary">
            <SidebarItem icon={<Server size={20} />} text="DC" active />
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
          <Navbar className="flex flex-wrap items-center justify-between">
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("management")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Management
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.management && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/summary"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Summary
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/master"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Master
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Repeat similar structure for other dropdowns */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("tape")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Tape
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.tape && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/tape_driver"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Driver
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/tape_library"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Library
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("server")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Server
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.server && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/server"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Server
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/decom_server"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Decom Server
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Repeat similar structure for 'storage', 'router', and 'device' */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("managementStorage")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Management
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.managementStorage && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/storage"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Storage
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/Switch"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Switch
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("managementRouter")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Management
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.managementRouter && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/Ruter"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Router
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/Pmis"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Pmis
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("device")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Device
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.device && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/security_device"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Security Device
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/monitoring_device"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Monitoring Device
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("infrastructure")}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
                type="button"
              >
                Infrastructure
                <svg
                  className="w-2.5 h-2.5 ms-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {dropdownVisible.infrastructure && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        to="/firewall"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Firewall
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dc_Utility_equipment"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        DC Utility Equipment
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/fiber_optik"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Fiber Optic
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
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
                    onClick={handleAddDevice} // Memanggil fungsi toggleForm untuk menampilkan form
                    className="px-4 py-2 text-white transition duration-200 ease-in-out bg-blue-500 rounded-md hover:bg-blue-700"
                  >
                    Add New Server
                  </button>
                  <button
                    onClick={toggleUploadForm} // Mengubah fungsi untuk menampilkan form upload
                    className="px-4 py-2 text-white transition duration-200 ease-in-out bg-green-500 rounded-md hover:bg-green-700"
                  >
                    Import Excel
                  </button>
                  <button
                    onClick={toggleReportForm}
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

            <div
              className="overflow-x-auto max-h-96"
              style={{ overflowY: "scroll", overflowX: "auto" }} // Ensure horizontal overflow is enabled
              ref={tableContainerRef} // Attach ref to the table container
            >
              <div style={{ width: "10500px" }}>
                <Table style={{ minWidth: "10500px" }}>
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
                    <TableCell>Rack #</TableCell>
                    <TableCell>Seq #</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Asset Category</TableCell>
                    <TableCell>Asset Number (SAP)</TableCell>
                    <TableCell>Asset Tag Number</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Job Title/Role</TableCell>
                    <TableCell>BU / BG</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Deposit CyberArk</TableCell>
                    <TableCell>SERVER OWNERSHIP / Managed by</TableCell>
                    <TableCell>Application Owner</TableCell>
                    <TableCell>System Owner</TableCell>
                    <TableCell>Business Unit</TableCell>
                    <TableCell>Add in Solarwinds</TableCell>
                    <TableCell>Server Role</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>MAC Address</TableCell>
                    <TableCell>Host Name</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>iLO</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Serial No.</TableCell>
                    <TableCell>Physical / virtual</TableCell>
                    <TableCell>Power Supply Model</TableCell>
                    <TableCell>EOSL date</TableCell>
                    <TableCell>Planned refresh date</TableCell>
                    <TableCell>EOSL status</TableCell>
                    <TableCell>CIP #</TableCell>
                    <TableCell>Date Purchased (YYMMDD)</TableCell>
                    <TableCell>Power Supply Model Description</TableCell>
                    <TableCell>Power Consumption</TableCell>
                    <TableCell>BTU/ hour</TableCell>
                    <TableCell>PO Renewal Maintenance Contract</TableCell>
                    <TableCell>PO Purchase Material #</TableCell>
                    <TableCell>Cost (Local Currency)</TableCell>
                    <TableCell>Indicate Which currency</TableCell>
                    <TableCell>Cost (USD)</TableCell>
                    <TableCell>UTILIZATION STORAGE</TableCell>
                    <TableCell>CRITICALITY RATING</TableCell>
                    <TableCell>DR ENABLE</TableCell>
                    <TableCell>WARRANTY START DATE</TableCell>
                    <TableCell>END DATE</TableCell>
                    <TableCell>DATE DISPOSED</TableCell>
                    <TableCell>CORE EACH PROCESSOR</TableCell>
                    <TableCell>NUMBER OF PHYSICAL PROCESSOR</TableCell>
                    <TableCell>TOTAL CORE</TableCell>
                    <TableCell>CPU</TableCell>
                    <TableCell>RAM</TableCell>
                    <TableCell>HARD DISK</TableCell>
                    <TableCell>PART NUMBER HARDDISK</TableCell>
                    <TableCell>USB DISABLED</TableCell>
                    <TableCell>CD/DVD</TableCell>
                    <TableCell>OS VERSION</TableCell>
                    <TableCell>REMARKS</TableCell>
                    <TableCell>MS OFFICE VERSION</TableCell>
                    <TableCell>DRUVA</TableCell>
                    <TableCell>IP GUARD</TableCell>
                    <TableCell>FDE</TableCell>
                    <TableCell>ACTION</TableCell>
                  </TableHeader>

                  {currentServers.map((server, index) => (
                    <TableRow key={server.id}>
                      {showCheckboxes && (
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(server.id)}
                            onChange={() => handleSelectRow(server.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-center">{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                      <TableCell>{server.rack}</TableCell>
                      <TableCell>{server.seq}</TableCell>
                      <TableCell>{server.type}</TableCell>
                      <TableCell>{server.active}</TableCell>
                      <TableCell>{server.asset_category}</TableCell>
                      <TableCell>{server.asset_number}</TableCell>
                      <TableCell>{server.asset_tag_number}</TableCell>
                      <TableCell>{server.site}</TableCell>
                      <TableCell>{server.location}</TableCell>
                      <TableCell>{server.user}</TableCell>
                      <TableCell>{server.job_title}</TableCell>
                      <TableCell>{server.bu}</TableCell>
                      <TableCell>{server.domain}</TableCell>
                      <TableCell>{server.deposit_cyberark}</TableCell>
                      <TableCell>{server.server_ownership}</TableCell>
                      <TableCell>{server.application_owner}</TableCell>
                      <TableCell>{server.system_owner}</TableCell>
                      <TableCell>{server.business_unit}</TableCell>
                      <TableCell>{server.add_in_solarwinds}</TableCell>
                      <TableCell>{server.server_role}</TableCell>
                      <TableCell>{server.brand}</TableCell>
                      <TableCell>{server.mac_address}</TableCell>
                      <TableCell>{server.host_name}</TableCell>
                      <TableCell>{server.ip_address}</TableCell>
                      <TableCell>{server.ilo}</TableCell>
                      <TableCell>{server.model}</TableCell>
                      <TableCell>{server.serial_no}</TableCell>
                      <TableCell>{server.physical_virtual}</TableCell>
                      <TableCell>{server.power_supply_model}</TableCell>
                      <TableCell>{formatDate(server.eosl_date)}</TableCell>
                      <TableCell>
                        {formatDate(server.planned_refresh_date)}
                      </TableCell>
                      <TableCell>{server.eosl_status}</TableCell>
                      <TableCell>{server.cip}</TableCell>
                      <TableCell>{formatDate(server.date_purchased)}</TableCell>
                      <TableCell>
                        {server.power_supply_model_description}
                      </TableCell>
                      <TableCell>{server.power_consumption}</TableCell>
                      <TableCell>{server.btu_hour}</TableCell>
                      <TableCell>
                        {server.po_renewal_maintenance_contract}
                      </TableCell>
                      <TableCell>{server.po_purchase_material}</TableCell>
                      <TableCell>{server.cost_local_currency}</TableCell>
                      <TableCell>{server.indicate_which_currency}</TableCell>
                      <TableCell>{server.cost_usd}</TableCell>
                      <TableCell>{server.utilization_storage}</TableCell>
                      <TableCell>{server.criticality_rating}</TableCell>
                      <TableCell>{server.dr_enable}</TableCell>
                      <TableCell>
                        {formatDate(server.warranty_start_date)}
                      </TableCell>
                      <TableCell>{formatDate(server.end_date)}</TableCell>
                      <TableCell>{formatDate(server.date_disposed)}</TableCell>
                      <TableCell>{server.core_each_processor}</TableCell>
                      <TableCell>
                        {server.number_of_physical_processor}
                      </TableCell>
                      <TableCell>{server.total_core}</TableCell>
                      <TableCell>{server.cpu}</TableCell>
                      <TableCell>{server.ram}</TableCell>
                      <TableCell>{server.hard_disk}</TableCell>
                      <TableCell>{server.part_number_harddisk}</TableCell>
                      <TableCell>{server.usb_disabled}</TableCell>
                      <TableCell>{server.cd_dvd}</TableCell>
                      <TableCell>{server.os_version}</TableCell>
                      <TableCell>{server.remarks}</TableCell>
                      <TableCell>{server.ms_office_version}</TableCell>
                      <TableCell>{server.druva}</TableCell>
                      <TableCell>{server.ip_guard}</TableCell>
                      <TableCell>{server.fde}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleEdit(server)}
                            className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-blue-500 rounded-md hover:bg-blue-700 hover:shadow-lg hover:scale-105"
                          >
                            <Pencil size={16} strokeWidth={1} />
                          </button>
                          <button
                            onClick={() => handleDelete(server.id)}
                            className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-red-500 rounded-md hover:bg-red-700 hover:shadow-lg hover:scale-105"
                          >
                            <Trash2 size={16} strokeWidth={1} />
                          </button>
                        </div>
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
            <div className="flex justify-center mt-4"> {/* Ubah justify-between menjadi justify-center */}
              <div>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600" 
                >
                  Previous
                </button>
                <span className="mx-4"> Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600" // Changed to blue
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-5xl p-8 mx-2 bg-white border border-gray-300 rounded-md shadow-md">
            <h2 className="mb-2 text-lg font-semibold text-center">
              Add New Server
            </h2>
            <div className="overflow-y-auto h-96">
              {/* Search input for form fields */}
              <div className="flex items-center mb-4">
                <button
                  onClick={toggleSearchInput}
                  className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
                >
                  <Search size={20} />
                </button>
                {isSearchInputVisible && (
                  <input
                    type="text"
                    placeholder="Search field..."
                    className="px-3 py-2 ml-2 border border-gray-300 rounded-md"
                    value={searchFieldTerm}
                    onChange={handleFieldSearch}
                  />
                )}
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
                {/* ... existing form fields ... */}
                <div>
                  <label
                    htmlFor="rack"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Rack #
                  </label>
                  <input
                    type="text"
                    id="rack"
                    name="rack"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "rack" ? "bg-yellow-100" : ""
                    }`}
                    value={form.rack}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="seq"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Seq #
                  </label>
                  <input
                    type="text"
                    id="seq"
                    name="seq"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "seq" ? "bg-yellow-100" : ""
                    }`}
                    value={form.seq}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="type"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Type
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "type" ? "bg-yellow-100" : ""
                    }`}
                    value={form.type}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="active"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Active
                  </label>
                  <input
                    type="text"
                    id="active"
                    name="active"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "active" ? "bg-yellow-100" : ""
                    }`}
                    value={form.active}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>

                <div>
                  <label
                    htmlFor="asset_category"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Asset Category
                  </label>
                  <select
                    id="asset_category"
                    name="asset_category"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "asset_category"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.sset_category}
                    disabled={isDisabled}
                    onChange={handleInputChange}
                  >
                    <option value="">Select</option>
                    <option value="Server">Server</option>
                    <option value="Network Device">Network Device</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="asset_number"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Asset Number
                  </label>
                  <input
                    type="text"
                    id="asset_number"
                    name="asset_number"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "asset_number" ? "bg-yellow-100" : ""
                    }`}
                    value={form.asset_number}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="asset_tag_number"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Asset Tag Number
                  </label>
                  <input
                type="text"
                id="asset_tag_number"
                name="asset_tag_number"
                className={`w-full p-1 border border-gray-300 rounded-md ${duplicateFields.asset_tag_number ? "border-red-500" : ""}`}
                value={form.asset_tag_number}
                onChange={handleInputChange}
                
            />
             {duplicateFields.asset_tag_number && <span className="text-red-500">{errorMessages.asset_tag_number}</span>}
                </div>
                <div>
                  <label
                    htmlFor="site"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Site
                  </label>
                  <input
                    type="text"
                    id="site"
                    name="site"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "site" ? "bg-yellow-100" : ""
                    }`}
                    value={form.site}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="location"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "location" ? "bg-yellow-100" : ""
                    }`}
                    value={form.location}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="user"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    User
                  </label>
                  <input
                    type="text"
                    id="user"
                    name="user"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "user" ? "bg-yellow-100" : ""
                    }`}
                    value={form.user}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="job_title"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "job_title" ? "bg-yellow-100" : ""
                    }`}
                    value={form.job_title}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="bu"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    BU / BG
                  </label>
                  <input
                    type="text"
                    id="bu"
                    name="bu"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "bu" ? "bg-yellow-100" : ""
                    }`}
                    value={form.bu}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="domain"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Domain
                  </label>
                  <input
                    type="text"
                    id="domain"
                    name="domain"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "domain" ? "bg-yellow-100" : ""
                    }`}
                    value={form.domain}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="deposit_cyberark"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Deposit CyberArk
                  </label>
                  <input
                    type="text"
                    id="deposit_cyberark"
                    name="deposit_cyberark"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "deposit_cyberark"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.deposit_cyberark}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="server_ownership"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Server Ownership
                  </label>
                  <input
                    type="text"
                    id="server_ownership"
                    name="server_ownership"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "server_ownership"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.server_ownership}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="application_owner"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Application Owner
                  </label>
                  <input
                    type="text"
                    id="application_owner"
                    name="application_owner"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "application_owner"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.application_owner}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="system_owner"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    System Owner
                  </label>
                  <input
                    type="text"
                    id="system_owner"
                    name="system_owner"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "system_owner" ? "bg-yellow-100" : ""
                    }`}
                    value={form.system_owner}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="business_unit"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Business Unit
                  </label>
                  <input
                    type="text"
                    id="business_unit"
                    name="business_unit"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "business_unit" ? "bg-yellow-100" : ""
                    }`}
                    value={form.business_unit}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="add_in_solarwinds"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Add in Solarwinds
                  </label>
                  <input
                    type="text"
                    id="add_in_solarwinds"
                    name="add_in_solarwinds"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "add_in_solarwinds"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.add_in_solarwinds}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="server_role"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Server Role
                  </label>
                  <select
                    id="server_role"
                    name="server_role"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "server_role" ? "bg-yellow-100" : ""
                    }`}
                    value={form.server_role}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  >
                    <option value="">Select </option>
                    <option value="Application Server">
                      Application Server
                    </option>
                    <option value="Web Server">Web Server</option>
                    <option value="Database Server">Database Server</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="brand"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "brand" ? "bg-yellow-100" : ""
                    }`}
                    value={form.brand}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="mac_address"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    MAC Address
                  </label>
                  <input
                type="text"
                id="mac_address"
                name="mac_address"
                className={`w-full p-1 border border-gray-300 rounded-md ${duplicateFields.mac_address ? "border-red-500" : ""}`}
                value={form.mac_address}
                onChange={handleInputChange}
            />
             {duplicateFields.mac_address && <span className="text-red-500">{errorMessages.mac_address}</span>}
             
                </div>
                <div>
                  <label
                    htmlFor="host_name"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Host Name
                  </label>
                  <input
                    type="text"
                    id="host_name"
                    name="host_name"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "host_name" ? "bg-yellow-100" : ""
                    }`}
                    value={form.host_name}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ip_address"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    IP Address
                  </label>
                  <input
                type="text"
                id="ip_address"
                name="ip_address"
                className={`w-full p-1 border border-gray-300 rounded-md ${duplicateFields.ip_address ? "border-red-500" : ""}`}
                value={form.ip_address}
                onChange={handleInputChange}
                
            />
            {duplicateFields.ip_address && <span className="text-red-500">{errorMessages.ip_address}</span>}
                </div>
                <div>
                  <label
                    htmlFor="ilo"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    iLO
                  </label>
                  <input
                    type="text"
                    id="ilo"
                    name="ilo"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "ilo" ? "bg-yellow-100" : ""
                    }`}
                    value={form.ilo}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="model"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "model" ? "bg-yellow-100" : ""
                    }`}
                    value={form.model}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="serial_no"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Serial No.
                  </label>
                  <input
                    type="text"
                    id="serial_no"
                    name="serial_no"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "serial_no" ? "bg-yellow-100" : ""
                    }`}
                    value={form.serial_no}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="physical_virtual"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Physical / Virtual
                  </label>
                  <input
                    type="text"
                    id="physical_virtual"
                    name="physical_virtual"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "physical_virtual"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.physical_virtual}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="power_supply_model"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Power Supply Model
                  </label>
                  <input
                    type="text"
                    id="power_supply_model"
                    name="power_supply_model"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "power_supply_model"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.power_supply_model}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="eosl_date"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    EOSL Date
                  </label>
                  <input
                    type="date"
                    id="eosl_date"
                    name="eosl_date"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "eosl_date" ? "bg-yellow-100" : ""
                    }`}
                    value={form.eosl_date}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="planned_refresh_date"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Planned Refresh Date
                  </label>
                  <input
                    type="date"
                    id="planned_refresh_date"
                    name="planned_refresh_date"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "planned_refresh_date"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.planned_refresh_date}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="eosl_status"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    EOSL Status
                  </label>
                  <input
                    type="text"
                    id="eosl_status"
                    name="eosl_status"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "eosl_status" ? "bg-yellow-100" : ""
                    }`}
                    value={form.eosl_status}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cip"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    CIP #
                  </label>
                  <input
                    type="text"
                    id="cip"
                    name="cip"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "cip" ? "bg-yellow-100" : ""
                    }`}
                    value={form.cip}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="date_purchased"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Date Purchased
                  </label>
                  <input
                    type="date"
                    id="date_purchased"
                    name="date_purchased"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "date_purchased"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.date_purchased}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="power_supply_model_description"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Power Supply Model Description
                  </label>
                  <input
                    type="text"
                    id="power_supply_model_description"
                    name="power_supply_model_description"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "power_supply_model_description"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.power_supply_model_description}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="power_consumption"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Power Consumption
                  </label>
                  <input
                    type="number"
                    id="power_consumption"
                    name="power_consumption"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "power_consumption"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.power_consumption}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="btu_hour"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    BTU / Hour
                  </label>
                  <input
                    type="number"
                    id="btu_hour"
                    name="btu_hour"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "btu_hour" ? "bg-yellow-100" : ""
                    }`}
                    value={form.btu_hour}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="po_renewal_maintenance_contract"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    PO Renewal Maintenance Contract
                  </label>
                  <input
                    type="text"
                    id="po_renewal_maintenance_contract"
                    name="po_renewal_maintenance_contract"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "po_renewal_maintenance_contract"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.po_renewal_maintenance_contract}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="po_purchase_material"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    PO Purchase Material
                  </label>
                  <input
                    type="text"
                    id="po_purchase_material"
                    name="po_purchase_material"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "po_purchase_material"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.po_purchase_material}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cost_local_currency"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Cost (Local Currency)
                  </label>
                  <input
                    type="number"
                    id="cost_local_currency"
                    name="cost_local_currency"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "cost_local_currency"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.cost_local_currency}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="indicate_which_currency"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Indicate Which Currency
                  </label>
                  <input
                    type="text"
                    id="indicate_which_currency"
                    name="indicate_which_currency"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "indicate_which_currency"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.indicate_which_currency}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cost_usd"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Cost (USD)
                  </label>
                  <input
                    type="text"
                    id="cost_usd"
                    name="cost_usd"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "cost_usd" ? "bg-yellow-100" : ""
                    }`}
                    value={form.cost_usd}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="utilization_storage"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Utilization Storage
                  </label>
                  <input
                    type="text"
                    id="utilization_storage"
                    name="utilization_storage"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "utilization_storage"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.utilization_storage}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="criticality_rating"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Criticality Rating
                  </label>
                  <input
                    type="number"
                    id="criticality_rating"
                    name="criticality_rating"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "criticality_rating"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.criticality_rating}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="dr_enable"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    DR Enable
                  </label>
                  <input
                    type="text"
                    id="dr_enable"
                    name="dr_enable"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "dr_enable" ? "bg-yellow-100" : ""
                    }`}
                    value={form.dr_enable}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="warranty_start_date"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Warranty Start Date
                  </label>
                  <input
                    type="date"
                    id="warranty_start_date"
                    name="warranty_start_date"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "warranty_start_date"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.warranty_start_date}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="end_date"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "end_date" ? "bg-yellow-100" : ""
                    }`}
                    value={form.end_date}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="date_disposed"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Date Disposed
                  </label>
                  <input
                    type="date"
                    id="date_disposed"
                    name="date_disposed"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "date_disposed" ? "bg-yellow-100" : ""
                    }`}
                    value={form.date_disposed}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="core_each_processor"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Core Each Processor
                  </label>
                  <input
                    type="number"
                    id="core_each_processor"
                    name="core_each_processor"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "core_each_processor"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.core_each_processor}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="number_of_physical_processor"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Number of Physical Processor
                  </label>
                  <input
                    type="number"
                    id="number_of_physical_processor"
                    name="number_of_physical_processor"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "number_of_physical_processor"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.number_of_physical_processor}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="total_core"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Total Core
                  </label>
                  <input
                    type="text"
                    id="total_core"
                    name="total_core"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "total_core" ? "bg-yellow-100" : ""
                    }`}
                    value={form.total_core}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cpu"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    CPU
                  </label>
                  <input
                    type="text"
                    id="cpu"
                    name="cpu"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "cpu" ? "bg-yellow-100" : ""
                    }`}
                    value={form.cpu}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ram"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    RAM
                  </label>
                  <input
                    type="number"
                    id="ram"
                    name="ram"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "ram" ? "bg-yellow-100" : ""
                    }`}
                    value={form.ram}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="hard_disk"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Hard Disk
                  </label>
                  <input
                    type="text"
                    id="hard_disk"
                    name="hard_disk"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "hard_disk" ? "bg-yellow-100" : ""
                    }`}
                    value={form.hard_disk}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="part_number_harddisk"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Part Number Hard Disk
                  </label>
                  <input
                    type="text"
                    id="part_number_harddisk"
                    name="part_number_harddisk"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "part_number_harddisk"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.part_number_harddisk}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="usb_disabled"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    USB Disabled
                  </label>
                  <input
                    type="text"
                    id="usb_disabled"
                    name="usb_disabled"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "usb_disabled" ? "bg-yellow-100" : ""
                    }`}
                    value={form.usb_disabled}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cd_dvd"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    CD/DVD
                  </label>
                  <input
                    type="text"
                    id="cd_dvd"
                    name="cd_dvd"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "cd_dvd" ? "bg-yellow-100" : ""
                    }`}
                    value={form.cd_dvd}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="os_version"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    OS Version
                  </label>
                  <input
                    type="text"
                    id="os_version"
                    name="os_version"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "os_version" ? "bg-yellow-100" : ""
                    }`}
                    value={form.os_version}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="remarks"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Remarks
                  </label>
                  <input
                    type="textarea"
                    id="remarks"
                    name="remarks"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "remarks" ? "bg-yellow-100" : ""
                    }`}
                    value={form.remarks}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ms_office_version"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    MS Office Version
                  </label>
                  <input
                    type="text"
                    id="ms_office_version"
                    name="ms_office_version"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "ms_office_version"
                        ? "bg-yellow-100"
                        : ""
                    }`}
                    value={form.ms_office_version}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="druva"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    Druva
                  </label>
                  <input
                    type="text"
                    id="druva"
                    name="druva"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "druva" ? "bg-yellow-100" : ""
                    }`}
                    value={form.druva}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ip_guard"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    IP Guard
                  </label>
                  <input
                    type="text"
                    id="ip_guard"
                    name="ip_guard"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "ip_guard" ? "bg-yellow-100" : ""
                    }`}
                    value={form.ip_guard}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>
                <div>
                  <label
                    htmlFor="fde"
                    className="block mb-1 font-medium text-gray-700"
                  >
                    FDE
                  </label>
                  <input
                    type="text"
                    id="fde"
                    name="fde"
                    className={`w-full p-1 border border-gray-300 rounded-md ${
                      searchFieldTerm === "fde" ? "bg-yellow-100" : ""
                    }`}
                    value={form.fde}
                    onChange={handleInputChange}
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex justify-end col-span-3 mt-4 space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsFormVisible(false)}
                    className="text-red-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {isReportFormVisible && ( // Render the report form when visible
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-[1000px] h-[700px] p-8 mx-4 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto">
      <h2 className="mb-4 text-xl font-semibold text-center">Server Report View</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">No</th>
            <th className="border px-4 py-2">Rack</th>
            <th className="border px-4 py-2">Sequence</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Active</th>
            <th className="border px-4 py-2">Asset Category</th>
            <th className="border px-4 py-2">Asset Number (SAP)</th>
            <th className="border px-4 py-2">Asset Tag Number</th>
            <th className="border px-4 py-2">Site</th>
            <th className="border px-4 py-2">Location</th>
            <th className="border px-4 py-2">User</th>
            <th className="border px-4 py-2">Job Title/Role</th>
            <th className="border px-4 py-2">BU / BG</th>
            <th className="border px-4 py-2">Domain</th>
            <th className="border px-4 py-2">Deposit CyberArk</th>
            <th className="border px-4 py-2">SERVER OWNERSHIP / Managed by</th>
            <th className="border px-4 py-2">Application Owner</th>
            <th className="border px-4 py-2">System Owner</th>
            <th className="border px-4 py-2">Business Unit</th>
            <th className="border px-4 py-2">Add in Solarwinds</th>
            <th className="border px-4 py-2">Server Role</th>
            <th className="border px-4 py-2">Brand</th>
            <th className="border px-4 py-2">MAC Address</th>
            <th className="border px-4 py-2">Host Name</th>
            <th className="border px-4 py-2">IP Address</th>
            <th className="border px-4 py-2">iLO</th>
            <th className="border px-4 py-2">Model</th>
            <th className="border px-4 py-2">Serial No.</th>
            <th className="border px-4 py-2">Physical / virtual</th>
            <th className="border px-4 py-2">Power Supply Model</th>
            <th className="border px-4 py-2">EOSL date</th>
            <th className="border px-4 py-2">Planned refresh date</th>
            <th className="border px-4 py-2">EOSL status</th>
            <th className="border px-4 py-2">CIP #</th>
            <th className="border px-4 py-2">Date Purchased (YYMMDD)</th>
            <th className="border px-4 py-2">Power Supply Model Description</th>
            <th className="border px-4 py-2">Power Consumption</th>
            <th className="border px-4 py-2">BTU/ hour</th>
            <th className="border px-4 py-2">PO Renewal Maintenance Contract</th>
            <th className="border px-4 py-2">PO Purchase Material #</th>
            <th className="border px-4 py-2">Cost (Local Currency)</th>
            <th className="border px-4 py-2">Indicate Which currency</th>
            <th className="border px-4 py-2">Cost (USD)</th>
            <th className="border px-4 py-2">UTILIZATION STORAGE</th>
            <th className="border px-4 py-2">CRITICALITY RATING</th>
            <th className="border px-4 py-2">DR ENABLE</th>
            <th className="border px-4 py-2">WARRANTY START DATE</th>
            <th className="border px-4 py-2">END DATE</th>
            <th className="border px-4 py-2">DATE DISPOSED</th>
            <th className="border px-4 py-2">CORE EACH PROCESSOR</th>
            <th className="border px-4 py-2">NUMBER OF PHYSICAL PROCESSOR</th>
            <th className="border px-4 py-2">TOTAL CORE</th>
            <th className="border px-4 py-2">CPU</th>
            <th className="border px-4 py-2">RAM</th>
            <th className="border px-4 py-2">HARD DISK</th>
            <th className="border px-4 py-2">PART NUMBER HARDDISK</th>
            <th className="border px-4 py-2">USB DISABLED</th>
            <th className="border px-4 py-2">CD/DVD</th>
            <th className="border px-4 py-2">OS VERSION</th>
            <th className="border px-4 py-2">REMARKS</th>
            <th className="border px-4 py-2">MS OFFICE VERSION</th>
            <th className="border px-4 py-2">DRUVA</th>
            <th className="border px-4 py-2">IP GUARD</th>
            <th className="border px-4 py-2">FDE</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server, index) => (
            <tr key={server.id}>
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{server.rack}</td>
              <td className="border px-4 py-2">{server.seq}</td>
              <td className="border px-4 py-2">{server.type}</td>
              <td className="border px-4 py-2">{server.active}</td>
              <td className="border px-4 py-2">{server.asset_category}</td>
              <td className="border px-4 py-2">{server.asset_number}</td>
              <td className="border px-4 py-2">{server.asset_tag_number}</td>
              <td className="border px-4 py-2">{server.site}</td>
              <td className="border px-4 py-2">{server.location}</td>
              <td className="border px-4 py-2">{server.user}</td>
              <td className="border px-4 py-2">{server.job_title}</td>
              <td className="border px-4 py-2">{server.business_unit}</td>
              <td className="border px-4 py-2">{server.domain}</td>
              <td className="border px-4 py-2">{server.deposit_cyberark}</td>
              <td className="border px-4 py-2">{server.server_ownership}</td>
              <td className="border px-4 py-2">{server.application_owner}</td>
              <td className="border px-4 py-2">{server.system_owner}</td>
              <td className="border px-4 py-2">{server.business_unit}</td>
              <td className="border px-4 py-2">{server.add_in_solarwinds}</td>
              <td className="border px-4 py-2">{server.server_role}</td>
              <td className="border px-4 py-2">{server.brand}</td>
              <td className="border px-4 py-2">{server.mac_address}</td>
              <td className="border px-4 py-2">{server.host_name}</td>
              <td className="border px-4 py-2">{server.ip_address}</td>
              <td className="border px-4 py-2">{server.ilo}</td>
              <td className="border px-4 py-2">{server.model}</td>
              <td className="border px-4 py-2">{server.serial_no}</td>
              <td className="border px-4 py-2">{server.physical_virtual}</td>
              <td className="border px-4 py-2">{server.power_supply_model}</td>
              <td className="border px-4 py-2">{server.eosl_date}</td>
              <td className="border px-4 py-2">{server.planned_refresh_date}</td>
              <td className="border px-4 py-2">{server.eosl_status}</td>
              <td className="border px-4 py-2">{server.cip}</td>
              <td className="border px-4 py-2">{server.date_purchased}</td>
              <td className="border px-4 py-2">{server.power_supply_model_description}</td>
              <td className="border px-4 py-2">{server.power_consumption}</td>
              <td className="border px-4 py-2">{server.btu_hour}</td>
              <td className="border px-4 py-2">{server.po_renewal_maintenance_contract}</td>
              <td className="border px-4 py-2">{server.po_purchase_material}</td>
              <td className="border px-4 py-2">{server.cost_local_currency}</td>
              <td className="border px-4 py-2">{server.indicate_which_currency}</td>
              <td className="border px-4 py-2">{server.cost_usd}</td>
              <td className="border px-4 py-2">{server.utilization_storage}</td>
              <td className="border px-4 py-2">{server.criticality_rating}</td>
              <td className="border px-4 py-2">{server.dr_enable}</td>
              <td className="border px-4 py-2">{server.warranty_start_date}</td>
              <td className="border px-4 py-2">{server.end_date}</td>
              <td className="border px-4 py-2">{server.date_disposed}</td>
              <td className="border px-4 py-2">{server.core_each_processor}</td>
              <td className="border px-4 py-2">{server.number_of_physical_processor}</td>
              <td className="border px-4 py-2">{server.total_core}</td>
              <td className="border px-4 py-2">{server.cpu}</td>
              <td className="border px-4 py-2">{server.ram}</td>
              <td className="border px-4 py-2">{server.hard_disk}</td>
              <td className="border px-4 py-2">{server.part_number_harddisk}</td>
              <td className="border px-4 py-2">{server.usb_disabled}</td>
              <td className="border px-4 py-2">{server.cd_dvd}</td>
              <td className="border px-4 py-2">{server.os_version}</td>
              <td className="border px-4 py-2">{server.remarks}</td>
              <td className="border px-4 py-2">{server.ms_office_version}</td>
              <td className="border px-4 py-2">{server.druva}</td>
              <td className="border px-4 py-2">{server.ip_guard}</td>
              <td className="border px-4 py-2">{server.fde}</td>
              <td className="text-center">
                
              </td>
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
    </>
  );
}

export default ServerComponent;