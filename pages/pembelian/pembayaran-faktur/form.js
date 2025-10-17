import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { formatDate, getYMD, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../component/styles/dataTable.module.css';
import Supplier from '../../component/supplier';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import MultipleRekeningCOA from '../../component/multipleRekeningCOA';
export async function getServerSideProps(context) {
    //   const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    const sessionData = await getSessionServerSide(context, '/pembelian/pembayaran-faktur');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterBayarFaktur() {
    //get faktur
    const apiEndPointGetFaktur = '/api/pembayaran_faktur/get_faktur';
    // get data by supplier & periode
    const apiEndPointGetDataBySupplier = '/api/pembayaran_faktur/getdata_bysupplier';
    //store bayar faktur
    const apiEndPointStore = '/api/pembayaran_faktur/store';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingButton, setLoadingButton] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeFormField, setActiveFormField] = useState(null);
    const [bayarFaktur, setBayarFaktur] = useState([]);
    const [bayarFakturTabel, setBayarFakturTabel] = useState([]);
    const [faktur, setFaktur] = useState(null);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadBayarFaktur();
    }, [lazyState]);

    const loadBayarFaktur = async () => {
        setLoading(true);
        try {
            let requestBody = {
                KODE: 'PH',
                LEN: '6'
            };
            const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setFaktur(json);
            setBayarFaktur((prevBayarFaktur) => ({
                ...prevBayarFaktur,
                FAKTUR: json
            }));
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const loadLazyData = async (supplierKode) => {
        try {
            setLoading(true);
            let requestBody = {
                Supplier: supplierKode
            };
            const vaTable = await postData(apiEndPointGetDataBySupplier, requestBody);
            const json = vaTable.data;
            showSuccess(toast, json?.message)
            setTotalRecords(json.data.total);
            const bayarFakturTabelWithStatus = json.data.map((entry) => ({
                ...entry,
                STATUS: entry.SISA === 0 ? 'L' : 'B'
            }));
            setBayarFakturTabel(bayarFakturTabelWithStatus);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...bayarFaktur };
        _data[`${name}`] = val;
        setBayarFaktur(_data);
    };
    // ----------------------------------------------------------------------------------------------------------------- Handle Change
    const [statusFilter, setStatusFilter] = useState('B'); // Ganti nama state menjadi statusFilter

    const handleRadioChangeStatus = (event) => {
        setStatusFilter(event.target.value); // Perbarui status filter sesuai nilai radio button yang dipilih
    };
    //  ------------------------------------------------------------------------------------------------------------------ edit in cell

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedPembayaranFaktur = bayarFakturTabel.filter((row) => row !== rowData);
        setBayarFakturTabel(updatedPembayaranFaktur);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        switch (field) {
            case 'PEMBAYARAN':
                let editPembayaran = parseInt(newValue);
                if (editPembayaran === 0) {
                    deleteSelectedRow(rowData);
                } else if (newValue === '' || newValue === undefined) {
                    const updatedPembayaranFaktur = bayarFakturTabel.map((item) => {
                        if (item.FAKTURPEMBELIAN === rowData.FAKTURPEMBELIAN) {
                            const addedData = rowData;
                            return { ...item, PEMBAYARAN: addedData.TOTALTERIMA };
                        } else {
                            return { ...item };
                        }
                    });
                    setBayarFakturTabel(updatedPembayaranFaktur);
                } else {
                    // const existingIndex = bayarFakturTabel.findIndex((item) => item.FAKTURPO === rowData.FAKTURPO);
                    const updatedPembayaranFaktur = bayarFakturTabel.map((item) => {
                        if (item.FAKTURPEMBELIAN === rowData.FAKTURPEMBELIAN) {
                            const addedData = rowData;
                            const addedSisa = addedData.VALSISA;
                            const reversedSisa = addedSisa < 0 ? -addedSisa : addedSisa;
                            const sisa = reversedSisa - editPembayaran;
                            return { ...item, PEMBAYARAN: editPembayaran, SISA: sisa };
                        } else {
                            return { ...item };
                        }
                    });
                    setBayarFakturTabel(updatedPembayaranFaktur);
                }
                break;
            default:
                break;
        }
    };
    const cellEditor = (options) => {
        return textEditor(options);
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama) => {
        setBayarFaktur((p) => ({
            ...p,
            SUPPLIER: supplierKode,
            NAMA: supplierNama
        }));
        loadLazyData(supplierKode);
    };

    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const handleSearchButtonClick = () => (event) => {
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        if (selectedRow.jenis_rekening === "I") {
            showError(toast, "Rekening Induk Tidak Boleh Dipilih")
            return;
        }
        setBayarFaktur((p) => ({
            ...p,
            REKENING: selectedRow.kode,
            KETREKENING: selectedRow.keterangan
        }));
        setRekeningDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func

    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };
    const createDataObject = (_bayarFaktur, _bayarFakturTabel) => {
        const data = {
            FAKTUR: _bayarFaktur.FAKTUR,
            TGL: getYMD(new Date()),
            SUPPLIER: _bayarFaktur.SUPPLIER,
            REKENING: _bayarFaktur.REKENING,
            tabelPembayaranFaktur: _bayarFakturTabel.map((item) => {
                convertUndefinedToNull(item);
                return {
                    FAKTURPEMBELIAN: item.FAKTURPEMBELIAN,
                    PEMBAYARAN: item.PEMBAYARAN,
                    JTHTMP: item.JTHTMP
                };
            })
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        try {
            setLoadingButton(true);
            let _bayarFaktur = { ...bayarFaktur };
            let _bayarFakturTabel = [...bayarFakturTabel];
            let _data = createDataObject(_bayarFaktur, _bayarFakturTabel);
            if (_data.REKENING === null || _data.REKENING === undefined || _data.REKENING === '') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pembayaran Belum Dipilih', life: 3000 });
                return;
            }

            if (_bayarFakturTabel.length === 0) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Faktur Kosong', life: 3000 });
                return;
            }
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setTimeout(() => {
                router.push('/pembelian/pembayaran-faktur');
            }, 2000);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingButton(false);
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Footer

    const dataFooter = bayarFakturTabel.filter((row) => (statusFilter === 'B' ? row.PEMBAYARAN !== 0 : row.PEMBAYARAN === 0));
    const totJumlah = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.JUMLAHPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totData = dataFooter.length;
    const totDisc = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.DISCOUNTPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totPpn = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.PAJAKPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTotal = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALPO);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTerima = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALTERIMA);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totRetur = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.TOTALRETUR);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totPembayaran = dataFooter.reduce((accumulator, item) => {
        const hargaValue = parseInt(item.PEMBAYARAN);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Total:" colSpan={1} footerStyle={{ textAlign: 'right' }} />
                <Column colSpan={1} footer={`${totData.toLocaleString()} Faktur`} />
                <Column colSpan={2} />
                <Column colSpan={1} footer={`${totJumlah.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totDisc.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totPpn.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totTotal.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totTerima.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totRetur.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totPembayaran.toLocaleString()}`} />
                <Column colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Pembayaran Faktur</h4>
                    <hr />
                    <Toast ref={toast} />

                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="">Faktur Bayar</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={faktur} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label>Supplier</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={bayarFaktur.SUPPLIER} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                        <InputText readOnly value={bayarFaktur.NAMA} />
                                        {/* <Button label="Cari" icon="pi pi-refresh" className="p-button-primary" onClick={btnCari} /> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="Pembayaran" style={{ marginBottom: '15px' }}>
                                        Status
                                    </label>
                                    <div className="p-inputgroup">
                                        <RadioButton inputId="tunai" value="B" checked={statusFilter === 'B'} onChange={handleRadioChangeStatus} className="mr-2" />
                                        <div className="mr-2">
                                            <Badge value="Belum Lunas" severity="secondary" size="small" className="mb-2 mr-2"></Badge>
                                        </div>
                                        <RadioButton inputId="girocek" value="L" checked={statusFilter === 'L'} onChange={handleRadioChangeStatus} className="mr-2" />
                                        <div className="mr-2">
                                            <Badge value="Lunas" severity="success" size="small" className="mb-2 mr-2"></Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label>Pembayaran</label>
                                    <div className="p-inputgroup">
                                        <InputText value={bayarFaktur.REKENING} onChange={(e) => onInputChange(e, 'REKENING')} />
                                        <Button icon="pi pi-search" className="p-button" onClick={handleSearchButtonClick()} />
                                        <InputText readOnly value={bayarFaktur.KETREKENING} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={bayarFakturTabel.filter((row) => (statusFilter === 'B' ? row.PEMBAYARAN !== 0 : row.PEMBAYARAN === 0))} // Filter data sesuai status filter
                            lazy
                            dataKey="KODE_TOKO"
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                        >
                            <Column field="FAKTURPO" header="FAKTUR PO"></Column>
                            <Column
                                field="FAKTURPEMBELIAN"
                                header="FKT PEMBELIAN"
                                body={(rowData) => <Badge value={rowData.FAKTURPEMBELIAN} severity={rowData.PEMBAYARAN === 0 ? 'success' : 'secondary'} size="small" />}

                            ></Column>
                            <Column field="TGL" header="TANGGAL" body={(rowData) => formatDate(rowData.TGL)}></Column>
                            <Column field="JTHTMP" header="JTHTMP" body={(rowData) => formatDate(rowData.JTHTMP)}></Column>
                            <Column field="JUMLAHPO" header="JUMLAH PO" body={(rowData) => (rowData.JUMLAHPO ? `${rowData.JUMLAHPO.toLocaleString()}` : '0')}></Column>
                            <Column field="DISCOUNTPO" header="DISCOUNT" body={(rowData) => (rowData.DISCOUNTPO ? `${rowData.DISCOUNTPO.toLocaleString()}` : '0')}></Column>
                            <Column field="PAJAKPO" header="PPN" body={(rowData) => (rowData.PAJAKPO ? `${rowData.PAJAKPO.toLocaleString()}` : '0')}></Column>
                            <Column field="TOTALPO" header="TOTAL PO" body={(rowData) => (rowData.TOTALPO ? `${rowData.TOTALPO.toLocaleString()}` : '0')}></Column>
                            <Column
                                field="TOTALTERIMA"
                                header="TOTAL TERIMA"
                                body={(rowData) => (rowData.TOTALTERIMA ? `${rowData.TOTALTERIMA.toLocaleString()}` : '0')}

                            ></Column>
                            <Column
                                field="TOTALRETUR"
                                header="TOTAL RETUR"
                                body={(rowData) => {
                                    const value = rowData.TOTALRETUR ? parseInt(rowData.TOTALRETUR).toLocaleString() : 0;
                                    return value;
                                }}

                            ></Column>
                            <Column
                                field="PEMBAYARAN"
                                header="PEMBAYARAN"
                                body={(rowData) => {
                                    const value = rowData.PEMBAYARAN ? parseInt(rowData.PEMBAYARAN).toLocaleString() : 0;
                                    return value;
                                }}
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}

                            ></Column>
                            <Column
                                field="SISA"
                                header="SISA"
                                body={(rowData) => {
                                    const value = rowData.SISA ? parseInt(rowData.SISA).toLocaleString() : 0;
                                    return value;
                                }}

                            ></Column>
                            <Column field="TIPE" header="TIPE"></Column>
                            <Column header="ACTION" body={actionBodyTabel}></Column>
                        </DataTable>
                        <br></br>
                    </div>
                    <div className="text-right">
                        <Button loading={loadingButton} label="Save" className="p-button-primary mr-2" onClick={saveData} />
                        <Button
                            label="Cancel"
                            className="p-button-secondary p-button"
                            onClick={() => {
                                router.push('/pembelian/pembayaran-faktur');
                            }}
                        />
                    </div>
                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Supplier */}
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
                </div>
            </div>
        </div>
    );
}
