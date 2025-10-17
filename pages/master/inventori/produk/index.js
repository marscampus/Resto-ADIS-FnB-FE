/**
     * Nama Program: GODONG POS - Master Inventori - Produk
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 3 April 2024 (revisi ulang)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Produk
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../../../component/tabel/skaleton';
import jsPDF from 'jspdf';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import PrintPriceTag from './printPriceTag';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
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
export default function MasterProduk() {
    const apiEndPointGet = '/api/produk/get';
    const apiEndPointDelete = '/api/produk/delete';
    const apiEndPointGetDataEdit = '/api/produk/getdata_edit';
    const apiEndPointUpdStatusHapus = '/api/produk/status-hapus';

    const toast = useRef(null);
    const [produk, setProduk] = useState([]);
    const [produkTabel, setProdukTabel] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [produkTabelFilt, setProdukTabelFilt] = useState([]);
    const [produkTabelAll, setProdukTabelAll] = useState([]);
    const [priceTagTabel, setPriceTagTabel] = useState([]);
    const [priceTagDiscTabel, setPriceTagDiscTabel] = useState([]);
    const [inputData, setInputData] = useState([]);
    const [inputDataDisc, setInputDataDisc] = useState([]);
    const [priceTag, setPriceTag] = useState([]);
    const [priceTagDisc, setPriceTagDisc] = useState([]);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [barcodeDiscDialog, setBarcodeDiscDialog] = useState(false);
    const [priceTagDiscDialog, setPriceTagDiscDialog] = useState(false);
    const [keteranganBarcode, setKeteranganBarcode] = useState('');
    const [keteranganBarcodeDisc, setKeteranganBarcodeDisc] = useState('');
    const [hjBarcode, setHJBarcode] = useState('');
    const [hjBarcodeDisc, setHJBarcodeDisc] = useState('');
    const [statusAction, setStatusAction] = useState(null);
    const [deleteProdukDialog, setDeleteProdukDialog] = useState(false);
    const [deleteProdukTabel, setDeleteProdukTabel] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [barcodeDiscTabel, setBarcodeDiscTabel] = useState([]);
    const [selectedRowDisc, setSelectedRowDisc] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    const fileName = `produk-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'Loading ...', header: 'Loading ...' }];

    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
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
        setProdukTabelFilt(produkTabel);
    }, [produkTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setProdukTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const onInputChangeDisc = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _inputDataDisc = { ...inputDataDisc };
        _inputDataDisc[name] = val;
        setInputDataDisc(_inputDataDisc);
    };

    const toggleBarcodeDisc = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setBarcodeDiscDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resBarcodeDisc = await dataTableBarcodeDisc(indeks);
            setBarcodeDiscTabel(resBarcodeDisc.data);
            // updateStateNamaProduk(indeks,resNamaProduk);
        }
        setLoadingItem(false);
    };
    const dataTableBarcodeDisc = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/produk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setBarcodeDiscDialog(true);
        });
    };

    const onRowSelectBarcode = (event) => {
        const selectedKode = event.data.KODE;
        const selectedBarcode = barcodeTabel.find((barcode) => barcode.KODE === selectedKode);

        if (selectedBarcode) {
            setInputData((prevData) => ({
                ...prevData,
                KODE_TOKO: selectedBarcode.KODE_TOKO,
                NAMA: selectedBarcode.NAMA,
                HJ: selectedBarcode.HJ
            }));
        }
        setKeteranganBarcode(selectedBarcode.NAMA);
        setHJBarcode(selectedBarcode.HJ);

        setBarcodeDialog(false);
    };

    const onRowSelectBarcodeDisc = (event) => {
        const selectedKodeDisc = event.data.KODE;
        const selectedBarcodeDisc = barcodeDiscTabel.find((barcodeDisc) => barcodeDisc.KODE === selectedKodeDisc);

        if (selectedBarcodeDisc) {
            setInputDataDisc((prevData) => ({
                ...prevData,
                KODE_TOKO: selectedBarcodeDisc.KODE_TOKO,
                NAMA: selectedBarcodeDisc.NAMA,
                HJ: selectedBarcodeDisc.HJ
            }));
        }
        setKeteranganBarcodeDisc(selectedBarcodeDisc.NAMA);
        setHJBarcodeDisc(selectedBarcodeDisc.HJ);

        setBarcodeDiscDialog(false);
    };

    const onRowSelectPriceTagListDisc = (event) => {
        setSelectedRowDisc(event.data);
    };
    // -------------------------------------------------------------------------------------------------

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };
    const onCheckboxChangeMember = (e, name) => {
        setInputDataDisc((prevState) => ({
            ...prevState,
            [name]: e.checked
        }));
    };

    const onCheckboxChange = (e) => {
        setIsChecked(e.target.checked);
    };
    const onDateChange = (e) => {
        const selectedDate = e.value; // Mendapatkan tanggal yang dipilih dari event
        const formattedDate = formatDate(selectedDate); // Mengubah format tanggal

        setPriceTagDisc((prevData) => ({
            ...prevData,
            EXPIRED: formattedDate
        }));
    };
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
    };

    const allData = async () => {
        const vaData = await postData(apiEndPointGet);
        const data = vaData.data;
        setProdukTabelAll(data.data);
    };

    const router = useRouter();
    const openNew = () => {
        setProduk([]);
        setSubmitted(false);
        router.push('/master/inventori/produk/form');
    };
    const editProduk = async (rowData) => {
        const { Kode } = rowData.KODE;
        try {
            let requestBody = {
                Kode: rowData.KODE
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            if (json.code === '409') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Sudah Ada Transaksi, Tidak Bisa Diedit', life: 3000 });
            } else {
                localStorage.setItem('KODE', rowData.KODE);
                router.push('/master/inventori/produk/form?status=update');
            }
        } catch (error) {
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------- Hide Dialog
    const hideDeleteProdukDialog = () => {
        setDeleteProdukDialog(false);
    };
    const hideDeleteProdukTabel = () => {
        setDeleteProdukTabel(false);
    };

    const hideDialogPriceTagDisc = () => {
        setSubmitted(false);
        setPriceTagDiscDialog(false);
        setInputDataDisc({
            barcode: '',
            NAMA: '',
            HJ: '',
            hDiskon: '',
            EXPIRED: '',
            qty: '',
            STATUS: ''
        });
        setPriceTagDiscTabel([]);
        setKeteranganBarcodeDisc('');
        setHJBarcodeDisc('');
    };
    // --------------------------------------------------
    const hideDialogBarcode = () => {
        setSubmitted(false);
        setBarcodeDialog(false);
    };
    const confirmDeleteProduk = (produk) => {
        setProduk(produk);
        setDeleteProdukTabel(true);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" href="/master/inventori/produk/add"/> */}
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (produkTabel.length == 0 || !produkTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        allData();
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const produkTabelPDF = produkTabelFilt ? JSON.parse(JSON.stringify(produkTabelFilt)) : [];
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

            if (!produkTabelPDF || produkTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Produk';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = produkTabelPDF.map((item) => [item.KODE, item.KODE_TOKO, item.GOLONGAN, item.NAMA, item.SATUAN, item.GUDANG, parseInt(item.HB).toLocaleString(), parseInt(item.HJ).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'BARCODE', 'GOLONGAN', 'NAMA PRODUK', 'SATUAN', 'GUDANG', 'HARGA BELI', 'HARGA JUAL']],
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
                    6: { halign: 'right' },
                    7: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        allData();
        exportToXLSX(produkTabelFilt, 'master-produk.xlsx');
    };

    const cetakHarga = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                    <Button label="Price Tag" icon="pi pi-tag" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnPrintBarcode} />
                </div>
                <div className="my-2">{/* <Button label="Price Tag Diskon" icon="pi pi-percentage" outlined className="p-button-secondary p-button-sm mr-2" onClick={togglePriceTagDisc} /> */}</div>
            </React.Fragment>
        );
    };

    const deleteProduk = async () => {
        let requestBody = {
            Kode: produk.KODE
        };
        try {
            const vaUpdate = await postData(apiEndPointDelete, requestBody);
            let data = vaUpdate.data;
            showSuccess(toast, data?.message)
            loadLazyData();
            setDeleteProdukTabel(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Print Barcode >
    const [deletePrintBarcodeDialog, setDeletePrintBarcodeDialog] = useState(false);
    const [printBarcode, setPrintBarcode] = useState([]);

    const [printBarcodeDialog, setPrintBarcodeDialog] = useState(false);
    const [dataPrint, setDataPrint] = useState('');
    const btnPrintBarcode = () => {
        setPrintBarcodeDialog(true);
    };
    const handlePrintBarcode = (dataPrintBarcode) => {
        setDataPrint(dataPrintBarcode);
    };
    const onRowSelectBarcodes = async (kode) => {
        let requestBody = {
            KODE: kode
        };
        try {
            const vaTable = await postData(apiEndPointSelect, requestBody);
            const json = vaTable.data;
            setBarcodeTambah(json);
        } catch (error) {
            console.error('Error fetching barcode data:', error);
        }
    };
    const hideBarcodePrintDialog = () => {
        // setNull();
        setPriceTagTabel([]);
        setPrintBarcodeDialog(false);
    };

    const addPriceTagDisc = async (e) => {
        e.preventDefault();
        const newData = {
            KODE_TOKO: inputDataDisc.KODE_TOKO,
            NAMA: inputDataDisc.NAMA,
            HJ: inputDataDisc.HJ,
            hDiskon: inputDataDisc.hDiskon,
            EXPIRED: inputDataDisc.EXPIRED,
            JUMLAH: inputDataDisc.JUMLAH,
            STATUS: inputDataDisc.STATUS
        };
        const updatedData = [...priceTagDiscTabel];
        updatedData.push(newData);
        setPriceTagDiscTabel(updatedData);

        setInputDataDisc({
            KODE_TOKO: '',
            NAMA: '',
            HJ: '',
            hDiskon: '',
            EXPIRED: '',
            JUMLAH: '',
            STATUS: ''
        });
        setKeteranganBarcodeDisc('');
        setHJBarcodeDisc('');
        // setExpiredBarcodeDisc('');
    };

    const produkDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDeleteProdukTabel} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteProduk} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editProduk(rowData)} />
                {/* <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteProduk(rowData)} /> */}
            </>
        );
    };
    // ------------------------------------------------------------------------------------------e----------------------------------------------------------- search
    const [defaultOption, setDropdownValue] = useState(null);

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" /> */}
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
            filtered = produkTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KODE_TOKO) || x.test(d.GOLONGAN) || x.test(d.NAMA) || x.test(d.SATUAN) || x.test(d.GUDANG) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = produkTabel;
            } else {
                filtered = produkTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setProdukTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    //  Yang Handle Update Status Produk
    const statusButtonTemplate = (rowData) => {
        return <Button label={rowData.STATUS_HAPUS === '1' ? 'TIDAK AKTIF' : 'AKTIF'} className={rowData.STATUS_HAPUS === '1' ? 'p-button-danger' : 'p-button-success'} rounded onClick={() => handleStatusChange(rowData)} />;
    };

    const handleStatusChange = async (rowData) => {
        let requestBody = {
            Kode: rowData.KODE
        };
        try {
            const vaUpdate = await postData(apiEndPointUpdStatusHapus, requestBody);
            let data = vaUpdate.data;
            showSuccess(toast, data?.message)
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

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
                        <h4>Menu Produk</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                        <DataTable
                            value={produkTabelFilt}
                            header={headerSearch}
                            paginator
                            paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            loading={loading}
                            dataKey="KODE"
                            className="datatable-responsive"
                            filters={lazyState.filters}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            emptyMessage="Data Kosong"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="BARCODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="GOLONGAN" header="GOLONGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA PRODUK"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="GUDANG" header="GUDANG"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="STATUS_HAPUS" header="STATUS" body={statusButtonTemplate} />
                            <Column headerStyle={{ textAlign: 'center' }} field="FOTO" header="FOTO PRODUK" body={(rowData) => <img src={`${rowData.FOTO}`} alt="Foto Produk" style={{ width: 'auto', height: '50px' }} />} />
                            {/* <Column headerStyle={{ textAlign: "center" }} field="SATUAN3" header="SATUAN3"></Column> */}
                            {/* <Column headerStyle={{ textAlign: "center" }} field="MIN" header="MIN"></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="MAX" header="MAX"></Column> */}
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={cetakHarga}></Toolbar>

                        <PrintPriceTag
                            printBarcodeDialog={printBarcodeDialog}
                            hideBarcodePrintDialog={hideBarcodePrintDialog}
                            deletePrintBarcodeDialog={deletePrintBarcodeDialog}
                            printBarcode={printBarcode}
                            setPrintBarcode={setPrintBarcode}
                            priceTagTabel={priceTagTabel}
                        />

                        {/* Dialog Hapus Produk Tabel*/}
                        <Dialog visible={deleteProdukTabel} header="Confirm" modal footer={produkDialogFooter} onHide={hideDeleteProdukTabel}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {produk && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{produk.KODE}</strong>
                                    </span>
                                )}
                            </div>
                        </Dialog>
                        {/* Dialog Barcode */}
                        <Dialog visible={barcodeDialog} style={{ width: '75%' }} header="Pilih Stock" modal className="p-fluid" onHide={hideDialogBarcode}>
                            {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loadingItem && (
                                <DataTable
                                    value={barcodeTabel}
                                    size="small"
                                    lazy
                                    dataKey="KODE"
                                    paginator
                                    rows={10}
                                    className="datatable-responsive"
                                    first={lazyState.first}
                                    totalRecords={totalRecords}
                                    onPage={onPage}
                                    loading={loading}
                                    onRowSelect={onRowSelectBarcode}
                                    selectionMode="single" // Memungkinkan pemilihan satu baris
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="KODE TOKO"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA PRODUK"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="HJ" header="HARGA JUAL"></Column>
                                    {/* <Column headerStyle={{ textAlign: "center" }} field="PENARIKANTUNAI" body={penarikantunaiBodyTemplate} header="PENARIKAN TUNAI" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                                </DataTable>
                            )}
                        </Dialog>

                        {/* Dialog Barcode DiscDisc*/}
                        <Dialog visible={barcodeDiscDialog} style={{ width: '75%' }} header="Pilih Stock" modal className="p-fluid" onHide={hideDialogBarcode}>
                            {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                            {!loadingItem && (
                                <DataTable
                                    value={barcodeDiscTabel}
                                    size="small"
                                    lazy
                                    dataKey="KODE"
                                    paginator
                                    rows={10}
                                    className="datatable-responsive"
                                    first={lazyState.first}
                                    totalRecords={totalRecords}
                                    onPage={onPage}
                                    loading={loading}
                                    onRowSelect={onRowSelectBarcodeDisc}
                                    selectionMode="single" // Memungkinkan pemilihan satu baris Disc
                                >
                                    <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="KODE TOKO"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA PRODUK"></Column>
                                    <Column headerStyle={{ textAlign: 'center' }} field="HJ" header="HARGA JUAL"></Column>
                                </DataTable>
                            )}
                        </Dialog>
                    </div>
                </div>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI >
    );
}
