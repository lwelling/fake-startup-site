import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Pipeline() {
  const [cars, setCars] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isScanning, setIsScanning] = useState(false);
  const [scanModal, setScanModal] = useState(null);
  const [completedItems, setCompletedItems] = useState([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCars() {
      const snap = await getDocs(collection(db, 'pipeline'));
      const data = snap.docs.map((d) => d.data());
      setCars(data);
    }
    fetchCars();
  }, []);

  useEffect(() => {
    async function fetchCompleted() {
      const snap = await getDocs(collection(db, 'completedItems'));
      setCompletedItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    fetchCompleted();
  }, []);

  useEffect(() => {
    if (isScanning) {
      const codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeOnceFromVideoDevice(undefined, 'video')
        .then((result) => {
          handleVinScanned(result.getText());
          codeReader.reset();
        })
        .catch((err) => {
          console.error(err);
          setIsScanning(false);
          codeReader.reset();
        });
      return () => codeReader.reset();
    }
  }, [isScanning]);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (
      cars.length &&
      !window.confirm(
        'Uploading a new CSV will overwrite existing inventory data. Continue?'
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(',');
      const data = lines.map((line) => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim();
        });
        return obj;
      });
      setCars(data);

      const coll = collection(db, 'pipeline');
      const existing = await getDocs(coll);
      await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
      await Promise.all(
        data.map((car) =>
          setDoc(doc(coll, car['Stock Number'] || crypto.randomUUID()), car)
        )
      );
    };
    reader.readAsText(file);
  };

  const parseBool = (value) => {
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      return v === 'true' || v === 'yes';
    }
    return Boolean(value);
  };

  const getBadgeAndAction = (car) => {
    const inspection = (car['Inspection Status'] || '').toLowerCase();
    const emission = (car['Emission Status'] || '').toLowerCase();
    const hasPhoto = parseBool(car['Has Photo']);
    const exterior = car['Exterior Color'];
    const interior = car['Interior Color'];
    const price = car['Asking Price'];

    if (
      inspection === 'complete' &&
      emission === 'passed' &&
      hasPhoto &&
      exterior &&
      interior &&
      price
    ) {
      return { badge: '✅', action: null };
    }

    if (inspection === 'pending') {
      return { badge: '⏳', action: 'In recon' };
    }

    if (inspection !== 'complete' && inspection !== 'pending') {
      return { badge: '⚠️', action: 'Get inspected' };
    }

    if (inspection === 'complete' && emission === 'pending') {
      return { badge: '⚠️', action: 'Get Emissions' };
    }

    if (inspection === 'complete' && emission === 'passed' && !hasPhoto) {
      return { badge: '⚠️', action: 'Get photo' };
    }

    if (!exterior || !interior || !price) {
      return { badge: '⚠️', action: 'Price or color missing' };
    }

    return { badge: '', action: '' };
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedCars = [...cars].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    const comp = String(aVal).localeCompare(String(bVal));
    return sortConfig.direction === 'asc' ? comp : -comp;
  });

  const carsWithStatus = sortedCars.map((car) => ({
    car,
    status: getBadgeAndAction(car),
  }));

  const actionItems = carsWithStatus.filter(
    ({ status }) => status.action && status.action !== 'In recon'
  );

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleVinScanned = (vin) => {
    setIsScanning(false);
    const car = cars.find(
      (c) => c.VIN === vin || c.Vin === vin || c['VIN'] === vin
    );
    if (car) {
      const status = getBadgeAndAction(car);
      setScanModal({ car, status, vin });
    } else {
      setScanModal({ vin, notFound: true });
    }
  };

  const completeAction = async () => {
    if (!scanModal?.car || !scanModal?.status?.action) return;
    const { car, status, vin } = scanModal;
    const coll = collection(db, 'completedItems');
    await setDoc(doc(coll, vin), {
      vin,
      stockNumber: car['Stock Number'],
      action: status.action,
      completedAt: Date.now(),
    });
    setCompletedItems((prev) => [
      ...prev,
      { id: vin, vin, stockNumber: car['Stock Number'], action: status.action },
    ]);
    setScanModal(null);
  };

  const clearCompleted = async () => {
    const coll = collection(db, 'completedItems');
    const snap = await getDocs(coll);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    setCompletedItems([]);
    setShowCompletedModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded md:hidden"
            onClick={() => setIsScanning(true)}
          >
            Scan VIN
          </button>
          <button
            type="button"
            className="relative px-4 py-2 bg-gray-800 text-white rounded"
            onClick={() => setShowCompletedModal(true)}
          >
            View Completed Items
            {completedItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {completedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>
      {actionItems.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Action Items</h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {actionItems.map(({ car, status }) => (
              <li key={car['Stock Number']}>
                <span className="font-medium">
                  {car['Stock Number']} {car.Year} {car.Make} {car.Model}
                </span>
                : {status.action}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label htmlFor="inventory" className="block mb-2 font-semibold">
        Upload current inventory
      </label>
      <input
        id="inventory"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mb-2"
      />
      <p className="text-sm text-gray-500 mb-6">
        Uploading a new CSV will overwrite existing data.
      </p>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th
              className="px-4 py-2 text-left cursor-pointer"
              onClick={() => handleSort('Stock Number')}
            >
              Stock # {sortIcon('Stock Number')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Year')}
            >
              Year {sortIcon('Year')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Make')}
            >
              Make {sortIcon('Make')}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleSort('Model')}
            >
              Model {sortIcon('Model')}
            </th>
            <th
              className="px-4 py-2 text-right cursor-pointer"
              onClick={() => handleSort('Odometer')}
            >
              Odometer {sortIcon('Odometer')}
            </th>
            <th
              className="px-4 py-2 text-right cursor-pointer"
              onClick={() => handleSort('Days In Stock')}
            >
              Days {sortIcon('Days In Stock')}
            </th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {carsWithStatus.map(({ car, status }) => (
            <tr
              key={car['Stock Number']}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() =>
                navigate(`/pipeline/${car['Stock Number']}`, { state: { car } })
              }
            >
              <td className="px-4 py-2 font-medium">{car['Stock Number']}</td>
              <td className="px-4 py-2">{car.Year}</td>
              <td className="px-4 py-2">{car.Make}</td>
              <td className="px-4 py-2">{car.Model}</td>
              <td className="px-4 py-2 text-right">{car.Odometer} mi</td>
              <td className="px-4 py-2 text-right">
                {car['Days In Stock']} days
              </td>
              <td className="px-4 py-2">
                {status.action ? (
                  <span className="flex items-center text-sm text-red-600">
                    <span className="mr-1">{status.badge}</span>
                    {status.action}
                  </span>
                ) : (
                  status.badge && (
                    <span className="text-green-600">{status.badge}</span>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-80">
          <video id="video" className="flex-1 w-full object-cover" />
          <button
            type="button"
            className="p-4 bg-red-600 text-white"
            onClick={() => setIsScanning(false)}
          >
            Close
          </button>
        </div>
      )}

      {scanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            {scanModal.notFound ? (
              <>
                <p className="mb-4">No vehicle found for VIN {scanModal.vin}.</p>
                <div className="text-right">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setScanModal(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  {scanModal.car['Stock Number']} {scanModal.car.Year}{' '}
                  {scanModal.car.Make} {scanModal.car.Model}
                </h2>
                {scanModal.status.action ? (
                  <>
                    <p className="mb-4">Action needed: {scanModal.status.action}</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded"
                        onClick={completeAction}
                      >
                        Complete
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-200 rounded"
                        onClick={() => setScanModal(null)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-4">No action items for this vehicle.</p>
                    <div className="text-right">
                      <button
                        className="px-4 py-2 bg-gray-200 rounded"
                        onClick={() => setScanModal(null)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4">Completed Items</h2>
            {completedItems.length === 0 ? (
              <p className="mb-4 text-sm">No completed items.</p>
            ) : (
              <ul className="mb-4 text-sm text-gray-700 max-h-64 overflow-y-auto">
                {completedItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <span className="font-medium">{item.stockNumber}</span>: {item.action}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end space-x-2">
              {completedItems.length > 0 && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  onClick={clearCompleted}
                >
                  I have recorded these items in DealerCenter. Delete Items.
                </button>
              )}
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowCompletedModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
