import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { formatCurrency,getDBConfig } from './GeneralFunction/GeneralFunction';
export default function PilihJasaBarang({ barangList, setBarangList, servicesAndStock, errors }) {
    const [selectedBarang, setSelectedBarang] = useState(null);
    const [filteredItems, setFilteredItems] = useState(servicesAndStock);
    const [itemFilter, setItemFilter] = useState('');
    const toast = useRef(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [loading, setLoading] = useState(false);

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        updateBarangListWithKode();
        setFilteredItems(servicesAndStock.filter((item) => item.KETERANGAN?.toLowerCase().includes(itemFilter.toLowerCase()) || item.NAMA?.toLowerCase().includes(itemFilter.toLowerCase())));
    }, [itemFilter, servicesAndStock]);

    const addItemToBarang = (item) => {
        // Check if NAMA is empty or null
        if (!selectedBarang.NAMA) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Nama Barang Masih Kosong!',
                life: 3000
            });
            return;
        }

        if (selectedBarang) {
            // Find the index of the existing service by matching KODE
            const existingServiceIndex = selectedBarang.services.findIndex((service) => service.KODE === item.KODE);

            let updatedServices;
            if (existingServiceIndex !== -1) {
                // If the service already exists, update its quantity
                updatedServices = selectedBarang.services.map((service, index) => (index === existingServiceIndex ? { ...service, QTY: (service.QTY || 0) + (item.QTY || 1) } : service));
            } else {
                // Add new service to the list if it doesn't exist
                const newService = {
                    KODE_SERVICE: selectedBarang.KODE,
                    KODE_BARANG: selectedBarang.KODE,
                    KODE: item.KODE,
                    HARGA: item.ESTIMASIHARGA || 0,
                    TYPE: item.TYPE,
                    NAMA: item.KETERANGAN,
                    SATUAN: item.SATUAN,
                    QTY: item.QTY || 1
                };
                updatedServices = [...selectedBarang.services, newService];
            }

            // Update the selected barang with new services array
            const updatedBarang = {
                ...selectedBarang,
                services: updatedServices
            };

            // Call function to update the barang list
            updateBarangList(updatedBarang);
        }
    };

    const removeItemFromBarang = (itemKode) => {
        if (selectedBarang) {
            const indexToRemove = selectedBarang.services.findLastIndex((service) => service.KODE === itemKode);
            if (indexToRemove !== -1) {
                const updatedServices = [...selectedBarang.services.slice(0, indexToRemove), ...selectedBarang.services.slice(indexToRemove + 1)];
                const updatedBarang = {
                    ...selectedBarang,
                    services: updatedServices
                };
                updateBarangList(updatedBarang);
            }
        }
    };
    const itemSelectionBody = (rowData) => <Button icon="pi pi-plus" className="p-button-rounded p-button-success" onClick={() => addItemToBarang(rowData)} />;
    const groupAndSumServices = (services) => {
        const groupedServices = services.reduce((acc, service) => {
            // Jika item dengan KODE yang sama belum ada di akumulator, tambahkan item tersebut
            if (!acc[service.KODE]) {
                acc[service.KODE] = { ...service, QTY: 0, TOTAL_HARGA: 0 };
            }
            // Tambahkan QTY dan TOTAL_HARGA
            acc[service.KODE].QTY += service.QTY || 1; // Gunakan nilai default 1 jika QTY tidak ada
            acc[service.KODE].TOTAL_HARGA += (service.HARGA || 0) * (service.QTY || 1); // Hitung TOTAL_HARGA
            return acc;
        }, {});
        // Kembalikan array dari nilai-nilai objek di akumulator
        return Object.values(groupedServices);
    };

    const updateBarang = useCallback(
        (index, field, value) => {
            setBarangList((prev) => {
                const newList = [...prev];
                newList[index] = { ...newList[index], [field]: value };
                return newList;
            });
            if (selectedBarang && selectedBarang.KODE === barangList[index].KODE) {
                setSelectedBarang((prev) => (prev ? { ...prev, [field]: value } : null));
            }
        },
        [barangList, selectedBarang]
    );

    const updateBarangListWithKode = () => {
        const updatedBarangList = barangList.map((barang, index) => ({
            ...barang,
            KODE: ('000' + (index + 1)).slice(-4) // Menambahkan KODE yang diformat
        }));
        setBarangList(updatedBarangList); // Simpan barangList yang telah diperbarui
    };

    const updateBarangList = (updatedBarang) => {
        const newEstimatedPrice = updatedBarang.services.reduce((sum, service) => sum + service.QTY * service.HARGA, 0);
        const finalUpdatedBarang = { ...updatedBarang, ESTIMASIHARGA: newEstimatedPrice };
        setBarangList((prev) => prev.map((item) => (item.KODE === updatedBarang.KODE ? finalUpdatedBarang : item)));
        setSelectedBarang(finalUpdatedBarang);
    };

    const addBarangRow = () => {
        const kodeValues = barangList.map((b) => parseInt(b.KODE, 10)).filter((kode) => !isNaN(kode));

        const newKode = kodeValues.length > 0 ? ('000' + (Math.max(...kodeValues) + 1)).slice(-4) : '0001';

        setBarangList((prev) => [
            ...prev,
            {
                KODE: newKode,
                NAMA: '',
                KETERANGAN: '',
                STATUSAMBIL: 'Antrian',
                services: [],
                ESTIMASIHARGA: 0
            }
        ]);
    };

    const removeBarangRow = (kode) => {
        if (barangList.length > 1) {
            setBarangList((prev) => prev.filter((b) => b.KODE !== kode));
            if (selectedBarang && selectedBarang.KODE === kode) {
                setSelectedBarang(null);
            }
        }
    };
    const getErrorMessage = (field) => {
        return errors[field] ? errors[field][0] : '';
    };
    const barangTemplate = (rowData, column, field) => {
        return (
            <>
                <InputText value={rowData[field]} onChange={(e) => updateBarang(barangList.indexOf(rowData), field, e.target.value)} className={getErrorMessage(`barangList.${barangList.indexOf(rowData)}.${field}`) ? 'p-invalid' : ''} />
                {getErrorMessage(`barangList.${barangList.indexOf(rowData)}.${field}`) && <small className="p-error">{getErrorMessage(`barangList.${barangList.indexOf(rowData)}.${field}`)}</small>}
            </>
        );
    };
    const statusTemplate = (rowData) => (
        <Dropdown
            value={rowData.STATUSAMBIL}
            options={['Antrian', 'Proses', 'Selesai']}
            onChange={(e) => {
                e.stopPropagation();
                updateBarang(
                    barangList.findIndex((b) => b.KODE === rowData.KODE),
                    'STATUSAMBIL',
                    e.value
                );
            }}
            placeholder="Select Status"
            onClick={(e) => e.stopPropagation()}
        />
    );
    const estimatedPriceTemplate = (rowData) => <span>{formatCurrency(rowData.ESTIMASIHARGA)}</span>;
    const actionTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button className="p-button-rounded p-button-success" icon="pi pi-plus" onClick={addBarangRow} />
            <Button icon="pi pi-minus" className="p-button-rounded p-button-danger" onClick={() => removeBarangRow(rowData.KODE)} disabled={barangList.length === 1} />
        </div>
    );

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field } = e;
        let updatedServices;

        if (field === 'QTY') {
            const editedQty = parseFloat(newValue);
            if (!isNaN(editedQty)) {
                updatedServices = selectedBarang.services.map((item) => {
                    if (item.KODE === rowData.KODE) {
                        const updatedData = calculateQtyAndTotal(item, editedQty, item.HARGA, 'editQtyFromTable');
                        return {
                            ...item,
                            QTY: updatedData.updatedQty,
                            TOTAL_HARGA: updatedData.total
                        };
                    }
                    return item;
                });
                setSelectedBarang({ ...selectedBarang, services: updatedServices });
            }
        }
    };

    const calculateQtyAndTotal = (item, editedQty, harga, source) => {
        const updatedQty = editedQty || item.QTY;
        const updatedHarga = harga || item.HARGA;
        const total = updatedQty * updatedHarga;

        return {
            updatedQty,
            updatedHarga,
            total
        };
    };

    const cellEditor = (options) => {
        return (
            <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback(e.value)}
                mode="decimal"
                min={0}
                showButtons
                buttonLayout="horizontal"
                decrementButtonClassName="p-button-danger"
                incrementButtonClassName="p-button-success"
            />
        );
    };

    const cellEditor1 = (options) => {
        return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} />;
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="flex justify-content-between align-items-center mb-2">
                    <h5 className="m-0">List Barang</h5>
                </div>
                <Toast ref={toast} />
                <DataTable size="small" value={barangList} selection={selectedBarang} onSelectionChange={(e) => setSelectedBarang(e.value)} selectionMode="single" dataKey="KODE">
                    <Column selectionMode="single" style={{ width: '3em' }} />
                    <Column field="KODE" header="No" style={{ width: '10%' }}></Column>
                    <Column body={(rowData, column) => barangTemplate(rowData, column, 'NAMA')} header="Nama Barang"></Column>
                    <Column body={(rowData, column) => barangTemplate(rowData, column, 'KETERANGAN')} header="Keterangan"></Column>
                    <Column body={statusTemplate} header="Status"></Column>
                    <Column body={estimatedPriceTemplate} header="Estimated Price"></Column>
                    <Column body={actionTemplate} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            {selectedBarang && (
                <>
                    <div className="col-12 md:col-6 mt-3">
                        <h5>Available Services and Stock</h5>
                        <span className="p-input-icon-left mb-2">
                            <i className="pi pi-search" />
                            <InputText value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} placeholder="Search services or stock" />
                        </span>
                        <TabView>
                            <TabPanel header="Services">
                                <div style={{ height: '400px', overflow: 'auto' }}>
                                    <DataTable value={filteredItems.filter((item) => item.TYPE === 'service')} scrollable scrollHeight="100%">
                                        <Column field="KODE" header="Code"></Column>
                                        <Column field="KETERANGAN" header="Description"></Column>
                                        <Column field="ESTIMASIHARGA" header="Price" body={(rowData) => formatCurrency(rowData.ESTIMASIHARGA)}></Column>
                                        <Column body={itemSelectionBody} style={{ width: '10%' }}></Column>
                                    </DataTable>
                                </div>
                            </TabPanel>
                            <TabPanel header="Stock">
                                <div style={{ height: '400px', overflow: 'auto' }}>
                                    <DataTable value={filteredItems.filter((item) => item.TYPE === 'stock')} scrollable scrollHeight="100%">
                                        <Column field="KODE" header="Code"></Column>
                                        <Column field="KETERANGAN" header="Description"></Column>
                                        <Column field="ESTIMASIHARGA" header="Price" body={(rowData) => formatCurrency(rowData.ESTIMASIHARGA)}></Column>
                                        <Column body={itemSelectionBody} style={{ width: '10%' }}></Column>
                                    </DataTable>
                                </div>
                            </TabPanel>
                        </TabView>
                    </div>
                    <div className="col-12 md:col-6 mt-3">
                        <h5>Selected Items for {selectedBarang?.NAMA}</h5>
                        <DataTable value={groupAndSumServices(selectedBarang?.services)} lazy dataKey="KODE" rows={10} className="datatable-responsive" first={lazyState.first} onPage={onPage} loading={loading} size="small">
                            <Column field="KODE" header="Code"></Column>
                            <Column field="TYPE" header="Type" body={(rowData) => (rowData.TYPE === 'service' ? 'Service' : 'Stock')}></Column>
                            <Column field="HARGA" header="Price per Unit" body={(rowData) => formatCurrency(rowData.HARGA)}></Column>
                            <Column field="QTY" header="Qty" style={{ textAlign: 'center' }} />
                            <Column field="TOTAL_HARGA" header="Total" body={(rowData) => formatCurrency(rowData.TOTAL_HARGA)}></Column>
                            <Column
                                body={(rowData) => (
                                    <div className="flex items-center">
                                        <Button icon="pi pi-minus" className="p-button-rounded p-button-danger p-button-icon-only" onClick={() => removeItemFromBarang(rowData.KODE)} />
                                    </div>
                                )}
                            ></Column>
                        </DataTable>
                    </div>
                </>
            )}
        </div>
    );
}
