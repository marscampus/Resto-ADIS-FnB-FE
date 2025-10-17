import jsPDF from 'jspdf';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatColumnValue, formatDate, formatDateSave, formatDateTable, getEmail, getUserName, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/PDFViewer.js';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF.js';
import AdjustPrintMarginPDF from '../../component/adjustPrintMarginPDF';
import Produk from '../../component/produk';
import PrintDiskonPeriode from './printDiskonPeriode.js';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { BlockUI } from 'primereact/blockui';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function MasterDiskon() {
    const apiEndPointGetDataPrint = '/api/diskon_periode/print';
    // API READ
    const apiEndPointGet = '/api/diskon_periode/get';
    // API DELETE
    const apiEndPointDelete = '/api/diskon_periode/delete';
    // API STORE
    const apiEndPointStore = '/api/diskon_periode/store';
    // API EDIT
    const apiEndPointUpdate = '/api/diskon_periode/update';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [diskonPeriodeDialog, setDiskonPeriodeDialog] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [diskon, setDiskon] = useState([]);
    const [diskonTabel, setDiskonTabel] = useState(null);
    const [diskonTabelFilt, setDiskonTabelFilt] = useState(null);
    const [deleteDiskonDialog, setDeleteDiskonDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [search, setSearch] = useState('');
    const fileName = `diskon-periode-${new Date().toISOString().slice(0, 10)}`;
    const [diskonCetak, setDiskonCetak] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setDiskonTabelFilt(diskonTabel);
    }, [diskonTabel, lazyState]);

    const [ketOptions, setKetOptions] = useState([
        { label: 'Semua Data', value: 'ALL' },
        { label: 'Diskon Masih Berlaku', value: 'ACTIVE' }
    ]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [tgl, setTgl] = useState(new Date());
    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                ...lazyState,
                Tgl: convertToISODate(tgl)
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setDiskonTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            // Tangani error dengan sesuai, misalnya tampilkan pesan kesalahan
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    const handleTglChange = (e) => {
        setTgl(e.value);
    };
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            Tgl_Mulai: dataProduk.Tgl_Mulai
        }));
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            Tgl_Akhir: dataProduk.Tgl_Akhir
        }));
    };
    const refresh = () => {
        setLoading(true);
        if (tgl) {
            const updatedLazyState = {
                ...lazyState,
                TGL: tgl
            };
            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setDiskonPeriodeDialog(false);
    };
    const hideDeleteDiskonDialog = () => {
        setDeleteDiskonDialog(false);
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkCetakDialog, setProdukCetakDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const [dataProdukCetak, setDataProdukCetak] = useState('');

    const btnProduk = () => {
        setProdukDialog(true);
    };

    const btnProdukCetak = () => {
        setProdukCetakDialog(true);
    };

    const handleProduk = (dataProduk) => {
        setDataProduk(dataProduk);
        if (dialogPreview === true) {
            setProdukDialog(false);
            return;
        }
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            Kode: dataProduk.KODE,
            Barcode: dataProduk.KODE_TOKO,
            Nama: dataProduk.NAMA,
            HJ_Awal: dataProduk.HJ
        }));

        setProdukDialog(false);
    };

    const handleProdukCetak = (dataProdukCetak) => {
        setDataProdukCetak(dataProdukCetak);
        setDiskonCetak((prevDiskon) => ({
            ...prevDiskon,
            Kode: dataProdukCetak.KODE
        }));

        setProdukDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setDiskon([]);
        setDiskonPeriodeDialog(true);
        setIsUpdateMode(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setDiskonCetak((prevState) => ({ ...prevState, [name]: val }));
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _diskon = { ...diskon };
        _diskon[`${name}`] = val;
        setDiskon(_diskon);
    };

    const saveDiskon = async (e) => {
        e.preventDefault();
        let _diskonTabel = [...diskonTabel];
        let _diskon = {
            ...diskon,
            Tgl_Mulai: isUpdateMode ? diskon.Tgl_Mulai : formatDateSave(diskon.Tgl_Mulai || startDate),
            Tgl_Akhir: isUpdateMode ? diskon.Tgl_Akhir : formatDateSave(diskon.Tgl_Akhir || endDate)
        };
        if (!_diskon.Kode) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kode Barang Belum Diisi !', life: 3000 });
            return;
        }
        if (!_diskon.Kuota_Qty) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kuota QTY masih 0 !', life: 3000 });
            return;
        }
        if (!_diskon.HJ_Diskon) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harga Diskon Belum Diisi !', life: 3000 });
            return;
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _diskon);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setDiskonTabel(_diskonTabel);
            setDiskon([]);
            setDiskonPeriodeDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const editDiskon = (diskon) => {
        setDiskon({ ...diskon });
        setDiskonPeriodeDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteDiskon = (diskon) => {
        setDiskon(diskon);
        setDeleteDiskonDialog(true);
    };

    const deleteDiskon = async () => {
        let requestBody = {
            KODEDISKON: diskon.KodeDiskon
        };
        try {
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            showSuccess(toast, data?.message)
            setDiskon([]);
            setDeleteDiskonDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Print Barcode >
    const [deletePrintBarcodeDialog, setDeletePrintBarcodeDialog] = useState(false);
    const [printBarcode, setPrintBarcode] = useState([]);
    const [priceTagTabel, setPriceTagTabel] = useState([]);

    const [printBarcodeDialog, setPrintBarcodeDialog] = useState(false);
    const [dataPrint, setDataPrint] = useState('');
    const btnPrintBarcode = () => {
        setPrintBarcodeDialog(true);
    };


    const hideBarcodePrintDialog = () => {
        // setNull();
        setPriceTagTabel([]);
        setPrintBarcodeDialog(false);
    };

    // --------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selecteddiskons || !selecteddiskons.length} /> */}
                </div>
            </React.Fragment>
        );
    };
    const diskonDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveDiskon} />
        </>
    );
    const previewDiskon = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={previewDiskonPeriode} />
                </div>
                <div className="my-2">
                    <Button label="Print Diskon Periode" icon="pi pi-tag" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnPrintBarcode} />
                </div>
            </React.Fragment>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editDiskon(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteDiskon(rowData)} />
            </>
        );
    };

    const deleteDiskonDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteDiskonDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteDiskon} />
        </>
    );

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="tgl" value={tgl} onChange={handleTglChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" /> */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = diskonTabel.filter((d) => (x ? x.test(d.KodeDiskon) || x.test(d.Kode) || x.test(d.Barcode) || x.test(d.Nama) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = diskonTabel;
            } else {
                filtered = diskonTabel.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }
        setDiskonTabelFilt(filtered);
    };

    const [startDateCetak, setStartDateCetak] = useState(new Date());
    const [endDateCetak, setEndDateCetak] = useState(new Date());
    const [dialogPreview, setDialogPreview] = useState(false);
    const [mutasiDiskonPeriode, setMutasiDiskonPeriode] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pilihDiskonPeriodeDialog, setPilihDiskonPeriodeDialog] = useState(false);
    const previewDiskonPeriode = () => {
        setPilihDiskonPeriodeDialog(true);
        setDialogPreview(true);
    };

    const handleAdjust = async (dataAdjust) => {
        cetak(dataAdjust);
    };
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const cetak = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            setLoadingPreview(true);
            const rekapPDF = mutasiDiskonPeriode ? JSON.parse(JSON.stringify(mutasiDiskonPeriode)) : [];
            const tableData = rekapPDF.map((item, index) => [
                index + 1,
                item.KodeDiskon,
                item.Kode,
                item.Barcode,
                formatDateTable(item.Tgl_Mulai),
                formatDateTable(item.Tgl_Akhir),
                formatColumnValue(item.HJ_Awal),
                formatColumnValue(item.HJ_Diskon),
                item.Kuota_Qty
            ]);

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);

            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!rekapPDF || rekapPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());
            const judulLaporan = 'Rekap Mutasi Diskon Periode ';
            const periodeLaporan = 'Antara Tanggal : ' + formatDate(startDateCetak) + '  -  ' + formatDate(endDateCetak);

            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['NO.', 'KODE DISKON', 'KODE', 'BARCODE', 'TANGGAL DIMULAI', 'TANGGAL BERAKHIR', 'HARGA AWAL', 'HARGA DISKON', 'KUOTA QTY']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                    0: { halign: 'center' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'center' },
                    6: { halign: 'right' },
                    7: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setAdjustDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    const funcPilihDiskonPeriode = async () => {
        setLoading(true);
        try {
            let requestBody = {
                KET: diskonCetak.Ket,
                KODE: diskonCetak.Kode
            };
            console.log(requestBody);
            const vaTable = await postData(apiEndPointGetDataPrint, requestBody);
            const json = vaTable.data;
            setMutasiDiskonPeriode(json.data);
            setAdjustDialog(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setPilihDiskonPeriodeDialog(false);
    };

    const handleCloseDialog = () => {
        setPilihDiskonPeriodeDialog(false);
        setDialogPreview(false);
        setDiskonCetak([]);
    };

    const diskonPeriodeDialogFooter = (
        <>
            {/* <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /> */}
            <Button label="Cetak" icon="pi pi-check" className="p-button" onClick={funcPilihDiskonPeriode} />
        </>
    );


    // -------------------------------------------------------------------------------------------------------------------------- return view
    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <h4>Menu Diskon Periode</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                        <DataTable
                            value={diskonTabelFilt}
                            filters={lazyState.filters}
                            header={headerSearch}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            loading={loading}
                            className="datatable-responsive"
                            emptyMessage="Data Kosong"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KodeDiskon" header="KODE DISKON"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Barcode" header="BARCODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Nama" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Tgl_Mulai" body={(rowData) => formatDate(rowData.Tgl_Mulai)} header="TGL MULAI" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Tgl_Akhir" body={(rowData) => formatDate(rowData.Tgl_Akhir)} header="TGL AKHIR" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="HJ_Awal"
                                header="HJ AWAL"
                                body={(rowData) => {
                                    const value = rowData.HJ_Awal ? parseInt(rowData.HJ_Awal).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="HJ_Diskon"
                                header="HJ DISKON"
                                body={(rowData) => {
                                    const value = rowData.HJ_Diskon ? parseInt(rowData.HJ_Diskon).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Kuota_Qty" header="KUOTA" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={previewDiskon}></Toolbar>

                        {/* Dialog Diskon  */}
                        <Dialog visible={diskonPeriodeDialog} style={{ width: '75%' }} header="Form Diskon Periode " modal className="p-fluid" footer={diskonDialogFooter} onHide={hideDialog}>
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-3">
                                        <label htmlFor="jenis-diskon">Kode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="kode" readOnly value={diskon.Kode} onChange={(e) => onInputChange(e, 'Kode')} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnProduk} disabled={isUpdateMode} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-3">
                                        <label htmlFor="Barcode">Barcode</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly id="Barcode" value={diskon.Barcode} onChange={(e) => onInputChange(e, 'Barcode')} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="nama">Nama Produk</label>
                                        <div className="p-inputgroup">
                                            <InputText id="nama" readOnly value={diskon.Nama} onChange={(e) => onInputChange(e, 'Nama')} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="tglPerubahan">Tanggal Awal Periode</label>
                                        <div className="p-inputgroup">
                                            <Calendar
                                                onChange={handleStartDateChange}
                                                value={diskon.Tgl_Mulai && diskon.Tgl_Mulai ? new Date(diskon.Tgl_Mulai) : startDate}
                                                showIcon
                                                dateFormat="dd-mm-yy"
                                            />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="tglPerubahan">Tanggal Akhir Periode</label>
                                        <div className="p-inputgroup">
                                            <Calendar
                                                value={diskon.Tgl_Akhir && diskon.Tgl_Akhir ? new Date(diskon.Tgl_Akhir) : endDate}
                                                onChange={handleEndDateChange}
                                                showIcon
                                                dateFormat="dd-mm-yy"
                                            />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-3">
                                        <label htmlFor="alamat">Harga Jual Awal</label>
                                        <div className="p-inputgroup">
                                            <InputNumber readOnly value={diskon.HJ_Awal} onChange={(e) => onInputNumberChange(e, 'HJ_Awal')} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-3">
                                        <label htmlFor="plafond1">Harga Jual Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="plafond1" value={diskon.HJ_Diskon} onChange={(e) => onInputNumberChange(e, 'HJ_Diskon')} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="plafond2">Kuota Qty</label>
                                        <div className="p-inputgroup">
                                            <InputNumber id="plafond2" value={diskon.Kuota_Qty} onChange={(e) => onInputNumberChange(e, 'Kuota_Qty')} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Dialog>
                        <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />
                        <Produk produkDialog={produkCetakDialog} setProdukDialog={setProdukCetakDialog} btnProduk={btnProdukCetak} handleProduk={handleProdukCetak} />
                        <Dialog visible={deleteDiskonDialog} header="Confirm" modal footer={deleteDiskonDialogFooter} onHide={hideDeleteDiskonDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {diskon && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{diskon.KodeDiskon}</strong>
                                    </span>
                                )}
                            </div>
                        </Dialog>
                        <Dialog visible={pilihDiskonPeriodeDialog} style={{ width: '75%' }} header="Pilih Tanggal Diskon Periode" footer={diskonPeriodeDialogFooter} modal className="p-fluid" onHide={handleCloseDialog}>
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-6">
                                    <label htmlFor="ket">Keterangan</label>
                                    <Dropdown id="ket" value={diskonCetak.Ket} options={ketOptions} onChange={(e) => onInputChange(e, 'Ket')} placeholder="Pilih Keterangan" />
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <label htmlFor="kode">Kode Barang</label>
                                    <div className="p-inputgroup">
                                        <InputText id="kode" readOnly value={diskonCetak.Kode} onChange={(e) => onInputChange(e, 'Kode')} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnProdukCetak} />
                                    </div>
                                </div>
                            </div>
                        </Dialog>

                        <PrintDiskonPeriode
                            printBarcodeDialog={printBarcodeDialog}
                            hideBarcodePrintDialog={hideBarcodePrintDialog}
                            deletePrintBarcodeDialog={deletePrintBarcodeDialog}
                            printBarcode={printBarcode}
                            setPrintBarcode={setPrintBarcode}
                            priceTagTabel={priceTagTabel}
                        />

                        <AdjustPrintMarginPDF loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
                        <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                            <div className="p-dialog-content">
                                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </BlockUI>
    );
}
