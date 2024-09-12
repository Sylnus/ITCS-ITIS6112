import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import CheckboxDropdownComponent, {
  createStyles
} from "react-checkbox-dropdown";

//creates table
const Record = ({ record, editRecord, deleteRecord }) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    <td className="p-4 align-middle">{record.name}</td>
    <td className="p-4 align-middle">{record.position}</td>
    <td className="p-4 align-middle">{record.level}</td>
    <td className="p-4 align-middle">
      <div className="flex gap-2">
        <button
          className="inline-flex items-center justify-center text-sm font-medium border bg-background hover:bg-slate-100 h-9 rounded-md px-3"
          onClick={() => editRecord(record._id)}
        >
          Edit
        </button>
        <button
          className="inline-flex items-center justify-center text-sm font-medium border bg-background hover:bg-slate-100 h-9 rounded-md px-3"
          onClick={() => deleteRecord(record._id, record.isNew)}
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
);

export default function RecordList() {
  const [records, setRecords] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [hasUnsavedRecords, setHasUnsavedRecords] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  //dropdown
  const DropdownOptions = ["Intern", "Junior", "Senior"].map(item => ({ value: item, label: item }));
  const [checkboxValue, setCheckboxValue] = useState([]);

  // This method fetches the records from the database.
  useEffect(() => {
    fetch(`http://localhost:5050/record/`)
      .then(response => response.json())
      .then(data => setRecords(data))
      .catch(error => console.error('Error fetching records:', error));
  }, []);

  const handleUploadClick = () => fileInputRef.current.click();
//handles excel file parsing assuming excel sheet has data in 3 columns
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.every(row => row.length === 3)) {
          const formattedData = jsonData.map(row => ({
            _id: uuidv4(),
            name: row[0],
            position: row[1],
            level: row[2],
            isNew: true,
          }));
          setRecords(prevRecords => [...prevRecords, ...formattedData]);
          setShowSaveButton(true);
          setHasUnsavedRecords(true);
        } else {
          alert('Invalid file format. Please ensure the file has 3 columns: Name, Position, Level.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
//handles filtering results from dropdown
  const handleCheckbox = async () => {
    if(checkboxValue.length === 0) {
      await fetch(`http://localhost:5050/record/`)
      .then(response => response.json())
      .then(data => setRecords(data))
      .catch(error => console.error('Error fetching records:', error));
    } else {
      console.log("I'm working!")
      await fetch(`http://localhost:5050/record/`)
      .then(response => response.json())
      .then(data => setRecords(data))
      .catch(error => console.error('Error fetching records:', error));
      const updatedRecords = records.filter(function (val) {
      var returnVal = false;
      for (let i = 0; i < checkboxValue.length; i++) {
        console.log("Checkbox value:");
        console.log(checkboxValue[i].value);
        console.log("val level:");
        console.log(val.level);
        if (val.level === checkboxValue[i].value) {
          returnVal = true;
        }
      }
      return returnVal;
    });
    setRecords(updatedRecords)
    }
  }
//handles saving records with database
  const handleSave = async () => {
    const newRecords = records.filter(record => record.isNew);
    try {
      await Promise.all(newRecords.map(record =>
        fetch("http://localhost:5050/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        })
      ));
      alert('Data saved successfully!');
      setShowSaveButton(false);
      setHasUnsavedRecords(false);
      const updatedRecords = await fetch(`http://localhost:5050/record/`).then(res => res.json());
      setRecords(updatedRecords);
    } catch (error) {
      alert('Failed to save data.');
      console.error('Error saving records:', error);
    }
  };
  // This method will delete a record
  const deleteRecord = async (id, isNew) => {
    if (isNew) {
      setRecords(records.filter(record => record._id !== id));
    } else {
      try {
        await fetch(`http://localhost:5050/record/${id}`, { method: "DELETE" });
        setRecords(records.filter(record => record._id !== id));
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };
//handles the edit page and button
  const editRecord = (id) => {
    if (hasUnsavedRecords) {
      alert('Please click Save first before editing.');
    } else {
      navigate(`/edit/${id}`);
    }
  };
  // This following section will display the table with the records of individuals.
  return (
    <div className="container mx-auto p-4">
      <h3 className="text-lg font-semibold mb-4">Employee Records</h3>
      <div className="default">
        <CheckboxDropdownComponent
          displayText="Filter by Level"
          options={DropdownOptions}
          onChange={option => {
            if (!checkboxValue.includes(option)) {
              console.log('change');
              const newValue = [...checkboxValue, option];
              setCheckboxValue(newValue);
            }
            handleCheckbox();
          }}
          onDeselectOption={option => {
            console.log('deselect');
            const filteredOptions = checkboxValue.filter(
              item => item.value !== option.value
            );
            setCheckboxValue(filteredOptions);
            handleCheckbox();
          }}
          value={checkboxValue}
          isStrict={true}
        />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left font-medium">Name</th>
                <th className="h-12 px-4 text-left font-medium">Position</th>
                <th className="h-12 px-4 text-left font-medium">Level</th>
                <th className="h-12 px-4 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <Record
                  key={record._id}
                  record={record}
                  deleteRecord={deleteRecord}
                  editRecord={editRecord}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center text-md font-medium border bg-background hover:bg-slate-100 h-9 rounded-md px-3 mt-4"
        onClick={handleUploadClick}
      >
        Upload Records
      </button>
      <input
        type="file"
        accept=".xlsx, .xls"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {showSaveButton && (
        <button
          onClick={handleSave}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
        >
          Save
        </button>
      )}
    </div>
  );
}