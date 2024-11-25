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

const VendorRepairComponent = () => {
  const [vendorRepair, setVendorRepair] = useState([]);
  const [isFormVisible, setFormVisible] = useState(false);
  const [isImportFormVisible, setImportFormVisible] = useState(false);
  const [form, setForm] = useState({
    id: "",
    repair_date: "",
    ticket_number: "",
    engineer_name: "",
    username: "",
    bu_name: "",
    material_name: "",
    brand: "",
    type: "",
    serial_number: "",
    cost_center: "",
    pr_number: "",
    po_number: "",
    quotation_date: "",
    cost_without: "",
    status: "",
    vendor_delivery_date: "",
    remarks: "",
  });
  //format date
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
  const [error, setError] = useState("");
  const [isTicketNumberDuplicate, setIsTicketNumberDuplicate] = useState(false);

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
    fetchVendorRepair();
    fetchProfile();
  }, []);

  const fetchVendorRepair = async () => {
    try {
      const response = await axios.get("http://localhost:3001/vendor-repair");
      setVendorRepair(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage)); // Calculate total pages
    } catch (error) {
      console.error("Error fetching vendor repair data:", error);
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
    let formattedValue = value;

    if (
      name === "repair_date" ||
      name === "quotation_date" ||
      name === "date"
    ) {
      formattedValue = dayjs(value).format("YYYY-MM-DD"); // Ensure the format is YYYY-MM-DD
    }

    setForm({ ...form, [name]: formattedValue });

    if (name === "ticket_number") {
      const isDuplicateTicketNumber = vendorRepair.some(
        (repair) => repair.ticket_number.toLowerCase() === value.toLowerCase() // Perbandingan tanpa memperhatikan huruf besar/kecil
      );
      if (isDuplicateTicketNumber) {
        setError(
          "Ticket Number already exists. Please enter a unique Ticket Number."
        );
        setIsTicketNumberDuplicate(true);
      } else {
        setError("");
        setIsTicketNumberDuplicate(false);
      }
    }
  };

  const [inputErrors, setInputErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      "repair_date",
      "ticket_number",
      "engineer_name",
      "username",
      "bu_name",
      "material_name",
      "brand",
      "type",
      "serial_number",
      "cost_center",
      "quotation_date",
      "cost_without",
      "status",
      "vendor_delivery_date",
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

    // Reset input errors if all fields are filled
    setInputErrors({});

    const isDuplicateTicketNumber = vendorRepair.some(
      (repair) =>
        repair.ticket_number === form.ticket_number && repair.id !== form.id
    );

    if (isDuplicateTicketNumber) {
      showAlert(
        "Ticket Number already exists. Please enter a unique Ticket Number."
      );
      return;
    }

    if (
      !form.repair_date ||
      !form.ticket_number ||
      !form.engineer_name ||
      !form.username ||
      !form.bu_name ||
      !form.material_name ||
      !form.brand ||
      !form.type ||
      !form.serial_number ||
      !form.cost_center ||
      !form.quotation_date ||
      !form.cost_without ||
      !form.status ||
      !form.vendor_delivery_date
    ) {
      showAlert("Please fill in all fields before submitting.");
      return;
    }

    try {
      console.log("Submitting form data:", form); // Logging form data

      if (form.id) {
        await axios.put(`http://localhost:3001/vendor-repair/${form.id}`, form);
        showAlert("Vendor repair updated successfully!", "success");
        setIsEditSuccess(true);
        setTimeout(() => setIsEditSuccess(false), 3000);
      } else {
        await axios.post("http://localhost:3001/vendor-repair", form);
        showAlert("Vendor repair added successfully!", "success");
      }
      setForm({
        id: "",
        repair_date: "",
        ticket_number: "",
        engineer_name: "",
        username: "",
        bu_name: "",
        material_name: "",
        brand: "",
        type: "",
        serial_number: "",
        cost_center: "",
        pr_number: "",
        po_number: "",
        quotation_date: "",
        cost_without: "",
        status: "",
        vendor_delivery_date: "",
        remarks: "",
      });
      fetchVendorRepair();
      setFormVisible(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("Error submitting form:", err.message); // Logging error message
    }
  };

  const handleEdit = (repair) => {
    setForm({
      ...repair,
      repair_date: dayjs(repair.repair_date).format("YYYY-MM-DD"),
      quotation_date: dayjs(repair.quotation_date).format("YYYY-MM-DD"),
      date: dayjs(repair.date).format("YYYY-MM-DD"),
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
        await axios.delete(`http://localhost:3001/vendor-repair/${id}`);
        Swal.fire({
          title: "Deleted!",
          text: "Vendor repair removed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchVendorRepair();
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
    e.preventDefault();
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Check for duplicate ticket numbers in the imported data
      const importedTicketNumbers = jsonData.map((item) => item.ticket_number);
      const existingTicketNumbers = vendorRepair.map(
        (item) => item.ticket_number
      );
      const duplicateTicketNumbers = importedTicketNumbers.filter(
        (ticketNumber) => existingTicketNumbers.includes(ticketNumber)
      );

      if (duplicateTicketNumbers.length > 0) {
        showAlert(
          `Duplicate Ticket Numbers found: ${duplicateTicketNumbers.join(
            ", "
          )}. Please ensure all Ticket Numbers are unique.`,
          "error"
        );
        return;
      }

      try {
        await axios.post(
          "http://localhost:3001/vendor-repair/import",
          jsonData
        );
        showAlert("Data imported successfully!", "success");
        fetchVendorRepair();
        setImportFormVisible(false);
      } catch (error) {
        showAlert("Failed to import data. Please try again.", "error");
        console.error("Error importing data:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const vendorRepairFiltered = vendorRepair.filter((repair) =>
    repair.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
    if (showCheckboxes) {
      setSelectedRows([]);
      setSelectAll(false);
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
      setSelectedRows([]);
    } else {
      setSelectedRows(vendorRepairFiltered.map((repair) => repair.id));
    }
    setSelectAll(!selectAll);
  };

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
            axios.delete(`http://localhost:3001/vendor-repair/${id}`)
          )
        );
        Swal.fire({
          title: "Deleted!",
          text: `${selectedRows.length} items removed successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });
        fetchVendorRepair();
        setSelectedRows([]);
      } catch (err) {
        console.error(err.message);
      }
    } else {
      setSelectedRows([]);
    }
  };

  const toggleForm = () => {
    setFormVisible(!isFormVisible);
    setError("");
    setIsTicketNumberDuplicate(false);
    if (isFormVisible) {
      setForm({
        id: "",
        repair_date: "",
        ticket_number: "",
        engineer_name: "",
        username: "",
        bu_name: "",
        material_name: "",
        brand: "",
        type: "",
        serial_number: "",
        cost_center: "",
        pr_number: "",
        po_number: "",
        quotation_date: "",
        cost_without: "",
        status: "",
        vendor_delivery_date: "",
        remarks: "",
      });
    }
  };

  const toggleImportForm = () => {
    setImportFormVisible(!isImportFormVisible);
  };

  const calculateAgeing = (repairDate, deliveryDate) => {
    const repair = new Date(repairDate);
    const delivery = new Date(deliveryDate);
    const differenceInTime = delivery - repair;
    const differenceInDays = differenceInTime / (1000 * 3600 * 24); // Convert milliseconds to days
    return differenceInDays >= 0 ? differenceInDays : 0; // Return 0 if negative
  };

  const [isReportFormVisible, setReportFormVisible] = useState(false);
  const toggleReportForm = () => {
    setReportFormVisible(!isReportFormVisible);
  };

  const formatCurrency = (value) => {
    if (!value) return "0";
    const numberValue = parseInt(value, 10);
    return numberValue.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set jumlah item per halaman

  // Calculate total pages
  const totalPages = Math.ceil(vendorRepairFiltered.length / itemsPerPage);

  // Get current items for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = vendorRepairFiltered.slice(indexOfFirstItem, indexOfLastItem);

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
              <NavbarItem active={true}>Vendor Repair</NavbarItem>
            </Link>
            <Link to="/microsoft">
              <NavbarItem>License</NavbarItem>
            </Link>
            <Link to="/audit1">
              <NavbarItem>Audit 1</NavbarItem>
            </Link>
            <Link to="/audit2">
              <NavbarItem>Audit 2</NavbarItem>
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
                    Add Vendor Repair
                  </button>
                  <button
                    onClick={toggleImportForm}
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
                      <TableCell>No</TableCell>
                      <TableCell>Repair Date</TableCell>
                      <TableCell>Ticket Number</TableCell>
                      <TableCell>Ageing</TableCell>
                      <TableCell>Engineer Name</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>BU's</TableCell>
                      <TableCell>Material Name</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Cost Center</TableCell>
                      <TableCell>PR Number</TableCell>
                      <TableCell>PO Number</TableCell>
                      <TableCell>Quotation Date</TableCell>
                      <TableCell>Cost Without</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Vendor Delivery Date</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Action</TableCell>
                    </TableHeader>
                    {currentItems.map((repair, index) => (
                      <TableRow key={repair.id}>
                        {showCheckboxes && (
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(repair.id)}
                              onChange={() => handleSelectRow(repair.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                        <TableCell>{formatDate(repair.repair_date)}</TableCell>
                        <TableCell>{repair.ticket_number}</TableCell>
                        <TableCell>
                          {calculateAgeing(
                            repair.repair_date,
                            repair.vendor_delivery_date
                          )}{" "}
                          days
                        </TableCell>
                        <TableCell>{repair.engineer_name}</TableCell>
                        <TableCell>{repair.username}</TableCell>
                        <TableCell>{repair.bu_name}</TableCell>
                        <TableCell>{repair.material_name}</TableCell>
                        <TableCell>{repair.brand}</TableCell>
                        <TableCell>{repair.type}</TableCell>
                        <TableCell>{repair.serial_number}</TableCell>
                        <TableCell>{repair.cost_center}</TableCell>
                        <TableCell>{repair.pr_number}</TableCell>
                        <TableCell>{repair.po_number}</TableCell>
                        <TableCell>
                          {formatDate(repair.quotation_date)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(repair.cost_without)}
                        </TableCell>
                        <TableCell>{repair.status}</TableCell>
                        <TableCell>
                          {formatDate(repair.vendor_delivery_date)}
                        </TableCell>
                        <TableCell>{repair.remarks}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => handleEdit(repair)}
                              className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-blue-500 rounded-md hover:bg-blue-700 hover:shadow-lg hover:scale-105"
                            >
                              <Pencil size={16} strokeWidth={1} />
                            </button>
                            <button
                              onClick={() => handleDelete(repair.id)}
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
                  onClick={scrollLeft}
                  className="px-4 py-2 mr-2 text-white bg-gray-300 rounded-md hover:bg-gray-600"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollRight}
                  className="px-4 py-2 text-white bg-gray-300 rounded-md hover:bg-gray-600"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {isFormVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="h-full max-w-3xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                    <h2 className="mb-4 text-xl font-semibold text-center">
                      {form.id ? "Edit Vendor Repair" : "Add Vendor Repair"}
                    </h2>
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-3 gap-6"
                    >
                      <div className="col-span-1">
                        <label htmlFor="repair_date">
                          Repair Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="repair_date"
                          name="repair_date"
                          value={form.repair_date}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.repair_date ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="ticket_number">
                          Ticket Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="ticket_number"
                          name="ticket_number"
                          value={form.ticket_number}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.ticket_number ? 'border-red-500' : ''}`}
                        />
                        {error && <p className="text-red-500">{error}</p>}
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="engineer_name">
                          Engineer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="engineer_name"
                          name="engineer_name"
                          value={form.engineer_name}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.engineer_name ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="username">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={form.username}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.username ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="bu_name">
                          BU Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="bu_name"
                          name="bu_name"
                          value={form.bu_name}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.bu_name ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="material_name">
                          Material Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="material_name"
                          name="material_name"
                          value={form.material_name}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.material_name ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="brand">
                          Brand <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="brand"
                          name="brand"
                          value={form.brand}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.brand ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="type">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="type"
                          name="type"
                          value={form.type}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.type ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="serial_number">
                          Serial Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="serial_number"
                          name="serial_number"
                          value={form.serial_number}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.serial_number ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="cost_center">
                          Cost Center <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="cost_center"
                          name="cost_center"
                          value={form.cost_center}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.cost_center ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="pr_number">PR Number</label>
                        <input
                          type="text"
                          id="pr_number"
                          name="pr_number"
                          value={form.pr_number}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.pr_number ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="po_number">PO Number</label>
                        <input
                          type="text"
                          id="po_number"
                          name="po_number"
                          value={form.po_number}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.po_number ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="quotation_date">
                          Quotation Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="quotation_date"
                          name="quotation_date"
                          value={form.quotation_date}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.quotation_date ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="cost_without">
                          Cost Without PPN (IDR){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="cost_without"
                          name="cost_without"
                          value={form.cost_without}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.cost_without ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="status">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={form.status}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.status ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        >
                          <option>Select Status</option>
                          <option value="Repair">Repair</option>
                          <option value="Finished">Finished</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="date">
                          Vendor Delivery Date{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="vendor_delivery_date"
                          name="vendor_delivery_date"
                          value={form.vendor_delivery_date}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.vendor_delivery_date ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="remarks">Remarks</label>
                        <input
                          type="text"
                          id="remarks"
                          name="remarks"
                          value={form.remarks}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 border border-gray-300 rounded-md ${inputErrors.remarks ? 'border-red-500' : ''}`}
                          disabled={isTicketNumberDuplicate}
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

              {isImportFormVisible && (
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
                        href="../../../../public/excel/vendor repair (1).xlsx"
                        download
                        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      >
                        Download Template
                      </a>

                      <button
                        onClick={toggleImportForm}
                        className="px-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isReportFormVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-[1000px] h-[700px] p-8 mx-4 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto">
                    <h2 className="mb-4 text-xl font-semibold text-center">Report View</h2>
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="border px-4 py-2">No</th>
                          <th className="border px-4 py-2">Repair Date</th>
                          <th className="border px-4 py-2">Ticket Number</th>
                          <th className="border px-4 py-2">Engineer Name</th>
                          <th className="border px-4 py-2">Username</th>
                          <th className="border px-4 py-2">BU Name</th>
                          <th className="border px-4 py-2">Material Name</th>
                          <th className="border px-4 py-2">Brand</th>
                          <th className="border px-4 py-2">Type</th>
                          <th className="border px-4 py-2">Serial Number</th>
                          <th className="border px-4 py-2">Cost Center</th>
                          <th className="border px-4 py-2">PR Number</th>
                          <th className="border px-4 py-2">PO Number</th>
                          <th className="border px-4 py-2">Quotation Date</th>
                          <th className="border px-4 py-2">Cost Without</th>
                          <th className="border px-4 py-2">Status</th>
                          <th className="border px-4 py-2">Vendor Delivery Date</th>
                          <th className="border px-4 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorRepair.map((repair, index) => (
                          <tr key={repair.id}>
                            <td className="border px-4 py-2">{index + 1}</td>
                            <td className="border px-4 py-2">{repair.repair_date}</td>
                            <td className="border px-4 py-2">{repair.ticket_number}</td>
                            <td className="border px-4 py-2">{repair.engineer_name}</td>
                            <td className="border px-4 py-2">{repair.username}</td>
                            <td className="border px-4 py-2">{repair.bu_name}</td>
                            <td className="border px-4 py-2">{repair.material_name}</td>
                            <td className="border px-4 py-2">{repair.brand}</td>
                            <td className="border px-4 py-2">{repair.type}</td>
                            <td className="border px-4 py-2">{repair.serial_number}</td>
                            <td className="border px-4 py-2">{repair.cost_center}</td>
                            <td className="border px-4 py-2">{repair.pr_number}</td>
                            <td className="border px-4 py-2">{repair.po_number}</td>
                            <td className="border px-4 py-2">{repair.quotation_date}</td>
                            <td className="border px-4 py-2">{repair.cost_without}</td>
                            <td className="border px-4 py-2">{repair.status}</td>
                            <td className="border px-4 py-2">{repair.vendor_delivery_date}</td>
                            <td className="border px-4 py-2">{repair.remarks}</td>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorRepairComponent;