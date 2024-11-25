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
  Trash,
  FileText,
} from "lucide-react";
import Sidebar, { SidebarItem } from "../../components/Sidebar";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import ProfileCard from "../../components/ProfileCard";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Table from "../../components/Table"; // Import Table component
import TableRow from "../../components/TableRow"; // Import TableRow component
import TableHeader from "../../components/TableHeader"; // Import TableHeader component
import TableCell from "../../components/TableCell"; // Import TableCell component
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"; // Import Trash2 and Chevron icons
import Swal from "sweetalert2"; // Import SweetAlert2
import * as XLSX from 'xlsx'; // Import XLSX for Excel handling

function TelnetComponent() {
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [showCheckboxes, setShowCheckboxes] = useState(false); // State for showing checkboxes
  const [selectedRows, setSelectedRows] = useState([]); // State for selected rows
  const [devices, setDevices] = useState([]); // State for devices
  const [isEditSuccess, setIsEditSuccess] = useState(false);
  const [isIpDuplicate, setIsIpDuplicate] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    // State for form data
    area: "",
    role: "",
    ip_address: "",
    hostname: "",
    brand: "",
    device_type: "",
    serial_number: "",
    source_date: "",
  });
  const [isFormVisible, setIsFormVisible] = useState(false); // State for form visibility
  const [isImportFormVisible, setImportFormVisible] = useState(false); // State for import form visibility
  const [isReportFormVisible, setReportFormVisible] = useState(false); // State for report form visibility
  const [reportData, setReportData] = useState([]); // State for report data
  const tableContainerRef = useRef(null); // Reference for the table container
  const [formErrors, setFormErrors] = useState({}); // State for form errors
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set jumlah item per halaman
  const [totalPages, setTotalPages] = useState(0); // State for total pages

  useEffect(() => {
    fetchDevices(); // Fetch device data on component mount
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get("http://localhost:3001/telnet"); // Adjust the endpoint as necessary
      setDevices(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage)); // Calculate total pages
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === devices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(devices.map((device) => device.id));
    }
  };

  const handleDeleteSelectedRows = async () => {
    const result = await Swal.fire({
      title: "Confirmation",
      text: "Are you sure you want to delete the selected items?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Loop through selectedRows and delete each one
        await Promise.all(selectedRows.map(async (id) => {
          await axios.delete(`http://localhost:3001/telnet/${id}`);
        }));

        Swal.fire({
          title: "Deleted!",
          text: "Selected items have been deleted successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });

        // Update state devices to remove deleted items
        setDevices((prevDevices) => prevDevices.filter(device => !selectedRows.includes(device.id)));
        setSelectedRows([]); // Clear selected rows after deletion
      } catch (err) {
        console.error("Error deleting selected rows:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while deleting the selected items.",
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "ip_address") {
      const isDuplicateIP = devices.some((device) => device.ip_address === value);
      if (isDuplicateIP) {
        setError("IP address already exists. Please enter a unique IP address.");
        setIsIpDuplicate(true);
      } else {
        setError("");
        setIsIpDuplicate(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for empty fields
    const newFormErrors = {};
    Object.keys(form).forEach((key) => {
      if (!form[key]) {
        newFormErrors[key] = "This field is required."; // Set error message for empty fields
      }
    });

    // Check for duplicate IP address
    const isDuplicateIP = devices.some((device) => device.ip_address === form.ip_address && device.id !== form.id);
    if (isDuplicateIP) {
      newFormErrors.ip_address = "IP address already exists. Please enter a unique IP address.";
    }

    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors);
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please fill in all required fields before submitting.",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/telnet", form);
      console.log("Server response:", response.data);
      
      // Alert success after data has been added
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data has been successfully added!",
      });

      // Update state devices with new data
      setDevices((prevDevices) => [...prevDevices, response.data]);

      setIsFormVisible(false); // Hide the form after submission

      // After successful submission, set the report data
      setReportData((prevData) => [...prevData, form]); // Include the newly added device in the report
    } catch (error) {
      console.error("Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while submitting the form.",
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // Ensure file exists

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      // Call function to import data
      await handleImportTelnet(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportTelnet = async (data) => {
    try {
      const response = await axios.post('http://localhost:3001/telnet/import', data);
      console.log('Data imported successfully:', response.data);
      
      // Call fetchDevices to refresh data after import
      fetchDevices(); // Refresh data

      // Show success message using SweetAlert2
      Swal.fire({
        icon: 'success',
        title: 'Import Successful',
        text: 'Data has been successfully imported from Excel!',
      }).then(() => {
        toggleImportForm(); // Close import form after confirmation
      });

    } catch (error) {
      console.error('Error importing data:', error);
      // Show error message to user
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: 'An error occurred while importing the data. Please try again.',
      });
    }
  };

  const toggleImportForm = () => {
    setImportFormVisible(!isImportFormVisible); // Toggle visibility of import form
  };

  const toggleReportForm = () => {
    setReportFormVisible(!isReportFormVisible); // Toggle report visibility
    if (!isReportFormVisible) {
      setReportData(devices); // Set report data to current devices when opening the report
    }
  };

  // Filter devices based on search term
  const filteredDevices = devices.filter(device =>
    device.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.hostname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total pages based on filtered data
  const totalFilteredPages = Math.ceil(filteredDevices.length / itemsPerPage);

  // Get current items for the page
  const indexOfLastDevice = currentPage * itemsPerPage;
  const indexOfFirstDevice = indexOfLastDevice - itemsPerPage;
  const currentDevices = filteredDevices.slice(indexOfFirstDevice, indexOfLastDevice);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleEdit = (device) => {
    setForm({
      area: device.area,
      role: device.role,
      ip_address: device.ip_address,
      hostname: device.hostname,
      brand: device.brand,
      device_type: device.device_type,
      serial_number: device.serial_number,
      source_date: device.source_date,
    });
    setFormErrors({}); // Reset errors when editing
    setIsFormVisible(true); // Show the form for editing
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
        await axios.delete(`http://localhost:3001/telnet/${id}`);
        Swal.fire({
          title: "Delete!",
          text: "Telnet removed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
        // Update state devices to remove deleted item
        setDevices((prevDevices) => prevDevices.filter(device => device.id !== id));
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false); // Hide the form
    setForm({ // Reset form to initial state
      area: "",
      role: "",
      ip_address: "",
      hostname: "",
      brand: "",
      device_type: "",
      serial_number: "",
      source_date: "",
    });
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
            <SidebarItem icon={<Server size={20} />} text="DC" />
          </Link>
          <Link to="/telnet">
            <SidebarItem icon={<Network size={20} />} text="Telnet" active />
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

        <div className="flex-1 p-6 main-content">
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
                >
                  &times; {/* Clear search button */}
                </button>
              )}
              <button
                onClick={() => setShowCheckboxes(!showCheckboxes)}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-700"
              >
                {showCheckboxes ? "Cancel Selection" : "Select"}
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
                onClick={() => setIsFormVisible(true)} // Call the add device function
                className="px-4 py-2 text-white transition duration-200 ease-in-out bg-blue-500 rounded-md hover:bg-blue-700"
              >
                Add Telnet
              </button>
              <button
                onClick={toggleImportForm} // Call the import Excel function
                className="px-4 py-2 text-white transition duration-200 ease-in-out bg-green-500 rounded-md hover:bg-green-700"
              >
                Import Excel
              </button>
              <button
                onClick={toggleReportForm}
                className="px-4 py-2 text-black hover:text-gray-700"
              >
                View Report
              </button>
            </div>
          </div>

          {isFormVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="max-w-5xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                <h2 className="mb-2 text-lg font-semibold text-center">Add New Device</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="area" className="block mb-1 font-medium text-gray-700">Area</label>
                    <input
                      type="text"
                      id="area"
                      name="area"
                      placeholder="Area"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.area}
                      onChange={handleInputChange}
                    />
                    {formErrors.area && <p className="text-red-500">{formErrors.area}</p>}
                  </div>
                  <div>
                    <label htmlFor="role" className="block mb-1 font-medium text-gray-700">Role</label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      placeholder="Role"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.role}
                      onChange={handleInputChange}
                    />
                    {formErrors.role && <p className="text-red-500">{formErrors.role}</p>}
                  </div>
                  <div>
                    <label 
                    htmlFor="ip_address" className="block mb-1 font-medium text-gray-700">
                    IP Address <span className="text-red-500">*</span> {/* Red asterisk */}
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
                    {formErrors.ip_address && <p className="text-red-500">{formErrors.ip_address}</p>}
                  </div>
                  <div>
                    <label htmlFor="hostname" className="block mb-1 font-medium text-gray-700">Host Name</label>
                    <input
                      type="text"
                      id="hostname"
                      name="hostname"
                      placeholder="Host Name"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.hostname}
                      onChange={handleInputChange}
                    />
                    {formErrors.hostname && <p className="text-red-500">{formErrors.hostname}</p>}
                  </div>
                  <div>
                    <label htmlFor="brand" className="block mb-1 font-medium text-gray-700">Brand</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      placeholder="Brand"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.brand}
                      onChange={handleInputChange}
                    />
                    {formErrors.brand && <p className="text-red-500">{formErrors.brand}</p>}
                  </div>
                  <div>
                    <label htmlFor="device_type" className="block mb-1 font-medium text-gray-700">Device Type</label>
                    <input
                      type="text"
                      id="device_type"
                      name="device_type"
                      placeholder="Device Type"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.device_type}
                      onChange={handleInputChange}
                    />
                    {formErrors.device_type && <p className="text-red-500">{formErrors.device_type}</p>}
                  </div>
                  <div>
                    <label htmlFor="serial_number" className="block mb-1 font-medium text-gray-700">Serial Number</label>
                    <input
                      type="text"
                      id="serial_number"
                      name="serial_number"
                      placeholder="Serial Number"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.serial_number}
                      onChange={handleInputChange}
                    />
                    {formErrors.serial_number && <p className="text-red-500">{formErrors.serial_number}</p>}
                  </div>
                  <div>
                    <label htmlFor="source_date" className="block mb-1 font-medium text-gray-700">Source Date</label>
                    <input
                      type="date"
                      id="source_date"
                      name="source_date"
                      className="w-full p-1 border border-gray-300 rounded-md"
                      value={form.source_date}
                      onChange={handleInputChange}
                    />
                    {formErrors.source_date && <p className="text-red-500">{formErrors.source_date}</p>}
                  </div>
                  <div className="flex justify-end col-span-3 mt-4 space-x-4">
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsFormVisible(false)} // Call the cancel function
                      className="text-red-500"
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
              <div className="max-w-5xl p-8 mx-2 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                <h2 className="mb-2 text-lg font-semibold text-center">Import Excel File</h2>
                <label htmlFor="file" className="block mb-1 font-medium text-gray-700">Select Excel File</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="block w-full p-3 mb-4 transition duration-150 ease-in-out border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-end space-x-4">
                  <a
                    href="../../../public/excel/telnet_data.xlsx"
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

          {isReportFormVisible && ( // Render the report view when visible
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-[1200px] h-[800px] p-8 mx-4 bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto"> {/* Increased size */}
                <h2 className="mb-4 text-xl font-semibold text-center">Telnet Report View</h2>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">No</th>
                      <th className="border px-4 py-2">Area</th>
                      <th className="border px-4 py-2">Role</th>
                      <th className="border px-4 py-2">IP Address</th>
                      <th className="border px-4 py-2">Hostname</th>
                      <th className="border px-4 py-2">Brand</th>
                      <th className="border px-4 py-2">Device Type</th>
                      <th className="border px-4 py-2">Serial Number</th>
                      <th className="border px-4 py-2">Source Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((device, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{device.area}</td>
                        <td className="border px-4 py-2">{device.role}</td>
                        <td className="border px-4 py-2">{device.ip_address}</td>
                        <td className="border px-4 py-2">{device.hostname}</td>
                        <td className="border px-4 py-2">{device.brand}</td>
                        <td className="border px-4 py-2">{device.device_type}</td>
                        <td className="border px-4 py-2">{device.serial_number}</td>
                        <td className="border px-4 py-2">{formatDate(device.source_date)}</td>
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

          <div className="overflow-x-auto" ref={tableContainerRef}>
            <Table>
              <TableHeader>
                {showCheckboxes && (
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === devices.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell>No</TableCell>
                <TableCell>AREA</TableCell>
                <TableCell>ROLE</TableCell>
                <TableCell>IP ADDRESS</TableCell>
                <TableCell>HOSTNAME</TableCell>
                <TableCell>BRAND</TableCell>
                <TableCell>DEVICE TYPE</TableCell>
                <TableCell>SERIAL NUMBER</TableCell>
                <TableCell>SOURCE DATE</TableCell>
                <TableCell>Action</TableCell>
              </TableHeader>
              <tbody>
                {currentDevices.map((device, index) => (
                  <TableRow key={device.id}>
                    {showCheckboxes && (
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(device.id)}
                          onChange={() => handleSelectRow(device.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                    <TableCell>{device.area}</TableCell>
                    <TableCell>{device.role}</TableCell>
                    <TableCell>{device.ip_address}</TableCell>
                    <TableCell>{device.hostname}</TableCell>
                    <TableCell>{device.brand}</TableCell>
                    <TableCell>{device.device_type}</TableCell>
                    <TableCell>{device.serial_number}</TableCell>
                    <TableCell>{formatDate(device.source_date)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleEdit(device)}
                        className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-blue-500 rounded-md hover:bg-blue-700 hover:shadow-lg hover:scale-105"
                      >
                        <Pencil size={16} strokeWidth={1} />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="px-2 py-1 text-white transition duration-300 ease-in-out transform bg-red-500 rounded-md hover:bg-red-700 hover:shadow-lg hover:scale-105"
                      >
                        <Trash2 size={16} strokeWidth={1} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Previous
            </button>
            <span className="mx-4">Page {currentPage} of {totalFilteredPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalFilteredPages))}
              disabled={currentPage === totalFilteredPages}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TelnetComponent;
